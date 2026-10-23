"""Build the unified nine-lesson training tracks without removing MAIN content."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'data'/name).read_text(encoding='utf-8'))
legacy={l['id']:l for l in read('academy.json')}
def quiz(title,text,code,prompt,options,answer):
    return dict(title=title,intro=text,sections=[dict(title='Conceito',text=text,code=code)],activity=dict(type='quiz',prompt=prompt,options=options,answerIndex=answer))
extra={
 'html': [legacy['html-intro'],legacy['web-access'],quiz('Formulários com rótulos','O atributo for do label aponta para o id do campo.','<label for="nome">Nome</label>\n<input id="nome">','Qual atributo conecta o label ao campo?',['href','for','src','alt'],1),quiz('Semântica no portal','Use main para o conteúdo principal e nav para grupos de links.','<nav><a href="/rpg/">Jogar</a></nav>','Qual elemento representa um grupo de navegação?',['div','nav','img','input'],1)],
 'css':[legacy['css'],legacy['css-grid'],legacy['web-access'],quiz('Contraste e legibilidade','Texto e fundo devem ter contraste. Não dependa apenas de cor para indicar um erro.','.erro { color: #ffb8c5; background: #26141b; }','Como tornar o erro compreensível para mais pessoas?',['Somente vermelho','Ocultar o rótulo','Texto explicativo junto da cor','Piscar rapidamente'],2)],
 'javascript':[legacy['js'],legacy['js-output'],legacy['web-access'],quiz('Listas de itens','Arrays guardam coleções. O primeiro índice é zero.','const itens = ["patch", "bateria"];\nconsole.log(itens[0]);','Qual é a saída?',['bateria','patch','0','undefined'],1)],
 'python':[legacy['py'],legacy['py-lists'],quiz('Dicionários de inventário','Dicionários associam chaves a valores.','mochila = {"patch": 3}\nprint(mochila["patch"])','Qual valor é impresso?',['patch','0','3','1'],2),quiz('Tratando erros','try/except permite tratar um erro específico e explicar como continuar.','try:\n    numero = int("texto")\nexcept ValueError:\n    print("Use um número")','Qual exceção é tratada neste código?',['ValueError','KeyError','SyntaxError','IndexError'],0)],
 'java':[legacy['java-intro'],quiz('Tipos em Java','int representa números inteiros; String representa texto.','int energia = 45;','Qual declaração representa uma energia inteira?',['String energia = 45;','int energia = 45;','let energia = 45;','energia := 45;'],1),quiz('Exceções em Java','Um bloco catch pode tratar uma exceção lançada dentro de try.','try { Integer.parseInt("x"); }\ncatch (NumberFormatException e) { System.out.println("Número inválido"); }','Qual bloco trata a exceção?',['class','while','catch','return'],2),quiz('Métodos com retorno','Um método pode receber parâmetros e retornar o resultado.','static int dobro(int n) { return n * 2; }','Qual o resultado de dobro(6)?',['6','8','12','36'],2)],
 'kotlin':[legacy['kotlin-intro'],quiz('Valores nulos','O tipo String? admite null. O operador ?: fornece um valor alternativo.','val nome: String? = null\nprintln(nome ?: "Agente")','Qual é a saída?',['null','Agente','nome','Erro'],1),quiz('Coleções Kotlin','listOf cria uma lista somente de leitura. O primeiro índice é zero.','val itens = listOf("Patch", "Escudo")\nprintln(itens[1])','Qual item é impresso?',['Patch','Escudo','1','null'],1),quiz('Funções Kotlin','fun declara uma função. O corpo pode ser uma expressão.','fun dano(a: Int, d: Int) = a - d','Qual o resultado de dano(30, 8)?',['38','22','30','8'],1)]
}
rules={
 'html-intro':dict(nodes=[dict(tag='main'),dict(tag='h1',parent='main',text='CodeWorld')]),
 'css':dict(props={'width':r'120px','background':r'red|#ff0000|#f00'}),
 'css-grid':dict(props={'display':'grid','grid-template-columns':r'repeat\(\s*2\s*,\s*1fr\s*\)|1fr\s+1fr'}),
 'js':dict(output=120),'py':dict(output=20)
}
courses=[]
for agent in read('lessons.json'):
    cid=agent['id'];modules=[]
    for i,n in enumerate(agent['niveis']):
        modules.append(dict(id=f'{cid}-{i}',title=n['titulo'],intro=n['resumo'],sections=[dict(title=c['titulo'],text=c['texto'],code='') for c in n['conceitos']],example=n['codigo'],kind='quiz',questions=[dict(prompt=q['pergunta'],options=q['opcoes'],answer=q['correta']) for q in n['questoes']],reward=25,source='MAIN'))
    for i,l in enumerate(extra[cid],5):
        a=l['activity'];m=dict(id=f'{cid}-{i}',title=l['title'],intro=l['intro'],sections=l['sections'],reward=50,source='Academia',kind='quiz' if a['type']=='quiz' else 'code')
        if m['kind']=='quiz':m['questions']=[dict(prompt=a['prompt'],options=a['options'],answer=a['answerIndex'])]
        else:m.update(language='javascript' if a['type']=='js' else a['type'],objective=a['prompt'],starter=a.get('starter',''),rule=rules[l['id']])
        modules.append(m)
    courses.append(dict(id=cid,name=agent['nome'],modules=modules))
(ROOT/'data/curriculum.json').write_text(json.dumps(courses,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(courses)} trilhas, {sum(len(c["modules"]) for c in courses)} aulas.')
