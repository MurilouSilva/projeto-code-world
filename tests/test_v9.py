import concurrent.futures
import copy
import json
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch
import test_system as base
import campaign, combat, items, missions, practice, training
from helpers import lesson_body

class LearningMissionTests(unittest.TestCase):
    setUpClass=classmethod(base.SystemTests.setUpClass.__func__)
    tearDownClass=classmethod(base.SystemTests.tearDownClass.__func__)
    setUp=base.SystemTests.setUp
    request=base.SystemTests.request
    post=base.SystemTests.post
    get=base.SystemTests.get
    account=base.SystemTests.account

    def test_all_54_lessons_and_levels(self):
        self.account()
        for c in training.COURSES:
            for i,m in enumerate(c['modules']):
                with self.subTest(character=c['id'],lesson=i):
                    r=self.post('training/complete',lesson_body(c['id'],i))
                    self.assertTrue(r['complete']);self.assertEqual(r['level'],i+2)
                    self.assertEqual(self.post('training/complete',lesson_body(c['id'],i))['earned'],0)
        p=self.get('me');self.assertEqual(p['money'],1950);self.assertTrue(all(n==10 for n in p['progress']['levels'].values()))

    def test_wrong_answers_skip_and_read_marker_rejected(self):
        self.account();self.post('training/complete',lesson_body('html',1),409)
        body=lesson_body('html',0);body['answers']=[(a+1)%4 for a in body['answers']]
        self.assertFalse(self.post('training/complete',body)['complete'])
        self.assertEqual(self.get('me')['progress']['levels']['html'],1)
        self.post('progress',{'lesson':'html-intro'},400)

    def test_main_lesson_certifies_and_reset_keeps_level(self):
        self.account();a=campaign.LESSONS[0];cid=a['id']
        for i,n in enumerate(a['niveis']):
            self.post('lesson',dict(id=cid,level=i,answers=[q['correta'] for q in n['questoes']]))
        self.assertEqual(self.get('me')['progress']['levels'][cid],6)
        self.post('lessons/reset',{});self.assertEqual(self.get('me')['progress']['levels'][cid],6)
        self.assertEqual(self.post('training/complete',lesson_body(cid,0))['earned'],0)

    def test_run_claim_and_concurrent_replay(self):
        self.account();day=self.get('missions')['day'];body=dict(id='escape-loop',day=day,code='console.log(3 * 12);')
        initial=self.get('me')['progress']['inventory']
        self.assertTrue(self.post('missions/run',body)['passed']);self.assertEqual(self.get('me')['progress']['inventory'],initial)
        self.assertFalse(self.post('missions/claim',dict(body,code='console.log(35);'))['passed'])
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:self.request('/api/missions/claim',body),range(4)))
        self.assertTrue(all(r[0]==200 for r in results));self.assertEqual(sum(r[1]['granted'].get('battery',0) for r in results),2)
        self.assertEqual(self.get('me')['progress']['inventory']['battery'],2)

    def test_all_permanent_terminals(self):
        self.account();day=self.get('missions')['day']
        solutions={'bug-invasor':'<main><section><h2>Nível 0</h2><p>HTML</p></section></main>','escape-loop':'const torres=3; const energia=12; console.log(torres*energia);','dados-perdidos':'pacotes=[7,11,5]\nprint(sum(pacotes))','firewall':'.quadrado {display:grid; grid-template-columns:repeat(2, 1fr); gap:16px;}','protocolo-raiz':'console.log(Math.min(100, 86 + 28));','sinal':'<main><button>Conectar</button></main>'}
        for id,code in solutions.items():
            with self.subTest(id=id):self.assertTrue(self.post('missions/claim',dict(id=id,day=day,code=code))['passed'])
        p=self.get('me');self.assertEqual(len(p['progress']['missionClaims']),6);self.assertEqual(p['money'],0)
        self.assertTrue(all(m['completed'] for m in self.get('missions')['missions'] if not m['daily']))

    def test_midnight_refresh_and_old_claim_rejected(self):
        self.account();before=datetime(2026,10,23,23,59,59,tzinfo=missions.ZONE)
        with patch('missions.now',return_value=before):
            old=self.get('missions');self.assertEqual(old,self.get('missions'))
        with patch('missions.now',return_value=before+timedelta(seconds=1)):
            new=self.get('missions');self.assertNotEqual(old['day'],new['day'])
            self.post('missions/claim',dict(id=old['missions'][0]['id'],day=old['day'],code='x'),409)
        with patch('missions.now',return_value=before+timedelta(days=12)):
            self.assertEqual(self.get('missions')['day'],'2026-11-04')

    def test_claims_are_account_bound(self):
        self.account();day=self.get('missions')['day'];body=dict(id='escape-loop',day=day,code='console.log(36)')
        self.post('missions/claim',body);self.email='other'+self.email;self.account()
        self.assertFalse(next(m for m in self.get('missions')['missions'] if m['id']=='escape-loop')['completed'])
        self.assertEqual(self.post('missions/claim',body)['granted'],{'battery':2})

    def test_public_content_has_no_answer_keys(self):
        data=self.get('content')
        for c in data['courses']:
            self.assertEqual(len(c['modules']),9)
            for m in c['modules']:
                self.assertNotIn('rule',m)
                for q in m.get('questions',[]):self.assertNotIn('answer',q)
        self.assertTrue(all('rule' not in m for m in self.get('missions')['missions']))

    def test_nexus_all_four_validated_terminals(self):
        self.account();solutions=['<main><h1>CodeWorld</h1></main>','const total = 2 + 3; console.log(total);','valores=[2,3]\nprint(sum(valores))','SELECT nome FROM linguagens WHERE nivel >= 10;']
        for n,code in zip(campaign.NEXUS,solutions):
            self.post('nexus/start',{'id':n['id']})
            for q in n['questions']:self.post('nexus/answer',dict(id=q['id'],answer=q['a']))
            self.assertTrue(self.post('nexus/run',{'code':code})['passed'])
            self.assertEqual(self.get('nexus')['state']['active']['codeDraft'],code)
            self.post('nexus/complete',{'code':'incorrect'},409)
            self.assertTrue(self.post('nexus/complete',{'code':code})['rewards'])
        self.assertEqual(len(self.get('me')['progress']['nexus']['cleared']),4)

