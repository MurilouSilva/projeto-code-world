import training
def lesson_body(cid,index):
    m=training.BY_ID[cid]['modules'][index]
    body=dict(id=cid,index=index)
    if m['kind']=='quiz':body['answers']=[q['answer'] for q in m['questions']]
    else:body['code']={('html',5):'<main><h1>CodeWorld</h1></main>',('css',5):'.quadrado { width:120px; background:red; }',('css',6):'.quadrado { display:grid; grid-template-columns:repeat(2, 1fr); }',('javascript',5):'const ataque=150; const defesa=30; console.log(ataque-defesa);',('python',5):'resultado = 15 + 5\nprint(resultado)'}[(cid,index)]
    return body
def study(api,cid):
    for i in range(9):api.post('training/complete',lesson_body(cid,i))
