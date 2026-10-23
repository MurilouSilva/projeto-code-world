# Atualização arquitetural v9

- `training.py` + `data/curriculum.json`: nove módulos por personagem. Respostas e regras permanecem no servidor; a API pública as remove. O ledger de certificações controla níveis e recompensas. `tools/build_curriculum.py` reconstrói as trilhas a partir das aulas originais e da academia.
- `missions.py`: missões permanentes e geração determinística por data UTC−03. O relógio do servidor decide quais diárias são válidas. `missionClaims` é por conta, dentro da mesma transação SQLite de concessão de itens.
- `practice.py`: parser HTML, critérios CSS, avaliador numérico AST com orçamento e SQLite descartável para SELECT. Não usa exec/eval de código enviado. Não é um interpretador geral de Python/JavaScript; atividades declaram operações compatíveis.
- `items.py`: catálogo único, preços e recompensas. `combat.py` valida turno, alvo, estoque e consumo. Ataques não dependem de perguntas; a revisão do turno continua obrigatória.
- `comum/mission-board.js`: central compartilhada entre MAIN e RPG. `rpg/js/training-ui.js`: estudo e certificação. `comum/onboarding.js`: guia por identidade e navegador. `operations.css`: estilos compartilhados.
- Migração `schema=8` → `schema=9`: níveis existentes viram um piso de preservação; futuras certificações passam a controlar a evolução. Story/posição/economia não são reiniciadas.

Rotas novas: GET `/api/missions`; POST `/api/missions/run`, `/api/missions/claim`, `/api/training/run`, `/api/training/complete`. GET `/api/content` inclui cursos sem gabaritos e catálogo de itens. POST `/api/nexus/run` testa e salva código; `/api/nexus/complete` revalida a solução. `/api/progress` aceita apenas equipe.

---

## Arquitetura da base v8 (referência histórica)

# Arquitetura e manutenção

## Estrutura

```text
server.py                 HTTP, autenticação, sessões, compras e serviços opcionais
campaign.py               história, movimento, lições, XP e recompensas
combat.py                 regras e estado autoritativo de batalha
nexus_legacy.py           campanha de programação do V7 preservada
data/                     conteúdo JSON e banco de jogadores criado ao executar
comum/base.*              design e animações originais do MAIN
comum/integracao.*        conta, tutor e pontos de conexão com o RPG
nexus/ universo/ ...      sete páginas originais do MAIN
rpg/index.html            shell RPG com cabeçalho original
rpg/style.css             interface da expansão
rpg/js/app.js             navegação e coordenação das operações
rpg/js/world.js           tiles, caminhada, colisões visuais e controles
rpg/js/sprites.js         importação das pranchas e atlas
rpg/js/dialogue.js        diálogos progressivos e cancelamento
rpg/js/battle-view.js     apresentação sequencial dos eventos do servidor
rpg/js/lab.js             executores isolados no cliente
rpg/assets/               pranchas originais, atlas de poses e inimigos
campanha/index.html       terminal Nexus fora do elenco RPG
academia/index.html       conteúdo complementar do V7
tools/build_content.py    gerador reproduzível do conteúdo novo
tests/test_system.py      testes HTTP, regras e preservação
```

O runtime lê os arquivos JSON diretamente. O gerador `tools/build_content.py` sobrescreve personagens, capítulos, inimigos, mapas e história. Se editar os JSON manualmente, não execute o gerador até incorporar essas mudanças nele. As aulas em `data/lessons.json` foram extraídas do `personagens/dados.js` original, cujo arquivo permanece preservado.

## Estado e fronteiras

`users.progress` armazena `schema`, `story`, `position`, `unlocked`, `team`, `inventory`, `levels`, `xp`, `lessonProgress`, `lessonRewards` e a campanha `nexus`. O saldo é uma coluna própria. As respostas gerais têm chave única `(user_id, question_id)` em outra tabela.

O estado de batalha ativo é serializado junto da operação. Inclui ID aleatório, revisão, rodada, aliados, inimigos, atributos de combate, efeitos, membros que já agiram e índice do desafio. O cliente não fornece atributos nem cria recompensas. Recarregar a página lê o último estado confirmado. Uma animação interrompida não reverte uma ação já gravada.

As rotas mutáveis abrem `BEGIN IMMEDIATE` antes de ler o usuário, evitando leituras concorrentes que permitiriam compras/recompensas duplicadas. A resposta JSON confirma a transação antes de ser enviada. Falhas descartam mudanças não confirmadas.

## Principais rotas

| Rota | Finalidade |
|---|---|
| GET `/api/health` | Estado de inicialização |
| GET `/api/content` | Fichas, capítulos e lições sem os índices corretos |
| POST `/api/register`, `/verify`, `/login`, `/setup`, `/logout` | Ciclo de autenticação |
| GET `/api/me` | Perfil da sessão |
| GET `/api/story` | Conteúdo público e estado atual da história |
| POST `/api/story/move`, `/travel` | Passo validado e viagem desbloqueada |
| POST `/api/story/start`, `/answer` | Início físico da fase e perguntas de terminal |
| POST `/api/story/act` | Ação de batalha com ID e revisão |
| POST `/api/story/abandon` | Reinício da operação sem devolução de consumíveis |
| POST `/api/buy`, `/progress` | Compra e composição da equipe |
| POST `/api/lesson`, `/lessons/reset` | Desafio de aula e reinício, sem refazer recompensas |
| GET `/api/questions`; POST `/api/answer` | Missões gerais |
| GET `/api/nexus`; POST `/api/nexus/...` | Campanha legado de programação |
| POST `/api/run`, `/chat` | Executor e tutor configuráveis |

