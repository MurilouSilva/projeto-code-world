# CodeWorld

Portal do projeto CodeWorld, organizado em uma pasta por seção/tela.
Trabalho de Front End referente à aula de desenvolvimento front end.

## Estrutura

- `nexus/` — Seção 01: NEXUS (entrada do portal)
- `universo/` — Seção 02: UNIVERSO
- `personagens/` — Seção 03: PERSONAGENS
- `mapa/` — Seção 04: MAPA
- `missoes/` — Seção 05: MISSÕES
- `arquivos/` — Seção 06: ARQUIVOS
- `perfil/` — Seção 07: SISTEMA (perfil do operador)
- `img/` — imagens compartilhadas entre as telas (copie aqui os arquivos originais, veja img/LEIA-ME.txt)

Cada pasta de seção é autocontida:

- `index.html` — marcação daquela tela (com o mesmo cabeçalho e rodapé do site)
- `style.css` — cópia completa do estilo do projeto (mantida assim de propósito,
  já que várias classes — botões, rótulos, painéis, cabeçalho, responsividade —
  são usadas em todas as telas; dividir o CSS por tela arriscava quebrar esses
  estilos compartilhados)
- `script.js` — arquivo de JavaScript próprio da tela, hoje apenas um esqueleto
  comentado, pronto para receber as interações futuras dessa seção

## Como visualizar

Abra `nexus/index.html` no navegador para começar pela tela inicial —
a navegação entre as telas leva às demais pastas. Não há build nem dependências.
