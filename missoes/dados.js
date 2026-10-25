/**
 * CODEWORLD // missoes/dados.js
 * Conteúdo das missões de código da tela MISSÕES. O script.js monta a tela
 * a partir destes dados — para mudar um texto, um código ou uma recompensa,
 * basta editar este arquivo.
 *
 * As missões foram criadas pelo Italo para a versão com servidor em Python
 * e foram trazidas para cá sem mudar objetivo, código inicial, dica ou
 * recompensa. Agora o próprio navegador confere a resposta.
 *
 * Formato de cada missão:
 *   - id          → nome único (é ele que fica salvo quando a missão é vencida)
 *   - titulo      → nome mostrado no card e no terminal
 *   - tipo        → principal, secundaria ou epica (cor do selo e do card)
 *   - linguagem   → html, css, javascript ou python
 *   - resumo      → frase curta do card
 *   - objetivo    → o que o jogador precisa fazer
 *   - inicial     → código que aparece no terminal (com o erro a corrigir)
 *   - dica        → ajuda mostrada abaixo do terminal
 *   - regra       → como conferir a resposta:
 *                     { tipo: "html", elementos: [{ tag, pai, texto }] }
 *                     { tipo: "css", seletor, propriedades: { nome: valor } }
 *                     { tipo: "saida", esperado }  → último valor impresso
 *   - recompensas → itens do RPG: patch, antidote, battery e shield
 *
 * As diárias são modelos: recebem os números sorteados do dia
 * (setor, largura, cor, energia e custo) e devolvem uma missão.
 */

const MISSOES = {
  // ==========================================================================
  // MISSÕES PERMANENTES (vencidas uma única vez)
  // ==========================================================================
  permanentes: [
    {
      id: "bug-invasor",
      titulo: "Bug invasor",
      tipo: "principal",
      linguagem: "html",
      resumo: "Tags fora de ordem corromperam o território HTML.",
      objetivo: "Corrija o aninhamento. Mantenha main, section, h2 e p; feche as tags na ordem inversa.",
      inicial: "<main>\n  <section>\n    <h2>Nível 0</h2>\n    <p>Território HTML\n</main>\n</section>",
      dica: "Feche p, depois section e finalmente main.",
      regra: {
        tipo: "html",
        elementos: [
          { tag: "main" },
          { tag: "section", pai: "main" },
          { tag: "h2", pai: "section" },
          { tag: "p", pai: "section" },
        ],
      },
      recompensas: { patch: 2 },
    },
    {
      id: "escape-loop",
      titulo: "Escape do loop",
      tipo: "secundaria",
      linguagem: "javascript",
      resumo: "Calcule a energia que as torres precisam.",
      objetivo: "Cada uma das 3 torres precisa de 12 unidades. Calcule o total e mostre 36 no console.",
      inicial: "const torres = 3;\nconst energia = 12;\nconsole.log(torres + energia);",
      dica: "Multiplique a quantidade de torres pela energia de cada torre.",
      regra: { tipo: "saida", esperado: 36 },
      recompensas: { battery: 2 },
    },
    {
      id: "dados-perdidos",
      titulo: "Dados perdidos",
      tipo: "secundaria",
      linguagem: "python",
      resumo: "Recupere pacotes de dados.",
      objetivo: "Some os pacotes [7, 11, 5] e imprima 23.",
      inicial: "pacotes = [7, 11, 5]\n# imprima a soma",
      dica: "Use print(sum(pacotes)).",
      regra: { tipo: "saida", esperado: 23 },
      recompensas: { antidote: 2 },
    },
    {
      id: "firewall",
      titulo: "Firewall breach",
      tipo: "principal",
      linguagem: "css",
      resumo: "Monte a grade do firewall em duas colunas.",
      objetivo: "Organize .quadrado em uma grade de 2 colunas iguais e gap de 16px.",
      inicial: ".quadrado {\n  display: block;\n  background: #68d8ff;\n}",
      dica: "Use display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px.",
      regra: {
        tipo: "css",
        seletor: ".quadrado",
        propriedades: {
          display: "grid",
          // Aceita as duas formas de escrever duas colunas iguais
          "grid-template-columns": /^(repeat\(\s*2\s*,\s*1fr\s*\)|1fr\s+1fr)$/,
          gap: "16px",
        },
      },
      recompensas: { shield: 2 },
    },
    {
      id: "protocolo-raiz",
      titulo: "Protocolo raiz",
      tipo: "epica",
      linguagem: "javascript",
      resumo: "Limite a energia antes que o núcleo sobrecarregue.",
      objetivo: "A energia atual é 86 e a bateria dá 28. Limite o resultado a 100 e imprima esse valor.",
      inicial: "const energia = 86;\nconst carga = 28;\nconsole.log(energia + carga);",
      dica: "Math.min(100, energia + carga) limita a carga máxima.",
      regra: { tipo: "saida", esperado: 100 },
      recompensas: { patch: 2, battery: 2, shield: 1 },
    },
    {
      id: "sinal",
      titulo: "Sinal da resistência",
      tipo: "secundaria",
      linguagem: "html",
      resumo: "Crie o botão que chama a resistência.",
      objetivo: "Crie um botão com o texto Conectar dentro de main.",
      inicial: "<main>\n  <span>Conectar</span>\n</main>",
      dica: "Use button para ações acessíveis por teclado.",
      regra: {
        tipo: "html",
        elementos: [{ tag: "main" }, { tag: "button", pai: "main", texto: "Conectar" }],
      },
      recompensas: { antidote: 1, shield: 1 },
    },
  ],

  // ==========================================================================
  // MODELOS DAS DIÁRIAS (3 por dia, vencidas uma vez por dia)
  // ==========================================================================
  diarias: [
    (n) => ({
      titulo: `Reconectar setor ${n.setor}`,
      linguagem: "html",
      resumo: "Um setor da cidade perdeu o nome.",
      objetivo: `Crie main com um h1 contendo exatamente Setor ${n.setor}.`,
      inicial: "<main>\n  <h1></h1>\n</main>",
      dica: "Escreva o nome do setor entre as tags h1.",
      regra: {
        tipo: "html",
        elementos: [{ tag: "main" }, { tag: "h1", pai: "main", texto: `Setor ${n.setor}` }],
      },
      recompensas: { patch: 1, shield: 1 },
    }),
    (n) => ({
      titulo: "Calibrar o painel",
      linguagem: "css",
      resumo: "O painel de controle saiu do tamanho certo.",
      objetivo: `Em .quadrado, defina width: ${n.largura}px e background: ${n.cor}.`,
      inicial: ".quadrado {\n  width: 80px;\n  height: 80px;\n  background: cyan;\n}",
      dica: "Edite as duas propriedades solicitadas.",
      regra: {
        tipo: "css",
        seletor: ".quadrado",
        propriedades: { width: `${n.largura}px`, background: n.cor },
      },
      recompensas: { antidote: 1, patch: 1 },
    }),
    (n) => ({
      titulo: "Reserva de energia",
      linguagem: "javascript",
      resumo: "Descubra quanta energia sobrou.",
      objetivo: `Você tem ${n.energia} de energia e usa ${n.custo}. Imprima a energia restante. Calcule a subtração.`,
      inicial: `const energia = ${n.energia};\nconst custo = ${n.custo};\n// escreva a saída`,
      dica: "Use console.log(energia - custo).",
      regra: { tipo: "saida", esperado: n.energia - n.custo },
      recompensas: { battery: 2 },
    }),
  ],
};
