# CodeWorld

Portal do projeto CodeWorld, organizado em uma pasta por seção/tela.
Trabalho de Front End referente à aula de desenvolvimento front end.
Feito somente com HTML, CSS e JavaScript (sem bibliotecas nem build).

## Estrutura

- `nexus/` — Seção 01: SOBRE (entrada do portal)
- `universo/` — Seção 02: UNIVERSO
- `personagens/` — Seção 03: PERSONAGENS
- `mapa/` — Seção 04: MAPA
- `missoes/` — Seção 05: MISSÕES
- `arquivos/` — Seção 06: ARQUIVOS
- `rpg/` — Seção 07: RPG (exploração e batalhas por turnos)
- `comum/` — arquivos compartilhados por todas as telas
- `img/` — imagens compartilhadas entre as telas

### Pasta `comum/`

- `base.css` — tudo que é igual em todas as telas: variáveis de cor e fonte,
  botões, selos, painéis, cabeçalho, menu mobile, painel de acessibilidade,
  rodapé, animações (entrada da página, revelar ao rolar, glitch) e
  responsividade geral
- `base.js` — menu hambúrguer, painel de acessibilidade (tema, fonte, alto
  contraste, reduzir movimento) com as preferências salvas no localStorage,
  cabeçalho compacto ao rolar, barra de progresso da rolagem, botão "voltar
  ao topo", revelar ao rolar, contadores e barras animadas, efeito de
  digitação nos consoles, efeito 3D nos cartões, cursor duplo e transição
  entre páginas
- `idioma-e-movimento.css` / `idioma-e-movimento.js` — tradução PT-BR / EN
  pelo Google Tradutor e pausa do vídeo ao reduzir movimento

### Pastas de seção

Cada pasta de seção tem:

- `index.html` — marcação daquela tela (com o mesmo cabeçalho e rodapé do site)
- `style.css` — apenas o estilo exclusivo daquela tela (carregado depois do
  `comum/base.css`)
- `script.js` — interações exclusivas daquela tela (o do Mapa controla o mapa
  interativo; o de Personagens monta o Modo Agente; o de Missões monta as
  missões de código e o terminal; os demais estão prontos para receber
  interações)

### Modo Agente (Personagens)

- `personagens/dados.js` guarda os 6 agentes e as lições de cada um:
  5 níveis por agente, cada nível com código de exemplo, 3 conceitos e as
  perguntas do mini desafio. Para mudar uma lição, basta editar esse arquivo.
- Os níveis são liberados um de cada vez, e um nível só é concluído quando
  todas as perguntas forem acertadas (as alternativas são embaralhadas).
- O próximo agente só é desbloqueado quando os 5 níveis do anterior forem
  concluídos. O progresso fica salvo no navegador (localStorage) e pode ser
  apagado pelo link "Reiniciar progresso dos agentes".
- As imagens dos agentes ainda vão ser escolhidas: enquanto o campo `imagem`
  de cada agente no `dados.js` estiver vazio, aparece "IMAGEM EM BREVE".
- Dá para abrir um agente direto pelo endereço, ex.:
  `personagens/index.html#agente-css` (se ele já estiver desbloqueado).
- Os agentes desbloqueados aqui são os que podem entrar na equipe do RPG
  (botão "Montar equipe no RPG", no painel ao lado da lista).

### Mapa interativo

- Cada andar da imagem do mapa é clicável e mostra, no painel ao lado,
  descrição, status, chefe, dificuldade, nível de ameaça, missões e agentes
  (com link para o Modo Agente de cada um).
- Controles: ▲ ▼ trocam de andar, + e − dão zoom, R centraliza e, com zoom,
  dá para arrastar o mapa. Com o foco no mapa, funcionam também as setas do
  teclado, + / − e R. Duplo clique em um andar aproxima direto nele.
- Os textos de cada andar ficam na lista `ANDARES` no início do
  `mapa/script.js`. A posição das áreas clicáveis está no `style` de cada
  botão `.andar-mapa` no `mapa/index.html` (em % da imagem).
