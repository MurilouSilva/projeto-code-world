"""Servidor local CodeWorld: Python 3.10+, apenas biblioteca padrão."""
from __future__ import annotations

import base64
import contextlib
import combat
import campaign
import training
import missions
import items
import practice
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import struct
import threading
import time
import urllib.request
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from campaign import get_story, get_nexus, handle_story, handle_nexus, progress_for, handle_lesson, save_progress

ROOT = Path(__file__).resolve().parent
DB = Path(os.getenv("CODEWORLD_DB", str(ROOT / "data" / "players.sqlite3")))
QUESTIONS = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf-8"))
BY_ID = {q["id"]: q for q in QUESTIONS}
SESSIONS_SECONDS = 60 * 60 * 24 * 14
ATTEMPTS = {}
ATTEMPTS_LOCK = threading.Lock()


def throttled(ip, email, failed=False):
    key = (ip, email)
    now = time.time()
    with ATTEMPTS_LOCK:
        recent = [t for t in ATTEMPTS.get(key, []) if now - t < 300]
        if failed:
            recent.append(now)
        ATTEMPTS[key] = recent
        return len(recent) >= 10


@contextlib.contextmanager
def connection():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password TEXT NOT NULL, secret TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, money INTEGER NOT NULL DEFAULT 0, progress TEXT NOT NULL DEFAULT '{}', last_totp INTEGER NOT NULL DEFAULT -1)")
    db.execute("CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS answers (user_id INTEGER NOT NULL, question_id TEXT NOT NULL, PRIMARY KEY(user_id,question_id))")
    db.commit()
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1).hex()


def totp(secret, counter):
    key = base64.b32decode(secret)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 15
    value = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7fffffff
    return str(value % 1000000).zfill(6)


