# CodeWorld integrado · campanhas Nexus e RPG

O CodeWorld original continua como página principal. **Jogar RPG** é a única entrada para exploração, história, diálogos, vídeos opcionais, perguntas específicas, batalhas e quatro mundos. O mapa da página principal inicia uma **campanha Nexus separada**, com seu próprio terminal. As missões gerais também têm perguntas e progresso próprios. O visual da página original está em `style.css`; as adições estão em `extensions.css` e `shared.css`.

## Abrir e encerrar

1. Instale Python 3.10 ou mais recente.
2. Na pasta onde está este arquivo, rode `python3 server.py` (Windows: `py server.py`).
3. Abra `http://127.0.0.1:8000/` no navegador. Não abra `index.html` como arquivo local.
4. Para **encerrar o servidor**, volte ao terminal onde ele está executando e pressione **Ctrl + C**.

Cadastre nome, e-mail e senha de 12+ caracteres. Digite a chave apresentada em um aplicativo autenticador TOTP; o código de seis dígitos confirma a conta **e já faz login**. Em visitas seguintes, use um código novo. O botão **MOSTRAR CHAVE PENDENTE** recupera a chave antes da confirmação com e-mail e senha. Os códigos não são enviados por e-mail.

O arquivo `data/players.sqlite3` guarda contas, dinheiro e progresso. Se estiver substituindo uma versão anterior do ZIP, **copie esse arquivo do projeto antigo para `data/` do novo projeto com o servidor parado**. Não o inclua em repositórios públicos. Faça backup do banco para não perder saves. Ambas as páginas usam a mesma sessão de login.

## As três atividades

| Área | Arquivo de perguntas | Progressão |
| --- | --- | --- |
| Missões gerais | `data/questions.json` | 64 perguntas, incluindo 32 de previsão de saída de código. Cada resposta correta rende moedas uma vez por conta. |
| Mapa Nexus | `data/nexus.json` | Quatro níveis com cinco perguntas próprias e um código a editar/executar/validar em terminal separado da Academia. A imagem original recebe marcadores clicáveis. |
| Jogar RPG | `data/story.json` + `data/mazes.json` | Quatro labirintos com cinco fases cada; diálogos, cinco perguntas por fase e batalhas com 2 a 4 adversários. A quinta fase traz o guardião; a última tem componentes mecânicos. |

Ao vencer todas as batalhas de uma fase, as Nexus Coins e o XP acumulados nela são salvos na conta. **A fase concluída fica travada**; caminhe até o marcador seguinte para começar outra. Após uma derrota, clique **CONTINUAR · RECOMEÇAR FASE**: perguntas e batalhas dessa fase voltam ao início e as recompensas **provisórias dessa tentativa** são descartadas. Os ganhos de fases anteriores permanecem. A equipe sobe até o nível 10 conforme acumula XP; as habilidades 3 e 4 abrem nos níveis 3 e 7.

Os mapas RPG são labirintos: `#` é parede, `!` indica a próxima missão, `★` é a fase do chefe, `✓` significa missão concluída e travada e `◇` é o portal após a quinta fase. As paredes escuras têm cores contrastantes com as passagens de cada mundo. Use WASD, setas ou os botões na tela; o clique no mapa move somente para uma **casa vizinha**. O servidor confere cada passo, salva sua posição no login e só aceita iniciar a fase se você estiver no marcador. Personagens são adquiridos na Loja; personagens já desbloqueados em saves antigos permanecem na coleção e na equipe. É possível viajar para mundos já liberados pelos botões acima do mapa. A posição do mapa antigo é migrada para o início do novo labirinto, preservando fases, moedas e XP já salvos.

Cada uma das seis fichas solicitadas começa com **15 pontos** distribuídos entre Vida, Inteligência, Combate e Sanidade. Kotlin e Python são Suporte; CSS e HTML são Vanguarda; Java e JavaScript são Combatente. Cinco aumentos automáticos até o nível 10 levam ao **limite total de 20 pontos**. C# e SQL continuam como personagens extras da versão anterior. Vida define HP; Combate e Inteligência influenciam ataque, e Inteligência também recupera Energia; Sanidade melhora a resistência aos efeitos. **Envenenado** e **Sangramento** reduzem Vida por dois turnos, **Fraqueza** reduz o dano, **Fortificação** reduz o dano recebido e **Atordoamento** faz perder uma ação. Cura, defesa, escolha de alvos e remoção de efeitos ajudam nas batalhas maiores. As animações usam CSS local e respeitam a preferência de movimento reduzido.

Cada mundo mantém cores e cenário próprios. Os vídeos de entrada e de chefe possuem players preparados, mas os arquivos MP4 não vêm no ZIP. Copie seus vídeos para `assets/videos/` com os nomes presentes em `rpg/js/world.js`.

## Acessibilidade