- Dá para abrir um andar direto pelo endereço, ex.: `mapa/index.html#nivel-2`.
- O status de cada andar vem do progresso do RPG (bloqueado, explorando ou
  recuperado), e o botão **JOGAR ESTE ANDAR NO RPG** abre o jogo já naquele
  capítulo.

### Missões

A tela tem três filtros:

- **Ativas** — o card **MISSÃO ATIVA** mostra a operação atual da campanha
  do RPG (capítulo, fase e recompensa) com o botão **JOGAR NO RPG**, que leva
  o personagem até o capítulo dela. Abaixo ficam as 6 missões de código que
  ainda faltam.
- **Concluídas** — as missões de código vencidas e as operações já vencidas
  no RPG.
- **Diárias** — 3 missões de código por dia, sorteadas pela data (horário de
  Brasília), e um atalho para os desafios rápidos do RPG.

Cada missão abre no **terminal**, no mesmo estilo do terminal do Modo Agente
(número das linhas e cores no código). O jogador corrige o código e clica em
**EXECUTAR**; **RESTAURAR CÓDIGO** volta ao código inicial. O próprio
navegador confere a resposta:

- **HTML** — se as tags fecham na ordem certa e se os elementos pedidos estão
  no lugar (ex.: `button` dentro de `main`)
- **CSS** — as propriedades do seletor pedido (ex.: `display: grid`)
- **JavaScript** — o último valor mostrado com `console.log`. O código roda
  separado da página (Web Worker) e é parado depois de 1,5 s, o que protege
  contra loop infinito
- **Python** — uma versão simplificada: variáveis, listas, `print()`, `sum()`
  e `len()`

Errar tira vida do agente; acertar derruba a IA Corrupta. O agente do
combate é o líder da equipe do RPG.

- `missoes/dados.js` — as 6 missões permanentes e os modelos das 3 diárias
  (objetivo, código inicial, dica, regra de conferência e recompensa). As
  missões vieram da versão com servidor em Python e agora rodam só no
  navegador. Para mudar uma missão, basta editar esse arquivo.
- **Recompensas** — a tela Missões só anota a vitória no navegador
  (localStorage, chave `cw_missoes`). Os itens entram na mochila do RPG na
  próxima vez que ele for aberto: uma vez por missão, e as diárias uma vez
  por dia. Assim a tela Missões nunca altera o progresso salvo do jogo.

### RPG

Jogo 2D em que o jogador explora os 7 capítulos da cidade, responde aos
terminais e enfrenta a Super IA em batalhas por turnos. Funciona só com
HTML, CSS e JavaScript: não há servidor, conta nem login, e o progresso fica
salvo no navegador (localStorage, chave `cw_rpg_progresso`).

- `rpg/index.html` — marcação da tela, com o mesmo cabeçalho e rodapé do site
- `rpg/style.css` — estilo exclusivo do RPG (usa as variáveis do `comum/base.css`)
- `rpg/dados.js` — conteúdo do jogo: personagens e habilidades, inimigos,
  capítulos, mapas, as 31 operações da história, itens e desafios rápidos.
  Para mudar uma pergunta, um texto ou um mapa, basta editar esse arquivo.
- `rpg/regras.js` — regras do jogo: progresso salvo, campanha, combate por
  turnos, loja, equipe e a entrega dos itens das missões de código (antes
  eram feitas por um servidor em Python)
- `rpg/desenho.js` — tudo o que é desenhado no `<canvas>`: sprites, o mapa
  explorável e a arena de batalha
- `rpg/script.js` — interações da tela: abas, janelas de diálogo, comandos
  da batalha, equipe, loja, desafios e diário
- `rpg/img/` — pranchas de sprites (pixel art) usadas no mapa e na batalha

A página do RPG também carrega o `personagens/dados.js`: dele vêm a ordem
de desbloqueio dos agentes e as imagens usadas na equipe.