def check_totp(secret, code, last=-1):
    if not isinstance(code, str) or not re.fullmatch(r"\d{6}", code):
        return None
    now = int(time.time() // 30)
    for counter in (now - 1, now, now + 1):
        if counter > last and hmac.compare_digest(totp(secret, counter), code):
            return counter
    return None


def public_question(q):
    return {k: v for k, v in q.items() if k != "a"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def send_json(self, status, value, cookie=None):
        # Never acknowledge a mutation before its transaction is durable.
        active = getattr(self, 'active_db', None)
        if active is not None:
            try:
                if active.in_transaction:
                    active.commit() if status < 400 else active.rollback()
            except sqlite3.ProgrammingError:
                pass  # An exception path already closed/rolled back the context.
        data = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        if cookie is not None:
            suffix = "; Secure" if os.getenv("CODEWORLD_HTTPS") == "1" else ""
            self.send_header("Set-Cookie", f"cw_session={cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSIONS_SECONDS if cookie else 0}{suffix}")
        self.end_headers()
        self.wfile.write(data)

    def valid_host(self):
        allowed = os.getenv("CODEWORLD_ALLOWED_HOSTS", "localhost,127.0.0.1,terminal.local").split(",")
        return self.headers.get("Host", "").split(":")[0] in allowed

    def safe_static(self):
        path = unquote(urlsplit(self.path).path)
        target = (ROOT / path.lstrip("/")).resolve()
        if not target.is_relative_to(ROOT) or ".." in Path(path).parts or any(x.startswith(".") for x in Path(path).parts if x!="/"):
            return False
        if path.startswith(("/data/", "/docs/", "/tests/", "/tools/", "/upload/")): return False
        if target.is_dir(): return (target/"index.html").is_file()
        return target.suffix.lower() in {".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp4", ".woff2", ".ico", ".json"}

    def do_HEAD(self):
        if not self.valid_host() or not self.safe_static(): return self.send_error(404)
        super().do_HEAD()

    def do_GET(self):
        if not self.valid_host(): return self.send_json(403, {"error":"Host não autorizado."})
        path = unquote(urlsplit(self.path).path)
        if path == "/api/health": return self.send_json(200, {"ok":True,"version":"9.0.1"})
        if path == "/api/content":
            lessons = json.loads(json.dumps(campaign.LESSONS))
            for agent in lessons:
                for level in agent["niveis"]:
                    for q in level["questoes"]: q.pop("correta",None)
            return self.send_json(200, {"characters":combat.CHARACTERS,"enemies":list(combat.ENEMIES.values()),"chapters":campaign.CHAPTERS,"lessons":lessons,"courses":training.public_courses(),"items":items.CATALOG,"prologue":campaign.read("prologue.json")})
        if path.startswith("/api/"):
            with connection() as db:
                user = self.user(db)
                if path == "/api/missions":
                    return self.send_json(200, missions.board(progress_for(user) if user else {}))
                if path == "/api/me":
                    if not user:
                        return self.send_json(401, {"error": "Entre na sua conta."})
                    return self.send_json(200, self.profile(db, user))
                if path == "/api/story":
                    return self.send_json(200, get_story(user)) if user else self.send_json(401, {"error": "Entre na sua conta."})
                if path == "/api/nexus":
                    return self.send_json(200, get_nexus(user)) if user else self.send_json(401, {"error": "Entre na sua conta."})
                if path == "/api/questions":
                    if not user:
                        return self.send_json(401, {"error": "Entre na sua conta."})
                    answered = {x[0] for x in db.execute("SELECT question_id FROM answers WHERE user_id=?", (user["id"],))}
                    return self.send_json(200, {"questions": [dict(public_question(q),reward=0,rewards=items.question_reward(i)) for i,q in enumerate(QUESTIONS)], "completed": sorted(answered)})
                return self.send_json(404, {"error": "Rota desconhecida."})
        if not self.safe_static(): return self.send_error(404)
        super().do_GET()

    def user(self, db):
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get("Cookie", ""))
            token = cookies.get("cw_session")
            if not token:
                return None
            return db.execute("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.verified=1", (hashlib.sha256(token.value.encode()).hexdigest(), int(time.time()))).fetchone()
        except Exception:
            return None

    def profile(self, db, user):
        return {"id": user["id"], "email": user["email"], "username": user["username"], "money": user["money"], "progress": progress_for(user), "completed": [row[0] for row in db.execute("SELECT question_id FROM answers WHERE user_id=?", (user["id"],))]}

    def do_POST(self):
        if not self.valid_host(): return self.send_json(403, {"error":"Host não autorizado."})
        path = unquote(urlsplit(self.path).path)
        if self.headers.get("Sec-Fetch-Site") == "cross-site": return self.send_json(403, {"error":"Origem inválida."})
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json": return self.send_json(415, {"error":"Envie JSON."})
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            return self.send_json(403, {"error": "Origem inválida."})
        try: length = int(self.headers.get("Content-Length", 0))
        except ValueError: return self.send_json(400, {"error":"Tamanho inválido."})
        if length > 16000 or length < 1:
            return self.send_json(413, {"error": "Requisição inválida."})
        try:
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError()
        except (ValueError, UnicodeDecodeError):
            return self.send_json(400, {"error": "JSON inválido."})
        try:
            with connection() as db:
                # Serializes read/modify/write, including TOTP reuse and purchases.
                self.active_db = db
                db.execute("BEGIN IMMEDIATE")
                if path == "/api/register":
                    if throttled(self.client_address[0], "register", True):
                        return self.send_json(429, {"error":"Aguarde antes de cadastrar outra conta."})
                    email = str(body.get("email", "")).strip().lower()
                    username = str(body.get("username", "")).strip()
                    password = str(body.get("password", ""))
                    if len(password)>128: return self.send_json(400, {"error":"Senha muito longa."})
                    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 254 or not re.fullmatch(r"[\w-]{3,24}", username) or not (12 <= len(password) <= 128):
                        return self.send_json(400, {"error": "Use e-mail válido, usuário de 3 a 24 caracteres e senha com ao menos 12 caracteres."})
                    salt = secrets.token_hex(16)
                    secret = base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")
                    db.execute("INSERT INTO users(email,username,salt,password,secret) VALUES(?,?,?,?,?)", (email, username, salt, password_hash(password, salt), secret))
                    db.commit()
                    uri = f"otpauth://totp/CodeWorld:{email}?secret={secret}&issuer=CodeWorld"
                    return self.send_json(201, {"setupSecret": secret, "setupUri": uri, "message": "Adicione a chave no aplicativo autenticador e confirme o código."})
                if path == "/api/setup":
                    email = str(body.get("email", "")).strip().lower()
                    if throttled(self.client_address[0], email):
                        return self.send_json(429, {"error": "Muitas tentativas. Aguarde alguns minutos."})
                    row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                    password = str(body.get("password", ""))
                    if len(password)>128: return self.send_json(400, {"error":"Senha muito longa."})
                    if not row or not hmac.compare_digest(row["password"], password_hash(password, row["salt"])):
                        throttled(self.client_address[0], email, True)
                        return self.send_json(401, {"error": "E-mail ou senha incorretos."})
                    if row["verified"]:
                        return self.send_json(400, {"error": "Esta conta já está ativada. Use ENTRAR com um código novo."})
                    return self.send_json(200, {"setupSecret": row["secret"], "setupUri": f"otpauth://totp/CodeWorld:{email}?secret={row['secret']}&issuer=CodeWorld"})
                if path in ("/api/verify", "/api/login"):
                    email = str(body.get("email", "")).strip().lower()
                    if throttled(self.client_address[0], email):
                        return self.send_json(429, {"error": "Muitas tentativas. Aguarde alguns minutos."})
                    row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                    password = str(body.get("password", ""))
                    if len(password)>128: return self.send_json(400, {"error":"Senha muito longa."})
                    if not row or not hmac.compare_digest(row["password"], password_hash(password, row["salt"])):
                        throttled(self.client_address[0], email, True)
                        return self.send_json(401, {"error": "Dados de acesso incorretos."})
                    if path == "/api/login" and not row["verified"]:
                        return self.send_json(403, {"error": "Confirme primeiro a verificação em duas etapas."})
                    counter = check_totp(row["secret"], str(body.get("code", "")), row["last_totp"])
                    if counter is None:
                        throttled(self.client_address[0], email, True)
                        code = str(body.get("code", ""))
                        if row["last_totp"] >= 0 and code == totp(row["secret"], row["last_totp"]):
                            return self.send_json(401, {"error": "Esse código já foi usado. Aguarde o aplicativo mostrar o próximo código."})
                        return self.send_json(401, {"error": "Código de autenticação inválido ou já usado."})
                    db.execute("UPDATE users SET verified=1,last_totp=? WHERE id=?", (counter, row["id"]))
                    token = secrets.token_urlsafe(32)
                    db.execute("INSERT INTO sessions VALUES(?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), row["id"], int(time.time()) + SESSIONS_SECONDS))
                    db.commit()
                    return self.send_json(200, {"ok": True}, token)
                user = self.user(db)
                if path == "/api/logout":
                    cookies = SimpleCookie(); cookies.load(self.headers.get("Cookie", ""))
                    if cookies.get("cw_session"):
                        db.execute("DELETE FROM sessions WHERE token=?", (hashlib.sha256(cookies["cw_session"].value.encode()).hexdigest(),))
                        db.commit()
                    return self.send_json(200, {"ok": True}, "")
                if not user:
                    return self.send_json(401, {"error": "Faça login para continuar."})
                if path in ("/api/training/run", "/api/training/complete"):
                    p=progress_for(user)
                    if path.endswith('/run'):
                        _,_,module=training.module_for(body)
                        if module['kind']!='code':raise combat.RuleError('Esta aula usa um questionário.',400)
                        return self.send_json(200,practice.evaluate(body.get('code'),module['language'],module['rule']))
                    result=training.complete(p,body)
                    save_progress(db,user,p,result['earned'])
                    return self.send_json(200,result)
                if path in ("/api/missions/run", "/api/missions/claim"):
                    p=progress_for(user)
                    result=missions.submit(p,body,path.endswith('/claim'))
                    save_progress(db,user,p)
                    return self.send_json(200,result)
                if path == "/api/lesson":
                    status, data = handle_lesson(db,user,body)
                    return self.send_json(status,data)
                if path == "/api/lessons/reset":
                    p=progress_for(user)
                    p['lessonProgress']={}
                    save_progress(db,user,p)
                    return self.send_json(200,{"progress":p})
                if path.startswith("/api/story/"):
                    status, data = handle_story(db, user, path.rsplit("/", 1)[-1], body)
                    return self.send_json(status, data)
                if path.startswith("/api/nexus/"):
                    status, data = handle_nexus(db, user, path.rsplit("/", 1)[-1], body)
                    return self.send_json(status, data)
                if path == "/api/answer":
                    q = BY_ID.get(body.get("id")) if isinstance(body.get("id"), str) else None
                    if not q or type(body.get("answer")) is not int or body["answer"] not in range(len(q["o"])):
                        return self.send_json(400, {"error": "Resposta inválida."})
                    if q["a"] != body["answer"]:
                        return self.send_json(200, {"correct": False, "money": user["money"]})
                    cur = db.execute("INSERT OR IGNORE INTO answers VALUES(?,?)", (user["id"], q["id"]))
                    p=progress_for(user)
                    granted=items.question_reward(QUESTIONS.index(q)) if cur.rowcount else {}
                    items.grant(p,granted);save_progress(db,user,p)
                    return self.send_json(200, {"correct":True,"earned":0,"rewards":granted,"money":user['money']})
                if path == "/api/buy":
                    p = progress_for(user)
                    if p['story']['active']: raise combat.RuleError("Finalize a operação antes de comprar.")
                    item = body.get("id")
                    if not isinstance(item,str): raise combat.RuleError("Item inválido.",400)
                    character = combat.CATALOG.get(item)
                    consumables = {id:x['price'] for id,x in items.CATALOG.items()}
                    if character:
                        if item in p['unlocked']: return self.send_json(200, {"owned":True,"money":user['money'],"progress":p})
                        cost=character['cost']
                    elif item in consumables:
                        cost=consumables[item]
                        if p['inventory'].get(item,0)>=20: raise combat.RuleError("Limite de 20 unidades por item.")
                    else: raise combat.RuleError("Item desconhecido.",400)
                    if user['money']<cost: raise combat.RuleError("Saldo insuficiente.")
                    if character: p['unlocked'].append(item)
                    else: p['inventory'][item]=p['inventory'].get(item,0)+1
                    save_progress(db,user,p,-cost)
                    return self.send_json(200, {"money":user['money']-cost,"progress":p})
                if path == "/api/progress":
                    p=progress_for(user)
                    if set(body)-{'team'}: raise combat.RuleError("Campo de progresso não permitido.",400)
                    if 'team' in body:
                        if p['story']['active']: raise combat.RuleError("Finalize ou abandone a operação antes de alterar a equipe.")
                        team=body['team']
                        if not isinstance(team,list) or not 1<=len(team)<=3 or any(not isinstance(x,str) for x in team) or len(set(team))!=len(team) or any(x not in p['unlocked'] or x not in combat.CATALOG for x in team):
                            raise combat.RuleError("Selecione de 1 a 3 personagens adquiridos, sem repetições.",400)
                        p['team']=team
                    save_progress(db,user,p)
                    return self.send_json(200,{"progress":p})
                if path == "/api/chat":
                    message = str(body.get("message", "")).strip()[:1500]
                    if not message:
                        return self.send_json(400, {"error": "Escreva sua pergunta."})
                    key, endpoint = os.getenv("CODEWORLD_AI_KEY"), os.getenv("CODEWORLD_AI_URL")
                    if not (key and endpoint and endpoint.startswith("https://")):
                        return self.send_json(503, {"error": "A IA ainda não foi configurada pelo administrador. Consulte o guia da Academia."})
                    payload = json.dumps({"model": os.getenv("CODEWORLD_AI_MODEL", "gpt-4o-mini"), "messages": [{"role": "system", "content": "Você é o tutor CodeWorld. Responda em português, com clareza e honestidade. Ajude com programação e funcionamento do portal; quando não souber, diga."}, {"role": "user", "content": message}], "max_tokens": 450}).encode()
                    request = urllib.request.Request(endpoint, data=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
                    with urllib.request.urlopen(request, timeout=20) as response:
                        result = json.load(response)
                    answer = result["choices"][0]["message"]["content"]
                    return self.send_json(200, {"answer": answer})
                if path == "/api/run":
                    language = str(body.get("language", "")).lower()
                    code = str(body.get("code", ""))
                    if len(code) > 12000:
                        return self.send_json(400, {"error": "Código muito extenso."})
                    if language == "sql":
                        query = code.strip().rstrip(";")
                        if not re.match(r"(?is)^select\b", query) or ";" in query:
                            return self.send_json(400, {"error": "O laboratório SQL aceita uma consulta SELECT por vez."})
                        test = sqlite3.connect(":memory:")
                        test.execute("CREATE TABLE linguagens(nome TEXT,nivel INTEGER)")
                        test.executemany("INSERT INTO linguagens VALUES(?,?)", [("JavaScript",12),("Python",10),("CSS",9),("C#",8)])
                        test.set_progress_handler(lambda: 1, 10000)
                        try:
                            cursor = test.execute(query)
                            rows = cursor.fetchmany(30)
                            output = " | ".join(x[0] for x in cursor.description) + "\n" + "\n".join(" | ".join(map(str,row)) for row in rows)
                        except sqlite3.Error as error:
                            return self.send_json(400, {"error": str(error)})
                        finally:
                            test.close()
                        return self.send_json(200, {"output": output})
                    languages = {"java","kotlin","csharp","c","cpp","rust","go","ruby","php","typescript"}
                    runner = os.getenv("CODEWORLD_RUNNER_URL", "")
                    if language not in languages or not runner.startswith("https://"):
                        return self.send_json(503, {"error": "Esta linguagem exige um serviço de execução isolado configurado no servidor. Consulte o README."})
                    request = urllib.request.Request(runner.rstrip("/") + "/execute", data=json.dumps({"language": language, "code": code}).encode(), headers={"Content-Type":"application/json", "Authorization":"Bearer " + os.getenv("CODEWORLD_RUNNER_KEY", "")})
                    with urllib.request.urlopen(request, timeout=15) as response:
                        result = json.load(response)
                    return self.send_json(200, {"output": str(result.get("output", ""))[:12000]})
                return self.send_json(404, {"error": "Rota desconhecida."})
        except combat.RuleError as exc:
            self.send_json(exc.status, {"error":str(exc)})
        except sqlite3.IntegrityError:
            self.send_json(409, {"error": "E-mail ou usuário já cadastrado."})
        except Exception as exc:
            self.log_error("API error: %s", str(exc))
            self.send_json(500, {"error": "Não foi possível concluir. Tente novamente."})


if __name__ == "__main__":
    host = os.getenv("CODEWORLD_HOST", "127.0.0.1")
    port = int(os.getenv("CODEWORLD_PORT", os.getenv("PORT", "8000")))
    print(f"CodeWorld: http://{host}:{port}")
    with connection() as db: pass
    try:
        ThreadingHTTPServer((host, port), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado. Seu progresso está salvo.")