Abra **ACESSIBILIDADE** no cabeçalho. Os controles de tema claro/escuro, tamanho da fonte, contraste e movimento reduzido funcionam nas duas páginas e ficam salvos neste navegador. O seletor EN traduz a **navegação e alguns controles**; enunciados, diálogos e aulas continuam em português. Todos os botões da campanha podem ser alcançados por teclado.

## Academia

São 14 aulas em sequência, com exemplos maiores, navegação **AULA ANTERIOR / PRÓXIMA AULA** e conclusão salva no login. HTML/CSS têm prévia; JavaScript roda em quadro isolado; SQL usa uma tabela SQLite de exemplo; Python carrega Pyodide se houver internet. As aulas de C# são de perguntas, como solicitado.

O tutorial completo para executar C# localmente e depois conectá-lo ao site está em [`docs/GUIA-CSHARP.md`](docs/GUIA-CSHARP.md). Para executar outras linguagens no site, configure um executor isolado operado por você; o servidor principal não compila código enviado pelo navegador.

## Como editar

- `rpg/js/data/characters.js`: nome, classe, preço, `stats` (quatro atributos que somam 15), `growth` (cinco aumentos até 20) e habilidades com `effect:'poison'|'weakness'|'fortify'|'bleed'|'stun'`, cura ou remoção. Adicione o mesmo id e preço em `catalog` no `server.py` para a loja. Adicione sprite SVG, GIF ou WebP em `rpg/assets/characters/` e declare `sprite:'assets/characters/arquivo.webp'` se mudar o nome do arquivo.
- `rpg/js/data/enemies.js`, `rpg/js/engine/battle.js` e `damage.js`: inimigos, Vida, habilidades, efeitos, inteligência das ações e cálculo de dano. O núcleo só pode ser atingido após remover as outras peças.
- `data/mazes.json`: os quatro mapas têm `rows` de mesma largura; `#` bloqueia e `.` permite andar. Cada `spawn`, par de coordenadas em `stages` e `portal` deve estar sobre `.` e ser acessível a partir do início. A origem das coordenadas é o canto superior esquerdo, começando em zero. `campaign.py` valida os passos no servidor; `rpg/js/world.js` desenha o mapa. Novos personagens entram na Loja pelo catálogo de `server.py`, não em casas do labirinto. A imagem de referência continua em `img/mapa-referencia.png`.
- `rpg/css/codeworld.css` e `rpg/css/battle.css`: cores de cada mundo, sinais dos efeitos e animações de habilidades e impactos. É possível trocá-las por sprites animados nos arquivos de personagens/inimigos sem carregar uma biblioteca externa.
- `data/story.json`: cada objeto contém id (`w0p1` a `w3p5`), world (0–3), phase (1–5), título, cenas (`speaker`, `body`), cinco perguntas (`id`, `q`, `o`, `a`) e grupos de inimigos em `battles`. O índice `a` começa em zero. Mantenha a ordem e ids existentes se já houver saves.
- `data/nexus.json`: quatro níveis separados, linguagem, código inicial (`starter`), termos exigidos (`requirements`), cinco perguntas e recompensa. O terminal executa o código no navegador/serviço e valida a estrutura no servidor.
- `rpg/js/data/lessons.js`: aulas com `sections` e atividade de código ou `type:'quiz'` com `prompt`, `options`, `answerIndex`. Guarde ids estáveis para preservar conclusão.

O ganho de moedas por resposta e conclusão de fases é registrado pelo servidor. As batalhas são simuladas no navegador; para uma competição com premiações reais, valide turnos e vitórias no servidor. A checagem de código do Nexus reconhece a estrutura exigida, mas não substitui uma suíte de testes de código.

Para conferir o projeto depois de editar os mapas, rode `python3 tests/integration.py`. Para testar fichas, habilidades e condições de combate, rode `node tests/combat.mjs`. A dificuldade dos adversários por mundo e fase é ajustada em `rpg/js/engine/balance.js`.

## Serviços opcionais

Defina variáveis de ambiente antes de iniciar o servidor, nunca no JavaScript:

- `CODEWORLD_AI_KEY`, `CODEWORLD_AI_URL` e opcionalmente `CODEWORLD_AI_MODEL`: chatbot com provedor HTTPS compatível com chat completions.
- `CODEWORLD_RUNNER_URL` e opcionalmente `CODEWORLD_RUNNER_KEY`: executor isolado. O servidor envia `POST <URL>/execute` com `{ "language": "csharp", "code": "..." }` e espera `{ "output": "..." }`. Proteja tempo, CPU, memória, rede e arquivos nesse serviço.
- `CODEWORLD_DB`: caminho do banco SQLite; `CODEWORLD_HOST` e `CODEWORLD_PORT`: host/porta; `CODEWORLD_HTTPS=1`: cookie Secure atrás de HTTPS.

O chatbot e o executor externo não vêm com credenciais; até serem configurados, a interface informa a indisponibilidade. Para publicação pública, acrescente HTTPS, backups e validação de combate no servidor.
