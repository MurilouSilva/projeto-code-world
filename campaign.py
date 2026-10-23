"""Campaign, positions, lessons and rewards share one server-side save."""
import json
from pathlib import Path
import combat
import training
import items

DATA=Path(__file__).resolve().parent/'data'
def read(name):return json.loads((DATA/name).read_text(encoding='utf-8'))
STAGES=read('story.json');CHAPTERS=read('chapters.json');MAZES=read('mazes.json');NEXUS=read('nexus.json');LESSONS=read('lessons.json')
STORY_IDS={s['id']:s for s in STAGES};NEXUS_IDS={n['id']:n for n in NEXUS}

def public(item):
    result={k:v for k,v in item.items() if k not in ('a','requirements')}
    if 'questions' in result:result['questions']=[{k:v for k,v in q.items() if k not in ('a','explanation')} for q in result['questions']]
    return result

def progress_for(user):
    p=json.loads(user['progress'])
    if p.get('schema') not in (8,9):
        if p.get('story'):p['storyV7']=p['story']
        p.update(schema=8,story={'cleared':[],'active':None},position={'world':0,'x':3,'y':3})
    if p.get('schema') == 8:
        p['legacyLevels']=dict(p.get('levels',{}));p['schema']=9
    p.setdefault('unlocked',['html','javascript'])
    if 'html' not in p['unlocked']:p['unlocked'].append('html')
    p.setdefault('team',['html','javascript'])
    p['team']=[id for id in p['team'] if id in combat.CATALOG and id in p['unlocked']][:3] or ['html']
    p.setdefault('inventory',{'patch':3,'antidote':2});p.setdefault('levels',{});p.setdefault('xp',{});p.setdefault('lessonProgress',{});p.setdefault('nexus',{'cleared':[],'active':None})
    p.setdefault('lessonRewards',[f'{id}:{level}' for id,done in p['lessonProgress'].items() for level in range(done)])
    training.normalize(p)
    return p

def save_progress(db,user,progress,earned=0):
    db.execute('UPDATE users SET progress=?,money=money+? WHERE id=?',(json.dumps(progress,ensure_ascii=False),earned,user['id']))

