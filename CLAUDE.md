# Contexto do projeto — CodeRealm (Seção Personagens)

## Sobre o projeto
Trabalho de front-end (2º semestre) em grupo. CodeRealm é um portal RPG onde
HTML, CSS e JavaScript são personificados como personagens jogáveis. É uma
SPA (single-page application) com seções ancoradas, 7 seções obrigatórias:
Início, História, Mundo, Personagens, RPG, Missões, Perfil.

Estou desenvolvendo a **seção de Personagens** de forma independente antes
da integração com o repositório final do grupo.

Nomenclatura já definida no Figma (respeitar nos IDs/classes):
- Seção: `SECAO_04_PERSONAGENS`
- Referência de personagem: `personagem_HTML`

Referência visual para o painel de detalhes (modal): card estilo "ficha de
personagem" com botão voltar, imagem, badge de categoria, título grande,
abas (versão futura), descrição, tags, botão "ver detalhes". A versão atual
está simplificada: sem abas, sem carrossel — só imagem, categoria, título,
descrição e tags.

## MUITO IMPORTANTE — como me ajudar

**Sou iniciante completo em HTML/CSS/JS e meu objetivo é aprender, não
apenas ter o código pronto.**

Regras obrigatórias para qualquer sessão neste projeto:

1. **Nunca escreva o código completo por mim.** Explique o conceito, aponte
   o problema ou a lacuna, e me deixe tentar escrever/corrigir primeiro.
2. **Ao revisar meu código**, aponte erros e más práticas, mas não me
   entregue a correção pronta — descreva o que está errado e por quê, e
   deixe eu resolver.
3. **Para dúvidas conceituais**, use exemplos e explique o "porquê" por
   trás da sintaxe (por que essa tag existe, por que essa regra existe),
   não só "como" escrever.
4. Prefira o **modo Plan** ou converse comigo antes de editar qualquer
   arquivo. Não aplique mudanças automaticamente.
5. Sempre responda em português do Brasil.

## Progresso até agora

Roteiro de construção da seção (em 5 etapas):
1. Estrutura HTML sem estilo (em andamento)
2. Estrutura do modal/painel de detalhes
3. CSS de layout
4. JavaScript de interação (clique no card → abre modal)
5. Acessibilidade e ajustes finos

**Etapa 1 — progresso real:**
- Lista `<ul>` com o **conteúdo de detalhes** de HTML e CSS já criada
  corretamente: um `<li>` por personagem, cada um com `<h2>` (nome),
  `<h3>sobre</h3>` e `<p>` (descrição). Estrutura validada.
- **Próximo passo pendente:** criar uma **segunda `<ul>` separada**, para
  os **cards pequenos da grade** (o que aparece antes do clique). Cada
  `<li>` desse card deve ter: `<img>` (com `alt` descritivo — acabei de
  aprender essa tag), nome do personagem, categoria (texto simples por
  enquanto, ex: "CORE ENGINE"). Sem descrição longa aqui.
- Ainda falta repetir o padrão para os demais personagens (JavaScript,
  e outros que o grupo definir).

## Stack
HTML, CSS, JavaScript puro (vanilla) — sem frameworks, por exigência do
curso.
