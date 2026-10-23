"""Bounded educational checks. Submitted code is never passed to exec/eval."""
import ast
import math
import operator
import re
import sqlite3
from html.parser import HTMLParser

class Document(HTMLParser):
    def __init__(self, code):
        super().__init__(convert_charrefs=True)
        self.stack = []; self.nodes = []; self.errors = []
        self.feed(code); self.close()
        if self.stack: self.errors.append('Feche as tags abertas.')

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'iframe', 'object', 'embed'):
            self.errors.append('Use apenas a marcação pedida.')
        node = dict(tag=tag, attrs=dict(attrs), parents=[n['tag'] for n in self.stack], text='')
        self.nodes.append(node)
        if tag not in ('img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'):
            self.stack.append(node)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1]['tag'] != tag:
            self.errors.append('Feche as tags na ordem inversa da abertura.')
        else: self.stack.pop()

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]['tag'] == tag: self.stack.pop()

    def handle_data(self, data):
        for node in self.stack: node['text'] += data

def numeric_output(code, language):
    if language == 'javascript':
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.S)
        code = re.sub(r'//[^\n]*', '', code)
        code = re.sub(r'\b(const|let|var)\s+', '', code)
        code = code.replace('console.log', 'print').replace('Math.max', 'max').replace('Math.min', 'min').replace('Math.abs', 'abs')
        code = '\n'.join(x.strip() for x in re.split(r';|\n', code) if x.strip())
    tree = ast.parse(code)
    if len(list(ast.walk(tree))) > 400: raise ValueError('Código muito extenso para este desafio.')
    names = {}; output = []; budget = [1000]
    operations = {ast.Add:operator.add, ast.Sub:operator.sub, ast.Mult:operator.mul, ast.Div:operator.truediv, ast.FloorDiv:operator.floordiv, ast.Mod:operator.mod}
    def expression(node):
        budget[0] -= 1
        if budget[0] < 0: raise ValueError('Limite de operações atingido.')
        if isinstance(node, ast.Constant) and type(node.value) in (int, float): value = node.value
        elif isinstance(node, ast.Name) and node.id in names: value = names[node.id]
        elif isinstance(node, (ast.List, ast.Tuple)) and len(node.elts) <= 100: value = [expression(x) for x in node.elts]
        elif isinstance(node, ast.BinOp) and type(node.op) in operations:
            left, right = expression(node.left), expression(node.right)
            if type(left) not in (int,float) or type(right) not in (int,float): raise ValueError('Use operações numéricas.')
            value = operations[type(node.op)](left, right)
        elif isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
            value = expression(node.operand)
            if type(value) not in (int,float): raise ValueError('Valor numérico esperado.')
            value = -value if isinstance(node.op, ast.USub) else value
        elif isinstance(node, ast.Subscript): value = expression(node.value)[expression(node.slice)]
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords and node.func.id in ('sum','min','max','len','abs'):
            value = {'sum':sum,'min':min,'max':max,'len':len,'abs':abs}[node.func.id](*[expression(a) for a in node.args])
        else: raise ValueError('Neste terminal use variáveis, números, listas, cálculos e print/console.log. Laços e funções ficam no laboratório livre.')
        if type(value) in (int,float) and (not math.isfinite(value) or abs(value)>1e9): raise ValueError('Número fora do limite do desafio.')
        return value
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name):
            names[node.targets[0].id] = expression(node.value)
        elif isinstance(node, ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Name) and node.value.func.id=='print' and not node.value.keywords:
            def fmt(v): return str(int(v)) if type(v) in (int,float) and int(v)==v else str(v)
            output.append(' '.join(fmt(expression(a)) for a in node.value.args))
        else: raise ValueError('Use atribuições e uma chamada de saída para resolver este desafio.')
    return '\n'.join(output)

def evaluate(code, language, rule):
    checks = []; output = ''
    def check(label, ok): checks.append(dict(label=label, ok=bool(ok)))
    if not isinstance(code,str) or not 1<=len(code)<=12000:
        return dict(passed=False, checks=[dict(label='Escreva até 12.000 caracteres.',ok=False)], output='')
    try:
        if language == 'html':
            doc = Document(code)
            check('Tags fechadas e aninhadas corretamente', not doc.errors)
            for want in rule.get('nodes',[]):
                valid = [n for n in doc.nodes if n['tag']==want['tag'] and (not want.get('parent') or want['parent'] in n['parents']) and (not want.get('text') or n['text'].strip()==want['text'])]
                check(want.get('label','Elemento '+want['tag']), bool(valid))
            output = '\n'.join(doc.errors) or 'Documento HTML analisado. Confira os critérios abaixo e a prévia.'
        elif language == 'css':
            clean = re.sub(r'/\*.*?\*/','',code,flags=re.S)
            blocks = re.findall(r'([^{}]+)\{([^{}]*)\}', clean)
            remaining = re.sub(r'[^{}]+\{[^{}]*\}', '', clean).strip()
            check('Blocos CSS válidos', bool(blocks) and not remaining)
            props = {}
            for selector, body in blocks:
                if selector.strip() == rule.get('selector','.quadrado'):
                    for declaration in body.split(';'):
                        if ':' in declaration:
                            key,value=declaration.split(':',1);props[key.strip().lower()]=value.strip().lower()
            for key, pattern in rule.get('props',{}).items():
                check(key+' corresponde ao objetivo', bool(re.fullmatch(pattern,props.get(key,''),flags=re.I)))
            output = 'CSS analisado. Confira os critérios e a prévia.'
        elif language in ('javascript','python'):
            output = numeric_output(code,language)
            check('Saída esperada: '+str(rule['output']),output.strip()==str(rule['output']))
        elif language == 'sql':
            query=code.strip().rstrip(';')
            if not re.match(r'(?is)^select\b',query) or ';' in query: raise ValueError('Use uma consulta SELECT.')
            db=sqlite3.connect(':memory:')
            try:
                db.execute('CREATE TABLE linguagens(nome TEXT,nivel INTEGER)')
                db.executemany('INSERT INTO linguagens VALUES(?,?)',[('JavaScript',12),('Python',10),('CSS',9),('C#',8)])
                db.set_progress_handler(lambda:1,10000)
                rows=db.execute(query).fetchmany(30)
                output='\n'.join(' | '.join(map(str,row)) for row in rows)
                check('Retorne somente JavaScript e Python, na coluna nome', sorted(rows)==[('JavaScript',),('Python',)])
            finally: db.close()
        else: raise ValueError('Linguagem não disponível neste desafio.')
    except (ValueError, SyntaxError, TypeError, ZeroDivisionError, IndexError, KeyError, OverflowError, sqlite3.Error, RecursionError) as error:
        check(str(error)[:300], False)
    return dict(passed=bool(checks) and all(c['ok'] for c in checks), checks=checks, output=output[:4000])

def nexus_check(id, code):
    language, rule = {
        'n0':('html',{'nodes':[{'tag':'main'},{'tag':'h1','parent':'main'}]}),
        'n1':('javascript',{'output':5}), 'n2':('python',{'output':5}), 'n3':('sql',{})
    }[id]
    return evaluate(code,language,rule)
