"""Verified lessons, not battles or read receipts, level up characters."""
import copy
import json
from pathlib import Path
import combat
import practice
COURSES=json.loads((Path(__file__).parent/'data/curriculum.json').read_text(encoding='utf-8'))
BY_ID={c['id']:c for c in COURSES}

def normalize(p):
    p.setdefault('training',{});p.setdefault('legacyLevels',{});p.setdefault('levels',{})
    for c in COURSES:
        cid=c['id'];known={m['id'] for m in c['modules']}
        completed=set(p['training'].get(cid,[])) & known
        completed.update(f'{cid}-{i}' for i in range(min(5,p.get('lessonProgress',{}).get(cid,0))))
        p['training'][cid]=[m['id'] for m in c['modules'] if m['id'] in completed]
        p['levels'][cid]=min(10,max(int(p['legacyLevels'].get(cid,1)),1+len(completed)))

def public_courses():
    result=copy.deepcopy(COURSES)
    for c in result:
        for m in c['modules']:
            m.pop('rule',None)
            for q in m.get('questions',[]):q.pop('answer',None)
    return result

def module_for(body):
    cid=body.get('id');index=body.get('index')
    if not isinstance(cid,str) or cid not in BY_ID or type(index) is not int or index not in range(9):
        raise combat.RuleError('Aula inválida.',400)
    return cid,index,BY_ID[cid]['modules'][index]

def certify_main(p,cid,index):
    normalize(p)
    mid=f'{cid}-{index}'
    if mid not in p['training'][cid]:p['training'][cid].append(mid)
    normalize(p)

def complete(p,body):
    normalize(p);cid,index,m=module_for(body);done=p['training'][cid];old=p['levels'][cid]
    if m['id'] in done:return dict(complete=True,earned=0,level=old,levelUp=False,progress=p)
    if any(x['id'] not in done for x in BY_ID[cid]['modules'][:index]):raise combat.RuleError('Conclua a aula anterior para avançar.')
    if m['kind']=='quiz':
        answers=body.get('answers');qs=m['questions']
        if not isinstance(answers,list) or len(answers)!=len(qs) or any(type(a) is not int for a in answers):raise combat.RuleError('Responda todas as perguntas.',400)
        passed=all(a==q['answer'] for a,q in zip(answers,qs));result={}
    else:result=practice.evaluate(body.get('code'),m['language'],m['rule']);passed=result['passed']
    if not passed:return dict(result,complete=False,earned=0,progress=p)
    done.append(m['id']);earned=m['reward']
    if index<5:
        p['lessonProgress'][cid]=max(index+1,p['lessonProgress'].get(cid,0));rid=f'{cid}:{index}'
        if rid in p['lessonRewards']:earned=0
        else:p['lessonRewards'].append(rid)
    normalize(p)
    return dict(result,complete=True,earned=earned,level=p['levels'][cid],levelUp=p['levels'][cid]>old,progress=p)
