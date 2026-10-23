"""Authoritative turn engine. Clients submit intent, never HP, damage or wins."""
import copy
import items
import json
import random
import secrets
from pathlib import Path

DATA = Path(__file__).resolve().parent / 'data'
CHARACTERS = json.loads((DATA/'characters.json').read_text(encoding='utf-8'))
CATALOG = {c['id']:c for c in CHARACTERS}
ENEMIES = {e['id']:e for e in json.loads((DATA/'enemies.json').read_text(encoding='utf-8'))}
EFFECTS = {'poison':'Envenenado','bleed':'Sangramento','stun':'Atordoamento','weakness':'Fraqueza','fortify':'Fortificação','boost':'Potencialização'}
BASIC = dict(name='Ataque básico',cost=0,power=.85,target='enemy',energy=18,fx='strike')

class RuleError(Exception):
    def __init__(self, message, status=409):
        self.status=status
        super().__init__(message)

def attributes(character, level):
    a=character['stats'][:]
    for i,m in enumerate([3,5,7,9,10]):
        if level>=m:a[character['growth'][i]]+=1
    return a

def player(id, level):
    c=CATALOG[id];a=attributes(c,level)
    hp=120+a[0]*24+(level-1)*14
    return dict(id=id,uid=id,name=c['name'],level=level,maxHP=hp,hp=hp,energy=45,atk=15+a[2]*8+a[1]*2+(level-1)*4,
                defense=8+a[0]*2+a[3]*2,sanity=a[3],intelligence=a[1],effects=[],guard=False,side='team',skills=c['skills'],color=c['color'])

def create(team, levels, stage):
    party=[player(id,min(10,max(1,int(levels.get(id,1))))) for id in team if id in CATALOG]
    if not party:raise RuleError('Escolha pelo menos um personagem na Equipe.')
    w,p=stage['world'],stage['phase'];foes=[]
    for i,id in enumerate(stage['enemies']):
        e=ENEMIES[id];boss=e.get('boss',False)
        hp=(330+w*70+p*10) if boss else (120+w*33+p*10)
        foes.append(dict(id=id,uid='enemy'+str(i),name=e['name'],sprite=e['sprite'],side='enemies',maxHP=hp,hp=hp,
                         atk=25+w*7+p*2+(10 if boss else 0),defense=10+w*3,energy=100,effects=[],guard=False,
                         boss=boss,effect=e['effect'],fx=e['fx'],sanity=3))
    return dict(id=secrets.token_hex(12),revision=0,round=1,phase='player',actor=0,acted=[],team=party,enemies=foes,
                result=None,questionIndex=0,usedLanguages=[],events=[],stage=stage['id'])

def emit(b,kind,**kw):b['events'].append(dict(kind=kind,**kw))
def alive(units):return [u for u in units if u['hp']>0]
def has(u,effect):return any(e['type']==effect for e in u['effects'])

def apply(b,u,typ,duration=None):
    if typ not in EFFECTS:return
    u['effects']=[e for e in u['effects'] if e['type']!=typ]
    u['effects'].append(dict(type=typ,turns=duration or (1 if typ=='stun' else 2),stamp=b['revision']))
    emit(b,'effect',target=u['uid'],effect=typ,turns=u['effects'][-1]['turns'])

def hurt(b,u,amount,kind='damage'):
    amount=min(u['hp'],max(0,int(amount)));u['hp']-=amount
    emit(b,kind,target=u['uid'],amount=amount,hp=u['hp'])
    if u['hp']==0:emit(b,'faint',target=u['uid'])

def damage(actor,target,skill):
    value=max(4,actor['atk']*skill.get('power',1)-target['defense']*.55)
    if has(actor,'weakness'):value*=.7
    if has(actor,'boost'):value*=1.3
    if has(target,'fortify'):value*=.65
    if target['guard']:value*=.45
    return max(1,round(value))

def age(u,revision):
    for e in u['effects']:
        if e['stamp']<revision:e['turns']-=1
    u['effects']=[e for e in u['effects'] if e['turns']>0]

