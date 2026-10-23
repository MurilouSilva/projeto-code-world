"""Inventory rewards shared by every campaign and the mission terminal."""
CATALOG = {
    'patch': dict(name='Patch de reparo', desc='Restaura 40% da vida máxima de um aliado consciente.', price=60, color='mint'),
    'antidote': dict(name='Antídoto', desc='Remove veneno, sangramento, fraqueza e atordoamento.', price=45, color='violet'),
    'battery': dict(name='Bateria de energia', desc='Recupera 45 pontos de energia de um aliado.', price=55, color='gold'),
    'shield': dict(name='Escudo de dados', desc='Reduz o dano recebido em 35% por duas ações do aliado.', price=75, color='blue'),
}

def grant(progress, rewards):
    inventory = progress.setdefault('inventory', {})
    for key, quantity in rewards.items():
        if key in CATALOG and type(quantity) is int and quantity > 0:
            inventory[key] = inventory.get(key, 0) + quantity

def story_reward(stage):
    if stage['world'] == 6:
        return dict(patch=5, antidote=3, battery=3, shield=3)
    if stage['boss']:
        return dict(patch=2, battery=1, shield=1)
    return {'patch': 1, ['battery', 'antidote', 'shield'][stage['phase'] % 3]: 1}

def question_reward(index):
    return {list(CATALOG)[index % 4]: 1}

def nexus_reward(index):
    return {'patch': 2, 'battery': 1, ['antidote', 'shield'][index % 2]: 1}
