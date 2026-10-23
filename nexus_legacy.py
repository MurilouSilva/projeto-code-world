import practice
import items

def handle_nexus(db, user, action, body):
    progress = progress_for(user)
    state = nexus_state(progress)
    active = state['active']
    if action == 'start':
        stage_id = body.get('id')
        expected = NEXUS[len(state['cleared'])]['id'] if len(state['cleared']) < len(NEXUS) else None
        if stage_id != expected:
            return 403, {'error': 'Conclua o nível anterior do mapa.'}
        if active is None or active['id'] != stage_id:
            active = {'id': stage_id, 'q': 0, 'codeValidated': False}
            state['active'] = active
            save_progress(db, user, progress)
        return 200, {'state': state, 'level': public(NEXUS_IDS[stage_id])}
    if not active or active['id'] not in NEXUS_IDS:
        return 409, {'error': 'Selecione um nível do mapa primeiro.'}
    level = NEXUS_IDS[active['id']]
    if action == 'answer':
        if active['q'] >= len(level['questions']):
            return 409, {'error': 'As perguntas deste nível já foram respondidas.'}
        question = level['questions'][active['q']]
        if body.get('id') != question['id'] or type(body.get('answer')) is not int or body['answer'] not in range(len(question['o'])):
            return 400, {'error': 'Resposta fora da etapa atual.'}
        if body['answer'] != question['a']:
            return 200, {'correct': False, 'state': state}
        active['q'] += 1
        save_progress(db, user, progress)
        return 200, {'correct': True, 'state': state}
    if action in ('code','run'):
        code=body.get('code','')
        result=practice.nexus_check(level['id'],code)
        active['codeDraft']=code[:12000] if isinstance(code,str) else ''
        active['codeValidated']=result['passed']
        save_progress(db,user,progress)
        return 200,dict(result,valid=result['passed'],state=state)
    if action == 'complete':
        result=practice.nexus_check(level['id'],body.get('code',active.get('codeDraft','')))
        if active['q']!=len(level['questions']) or not result['passed']:
            return 409,{'error':'Conclua as cinco questões e execute um código que cumpra o objetivo.'}
        rewards=items.nexus_reward(NEXUS.index(level));items.grant(progress,rewards)
        state['cleared'].append(level['id']);state['active']=None
        save_progress(db,user,progress)
        return 200,{'earned':0,'rewards':rewards,'state':state}
    return 404, {'error': 'Operação desconhecida.'}