def start_turn(b,u,attacking=True):
    if has(u,'poison'):hurt(b,u,max(1,round(u['maxHP']*.045)),'poison')
    if attacking and has(u,'bleed') and u['hp']>0: hurt(b,u,max(1,round(u['maxHP']*.06)),'bleed')
    if u['hp']<=0:return False
    if has(u,'stun'):
        emit(b,'stun',target=u['uid']);u['effects']=[e for e in u['effects'] if e['type']!='stun'];return False
    return True

def evaluate(b):
    if not alive(b['enemies']):b.update(phase='victory',result='victory')
    elif not alive(b['team']):b.update(phase='defeat',result='defeat')
    if b['result']:emit(b,b['result'])
    return bool(b['result'])

def execute(b,actor,skill,targets,rng):
    emit(b,'cast',actor=actor['uid'],targets=[t['uid'] for t in targets],name=skill['name'],fx=skill.get('fx','strike'),hits=skill.get('hits',1))
    actor['energy']=max(0,min(100,actor.get('energy',100)-skill.get('cost',0)+skill.get('energy',0)))
    for target in targets:
        if skill.get('power'):hurt(b,target,damage(actor,target,skill))
        if skill.get('heal'):
            amount=min(target['maxHP']-target['hp'],round(target['maxHP']*skill['heal']));target['hp']+=amount
            emit(b,'heal',target=target['uid'],amount=amount,hp=target['hp'])
        if target['hp']>0:
            for key in ['effect','extraEffect']:
                effect=skill.get(key)
                if effect:
                    if actor['side']=='enemies' and effect in ['stun','weakness','poison','bleed'] and rng.random()<min(.4,target['sanity']*.04):
                        emit(b,'resist',target=target['uid'],effect=effect)
                    else:apply(b,target,effect,skill.get('duration'))
    if skill.get('selfEffect'):apply(b,actor,skill['selfEffect'])