## Adicionar personagens e ataques

1. Adicione uma ficha a `data/characters.json`: ID estável, nome, classe, preço, cor, `stats` na ordem Vida/Inteligência/Combate/Sanidade e `growth` com cinco índices de atributo.
2. As fichas desta edição têm quatro habilidades. Cada uma usa `name`, `desc`, `fx`, `cost`, `power` e `target`. Alvos: `enemy`, `all`, `ally`, `team` ou `self`.
3. Campos opcionais incluem `heal`, `effect`, `extraEffect`, `selfEffect`, `duration`, `energy`, `maxTargets`, `requires` e `hits`.
4. Adicione a arte e seu mapeamento em `rpg/js/sprites.js`. As pranchas originais têm quatro direções com larguras diferentes; os cortes estão registrados por personagem. O atlas de poses tem três quadros de caminhada, preparação, ataque e reação.
5. Atualize a regra de desbloqueio se o novo personagem precisar entrar por resgate. O catálogo de compra é lido do mesmo JSON, sem uma segunda tabela de preços.
6. Rode os testes e atualize o teste de atributos oficiais apenas se a especificação oficial realmente mudar.

Um novo `fx` precisa de desenho em `BattleView.drawFX`. O servidor emite `cast` antes de emitir dano/cura. Não aplique dano no cliente. Novos efeitos precisam de regra no `combat.py`, nome na UI e testes de aplicação/expiração; não basta criar uma etiqueta visual.

## Adicionar inimigos, mapas e capítulos

Inimigos são definidos em `data/enemies.json`. Campos básicos: `id`, `name`, `sprite`, `effect`, `fx` e `boss`. HP/ataque/defesa derivam do capítulo e fase em `combat.create`; a IA está em `enemy_round`. Use IDs únicos para instâncias de criaturas invocadas. O limite visual atual é quatro inimigos.

Mapas usam `rows` de **25 × 17**, `#` para parede e `.` para chão; coordenadas começam em zero. `spawn`, `stages`, `portal`, `npc` e `terminal` precisam estar sobre chão acessível. O servidor e o cliente leem o mesmo arquivo. A renderização atual usa Canvas 800 × 544 e tiles de 32; alterar essas dimensões exige atualizar `world.js` e seus testes.

Cada fase em `story.json` contém ID estável, `world`, `phase`, título, linguagem, cenas, cinco questões, grupo de inimigos, moedas, XP e encerramento. Cada questão usa alternativas `o`, índice correto `a` e explicação. A API remove `a` da resposta pública. `chapters.json` organiza nomes, duplas, chefes, temas e acontecimentos.

A fórmula atual de desbloqueio é cinco fases por capítulo, seis capítulos mais uma fase final. Para ampliar além dessa estrutura, atualize `unlocked_world`, o tratamento de final em `battle_questions`/`combat.step`, o agrupamento da UI e os testes. Não troque IDs de conteúdo já concluído sem migrar saves.

## Aulas, economia e narrativa

Aulas têm cinco níveis por agente. A conta guarda o número de níveis concluídos e uma lista separada de recompensas já concedidas. Reiniciar aulas não reinicia essa lista. Perguntas gerais usam uma tabela de unicidade. Fases só pagam no servidor após vitória real, uma vez por ID.

Diálogos usam `{speaker, portrait, body}` e a função `speak`. Fechar um diálogo interrompe sua apresentação, mas a fase iniciada pode ser retomada. Uma missão nova deve ser inserida na sequência oficial; evite abrir uma rota paralela que conceda a mesma recompensa sem checar o estado.

## Configuração e limites de operação

Variáveis: `CODEWORLD_DB`, `CODEWORLD_HOST`, `CODEWORLD_PORT`, `CODEWORLD_ALLOWED_HOSTS`, `CODEWORLD_HTTPS`, `CODEWORLD_AI_URL`, `CODEWORLD_AI_KEY`, `CODEWORLD_AI_MODEL`, `CODEWORLD_RUNNER_URL`, `CODEWORLD_RUNNER_KEY`.

O host permitido por padrão é `localhost`, `127.0.0.1` ou `terminal.local` (QA). Para uma rede autorizada, configure o host de escuta e inclua explicitamente o endereço utilizado em `CODEWORLD_ALLOWED_HOSTS`. `CODEWORLD_HTTPS=1` liga o atributo Secure do cookie; só use atrás de HTTPS funcional. Não há suporte nativo a publicação/gerenciamento de certificados.

O servidor usa somente a biblioteca padrão Python e é voltado à execução local. O executor externo deve estar isolado do banco e dos segredos. Backups devem ser feitos com o servidor parado ou pela API de backup do SQLite; nunca copie apenas parte de uma transação em andamento. `tools/preview.py` existe para QA do ambiente de desenvolvimento; o usuário deve iniciar por `server.py` ou `iniciar.py`.
