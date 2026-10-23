"""Offline regression tests. Uses an isolated SQLite database and loopback HTTP."""
import concurrent.futures
import copy
import hashlib
import http.client
import json
import os
from pathlib import Path
import random
import sqlite3
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from collections import deque

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import server
import campaign
import combat
import items
from helpers import study

class Quiet(server.Handler):
    def log_message(self,*args):pass

class SystemTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory();server.DB=Path(cls.temp.name)/'test.sqlite3'
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);cls.port=cls.http.server_port
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.temp.cleanup()
    def setUp(self):
        self.cookie='';self.email=f'test{time.time_ns()}@example.invalid'
        server.ATTEMPTS.clear()
    def request(self,path,body=None,method=None,cookie=None,headers=None,raw=None):
        h={'Origin':f'http://127.0.0.1:{self.port}'}
        if body is not None:h['Content-Type']='application/json'
        if cookie is None:cookie=self.cookie
        if cookie:h['Cookie']=cookie
        if headers:h.update(headers)
        c=http.client.HTTPConnection('127.0.0.1',self.port,timeout=15)
        c.request(method or ('POST' if body is not None else 'GET'),path,body=raw if raw is not None else json.dumps(body) if body is not None else None,headers=h)
        r=c.getresponse();status=r.status;hs=dict(r.getheaders());data=r.read();c.close()
        if 'application/json' in hs.get('Content-Type',''):data=json.loads(data)
        return status,data,hs
    def post(self,path,body,status=200):
        code,data,_=self.request('/api/'+path,body);self.assertEqual(code,status,data);return data
    def get(self,path,status=200):
        code,data,_=self.request('/api/'+path);self.assertEqual(code,status,data);return data
    def account(self):
        pwd='Offline-Test-Password-2026'
        r=self.post('register',dict(email=self.email,username='u'+str(time.time_ns())[-18:],password=pwd),201)
        secret=r['setupSecret'];otp=server.totp(secret,int(time.time()//30))
        status,r,headers=self.request('/api/verify',dict(email=self.email,password=pwd,code=otp))
        self.assertEqual(status,200,r);self.cookie=headers['Set-Cookie'].split(';')[0]
        return secret,pwd,otp
    def move_to(self,world,x,y):
        p=self.get('story')['position']
        if p['world']!=world:self.post('story/travel',{'world':world});p=self.get('story')['position']
        rows=campaign.MAZES[world]['rows'];start=(p['x'],p['y']);target=(x,y);q=deque([start]);prev={start:None}
        while q:
            cur=q.popleft()
            if cur==target:break
            for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                nx,ny=cur[0]+dx,cur[1]+dy
                if 0<=ny<len(rows) and 0<=nx<len(rows[0]) and rows[ny][nx]=='.' and (nx,ny) not in prev:
                    prev[(nx,ny)]=cur;q.append((nx,ny))
        self.assertIn(target,prev);path=[];cur=target
        while prev[cur] is not None:path.append(cur);cur=prev[cur]
        cur=start
        for cell in reversed(path):self.post('story/move',dict(dx=cell[0]-cur[0],dy=cell[1]-cur[1]));cur=cell
    def begin(self,index=0):
        s=campaign.STAGES[index];self.move_to(s['world'],*campaign.MAZES[s['world']]['stages'][s['phase']-1]);self.post('story/start',{'id':s['id']})
        for q in s['questions']:r=self.post('story/answer',dict(id=q['id'],answer=q['a']))
        return r
    def action(self,b,index=None,skill=None,target=None,action='basic'):
        i=b['actor'] if index is None else index
        targets=[u for u in b['enemies'] if u['hp']>0]
        if b['stage']=='c7s1' and any(not u['boss'] for u in targets):targets=[u for u in targets if not u['boss']]
        target=target or min(targets,key=lambda u:u['hp'])['uid']
        return dict(battleId=b['id'],revision=b['revision'],actor=i,action=action,skill=skill,target=target)

    def test_boot_and_static_routes(self):
        self.assertTrue(self.get('health')['ok'])
        for route in ['/','/nexus/index.html','/universo/index.html','/personagens/index.html','/mapa/index.html','/missoes/index.html','/arquivos/index.html','/perfil/index.html','/rpg/index.html','/campanha/index.html','/academia/index.html','/rpg/assets/poses.png']:
            with self.subTest(route=route):self.assertEqual(self.request(route)[0],200)
    def test_private_files_get_and_head(self):
        for path in ['/data/players.sqlite3','/data/story.json','/server.py','/docs/main-manifest.json','/.env','/rpg/../data/story.json','/%2e%2e/etc/passwd','/data/','/tests/test_system.py']:
            for method in ['GET','HEAD']:
                with self.subTest(path=path,method=method):self.assertEqual(self.request(path,method=method)[0],404)
    def test_authentication_2fa_cookie_and_replay(self):
        self.get('me',401);secret,pwd,otp=self.account();profile=self.get('me');self.assertEqual(profile['email'],self.email)
        self.assertNotIn('secret',profile);self.assertNotIn('password',profile)
        self.post('login',dict(email=self.email,password=pwd,code=otp),401)
        self.post('logout',{});self.get('me',401)
    def test_invalid_password_and_otp(self):
        self.account();self.post('login',dict(email=self.email,password='wrong',code='000000'),401)
        self.post('login',dict(email=self.email,password='x'*129,code='000000'),400)
    def test_cookie_security_flags(self):
        r=self.post('register',dict(email=self.email,username='cookie'+str(time.time_ns())[-10:],password='Good-password-123'),201)
        _,_,h=self.request('/api/verify',dict(email=self.email,password='Good-password-123',code=server.totp(r['setupSecret'],int(time.time()//30))))
        for flag in ['HttpOnly','SameSite=Strict','Path=/']:self.assertIn(flag,h['Set-Cookie'])
    def test_json_origin_and_host_validation(self):
        self.assertEqual(self.request('/api/register',{},headers={'Origin':'https://attacker.invalid'})[0],403)
        self.assertEqual(self.request('/api/me',headers={'Host':'attacker.invalid'})[0],403)
        self.assertEqual(self.request('/api/register',{},headers={'Content-Type':'text/plain'})[0],415)
        self.assertEqual(self.request('/api/register',{},raw='{')[0],400)
        self.assertEqual(self.request('/api/register',{},headers={'Content-Length':'wrong'},raw='')[0],400)
    def test_separate_accounts(self):
        self.account();q=server.QUESTIONS[0];self.post('answer',dict(id=q['id'],answer=q['a']));oldcookie=self.cookie
        self.email='other'+self.email;self.account();self.assertEqual(self.get('me')['money'],0)
        self.assertNotIn(q['id'],self.get('me')['completed']);self.cookie=oldcookie;self.assertEqual(self.get('me')['progress']['inventory']['patch'],4)
    def test_answer_reward_idempotency_and_race(self):
        self.account();q=server.QUESTIONS[0];body=dict(id=q['id'],answer=q['a'])
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.request('/api/answer',body),range(4)))
        self.assertTrue(all(r[0]==200 for r in results));self.assertEqual(sum(r[1]['rewards'].get('patch',0) for r in results),1);self.assertEqual(self.get('me')['progress']['inventory']['patch'],4);self.assertEqual(self.get('me')['money'],0)
    def test_shop_atomic_and_no_duplicate_charge(self):
        self.account()
        study(self,'html');study(self,'javascript')
        before=self.get('me')['money']
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(lambda _:self.request('/api/buy',{'id':'python'}),range(3)))
        self.assertTrue(all(r[0]==200 for r in results));p=self.get('me');self.assertEqual(p['money'],before-combat.CATALOG['python']['cost']);self.assertEqual(p['progress']['unlocked'].count('python'),1)
    def test_team_validation_and_inventory(self):
        self.account();self.post('progress',{'team':[]},400);self.post('progress',{'team':['html','html']},400);self.post('progress',{'team':['sql']},400);self.post('progress',{'team':[['html']]},400)
        self.post('progress',{'money':9999},400);self.post('progress',{'position':{'x':9}},400);self.post('buy',{'id':'csharp'},400)
        self.post('progress',{'team':['javascript','html']});self.assertEqual(self.get('me')['progress']['team'],['javascript','html'])
    def test_map_collision_stage_lock_and_travel(self):
        self.account();self.post('story/start',{'id':'c1s1'},403);self.post('story/start',{'id':'c1s2'},403);self.post('story/travel',{'world':1},403);self.post('story/move',{'dx':3,'dy':0},400);self.post('story/move',{'dx':True,'dy':0},400)
        self.move_to(0,1,1);self.post('story/move',{'dx':0,'dy':-1},403)
        self.move_to(0,5,3);self.post('story/start',{'id':'c1s1'});self.post('story/move',{'dx':1,'dy':0},409)
    def test_questions_strip_answers(self):
        self.account();r=self.get('story');self.assertNotIn('a',r['stages'][0]['questions'][0]);self.assertNotIn('battle',r['state'].get('active') or {})
        data=self.get('content');self.assertNotIn('correta',data['lessons'][0]['niveis'][0]['questoes'][0])
    def test_battle_authority_replay_and_resume(self):
        self.account();r=self.begin();b=r['battle'];self.assertTrue(b);self.post('story/battle',{'won':True},404)
        self.post('progress',{'team':['html']},409)
        body=self.action(b);r=self.post('story/act',body);self.assertNotEqual(r['battle']['revision'],b['revision']);self.post('story/act',body,409)
        resumed=self.get('story')['battle'];self.assertEqual(resumed['id'],b['id']);self.assertEqual(resumed['revision'],r['battle']['revision'])
    def test_attacks_execute_without_quiz(self):
        self.account();r=self.begin();b=r['battle'];self.assertNotIn('question',b)
        body=self.action(b);body['answer']='obsolete field is ignored'
        r=self.post('story/act',body);self.assertLess(sum(e['hp'] for e in r['battle']['enemies']),sum(e['hp'] for e in b['enemies']));self.assertNotIn('answer',[e['kind'] for e in r['events']])
    def test_lesson_progress_rewards_and_repeat(self):
        self.account();a=campaign.LESSONS[0];qs=a['niveis'][0]['questoes'];body=dict(id=a['id'],level=0,answers=[q['correta'] for q in qs]);self.assertTrue(self.post('lesson',body)['complete']);self.assertEqual(self.post('lesson',body)['earned'],0);self.assertEqual(self.get('me')['money'],25)
        self.post('lesson',dict(id=a['id'],level=3,answers=[0,0]),409)
        self.post('lessons/reset',{})
        self.assertEqual(self.get('me')['progress']['lessonProgress'],{})
        self.assertEqual(self.post('lesson',body)['earned'],0)
        self.assertEqual(self.get('me')['money'],25)
    def test_first_stage_completion_once(self):
        self.account();r=self.begin();turns=0
        while r['state']['active'] and r['state']['active']['status']=='battle' and turns<80:
            r=self.post('story/act',self.action(r['battle']));turns+=1
        self.assertTrue(r.get('cleared'),r.get('defeat'));self.assertGreater(turns,2);money=self.get('me')['money'];self.assertEqual(money,0);self.assertEqual(r['rewards'],items.story_reward(campaign.STAGES[0]));self.assertEqual(self.get('me')['progress']['levels']['html'],1);self.post('story/start',{'id':'c1s1'},403);self.assertEqual(self.get('me')['money'],money)
        self.assertEqual(self.get('story')['state']['cleared'],['c1s1']);self.post('story/start',{'id':'c1s2'},403)
    def test_nexus_questions_code_reward(self):
        self.account();n=campaign.NEXUS[0];self.post('nexus/start',{'id':n['id']});self.post('nexus/complete',{},409)
        for q in n['questions']:self.post('nexus/answer',dict(id=q['id'],answer=q['a']))
        self.assertFalse(self.post('nexus/code',{'code':'incorrect'})['valid']);code='<main><h1>Portal CodeWorld</h1></main>';self.assertTrue(self.post('nexus/code',{'code':code})['valid']);self.post('nexus/complete',{});self.post('nexus/complete',{},409);self.assertEqual(self.get('me')['progress']['inventory']['patch'],5)
    def test_full_31_stage_campaign_through_http(self):
        self.account()
        study(self,'html');study(self,'javascript')
        self.post('buy',{'id':'python'});study(self,'python');self.post('progress',{'team':['html','javascript','python']})
        with patch('combat.random.SystemRandom',return_value=random.Random(111)):
            for index,stage in enumerate(campaign.STAGES):
                with self.subTest(stage=stage['id']):
                    r=self.begin(index);turns=0
                    while r['state']['active'] and r['state']['active']['status']=='battle' and turns<150:
                        b=r['battle'];u=b['team'][b['actor']];foes=[e for e in b['enemies'] if e['hp']>0]
                        if index==30 and any(not e['boss'] for e in foes):foes=[e for e in foes if not e['boss']]
                        weakest=min([a for a in b['team'] if a['hp']>0],key=lambda a:a['hp']/a['maxHP'])
                        target=min(foes,key=lambda e:e['hp'])['uid'];skill=None;action='basic'
                        if u['id']=='python':
                            skill=0 if weakest['hp']/weakest['maxHP']<.7 and u['energy']>=22 else 1
                            if skill==0:target=weakest['uid']
                        elif u['id']=='javascript':skill=1 if u['energy']>=25 else 0
                        elif u['id']=='html' and u['energy']>=25:skill=1
                        if skill is not None:action='skill'
                        r=self.post('story/act',self.action(b,skill=skill,target=target,action=action));turns+=1
                    self.assertTrue(r.get('cleared'),f"{stage['id']} failed after {turns} actions")
                    self.assertEqual(len(self.get('story')['state']['cleared']),index+1)
        final=self.get('me');self.assertEqual(len(final['progress']['story']['cleared']),31)
        self.assertTrue(all(id in final['progress']['unlocked'] for id in combat.CATALOG))
        self.post('story/start',{'id':'c7s1'},403)
    def test_sql_isolated_and_services_honest(self):
        self.account();self.assertIn('JavaScript',self.post('run',dict(language='sql',code='SELECT nome FROM linguagens'))['output']);self.post('run',dict(language='sql',code='DROP TABLE users'),400)
        if not os.getenv('CODEWORLD_AI_KEY'):self.post('chat',{'message':'teste'},503)
        if not os.getenv('CODEWORLD_RUNNER_URL'):self.post('run',dict(language='java',code='x'),503)

class RulesTests(unittest.TestCase):
    def battle(self,team=None,level=10,index=0):return combat.create(team or ['html','javascript','python'],{c:level for c in combat.CATALOG},campaign.STAGES[index])
    def body(self,b,actor=0,action='basic',skill=None,target=None):
        q=campaign.battle_questions(campaign.STORY_IDS[b['stage']])[b['questionIndex']%len(campaign.battle_questions(campaign.STORY_IDS[b['stage']]))]
        return dict(battleId=b['id'],revision=b['revision'],actor=actor,action=action,skill=skill,target=target or b['enemies'][0]['uid'],questionId=q['id'],answer=q['a'])
    def step(self,b,body,inventory=None):return combat.step(b,body,campaign.battle_questions(campaign.STORY_IDS[b['stage']]),inventory or {'patch':3,'antidote':3},random.Random(5))
    def test_official_stats_and_skills(self):
        expected={'html':[7,2,4,2],'css':[6,3,4,2],'javascript':[5,2,6,2],'python':[4,3,4,4],'java':[4,4,5,2],'kotlin':[4,5,2,4]}
        self.assertEqual({c['id']:c['stats'] for c in combat.CHARACTERS},expected)
        for c in combat.CHARACTERS:self.assertEqual(sum(combat.attributes(c,1)),15);self.assertEqual(sum(combat.attributes(c,10)),20);self.assertEqual(len(c['skills']),4)
        self.assertEqual(combat.CATALOG['javascript']['skills'][0]['name'],'Corte JV');self.assertEqual(combat.CATALOG['kotlin']['skills'][1]['name'],'Toxina Gênesis')
    def test_all_maps_reachable(self):
        for m in campaign.MAZES:
            rows=m['rows'];seen={tuple(m['spawn'])};q=deque(seen)
            while q:
                x,y=q.popleft()
                for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                    nx,ny=x+dx,y+dy
                    if 0<=ny<len(rows) and 0<=nx<len(rows[0]) and rows[ny][nx]=='.' and (nx,ny) not in seen:seen.add((nx,ny));q.append((nx,ny))
            for pos in [*m['stages'],m['portal'],m['npc'],m['terminal']]:self.assertIn(tuple(pos),seen)
    def test_story_order_and_final_languages(self):
        self.assertEqual([c['id'] for c in campaign.CHAPTERS],['html','css','javascript','python','java','kotlin','core']);self.assertEqual(len(campaign.STAGES),31)
        self.assertEqual(len(campaign.battle_questions(campaign.STAGES[-1])),30)
    def test_poison_bleed_different_and_duration(self):
        b=self.battle();u=b['team'][0];h=u['hp'];combat.apply(b,u,'poison',2);combat.apply(b,u,'bleed',2);b['revision']+=1;combat.start_turn(b,u,False);self.assertEqual(h-u['hp'],round(u['maxHP']*.045));combat.age(u,b['revision']);h=u['hp'];b['revision']+=1;combat.start_turn(b,u,True);self.assertGreater(h-u['hp'],round(u['maxHP']*.045));combat.age(u,b['revision']);self.assertEqual(u['effects'],[])
    def test_stun_consumes_exactly_one_action(self):
        b=self.battle();combat.apply(b,b['team'][0],'stun');hp=b['enemies'][0]['hp'];self.step(b,self.body(b));self.assertEqual(b['enemies'][0]['hp'],hp);self.assertFalse(combat.has(b['team'][0],'stun'));self.assertIn(0,b['acted'])
    def test_fortify_weakness_boost_and_guard(self):
        b=self.battle();u,e=b['team'][0],b['enemies'][0];base=combat.damage(u,e,combat.BASIC);combat.apply(b,u,'weakness');self.assertLess(combat.damage(u,e,combat.BASIC),base);u['effects']=[];combat.apply(b,u,'boost');self.assertGreater(combat.damage(u,e,combat.BASIC),base);u['effects']=[];combat.apply(b,e,'fortify');self.assertLess(combat.damage(u,e,combat.BASIC),base);e['guard']=True;self.assertLess(combat.damage(u,e,combat.BASIC),base*.5)
    def test_heal_ally_and_consumables(self):
        b=self.battle();u=b['team'][0];u['hp']=30;inv={'patch':1,'antidote':1};body=self.body(b,action='item',target=u['uid']);body['item']='patch';self.step(b,body,inv);self.assertGreater(u['hp'],30);self.assertEqual(inv['patch'],0)
    def test_all_24_skills_animate_and_execute(self):
        for id,c in combat.CATALOG.items():
            for i,s in enumerate(c['skills']):
                with self.subTest(character=id,skill=i):
                    team=[id]+[x for x in ['java','html','python'] if x!=id][:2];b=self.battle(team);u=b['team'][0];u['energy']=100
                    if s.get('heal'):b['team'][1]['hp']=10
                    before=[e['hp'] for e in b['enemies']];body=self.body(b,action='skill',skill=i,target=b['team'][1]['uid'] if s['target']=='ally' else b['enemies'][0]['uid']);self.step(b,body)
                    casts=[e for e in b['events'] if e['kind']=='cast'];self.assertTrue(casts);self.assertEqual(casts[0]['fx'],s['fx']);self.assertEqual(casts[0]['name'],s['name'])
                    if s['power']:self.assertLess(sum(e['hp'] for e in b['enemies']),sum(before))
    def test_invalid_actions_are_not_partially_applied(self):
        b=self.battle(level=1);body=self.body(b,action='skill',skill=3);before=copy.deepcopy(b)
        with self.assertRaises(combat.RuleError):self.step(b,body)
        self.assertEqual(b,before)
    def test_duo_requires_java(self):
        b=self.battle(['javascript','html']);b['team'][0]['energy']=100
        with self.assertRaises(combat.RuleError):self.step(b,self.body(b,action='skill',skill=3))
    def test_core_shield(self):
        b=self.battle(index=30);body=self.body(b,target=b['enemies'][0]['uid'])
        with self.assertRaises(combat.RuleError):self.step(b,body)
    def test_defeat(self):
        b=self.battle(['html']);b['team'][0]['hp']=1;self.step(b,self.body(b,action='defend'));self.assertEqual(b['result'],'defeat')
    def test_preservation_main_assets_css_and_scripts(self):
        manifest=json.loads((ROOT/'docs/main-manifest.json').read_text(encoding='utf-8'))
        for name,sha in manifest.items():
            p=ROOT/name;self.assertTrue(p.exists(),name)
            if name.endswith('.html') or name in ['README.md','personagens/script.js','missoes/script.js']:continue
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),sha,name)

if __name__=='__main__':unittest.main(verbosity=2)