def enemy_round(b,rng):
    for i,foe in enumerate(list(b['enemies'])):
        if foe['hp']<=0:continue
        b['revision']+=1
        if start_turn(b,foe):
            if foe['effect']=='fortify' and not has(foe,'fortify') and (foe['hp']<foe['maxHP']*.6 or b['round']==1):
                execute(b,foe,dict(name='Defesa do sistema',fx='shield',target='self',effect='fortify'),[foe],rng)
            else:
                candidates=alive(b['team'])
                if not candidates:break
                # Alternate pressure between support/low-HP units and other allies.
                target=min(candidates,key=lambda u:u['hp']/u['maxHP']) if (b['round']+i)%3 else rng.choice(candidates)
                skill=dict(name={'stun':'Interrupção','poison':'Dados contaminados','weakness':'Interferência','bleed':'Fragmentação'}.get(foe['effect'],'Impacto'),fx=foe['fx'],power=1)
                if (b['round']+i)%2==0 and foe['effect']!='fortify':skill['effect']=foe['effect']
                if foe['id']=='clone' and b.get('lastPlayerSkill'):
                    last=b['lastPlayerSkill'];skill.update(name='Eco de '+last['name'],fx=last.get('fx','strike'),power=min(1.35,last.get('power',1) or 1))
                if foe['id']=='bug':skill['power']=[.8,1.25,1.0][b['round']%3]
                if foe['id']=='boss6':
                    protocols=[('HTML','charge','stun'),('CSS','missile','weakness'),('JavaScript','wave','bleed'),('Python','poison','poison'),('Java','barrage','weakness'),('Kotlin','laser','stun')]
                    language,fx,effect=protocols[(b['round']-1)%6]
                    skill.update(name='Protocolo corrompido · '+language,fx=fx,effect=effect)
                execute(b,foe,skill,[target],rng)
        age(foe,b['revision'])
        if evaluate(b):return
        if foe['id'] in ['duplicate','boss3'] and b['round']==3 and len(b['enemies'])<4:
            child=copy.deepcopy(foe);child.update(uid='enemy'+str(len(b['enemies'])),name='Duplicata instável',id='duplicate',boss=False,maxHP=max(60,foe['maxHP']//3),hp=max(60,foe['maxHP']//3),effects=[])
            b['enemies'].append(child);emit(b,'spawn',unit=copy.deepcopy(child))
    b['round']+=1;b['acted']=[]
    for u in alive(b['team']):
        u['guard']=False;u['energy']=min(100,u['energy']+8+u['intelligence'])
    emit(b,'round',round=b['round'])

def step(b,body,questions,inventory,rng=None):
    """Mutates a battle only after complete intent validation; persisted atomically."""
    rng=rng or random.SystemRandom()
    if b['result']:raise RuleError('Esta batalha já terminou.')
    if body.get('battleId')!=b['id'] or type(body.get('revision')) is not int or body['revision']!=b['revision']:
        raise RuleError('O turno mudou. Atualize a batalha antes de agir.')
    actor_index=body.get('actor',b['actor'])
    if type(actor_index) is not int or actor_index not in range(len(b['team'])):raise RuleError('Aliado inválido.',400)
    actor=b['team'][actor_index]
    if actor['hp']<=0 or actor_index in b['acted']:raise RuleError('Este aliado já agiu ou está derrotado.')
    action=body.get('action')
    target_id=body.get('target')
    item=None;skill=None;targets=[]
    if action=='skill':
        index=body.get('skill')
        if type(index) is not int or index not in range(4):raise RuleError('Habilidade inválida.',400)
        if actor['level']< [1,1,3,7][index]:raise RuleError('Habilidade ainda bloqueada pelo nível.')
        skill=actor['skills'][index]
    elif action=='basic':skill=BASIC
    elif action=='item':
        item=body.get('item')
        if not isinstance(item,str) or item not in items.CATALOG or inventory.get(item,0)<1:raise RuleError('Item indisponível.')
        skill=dict(name=items.CATALOG[item]['name'],fx='shield' if item=='shield' else 'heal',target='ally',heal=.4 if item=='patch' else 0)
        if item=='shield':skill.update(effect='fortify',duration=2)
    elif action!='defend':raise RuleError('Ação desconhecida.',400)
    if skill:
        if actor['energy']<skill.get('cost',0):raise RuleError('Energia insuficiente. Use ataque básico ou defenda.')
        if skill.get('requires') and not any(u['id']==skill['requires'] for u in alive(b['team'])):raise RuleError('Java precisa estar consciente na equipe para o ataque em dupla.')
        mode=skill.get('target','enemy')
        if mode in ['self','team']:targets=[actor] if mode=='self' else alive(b['team'])
        elif mode=='all':targets=alive(b['enemies'])[:skill.get('maxTargets',99)]
        else:
            targets=[u for u in (b['team'] if mode=='ally' else b['enemies']) if u['uid']==target_id and u['hp']>0]
        if not targets:raise RuleError('Selecione um alvo vivo.',400)
        if b['stage']=='c7s1':
            # The core unlocks after its shell and arms fall.
            if alive([u for u in b['enemies'] if not u['boss']]):
                targets=[u for u in targets if not u.get('boss')]
                if not targets:raise RuleError('Destrua a carapaça e os braços antes de atingir o Núcleo.')
    b['events']=[];b['revision']+=1
    can_act=start_turn(b,actor,action in ['basic','skill'])
    if can_act:
        if action=='defend':
            actor['guard']=True;actor['energy']=min(100,actor['energy']+30)
            emit(b,'cast',actor=actor['uid'],targets=[actor['uid']],name='Defender',fx='shield',hits=1)
        else:
            execute(b,actor,skill,targets,rng)
            if skill.get('power'):b['lastPlayerSkill']={k:skill[k] for k in ['name','power','fx'] if k in skill}
            if actor['id'] not in b['usedLanguages']:b['usedLanguages'].append(actor['id'])
            if item:
                inventory[item]-=1
                for t in targets:
                    if item=='antidote':t['effects']=[e for e in t['effects'] if e['type'] not in ['poison','bleed','weakness','stun']]
                    if item=='battery':
                        amount=min(45,100-t['energy']);t['energy']+=amount
                        emit(b,'energy',target=t['uid'],amount=amount,energy=t['energy'])
    age(actor,b['revision']);b['acted'].append(actor_index)
    if not evaluate(b):
        remaining=[i for i,u in enumerate(b['team']) if u['hp']>0 and i not in b['acted']]
        if not remaining:enemy_round(b,rng)
        b['actor']=next((i for i,u in enumerate(b['team']) if u['hp']>0 and i not in b['acted']),0)
    return b

def public(b,questions):
    if not b:return None
    result=copy.deepcopy(b)
    result.pop('questionIndex',None)
    return result
