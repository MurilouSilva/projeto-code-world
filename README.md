# CodeWorld

Portal do projeto CodeWorld, organizado em uma pasta por seção/tela.
Trabalho de Front End referente à aula de desenvolvimento front end.
Feito somente com HTML, CSS e JavaScript (sem bibliotecas nem build).

## Estrutura

- `nexus/` — Seção 01: NEXUS (entrada do portal)
- `universo/` — Seção 02: UNIVERSO
- `personagens/` — Seção 03: PERSONAGENS
- `mapa/` — Seção 04: MAPA
- `missoes/` — Seção 05: MISSÕES
- `arquivos/` — Seção 06: ARQUIVOS
- `perfil/` — Seção 07: SISTEMA (perfil do operador)
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
  interativo; o de Personagens monta o Modo Agente; os demais
  estão prontos para receber interações)

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

## Como visualizar

Abra `nexus/index.html` no navegador para começar pela tela inicial —
a navegação entre as telas leva às demais pastas. Não há build nem dependências.