def story_state(progress):return progress['story']
def nexus_state(progress):return progress.setdefault('nexus',{'cleared':[],'active':None})
def story_position(progress):return progress['position']
def unlocked_world(p):return min(6,len(p['story']['cleared'])//5)

def battle_questions(stage):
    if stage['world']==6:return [STAGES[w*5]['questions'][i] for i in range(5) for w in range(6)]
    return [q for s in STAGES if s['world']==stage['world'] for q in s['questions']]

def get_story(user):
    p=progress_for(user);active=p['story']['active'];b=active.get('battle') if active else None
    state=json.loads(json.dumps(p['story']))
    if state['active']:state['active'].pop('battle',None)
    return dict(stages=[dict(public(s),reward=0,xp=0,rewards=items.story_reward(s)) for s in STAGES],chapters=CHAPTERS,maps=MAZES,position=p['position'],state=state,
                battle=combat.public(b,battle_questions(STORY_IDS[active['id']])) if b else None,levels=p['levels'],xp=p['xp'],maxWorld=unlocked_world(p))

def get_nexus(user):return {'levels':[dict(public(n),reward=0,rewards=items.nexus_reward(i)) for i,n in enumerate(NEXUS)],'state':nexus_state(progress_for(user))}

def grant_xp(p,ids,amount):
    # Old saves retain their levels; new advancement comes from certified lessons.
    training.normalize(p)

def handle_story(db,user,action,body):
    p=progress_for(user);s=p['story'];active=s['active'];pos=p['position'];cleared=s['cleared'];expected=STAGES[len(cleared)] if len(cleared)<len(STAGES) else None
    reward=0;extra={}
    if action in ('move','travel'):
        if active:raise combat.RuleError('Conclua ou abandone a operação atual antes de explorar.')
        if action=='travel':
            w=body.get('world')
            if type(w) is not int or w not in range(unlocked_world(p)+1):raise combat.RuleError('Capítulo ainda bloqueado.',403)
            pos=dict(world=w,x=MAZES[w]['spawn'][0],y=MAZES[w]['spawn'][1])
        else:
            dx,dy=body.get('dx'),body.get('dy')
            if type(dx) is not int or type(dy) is not int or abs(dx)+abs(dy)!=1:raise combat.RuleError('Movimento inválido.',400)
            rows=MAZES[pos['world']]['rows'];x,y=pos['x']+dx,pos['y']+dy
            if not (0<=y<len(rows) and 0<=x<len(rows[0]) and rows[y][x]=='.'):raise combat.RuleError('Parede: procure uma passagem.',403)
            pos=dict(world=pos['world'],x=x,y=y)
            if [x,y]==MAZES[pos['world']]['portal'] and pos['world']<unlocked_world(p):
                w=pos['world']+1;pos=dict(world=w,x=MAZES[w]['spawn'][0],y=MAZES[w]['spawn'][1]);extra['worldChanged']=True
        p['position']=pos
    elif action=='start':
        if not expected or body.get('id')!=expected['id']:raise combat.RuleError('Esta fase está concluída ou ainda bloqueada.',403)
        spot=MAZES[expected['world']]['stages'][expected['phase']-1]
        if (pos['world'],pos['x'],pos['y'])!=(expected['world'],*spot):raise combat.RuleError('Pise no terminal desta fase para iniciar.',403)
        if not active:s['active']=dict(id=expected['id'],status='questions',q=0,battle=None)
    elif action=='abandon':s['active']=None
    elif action=='answer':
        if not active or active['status']!='questions':raise combat.RuleError('Nenhum terminal aguarda resposta.')
        stage=STORY_IDS[active['id']];q=stage['questions'][active['q']]
        if body.get('id')!=q['id'] or type(body.get('answer')) is not int or body['answer'] not in range(len(q['o'])):raise combat.RuleError('Resposta inválida.',400)
        extra['correct']=body['answer']==q['a'];extra['explanation']=q.get('explanation','')
        if extra['correct']:active['q']+=1
        if active['q']==len(stage['questions']):active['status']='battle';active['battle']=combat.create(p['team'],p['levels'],stage)
    elif action=='act':
        if not active or active['status']!='battle':raise combat.RuleError('Não há batalha ativa.')
        stage=STORY_IDS[active['id']];b=active['battle'];combat.step(b,body,battle_questions(stage),p['inventory'])
        extra['events']=b['events'];extra['battle']=combat.public(b,battle_questions(stage))
        if b['result']=='victory':
            granted=items.story_reward(stage);items.grant(p,granted);cleared.append(stage['id']);s['active']=None
            extra.update(cleared=True,earned=0,rewards=granted,outro=stage['outro'],xp=0)
            if stage['boss']:
                cid=CHAPTERS[stage['world']]['id']
                if cid in combat.CATALOG and cid not in p['unlocked']:p['unlocked'].append(cid);extra['rescued']=cid
        elif b['result']=='defeat':active['status']='defeat';extra['defeat']=True
    else:raise combat.RuleError('Operação desconhecida.',404)
    save_progress(db,user,p,reward)
    if action in ('move','travel'):
        return 200,dict(position=p['position'],worldChanged=extra.get('worldChanged',action=='travel'))
    new_user=dict(user);new_user['progress']=json.dumps(p)
    result=get_story(new_user);result.update(extra);result['money']=user['money']+reward
    return 200,result

def handle_lesson(db,user,body):
    p=progress_for(user);id=body.get('id');level=body.get('level');agent=next((a for a in LESSONS if a['id']==id),None)
    if not agent or type(level) is not int or level not in range(5):raise combat.RuleError('Aula inválida.',400)
    done=p['lessonProgress'].get(id,0)
    if level<done:return 200,dict(complete=True,earned=0,progress=p)
    if level!=done:raise combat.RuleError('Conclua o nível anterior.')
    answers=body.get('answers');qs=agent['niveis'][level]['questoes']
    if not isinstance(answers,list) or len(answers)!=len(qs) or any(type(a) is not int for a in answers):raise combat.RuleError('Responda todas as perguntas.',400)
    correct=all(a==q['correta'] for a,q in zip(answers,qs))
    earned=0
    if correct:
        p['lessonProgress'][id]=done+1
        training.certify_main(p,id,level)
        reward_id=f'{id}:{level}'
        if reward_id not in p['lessonRewards']:p['lessonRewards'].append(reward_id);earned=25
        save_progress(db,user,p,earned)
    return 200,dict(complete=correct,earned=earned,progress=p)

def handle_nexus(db,user,action,body):
    import nexus_legacy
    for key in ('progress_for','nexus_state','save_progress','NEXUS','NEXUS_IDS','public'):setattr(nexus_legacy,key,globals()[key])
    return nexus_legacy.handle_nexus(db,user,action,body)