Abas do RPG:

- **Explorar** — a faixa **OBJETIVO** diz o que fazer e uma trilha rosa
  mostra o caminho até lá; o botão **IR ATÉ LÁ** leva o personagem sozinho
  até o terminal e já começa a operação. Também dá para clicar em qualquer
  ponto do chão para andar até ele, ou usar W A S D / setas (sem precisar
  clicar no mapa antes; no celular há setas na tela). Um balão **E** mostra
  o que dá para fazer onde o personagem está (iniciar operação, conversar
  com o NPC, abrir as aulas). Cada operação tem 5 perguntas, respondidas na
  própria janela: errou, a alternativa fica marcada e você tenta outra;
  acertou, aparece a explicação.
- **Batalha** — a arena fica à esquerda, com as ações rápidas (ataque
  básico, defender, itens) logo abaixo; os poderes ficam numa coluna
  lateral à direita (no celular e no tablet, abaixo da arena). Três passos
  numerados: **1** quem age (seta ciano), **2** o alvo (seta rosa; clique
  no inimigo na arena ou na lista) e **3** o poder. Cartões desativados
  dizem o motivo (falta energia ou nível) e há atalhos: 1–4 poderes,
  5 ataque básico, 6 defender.
- **Equipe** — até 3 agentes desbloqueados na tela Personagens. No mapa, o
  primeiro lidera e os outros andam em fila atrás dele. Os bloqueados aparecem apagados, com o que falta para
  liberá-los.
- **Loja** — suprimentos para a batalha, pagos com Nexus Coins.
- **Desafios** — perguntas rápidas que rendem itens, uma vez cada.
- **Diário** — as 31 operações, com status e recompensas.

### Ligação entre Personagens e RPG

O RPG não tem tela própria de aulas nem compra de personagens, para não
repetir a tela Personagens. Tudo vem do **Modo Agente**:

- **Desbloqueio** — a mesma regra da tela Personagens: HTML começa liberado
  e cada agente seguinte é liberado ao concluir os 5 níveis do anterior. Só
  os agentes desbloqueados podem entrar na equipe; se o progresso dos agentes
  for reiniciado, quem ficou bloqueado sai da equipe (com um aviso).
- **Imagem** — a equipe, os cartões e os diálogos usam a mesma imagem do
  agente da tela Personagens (campo `imagem` do `personagens/dados.js`).
  O mapa e a batalha continuam com os sprites animados de `rpg/img/`.
- **Evolução** — cada nível concluído no Modo Agente vale 2 níveis no RPG
  (até o nível 10), libera habilidades nos níveis 3 e 7 e rende +50 Nexus
  Coins uma única vez.

## Responsividade

- **Desktop (1200px+)**: menu completo no cabeçalho
- **Tablet e celular (até 1199px)**: menu hambúrguer em tela cheia
- **Celular (até 767px)**: painel de acessibilidade vira uma gaveta que sobe
  da parte de baixo da tela
- **Celular pequeno (até 559px)**: botões ocupam a largura toda e as grades
  de cartões passam para 2 colunas

## Acessibilidade

- Link "Pular para o conteúdo" para quem navega pelo teclado
- Botões e chaves do painel acessíveis por teclado (Tab, Enter, Esc fecha
  menu e painel)
- "Reduzir movimento" desliga todas as animações; a preferência de movimento
  reduzido do sistema operacional também é respeitada
- O cursor customizado só aparece em telas com mouse
- Na tela Missões, o código é digitado num campo de texto comum (funciona com
  teclado e leitor de tela) e cada linha nova do log de combate é anunciada

## Como visualizar

Abra `nexus/index.html` no navegador para começar pela tela inicial —
a navegação entre as telas leva às demais pastas. Não há build nem dependências.
O RPG abre pelo item **RPG** do menu (ou direto em `rpg/index.html`), e as
missões de código pelo item **MISSÕES** (`missoes/index.html`).
