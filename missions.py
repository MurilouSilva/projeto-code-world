"""Daily missions derive from server date; claims are account-bound and atomic."""
import copy
import hashlib
import random
from datetime import datetime, timedelta, timezone
import combat
import items
import practice
ZONE=timezone(timedelta(hours=-3))
def now():return datetime.now(ZONE)
def task(id,title,language,objective,starter,hint,rule,rewards):
    return dict(id=id,title=title,language=language,objective=objective,starter=starter,hint=hint,rule=rule,rewards=rewards)
PERMANENT=[
 task('bug-invasor','Bug invasor','html','Corrija o aninhamento. Mantenha main, section, h2 e p; feche as tags na ordem inversa.','<main>\n  <section>\n    <h2>Nível 0</h2>\n    <p>Território HTML\n</main>\n</section>','Feche p, depois section e finalmente main.',{'nodes':[{'tag':'main'},{'tag':'section','parent':'main'},{'tag':'h2','parent':'section'},{'tag':'p','parent':'section'}]},{'patch':2}),
 task('escape-loop','Escape do loop','javascript','Cada uma das 3 torres precisa de 12 unidades. Calcule o total e mostre 36 no console.','const torres = 3;\nconst energia = 12;\nconsole.log(torres + energia);','Multiplique a quantidade de torres pela energia de cada torre.',{'output':36},{'battery':2}),
 task('dados-perdidos','Dados perdidos','python','Some os pacotes [7, 11, 5] e imprima 23.','pacotes = [7, 11, 5]\n# imprima a soma','Use print(sum(pacotes)).',{'output':23},{'antidote':2}),
 task('firewall','Firewall breach','css','Organize .quadrado em uma grade de 2 colunas iguais e gap de 16px.','.quadrado {\n  display: block;\n  background: #68d8ff;\n}','Use display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px.',{'props':{'display':'grid','grid-template-columns':r'repeat\(\s*2\s*,\s*1fr\s*\)|1fr\s+1fr','gap':'16px'}},{'shield':2}),
 task('protocolo-raiz','Protocolo raiz','javascript','A energia atual é 86 e a bateria dá 28. Limite o resultado a 100 e imprima esse valor.','const energia = 86;\nconst carga = 28;\nconsole.log(energia + carga);','Math.min(100, energia + carga) limita a carga máxima.',{'output':100},{'patch':2,'battery':2,'shield':1}),
 task('sinal','Sinal da resistência','html','Crie um botão com o texto Conectar dentro de main.','<main>\n  <span>Conectar</span>\n</main>','Use button para ações acessíveis por teclado.',{'nodes':[{'tag':'main'},{'tag':'button','parent':'main','text':'Conectar'}]},{'antidote':1,'shield':1}),
]

def assignments():
    current=now();day=current.date().isoformat();rng=random.Random(int(hashlib.sha256(day.encode()).hexdigest(),16))
    sector=rng.randint(10,99);width=rng.choice([96,120,144,160]);color=rng.choice(['#68d8ff','#b9a1ff','#78e8b0']);energy=rng.randint(50,95);cost=rng.randint(12,35)
    daily=[
        task('',f'Reconectar setor {sector}','html',f'Crie main com um h1 contendo exatamente Setor {sector}.','<main>\n  <h1></h1>\n</main>','Escreva o nome do setor entre as tags h1.',{'nodes':[{'tag':'main'},{'tag':'h1','parent':'main','text':f'Setor {sector}'}]},{'patch':1,'shield':1}),
        task('','Calibrar o painel','css',f'Em .quadrado, defina width: {width}px e background: {color}.','.quadrado {\n  width: 80px;\n  height: 80px;\n  background: cyan;\n}','Edite as duas propriedades solicitadas.',{'props':{'width':f'{width}px','background':color}},{'antidote':1,'patch':1}),
        task('','Reserva de energia','javascript',f'Você tem {energy} de energia e usa {cost}. Imprima a energia restante. Calcule a subtração.',f'const energia = {energy};\nconst custo = {cost};\n// escreva a saída','Use console.log(energia - custo).',{'output':energy-cost},{'battery':2}),
    ]
    rng.shuffle(daily)
    for i,m in enumerate(daily):m.update(id=f'daily:{day}:{i}',daily=True)
    permanent=copy.deepcopy(PERMANENT)
    for m in permanent:m['daily']=False
    return day,(datetime.combine(current.date()+timedelta(days=1),datetime.min.time(),tzinfo=ZONE)).isoformat(),daily+permanent

def board(p):
    day,expires,rows=assignments();claims=p.get('missionClaims',{})
    for m in rows:m.pop('rule',None);m['completed']=m['id'] in claims
    return dict(day=day,expires=expires,missions=rows)

def submit(p,body,claim=False):
    day,_,rows=assignments()
    if body.get('day')!=day:raise combat.RuleError('As diárias foram renovadas. Atualize o painel e escolha uma missão.')
    m=next((m for m in rows if m['id']==body.get('id')),None)
    if not m:raise combat.RuleError('Missão indisponível.',404)
    result=practice.evaluate(body.get('code'),m['language'],m['rule'])
    result.update(granted={},alreadyClaimed=False)
    if claim and result['passed']:
        claims=p.setdefault('missionClaims',{})
        if m['id'] in claims:result['alreadyClaimed']=True
        else:
            claims[m['id']]=day;items.grant(p,m['rewards']);result['granted']=m['rewards']
    return result