class RevisionRulesTests(unittest.TestCase):
    def test_v8_migration_preserves_progress(self):
        old=dict(schema=8,levels={'html':7},xp={'html':99},story={'cleared':['c1s1'],'active':None},position={'world':0,'x':5,'y':3})
        p=campaign.progress_for({'progress':json.dumps(old)})
        self.assertEqual(p['story'],old['story']);self.assertEqual(p['position'],old['position']);self.assertEqual(p['levels']['html'],7)
        campaign.grant_xp(p,['html'],99999);self.assertEqual(p['levels']['html'],7)

    def test_battery_and_shield_consumption(self):
        for item in ('battery','shield'):
            b=combat.create(['html','javascript'],{},campaign.STAGES[0]);u=b['team'][1];inv={item:1}
            body=dict(battleId=b['id'],revision=0,actor=0,action='item',item=item,target=u['uid'])
            combat.step(b,body,[],inv);self.assertEqual(inv[item],0)
            if item=='battery':self.assertEqual(u['energy'],90)
            else:self.assertTrue(combat.has(u,'fortify'));self.assertEqual(u['effects'][0]['turns'],2)

    def test_safe_code_and_fake_keywords(self):
        for code in ['import os\nprint(5)','print(__import__("os").getcwd())','while True: pass','print(9**999999999)','print([1]*999999999)','console.log(fetch("https://example.com"))']:
            self.assertFalse(practice.evaluate(code,'python',{'output':5})['passed'])
        self.assertFalse(practice.evaluate('<!-- <main><h1>CodeWorld</h1></main> -->','html',{'nodes':[{'tag':'main'}]})['passed'])
        self.assertFalse(practice.evaluate('/* .quadrado {width:120px;} */','css',{'props':{'width':'120px'}})['passed'])
        self.assertFalse(practice.nexus_check('n3','SELECT nome FROM linguagens')['passed'])

    def test_daily_challenges_solvable_and_deterministic(self):
        for date in [datetime(2026,10,23,tzinfo=missions.ZONE),datetime(2026,10,24,tzinfo=missions.ZONE),datetime(2027,1,1,tzinfo=missions.ZONE)]:
            with patch('missions.now',return_value=date):
                day,_,rows=missions.assignments();self.assertEqual(len([m for m in rows if m['daily']]),3)
                for m in rows[:3]:
                    if m['language']=='html':code='<main><h1>'+m['rule']['nodes'][1]['text']+'</h1></main>'
                    elif m['language']=='css':code='.quadrado {'+';'.join(k+':'+v for k,v in m['rule']['props'].items())+';}'
                    else:code=m['starter']+'\nconsole.log(energia - custo);'
                    self.assertTrue(missions.submit({},dict(id=m['id'],day=day,code=code),True)['passed'],m['title'])

if __name__=='__main__':unittest.main()
