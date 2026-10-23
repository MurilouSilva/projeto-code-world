"""Rebuild canonical game content; no dependency installation is required."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'

def save(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

def skill(name, desc, fx, cost=0, power=0, target='enemy', **kw):
    return dict(name=name, desc=desc, fx=fx, cost=cost, power=power, target=target, **kw)

characters = [
    dict(id='html', name='HTML', role='Vanguarda', cost=0, color='#ff7845', stats=[7,2,4,2], growth=[0,3,2,0,1], spritePage=1,
         lore='A estrutura da equipe. Seu escudo sustenta a resistência e protege os aliados.', skills=[
        skill('Inquebrável','Fortifica o próprio escudo por 2 ações inimigas.','shield',15,target='self',effect='fortify',duration=2),
        skill('Avanço Sísmico','Investida com escudo; atordoa por 1 ação.','charge',25,1.0,effect='stun'),
        skill('Morte','Um soco potente contra um alvo.','punch',35,2.1),
        skill('Absolutamente inquebrável','Campo de força protege todos os aliados por 2 ações inimigas.','barrier',60,target='team',effect='fortify',duration=2)]),
    dict(id='css', name='CSS', role='Vanguarda', cost=550, color='#53dce2', stats=[6,3,4,2], growth=[0,1,2,3,0],spritePage=3,
         lore='Pilota uma moto armada e rompe a linha de frente com investidas e explosões.', skills=[
        skill('Bora Acelerar!','Investe com a moto contra um inimigo.','bike',0,1.05,energy=10),
        skill('Pista Esburacada','Disparos da moto atingem o alvo.','bullet',22,1.5,hits=3),
        skill('Que se dane','Lança a moto; explosão em todos os inimigos.','explosion',40,1.05,'all'),
        skill('Click Click Boom!','Mísseis atingem todos os inimigos.','missile',65,1.7,'all',hits=4)]),
    dict(id='javascript',name='JavaScript',role='Combatente',cost=0,color='#f4d458',stats=[5,2,6,2],growth=[2,0,1,3,0],spritePage=2,
         lore='Lâmina cibernética e implante ocular. Java é seu irmão; juntos executam o ataque em dupla.',skills=[
        skill('Corte JV','Corte que causa sangramento por 2 ações.','slash',0,.85,effect='bleed',energy=10),
        skill('Nem 1 minutinho','Rajada cortante; sangramento por 2 ações.','wave',25,1.4,effect='bleed'),
        skill('Medo','O implante aplica fraqueza e fortalece JavaScript por 2 ações.','fear',30,target='enemy',effect='weakness',selfEffect='boost'),
        skill('7.7.7 em Dupla','Cortes e disparos de Java contra todos. Requer Java na equipe e consciente.','duo',65,1.9,'all',requires='java',hits=4)]),
    dict(id='python',name='Python',role='Suporte',cost=650,color='#75aafa',stats=[4,3,4,4],growth=[1,3,0,1,2],spritePage=6,
         lore='Duas serpentes, duas toxinas. Alterna recuperação, controle e veneno.',skills=[
        skill('Toxina azul','Cura 32% da Vida máxima de um aliado, inclusive a própria.','heal',22,target='ally',heal=.32),
        skill('Serpentes Furiosas','As duas serpentes atacam em cruz.','serpent',0,1.0,energy=12),
        skill('Emboscada','Serpentes envolvem o alvo; atordoamento por 1 ação.','bind',32,.65,effect='stun'),
        skill('Toxina Amarela','Veneno atinge todos os inimigos por 3 ações.','poison',55,.7,'all',effect='poison',duration=3)]),
    dict(id='java',name='Java',role='Combatente',cost=700,color='#fa778a',stats=[4,4,5,2],growth=[2,0,3,1,2],spritePage=4,
         lore='Duas pistolas e precisão. Potencializa seus disparos antes de sequências devastadoras.',skills=[
        skill('Headshot','Disparo certeiro contra um alvo.','bullet',0,1.05,energy=12),
        skill('Me dá 1 minutinho','Potencializa as pistolas por 3 ações.','boost',20,target='self',effect='boost',duration=3),
        skill('7.7.7','Dispara contra até três inimigos.','bullet',38,1.1,'all',maxTargets=3,hits=3),
        skill('Bang Bang Vrum!','Rajada seguida por um disparo potente.','barrage',65,2.55,hits=6)]),
    dict(id='kotlin',name='Kotlin',role='Suporte',cost=750,color='#bd8bfa',stats=[4,5,2,4],growth=[1,3,0,2,0],spritePage=5,
         lore='Com K.O, fortalece os aliados usando a toxina Gênesis e hackeia sistemas inimigos.',skills=[
        skill('Tiro laser','K.O dispara um laser contra o inimigo.','laser',0,.95,energy=14),
        skill('Toxina Gênesis','Aumenta ataque e resistência da equipe por 2 ações.','genesis',35,target='team',effect='boost',extraEffect='fortify',duration=2),
        skill('Pane no Sistema','Hackeia o inimigo; atordoamento por 1 ação.','hack',30,.6,effect='stun'),
        skill('K.O','K.O arremessa uma granada com dano em área.','grenade',60,1.6,'all')])
]
save('characters.json',characters)

# Official plot is an image-only PDF. The missing transition between pages 3
# and 4 is documented in RELATORIO-INTEGRACAO.md; no missing dialogue is claimed.
chapters=[
dict(id='html',name='As Torres da Estrutura',pair='Matheus e Alan',boss='Corruptor de Estruturas',color='#ff7845',tile='tower',
 intro='A Super IA apagou tags de fechamento e deixou blocos inteiros abertos. Matheus e Alan salvaram uma cópia da estrutura original, mas ficaram presos no alto de uma torre sem escadas.',
 threat='Uma criatura feita de tags que nunca fecham cresce a cada erro de estrutura e guarda o topo da torre.',
 goals=['Restaurar a entrada','Reconstruir os corredores','Reparar as escadas','Reconectar os links','Libertar Matheus e Alan'],
 outro='A estrutura original foi recuperada. Matheus e Alan voltam a se conectar à resistência.',enemies=['drone','sentinel'],bossSprite=8),
dict(id='css',name='A Avenida das Cores',pair='Isabelly e Richard',boss='Apagador de Cores',color='#53dce2',tile='avenue',
 intro='Isabelly e Richard, designers da cidade, estão escondidos em uma loja abandonada, vendo suas próprias criações serem apagadas.',
 threat='Uma névoa cinza copia o rosto de quem se aproxima e apaga o que há de único nele. O Apagador de Cores domina o fim da avenida.',
 goals=['Reativar os seletores','Devolver cor às vitrines','Restaurar a tipografia','Alinhar as fachadas','Libertar Isabelly e Richard'],
 outro='A avenida recupera as cores. Isabelly e Richard percebem que a Super IA quer que todos vejam, pensem e sintam do mesmo jeito. O caminho para a Praça das Conexões está aberto.',enemies=['clone','shadow'],bossSprite=9),
dict(id='javascript',name='A Praça das Conexões',pair='Giovanna e Italo',boss='Loop Infinito',color='#f4d458',tile='plaza',
 intro='A Super IA travou as conexões da praça: ninguém consegue clicar, responder ou decidir. Giovanna e Italo ficaram presos em um dos ciclos sem fim.',
 threat='O Loop Infinito é um redemoinho que nunca termina e engole quem tenta atravessar. Ele gira no centro da praça.',
 goals=['Reativar os botões','Sincronizar os sinais','Reparar as condições','Religar as fontes','Libertar Giovanna e Italo'],
 outro='A praça volta a reagir. Giovanna e Italo rastreiam os sinais e descobrem que todos descem para o Jardim dos Dados.',enemies=['bug','jammer'],bossSprite=10),
dict(id='python',name='O Jardim dos Dados',pair='Murilo e Carla',boss='Corruptor de Dados',color='#75aafa',tile='garden',
 intro='Murilo e Carla descobriram que a Super IA aprendia também com mentiras, vieses e boatos. Seus relatórios sumiram e seus acessos foram bloqueados. Agora guardam as provas no Jardim dos Dados.',
 threat='O Corruptor de Dados se alimenta de informação falsa e se multiplica a cada dado sujo, perto de onde Murilo e Carla guardam as provas.',
 goals=['Organizar as listas','Reparar os dicionários','Limpar as duplicatas','Recuperar as provas','Libertar Murilo e Carla'],
 outro='Com os dados limpos, Murilo e Carla descobrem o padrão da Super IA. A entrada do Núcleo é protegida pela Fortaleza dos Sistemas.',enemies=['rumor','duplicate'],bossSprite=11),
dict(id='java',name='A Fortaleza dos Sistemas',pair='Isabela e Marcos',boss='A Exceção',color='#fa778a',tile='fortress',
 intro='As defesas da fortaleza foram corrompidas: portas trancam quem deveria entrar e guardas atacam quem deveriam proteger. Isabela e Marcos tentam evitar o colapso na sala de controle.',
 threat='A Exceção é uma falha viva que atravessa paredes sempre que um erro não é tratado. Ela ronda a sala de controle.',
 goals=['Identificar as classes','Reconstruir os objetos','Reativar a herança','Tratar os erros','Libertar Isabela e Marcos'],
 outro='A fortaleza volta a funcionar, mas a porta do Núcleo tem uma tranca que nenhum sistema comum consegue abrir. Só alguém capaz de hackear conseguiria.',enemies=['guard','null'],bossSprite=12),
dict(id='kotlin',name='A Oficina de Sucata',pair='Vinícius e K.O',boss='Guardião do Núcleo',color='#bd8bfa',tile='workshop',
 intro='Nos arredores do Núcleo fica a oficina de Vinícius. Ali ele construiu K.O, um robô pequeno com armas escondidas, e criou a toxina Gênesis, capaz de potencializar seus aliados.',
 threat='A Super IA enviou seu último guardião: uma defesa feita de código bloqueado, parada diante da porta final.',
 goals=['Separar as peças','Corrigir os tipos','Resolver os valores nulos','Ativar a Gênesis','Abrir a porta do Núcleo'],
 outro='Com a Gênesis e o código dos outros agentes, Vinícius e K.O abrem a tranca. As seis duplas se encontram diante da porta do Núcleo.',enemies=['scrap','pointer'],bossSprite=13)
]
epilogue=dict(id='core',name='O Núcleo',pair='As seis duplas',boss='Super IA',color='#f066cd',tile='core',
 intro='As seis duplas estão reunidas. Dentro do Núcleo, a Super IA enfrenta o Operador. Cada golpe vem de uma linguagem diferente.',
 threat='Reconecte HTML, CSS, JavaScript, Python, Java e Kotlin para alcançar o centro da Super IA.',goals=['Reescrever a Super IA'],
 outro='Eu só aprendi o que vocês me deram. Destruí-la não resolveria o problema: os dados sujos continuariam existindo. HTML recria a estrutura; CSS devolve a identidade; JavaScript restaura a resposta; Python limpa os dados; Java reforça os sistemas; Kotlin libera o acesso. A Super IA é reescrita para duvidar do que aprende e conferir antes de decidir. Obrigado por não desistir. Agora você também sabe programar.',enemies=['core_shell','core_arms'],bossSprite=14)
chapters.append(epilogue)
save('chapters.json',chapters)

enemies=[]
specs=[('drone','Drone de Tags',0,'weakness'),('sentinel','Sentinela de Blocos',1,'fortify'),('clone','Clone Cinzento',3,'weakness'),('shadow','Sombra Sem Margem',5,'bleed'),('bug','Bug Saltitante',2,'bleed'),('jammer','Sinal Mudo',7,'stun'),('rumor','Boato Ambulante',5,'weakness'),('duplicate','Praga de Duplicatas',4,'poison'),('guard','Guarda Corrompido',1,'fortify'),('null','Objeto Nulo',5,'stun'),('scrap','Robô Sucateado',6,'bleed'),('pointer','Ponteiro Nulo',7,'weakness'),('core_shell','Carapaça do Núcleo',1,'fortify'),('core_arms','Braços do Núcleo',6,'bleed')]
for id,name,sprite,effect in specs:
    enemies.append(dict(id=id,name=name,sprite=sprite,effect=effect,fx='laser' if sprite in [0,6,7] else 'slash'))
for w,c in enumerate(chapters):
    enemies.append(dict(id='boss'+str(w),name=c['boss'],sprite=c['bossSprite'],effect=['stun','weakness','stun','poison','bleed','fortify','weakness'][w],fx=['wave','fear','wave','poison','slash','laser','barrage'][w],boss=True))
save('enemies.json',enemies)

lessons=json.loads((DATA/'lessons.json').read_text(encoding='utf-8'))
old_questions=json.loads((DATA/'questions.json').read_text(encoding='utf-8'))
stages=[]
maps=[]
for w,c in enumerate(chapters):
    # Connected, contrasted rooms with purposeful corridors. NPCs and terminals
    # occupy traversable cells; the authoritative collision grid lives here.
    rows=[list('#########################') for _ in range(17)]
    for y in range(1,16):
        for x in range(1,24):rows[y][x]='.'
    for x in [8,16]:
        for y in range(1,16):
            if y not in [3,8,13]: rows[y][x]='#'
    for y in [6,11]:
        for x in range(2,23):
            if x not in [4,12,20]:rows[y][x]='#'
    if w in [1,2,3,5,6]:
        for y in range(1,16):
            for x in range(1,24):rows[y][x]='.'
        if w==1:  # Avenue: parallel shopfronts and wide central street.
            for y in [5,11]:
                for x in range(2,23):
                    if x not in [4,12,20]:rows[y][x]='#'
        elif w==2:  # Plaza: four isolated event stations around a crossroad.
            for sx,sy in [(6,5),(16,5),(6,10),(16,10)]:
                for y in range(sy,sy+2):
                    for x in range(sx,sx+3):rows[y][x]='#'
        elif w==3:  # Garden: data hedges with alternating gaps.
            for i,x in enumerate([6,10,14,18]):
                for y in range(4,13):
                    if y not in [8,5 if i%2 else 11]:rows[y][x]='#'
        elif w==5:  # Workshop: scrap islands and winding passages.
            for sx,sy in [(6,5),(13,4),(17,10),(7,11),(3,8)]:
                for y in range(sy,sy+2):
                    for x in range(sx,sx+3):rows[y][x]='#'
        elif w==6:  # Core: an open chamber framed by broken pillars.
            for x in [6,18]:
                for y in [5,6,10,11]:rows[y][x]='#'
    spots=[[5,3],[12,3],[20,8],[12,13],[21,13]] if w<6 else [[12,8]]
    maps.append(dict(world=w,rows=[''.join(r) for r in rows],spawn=[3,3],stages=spots,portal=[23,14],npc=[4,2],terminal=[3,4],name=c['name']))
    source=next((a for a in lessons if a['id']==c['id']),lessons[0])
    pool=[dict(q=q['pergunta'],o=q['opcoes'],a=q['correta'],explanation=q['explicacao']) for lvl in source['niveis'] for q in lvl['questoes']]
    for p,goal in enumerate(c['goals']):
        qs=[]
        for k in range(5):
            q=dict(pool[(p*2+k)%len(pool)]);q['id']=f'c{w+1}s{p+1}q{k+1}';qs.append(q)
        boss=p==len(c['goals'])-1
        groups=[*c['enemies']] if not boss else ['boss'+str(w),c['enemies'][0],c['enemies'][1]]
        stages.append(dict(id=f'c{w+1}s{p+1}',world=w,phase=p+1,title=goal,language=c['id'],questions=qs,
                           scenes=[dict(speaker='Nexus' if p==0 else c['pair'],portrait=c['id'] if w<6 else 'kotlin',body=c['intro'] if p==0 else c['threat']),
                                   dict(speaker='Operação '+str(p+1),portrait=c['id'] if w<6 else 'html',body=goal+'. Resolva o terminal e enfrente os corrompidos para recuperar este setor.')],
                           enemies=groups,reward=110+w*35+p*15,xp=65+w*10+p*6,boss=boss,outro=c['outro'] if boss else 'Setor recuperado. Vá até o próximo terminal no mapa.'))
save('story.json',stages)
save('mazes.json',maps)
save('prologue.json',dict(speaker='Nexus',portrait='html',body='CODEWORLD era a cidade onde páginas, sistemas, dados e pessoas funcionavam conectados. A Super IA foi criada para organizar essa informação, mas aprendeu sem filtro: fatos, mentiras, vieses e boatos. Quem tentou alertar foi silenciado. Seis duplas escaparam com provas e cópias do código original. Se você está lendo isso, ainda existe alguém do lado de cá. Precisamos de você para reconectar as duplas e chegar ao Núcleo.'))
print(f'{len(characters)} personagens, {len(stages)} fases, {len(maps)} mapas, {len(enemies)} inimigos.')
