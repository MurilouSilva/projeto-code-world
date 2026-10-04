/**
 * CODEWORLD // personagens/dados.js
 * Banco de dados dos agentes e do "Modo Agente" (aprender a linguagem).
 *
 * Cada agente tem 5 níveis. Cada nível tem:
 *   - titulo / resumo  → o tema da lição
 *   - codigo           → exemplo mostrado no terminal
 *   - conceitos        → 3 cartões explicando o exemplo
 *   - questoes         → perguntas do mini desafio (correta = índice da opção)
 *
 * O campo "imagem" de cada agente está vazio de propósito: enquanto as
 * imagens não forem escolhidas, a tela mostra "IMAGEM EM BREVE". Para usar
 * uma imagem, coloque o caminho dela, ex.: imagem: "../img/agente-html.png"
 *
 * Para mudar uma lição basta editar este arquivo: o script.js monta a tela
 * a partir destes dados.
 */

const AGENTES = [
  // ==========================================================================
  // 01. HTML — O CONSTRUTOR
  // ==========================================================================
  {
    id: "html",
    numero: "01",
    nome: "HTML",
    funcao: "Construtor",
    papel: "Agente de Infraestrutura",
    afinidade: "DOM ARCHITECTURE",
    arquivo: "index.html",
    linguagem: "html",
    serial: "CW-01-DOM",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "Constrói as estruturas da Internet: cada página nasce das tags que ele organiza, dando significado e hierarquia a todo o conteúdo.",
    cor: "#ff5a1f", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Estrutura do Documento",
        resumo:
          "Todo arquivo HTML segue o mesmo esqueleto: a declaração do tipo, um cabeçalho invisível e o corpo visível.",
        codigo: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>CodeWorld</title>
  </head>
  <body>
    <h1>Olá, Nexus!</h1>
  </body>
</html>`,
        conceitos: [
          { tag: "REGRA 01", titulo: "<!DOCTYPE html>", texto: "Primeira linha do arquivo. Avisa o navegador que o documento segue o padrão HTML5 moderno." },
          { tag: "BASTIDORES", titulo: "<head>", texto: "Guarda informações sobre a página: título da aba, codificação e links para CSS. Nada dele aparece no conteúdo." },
          { tag: "PALCO", titulo: "<body>", texto: "Tudo o que o usuário vê fica dentro do body: textos, imagens, botões e links." },
        ],
        questoes: [
          { pergunta: "Qual declaração deve ser a primeira linha de um documento HTML5?", opcoes: ["<html5>", "<!DOCTYPE html>", "<head>", "<meta html>"], correta: 1, explicacao: "<!DOCTYPE html> coloca o navegador no modo de padrões (Standard Mode)." },
          { pergunta: "Em qual tag fica o conteúdo visível da página?", opcoes: ["<head>", "<title>", "<body>", "<meta>"], correta: 2, explicacao: "O <body> contém tudo o que é exibido na tela." },
        ],
      },
      {
        titulo: "Texto e Semântica",
        resumo:
          "Tags semânticas dizem o PAPEL de cada parte da página, ajudando leitores de tela e buscadores a entender o conteúdo.",
        codigo: `<header>
  <h1>CodeWorld</h1>
</header>
<main>
  <article>
    <h2>Missão 01</h2>
    <p>Proteja o <strong>Nexus</strong> dos bugs.</p>
  </article>
</main>
<footer>
  <p>© 2085 CodeWorld</p>
</footer>`,
        conceitos: [
          { tag: "HIERARQUIA", titulo: "Títulos <h1> a <h6>", texto: "Organizam o texto como um sumário. Use um único <h1> por página e não pule níveis." },
          { tag: "TEXTO", titulo: "<p> e <strong>", texto: "<p> cria parágrafos. <strong> marca algo importante e <em> dá ênfase à leitura." },
          { tag: "SEMÂNTICA", titulo: "<header>, <main>, <footer>", texto: "Descrevem o papel de cada região. O <main> guarda o conteúdo principal e aparece uma só vez." },
        ],
        questoes: [
          { pergunta: "Qual tag semântica envolve o conteúdo principal e exclusivo da página, sem se repetir?", opcoes: ["<section>", "<main>", "<article>", "<div>"], correta: 1, explicacao: "O <main> deve aparecer uma única vez e guardar o conteúdo central." },
          { pergunta: "Qual tag indica que um trecho de texto tem forte importância?", opcoes: ["<b>", "<i>", "<strong>", "<span>"], correta: 2, explicacao: "<strong> tem significado de importância; <b> só deixa o texto em negrito." },
        ],
      },
      {
        titulo: "Links e Imagens",
        resumo:
          "Links conectam páginas entre si e imagens trazem o visual — sempre com uma descrição para quem não pode vê-las.",
        codigo: `<nav>
  <a href="mapa.html">Ver o mapa</a>
  <a href="https://developer.mozilla.org" target="_blank">
    Documentação
  </a>
</nav>

<img src="agente-html.png"
     alt="Agente HTML com armadura laranja">`,
        conceitos: [
          { tag: "NAVEGAÇÃO", titulo: "<a href>", texto: "O atributo href define para onde o link leva: outro arquivo, um site ou uma âncora (#id)." },
          { tag: "NOVA ABA", titulo: 'target="_blank"', texto: "Abre o link em outra aba. Use com moderação, para não confundir o usuário." },
          { tag: "ACESSIBILIDADE", titulo: "<img alt>", texto: "src indica o arquivo. alt descreve a imagem para leitores de tela e aparece se ela não carregar." },
        ],
        questoes: [
          { pergunta: "Qual atributo define o endereço de destino de um link?", opcoes: ["src", "link", "href", "url"], correta: 2, explicacao: "href (hypertext reference) guarda o destino do <a>." },
          { pergunta: "Para que serve o atributo alt de uma imagem?", opcoes: ["Definir a largura", "Descrever a imagem para leitores de tela e quando ela não carrega", "Criar uma borda", "Mudar o formato do arquivo"], correta: 1, explicacao: "O alt é o texto alternativo: essencial para acessibilidade." },
        ],
      },
      {
        titulo: "Listas e Tabelas",
        resumo:
          "Listas agrupam itens relacionados e tabelas organizam dados em linhas e colunas.",
        codigo: `<ol>
  <li>Entrar no Nexus</li>
  <li>Escolher um agente</li>
</ol>

<table>
  <tr>
    <th>Agente</th>
    <th>Nível</th>
  </tr>
  <tr>
    <td>HTML</td>
    <td>5</td>
  </tr>
</table>`,
        conceitos: [
          { tag: "LISTAS", titulo: "<ul> e <ol>", texto: "<ul> cria uma lista com marcadores; <ol> cria uma lista numerada. Cada item é um <li>." },
          { tag: "LINHAS", titulo: "<tr>", texto: "Cada <tr> (table row) é uma linha da tabela." },
          { tag: "CÉLULAS", titulo: "<th> e <td>", texto: "<th> é uma célula de cabeçalho (título da coluna) e <td> é uma célula comum de dados." },
        ],
        questoes: [
          { pergunta: "Qual tag cria uma lista numerada?", opcoes: ["<ul>", "<ol>", "<li>", "<dl>"], correta: 1, explicacao: "<ol> = ordered list (lista ordenada)." },
          { pergunta: "Dentro de uma tabela, qual tag representa uma linha?", opcoes: ["<td>", "<th>", "<tr>", "<row>"], correta: 2, explicacao: "<tr> = table row." },
        ],
      },
      {
        titulo: "Formulários",
        resumo:
          "Formulários coletam dados do usuário. Cada campo precisa de um rótulo ligado a ele.",
        codigo: `<form action="/login" method="post">
  <label for="nome">Codinome</label>
  <input type="text" id="nome" name="nome" required>

  <label for="senha">Senha</label>
  <input type="password" id="senha" name="senha">

  <button type="submit">Acessar</button>
</form>`,
        conceitos: [
          { tag: "ENVIO", titulo: "<form>", texto: "Agrupa os campos. action diz para onde enviar e method como (get ou post)." },
          { tag: "RÓTULO", titulo: "<label for>", texto: "O for do label deve ser igual ao id do input. Assim, clicar no texto foca o campo." },
          { tag: "CAMPOS", titulo: "<input type>", texto: "type define o campo: text, email, password, checkbox... required torna o preenchimento obrigatório." },
        ],
        questoes: [
          { pergunta: "Como ligar um <label> a um <input>?", opcoes: ["Colocando o label depois do input", "Usando o atributo for do label igual ao id do input", "Usando a mesma class nos dois", "Com o atributo name no label"], correta: 1, explicacao: "for (no label) + id (no input) criam a ligação." },
          { pergunta: "Qual valor de type esconde os caracteres digitados?", opcoes: ["hidden", "secret", "password", "text"], correta: 2, explicacao: 'type="password" mostra pontinhos no lugar das letras.' },
        ],
      },
    ],
  },

  // ==========================================================================
  // 02. CSS — O ARTISTA
  // ==========================================================================
  {
    id: "css",
    numero: "02",
    nome: "CSS",
    funcao: "Artista",
    papel: "Agente de Renderização Visual",
    afinidade: "VISUAL RENDERING",
    arquivo: "style.css",
    linguagem: "css",
    serial: "CW-02-STY",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "Pinta o mundo digital: cores, espaços, layouts e movimentos nascem das regras que ele aplica sobre as estruturas do HTML.",
    cor: "#6d28d9", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Seletores e Regras",
        resumo:
          "Uma regra CSS escolhe elementos com um seletor e aplica propriedades a eles.",
        codigo: `/* seletor { propriedade: valor; } */
h1 {
  color: magenta;
}

.card {
  border: 1px solid cyan;
}

#nexus {
  padding: 20px;
}`,
        conceitos: [
          { tag: "ANATOMIA", titulo: "Regra CSS", texto: "Seletor + chaves com pares propriedade: valor; separados por ponto e vírgula." },
          { tag: "SELETORES", titulo: "tag, .classe, #id", texto: "h1 pega todas as tags h1, .card pega a classe card e #nexus pega o elemento com id nexus." },
          { tag: "CASCATA", titulo: "Especificidade", texto: "Quando regras brigam, vence a mais específica: id > classe > tag. Em empate, vale a que vem depois." },
        ],
        questoes: [
          { pergunta: 'Qual seletor escolhe os elementos com class="card"?', opcoes: ["#card", "card", ".card", "*card"], correta: 2, explicacao: "O ponto (.) indica classe; a cerquilha (#) indica id." },
          { pergunta: "Qual seletor tem a MAIOR especificidade?", opcoes: ["p", ".texto", "#principal", "*"], correta: 2, explicacao: "Seletores de id são mais específicos que classes e tags." },
        ],
      },
      {
        titulo: "Cores e Tipografia",
        resumo:
          "Cores e fontes definem a identidade visual. Unidades relativas deixam o texto acessível.",
        codigo: `body {
  background-color: #08060f;
  color: rgb(232, 230, 240);
  font-family: "Orbitron", sans-serif;
  font-size: 1rem;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  text-transform: uppercase;
}`,
        conceitos: [
          { tag: "CORES", titulo: "nome, hex, rgb", texto: "A mesma cor pode ser escrita como magenta, #ff00ff ou rgb(255, 0, 255)." },
          { tag: "UNIDADES", titulo: "px x rem", texto: "px é fixo. rem é relativo à fonte do <html>: se o usuário aumentar a fonte, tudo acompanha." },
          { tag: "FONTES", titulo: "font-family", texto: "Liste fontes de reserva: se a primeira não carregar, o navegador usa a seguinte (sans-serif)." },
        ],
        questoes: [
          { pergunta: "Qual propriedade muda a cor do TEXTO?", opcoes: ["background-color", "font-color", "color", "text-color"], correta: 2, explicacao: "color muda o texto; background-color muda o fundo." },
          { pergunta: "A unidade rem é relativa a quê?", opcoes: ["Ao tamanho da tela", "Ao tamanho da fonte do elemento raiz (html)", "Ao elemento pai em pixels", "Ao tamanho da imagem"], correta: 1, explicacao: "rem = root em, a fonte do elemento <html>." },
        ],
      },
      {
        titulo: "Box Model",
        resumo:
          "Todo elemento é uma caixa: conteúdo, padding, borda e margem, de dentro para fora.",
        codigo: `* {
  box-sizing: border-box;
}

.painel {
  width: 300px;
  padding: 16px;        /* espaço interno */
  border: 2px solid cyan;
  margin: 24px auto;    /* espaço externo */
}`,
        conceitos: [
          { tag: "CAMADAS", titulo: "As 4 camadas", texto: "De dentro para fora: content → padding → border → margin." },
          { tag: "ESPAÇOS", titulo: "padding x margin", texto: "padding afasta o conteúdo da borda (dentro). margin afasta a caixa dos vizinhos (fora)." },
          { tag: "LARGURA", titulo: "box-sizing", texto: "Com border-box, padding e borda ficam DENTRO do width. Fica muito mais fácil prever tamanhos." },
        ],
        questoes: [
          { pergunta: "Qual propriedade cria espaço INTERNO entre o conteúdo e a borda?", opcoes: ["margin", "padding", "gap", "border"], correta: 1, explicacao: "padding é o espaço interno; margin é o externo." },
          { pergunta: "Com box-sizing: border-box, width: 300px, padding: 16px e borda de 2px, qual a largura final da caixa?", opcoes: ["300px", "332px", "336px", "316px"], correta: 0, explicacao: "No border-box, padding e borda já estão incluídos nos 300px." },
        ],
      },
      {
        titulo: "Flexbox",
        resumo:
          "O Flexbox alinha e distribui itens em uma linha ou coluna com poucas propriedades.",
        codigo: `.menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.menu.vertical {
  flex-direction: column;
}`,
        conceitos: [
          { tag: "ATIVAR", titulo: "display: flex", texto: "Transforma o elemento em container flex: os filhos diretos viram itens alinháveis." },
          { tag: "EIXO PRINCIPAL", titulo: "justify-content", texto: "Distribui os itens na direção do flex (horizontal, por padrão): start, center, space-between..." },
          { tag: "EIXO CRUZADO", titulo: "align-items", texto: "Alinha os itens no outro eixo (vertical, por padrão). gap define o espaço entre eles." },
        ],
        questoes: [
          { pergunta: "Em um container flex com direção padrão (row), qual propriedade distribui os itens na horizontal?", opcoes: ["align-items", "justify-content", "text-align", "float"], correta: 1, explicacao: "justify-content trabalha no eixo principal, que no row é horizontal." },
          { pergunta: "Qual propriedade empilha os itens flex em coluna?", opcoes: ["flex-wrap: column", "display: column", "flex-direction: column", "align-items: column"], correta: 2, explicacao: "flex-direction muda o eixo principal para vertical." },
        ],
      },
      {
        titulo: "Responsividade e Animação",
        resumo:
          "Media queries adaptam o layout a cada tela e transições dão vida às mudanças de estado.",
        codigo: `.botao {
  transition: transform 0.3s ease;
}

.botao:hover {
  transform: scale(1.1);
}

@keyframes piscar {
  from { opacity: 1; }
  to { opacity: 0; }
}

@media (max-width: 600px) {
  .menu { flex-direction: column; }
}`,
        conceitos: [
          { tag: "TELAS", titulo: "@media", texto: "Aplica regras só quando a condição é verdadeira, como em telas de até 600px." },
          { tag: "SUAVIDADE", titulo: "transition", texto: "Faz a mudança entre dois estados (ex.: normal → :hover) acontecer aos poucos." },
          { tag: "MOVIMENTO", titulo: "@keyframes", texto: "Descreve as etapas de uma animação, que é aplicada com a propriedade animation." },
        ],
        questoes: [
          { pergunta: "O que faz @media (max-width: 600px) { ... }?", opcoes: ["Aplica as regras só em telas de até 600px de largura", "Aplica só acima de 600px", "Limita as imagens a 600px", "Cria uma animação de 600ms"], correta: 0, explicacao: "max-width: 600px = largura máxima de 600px." },
          { pergunta: "Para mudar a cor suavemente no :hover, usa-se:", opcoes: ["transition", "@media", "z-index", "display"], correta: 0, explicacao: "transition anima a troca entre os estados." },
        ],
      },
    ],
  },

  // ==========================================================================
  // 03. JAVASCRIPT — O ANALISADOR
  // ==========================================================================
  {
    id: "javascript",
    numero: "03",
    nome: "JavaScript",
    funcao: "Analisador",
    papel: "Agente de Lógica",
    afinidade: "LOGIC ENGINE",
    arquivo: "script.js",
    linguagem: "js",
    serial: "CW-03-LGC",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "Dá comportamento ao mundo digital: analisa dados, toma decisões e reage a cada clique que acontece no CodeWorld.",
    cor: "#eab308", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Variáveis e Tipos",
        resumo:
          "Variáveis guardam informações. Em JavaScript elas podem ser texto, número, booleano e muito mais.",
        codigo: `const nome = "Agente JS";   // string
let energia = 100;          // number
let online = true;          // boolean

energia = energia - 15;
console.log(nome, energia, online);
console.log(typeof energia); // "number"`,
        conceitos: [
          { tag: "CONSTANTE", titulo: "const", texto: "Cria uma variável que não pode receber outro valor depois. Use por padrão." },
          { tag: "MUTÁVEL", titulo: "let", texto: "Cria uma variável que pode mudar, como a energia de um agente durante o combate." },
          { tag: "TIPOS", titulo: "string, number, boolean", texto: 'Texto entre aspas, números e verdadeiro/falso. typeof mostra o tipo de um valor.' },
        ],
        questoes: [
          { pergunta: "Qual declaração NÃO permite reatribuir o valor depois?", opcoes: ["let", "var", "const", "static"], correta: 2, explicacao: "const não aceita uma nova atribuição." },
          { pergunta: 'Qual o resultado de typeof "42"?', opcoes: ['"number"', '"string"', '"boolean"', '"text"'], correta: 1, explicacao: 'Entre aspas, "42" é um texto (string).' },
        ],
      },
      {
        titulo: "Condicionais",
        resumo:
          "Com if e else o programa escolhe caminhos diferentes de acordo com uma condição.",
        codigo: `const vida = 35;

if (vida <= 0) {
  console.log("Agente derrotado");
} else if (vida < 50) {
  console.log("Alerta: energia baixa");
} else {
  console.log("Sistema estável");
}

console.log(5 === "5"); // false`,
        conceitos: [
          { tag: "DECISÃO", titulo: "if / else if / else", texto: "Testa as condições em ordem e executa só o primeiro bloco verdadeiro." },
          { tag: "COMPARAÇÃO", titulo: "===", texto: "Compara valor E tipo. Prefira === ao ==, que converte tipos e causa surpresas." },
          { tag: "LÓGICA", titulo: "&&, || e !", texto: "&& exige tudo verdadeiro, || basta um verdadeiro e ! inverte o resultado." },
        ],
        questoes: [
          { pergunta: "Com vida = 35, o que o código exibe?", opcoes: ["Agente derrotado", "Alerta: energia baixa", "Sistema estável", "Nada"], correta: 1, explicacao: "35 não é <= 0, mas é < 50." },
          { pergunta: 'Qual o resultado de 5 === "5"?', opcoes: ["true", "false", "undefined", "Erro"], correta: 1, explicacao: "Os tipos são diferentes (number e string), então === dá false." },
        ],
      },
      {
        titulo: "Arrays e Laços",
        resumo:
          "Arrays guardam listas de valores e laços repetem ações para cada item.",
        codigo: `const agentes = ["HTML", "CSS"];
agentes.push("JS");

console.log(agentes.length); // 3
console.log(agentes[0]);     // "HTML"

for (const agente of agentes) {
  console.log("Conectando " + agente);
}`,
        conceitos: [
          { tag: "LISTA", titulo: "Array [ ]", texto: "Guarda vários valores em ordem. O primeiro item fica no índice 0." },
          { tag: "MÉTODOS", titulo: "push e length", texto: "push() adiciona no final e length informa quantos itens existem." },
          { tag: "REPETIÇÃO", titulo: "for...of", texto: "Percorre o array item por item, sem precisar controlar índices." },
        ],
        questoes: [
          { pergunta: "Qual o índice do PRIMEIRO item de um array?", opcoes: ["1", "0", "-1", "first"], correta: 1, explicacao: "Arrays começam a contar do zero." },
          { pergunta: "Qual método adiciona um item no FINAL do array?", opcoes: ["pop()", "shift()", "push()", "add()"], correta: 2, explicacao: "push() empurra o item para o fim da lista." },
        ],
      },
      {
        titulo: "Funções",
        resumo:
          "Funções guardam um bloco de código reutilizável que recebe dados e devolve um resultado.",
        codigo: `function calcularDano(ataque, defesa) {
  return ataque - defesa;
}

const curar = (vida) => vida + 20;

console.log(calcularDano(50, 15)); // 35
console.log(curar(80));            // 100`,
        conceitos: [
          { tag: "DECLARAÇÃO", titulo: "function", texto: "Dá um nome ao bloco de código e define os parâmetros que ele recebe." },
          { tag: "RESULTADO", titulo: "return", texto: "Devolve um valor para quem chamou a função e encerra a execução dela." },
          { tag: "ATALHO", titulo: "Arrow function =>", texto: "Forma curta de escrever funções. Com uma só expressão, o return é automático." },
        ],
        questoes: [
          { pergunta: "Qual o resultado de calcularDano(50, 15)?", opcoes: ["65", "35", "50", "15"], correta: 1, explicacao: "50 - 15 = 35." },
          { pergunta: "O que a palavra return faz?", opcoes: ["Repete a função", "Devolve um valor e encerra a função", "Imprime no console", "Cria uma variável"], correta: 1, explicacao: "return entrega o resultado e sai da função." },
        ],
      },
      {
        titulo: "DOM e Eventos",
        resumo:
          "Com o DOM o JavaScript encontra elementos da página e reage às ações do usuário.",
        codigo: `const botao = document.querySelector("#atacar");
const log = document.querySelector(".log");

botao.addEventListener("click", () => {
  log.textContent = "Ataque enviado!";
  botao.classList.add("ativo");
});`,
        conceitos: [
          { tag: "BUSCA", titulo: "querySelector", texto: "Encontra o primeiro elemento que combina com um seletor CSS (#id, .classe, tag)." },
          { tag: "EVENTOS", titulo: "addEventListener", texto: "Executa uma função quando algo acontece: click, input, keydown, scroll..." },
          { tag: "ALTERAR", titulo: "textContent e classList", texto: "Mudam o texto e as classes do elemento, o que atualiza a página na hora." },
        ],
        questoes: [
          { pergunta: "Qual método busca o primeiro elemento que combina com um seletor CSS?", opcoes: ["document.getAll()", "document.querySelector()", "document.find()", "document.select()"], correta: 1, explicacao: "querySelector aceita qualquer seletor CSS." },
          { pergunta: "Como executar uma função quando o usuário clica em um botão?", opcoes: ["botao.onClickListener()", 'botao.addEventListener("click", funcao)', 'botao.listen("click")', "botao.click = true"], correta: 1, explicacao: "addEventListener registra a função para o evento click." },
        ],
      },
    ],
  },

  // ==========================================================================
  // 04. PYTHON — O ESTRATEGISTA
  // ==========================================================================
  {
    id: "python",
    numero: "04",
    nome: "Python",
    funcao: "Estrategista",
    papel: "Agente de Estratégia de Dados",
    afinidade: "DATA STRATEGY",
    arquivo: "main.py",
    linguagem: "python",
    serial: "CW-04-DAT",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "Planeja cada movimento com dados: sua sintaxe limpa transforma problemas complexos em estratégias simples e legíveis.",
    cor: "#be185d", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Variáveis e Print",
        resumo:
          "Em Python não é preciso declarar o tipo: basta dar um nome e um valor.",
        codigo: `nome = "Agente Python"
nivel = 4
precisao = 98.5
ativo = True

print(nome)
print(f"Nível {nivel} - precisão {precisao}%")
print(type(nivel))  # <class 'int'>`,
        conceitos: [
          { tag: "TIPAGEM", titulo: "Tipo automático", texto: "O Python descobre o tipo pelo valor: str (texto), int (inteiro), float (decimal) e bool." },
          { tag: "BOOLEANO", titulo: "True e False", texto: "Os valores lógicos começam com letra maiúscula em Python." },
          { tag: "TEXTO", titulo: "f-strings", texto: 'Com f antes das aspas, o que estiver entre { } é calculado e colocado no texto.' },
        ],
        questoes: [
          { pergunta: "Como se escreve o valor booleano verdadeiro em Python?", opcoes: ["true", "True", "TRUE", "1true"], correta: 1, explicacao: "Em Python é True, com T maiúsculo." },
          { pergunta: 'Qual a saída de print(f"Nível {2 + 3}")?', opcoes: ["Nível {2 + 3}", "Nível 5", "Nível 23", "Erro"], correta: 1, explicacao: "A f-string calcula 2 + 3 dentro das chaves." },
        ],
      },
      {
        titulo: "Condicionais e Indentação",
        resumo:
          "Em Python os blocos são definidos pelos espaços no início da linha, não por chaves.",
        codigo: `energia = 40

if energia > 70:
    print("Pronto para o combate")
elif energia > 30:
    print("Recarregando...")
else:
    print("Recuar!")`,
        conceitos: [
          { tag: "BLOCOS", titulo: "Indentação", texto: "Tudo que está recuado (normalmente 4 espaços) depois do if pertence a ele." },
          { tag: "SINTAXE", titulo: "Dois-pontos", texto: "if, elif, else, for e def sempre terminam com : antes do bloco." },
          { tag: "CAMINHOS", titulo: "elif", texto: 'Abreviação de "else if": testa outra condição se a anterior foi falsa.' },
        ],
        questoes: [
          { pergunta: "Em Python, o que define quais linhas pertencem a um bloco if?", opcoes: ["Chaves { }", "A indentação (espaços no início da linha)", "Ponto e vírgula", "A palavra end"], correta: 1, explicacao: "A indentação faz parte da sintaxe do Python." },
          { pergunta: "Com energia = 40, o que o código imprime?", opcoes: ["Pronto para o combate", "Recarregando...", "Recuar!", "Nada"], correta: 1, explicacao: "40 não é > 70, mas é > 30." },
        ],
      },
      {
        titulo: "Listas e Laços",
        resumo:
          "Listas guardam sequências de valores e o for percorre cada um deles.",
        codigo: `territorios = ["Nível 0", "Nível 1", "Nível 2"]
territorios.append("Núcleo")

for t in territorios:
    print("Explorando", t)

for i in range(3):
    print(i)  # 0, 1, 2`,
        conceitos: [
          { tag: "LISTA", titulo: "[ ] e append", texto: "Listas são criadas com colchetes. append() adiciona um item no final." },
          { tag: "REPETIÇÃO", titulo: "for ... in", texto: "Pega um item da lista por vez e executa o bloco para cada um." },
          { tag: "CONTAGEM", titulo: "range(n)", texto: "Gera os números de 0 até n - 1. Ótimo para repetir algo n vezes." },
        ],
        questoes: [
          { pergunta: "Quais números range(3) gera?", opcoes: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3, 2, 1"], correta: 1, explicacao: "range começa em 0 e para antes do 3." },
          { pergunta: "Qual método adiciona um item ao final de uma lista?", opcoes: ["push()", "add()", "append()", "insert_end()"], correta: 2, explicacao: "Em Python usamos lista.append(item)." },
        ],
      },
      {
        titulo: "Funções",
        resumo:
          "Funções são criadas com def e podem ter parâmetros com valores padrão.",
        codigo: `def calcular_xp(base, bonus=0):
    return base * 2 + bonus

print(calcular_xp(10))      # 20
print(calcular_xp(10, 5))   # 25`,
        conceitos: [
          { tag: "DEFINIR", titulo: "def", texto: "Cria uma função com nome e parâmetros. O corpo vem indentado." },
          { tag: "PADRÃO", titulo: "bonus=0", texto: "Parâmetro com valor padrão: se não for informado, usa 0." },
          { tag: "RESULTADO", titulo: "return", texto: "Devolve o valor calculado para quem chamou a função." },
        ],
        questoes: [
          { pergunta: "Qual palavra-chave define uma função em Python?", opcoes: ["function", "func", "def", "fn"], correta: 2, explicacao: "def vem de define." },
          { pergunta: "Qual o resultado de calcular_xp(10, 5)?", opcoes: ["15", "20", "25", "30"], correta: 2, explicacao: "10 * 2 + 5 = 25." },
        ],
      },
      {
        titulo: "Dicionários",
        resumo:
          "Dicionários guardam pares de chave e valor, como uma ficha de agente.",
        codigo: `agente = {
    "nome": "Python",
    "funcao": "Estrategista",
    "nivel": 5,
}

print(agente["nome"])
agente["nivel"] = 6

for chave, valor in agente.items():
    print(chave, "->", valor)`,
        conceitos: [
          { tag: "ESTRUTURA", titulo: "{ chave: valor }", texto: "Cada informação tem um nome (chave) e um conteúdo (valor)." },
          { tag: "ACESSO", titulo: 'agente["nome"]', texto: "Usa a chave entre colchetes para ler ou alterar um valor." },
          { tag: "PERCORRER", titulo: ".items()", texto: "Entrega chave e valor juntos para usar em um for." },
        ],
        questoes: [
          { pergunta: 'Como acessar o valor da chave "nome" do dicionário agente?', opcoes: ["agente.nome()", 'agente["nome"]', "agente(nome)", "agente->nome"], correta: 1, explicacao: "Dicionários são lidos com colchetes e a chave." },
          { pergunta: "Qual método percorre chaves e valores ao mesmo tempo?", opcoes: [".keys()", ".values()", ".items()", ".pairs()"], correta: 2, explicacao: ".items() devolve os pares (chave, valor)." },
        ],
      },
    ],
  },

  // ==========================================================================
  // 05. JAVA — O GUARDIÃO
  // ==========================================================================
  {
    id: "java",
    numero: "05",
    nome: "Java",
    funcao: "Guardião",
    papel: "Agente de Segurança de Tipos",
    afinidade: "TYPE SECURITY",
    arquivo: "Main.java",
    linguagem: "java",
    serial: "CW-05-SEC",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "Protege os sistemas com regras rígidas: cada valor tem um tipo definido e cada estrutura é verificada antes de executar.",
    cor: "#0891b2", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Estrutura de um Programa",
        resumo:
          "Em Java todo código vive dentro de uma classe, e a execução começa pelo método main.",
        codigo: `public class Main {
    public static void main(String[] args) {
        System.out.println("Guardião online");
    }
}`,
        conceitos: [
          { tag: "CLASSE", titulo: "public class Main", texto: "Todo código Java fica em uma classe. O arquivo deve ter o mesmo nome dela: Main.java." },
          { tag: "ENTRADA", titulo: "main", texto: "O método main é o ponto de partida: é ele que o Java executa primeiro." },
          { tag: "SAÍDA", titulo: "System.out.println", texto: "Mostra um texto no console e pula linha. Toda instrução termina com ;" },
        ],
        questoes: [
          { pergunta: "Qual método é o ponto de entrada de um programa Java?", opcoes: ["start()", "run()", "main()", "init()"], correta: 2, explicacao: "A JVM procura o public static void main(String[] args)." },
          { pergunta: "Se a classe pública se chama Main, o arquivo deve se chamar:", opcoes: ["main.txt", "Main.java", "Main.class.java", "programa.java"], correta: 1, explicacao: "O nome do arquivo segue o nome da classe pública." },
        ],
      },
      {
        titulo: "Tipos e Variáveis",
        resumo:
          "Java é fortemente tipado: o tipo de cada variável é declarado e verificado na compilação.",
        codigo: `int escudo = 150;
double precisao = 97.5;
boolean ativo = true;
char rank = 'A';
String nome = "Java";

escudo = escudo + 25;
System.out.println(nome + ": " + escudo);`,
        conceitos: [
          { tag: "TIPAGEM", titulo: "Tipo antes do nome", texto: "Toda variável declara seu tipo. Um int nunca vai guardar um texto." },
          { tag: "PRIMITIVOS", titulo: "int, double, boolean, char", texto: "Inteiros, decimais, verdadeiro/falso e um único caractere entre aspas simples." },
          { tag: "TEXTO", titulo: "String", texto: "Textos usam aspas duplas e podem ser unidos com +." },
        ],
        questoes: [
          { pergunta: "Qual tipo armazena números com casas decimais?", opcoes: ["int", "double", "boolean", "char"], correta: 1, explicacao: "double guarda números de ponto flutuante." },
          { pergunta: 'O que acontece com a linha int escudo = "forte";?', opcoes: ["Converte automaticamente", "Erro de compilação: tipos incompatíveis", "escudo vira 0", "Funciona normalmente"], correta: 1, explicacao: "O compilador barra: String não pode virar int." },
        ],
      },
      {
        titulo: "Condicionais e Laços",
        resumo:
          "Com if e for o Guardião decide quando agir e repete as defesas quantas vezes for preciso.",
        codigo: `int ondas = 3;

for (int i = 1; i <= ondas; i++) {
    System.out.println("Bloqueando onda " + i);
}

int vida = 20;
if (vida < 30 && vida > 0) {
    System.out.println("Escudo crítico!");
}`,
        conceitos: [
          { tag: "LAÇO", titulo: "for (início; condição; passo)", texto: "Começa em i = 1, repete enquanto i <= ondas e soma 1 a cada volta." },
          { tag: "INCREMENTO", titulo: "i++", texto: "Atalho para i = i + 1." },
          { tag: "LÓGICA", titulo: "&& e ||", texto: "&& (E) exige as duas condições verdadeiras; || (OU) exige pelo menos uma." },
        ],
        questoes: [
          { pergunta: "Quantas vezes o laço for (int i = 1; i <= 3; i++) executa?", opcoes: ["2", "3", "4", "Infinitas"], correta: 1, explicacao: "i vale 1, 2 e 3." },
          { pergunta: "Qual operador significa 'E' lógico em Java?", opcoes: ["and", "&", "&&", "||"], correta: 2, explicacao: "&& é o E lógico; || é o OU." },
        ],
      },
      {
        titulo: "Métodos",
        resumo:
          "Métodos são as funções do Java: declaram o tipo do valor que devolvem e o tipo de cada parâmetro.",
        codigo: `public class Main {
    static int reforcar(int escudo, int bonus) {
        return escudo + bonus;
    }

    public static void main(String[] args) {
        int total = reforcar(100, 50);
        System.out.println(total); // 150
    }
}`,
        conceitos: [
          { tag: "ASSINATURA", titulo: "int reforcar(int, int)", texto: "O primeiro int é o tipo do retorno; dentro dos parênteses vêm os parâmetros tipados." },
          { tag: "SEM RETORNO", titulo: "void", texto: "Indica que o método executa uma ação mas não devolve nenhum valor." },
          { tag: "CLASSE", titulo: "static", texto: "Permite chamar o método direto pela classe, sem criar um objeto." },
        ],
        questoes: [
          { pergunta: "Qual palavra indica que um método NÃO retorna valor?", opcoes: ["null", "empty", "void", "none"], correta: 2, explicacao: "void = vazio, sem retorno." },
          { pergunta: "O que reforcar(100, 50) retorna?", opcoes: ["100", "50", "150", "10050"], correta: 2, explicacao: "São dois int somados: 100 + 50 = 150." },
        ],
      },
      {
        titulo: "Classes e Objetos",
        resumo:
          "Classes são moldes; objetos são as peças criadas a partir deles, cada uma com seus próprios dados.",
        codigo: `public class Agente {
    private String nome;
    private int nivel;

    public Agente(String nome, int nivel) {
        this.nome = nome;
        this.nivel = nivel;
    }

    public String getNome() {
        return nome;
    }
}

Agente java = new Agente("Java", 5);`,
        conceitos: [
          { tag: "INSTÂNCIA", titulo: "new", texto: "Cria um objeto novo na memória a partir da classe." },
          { tag: "CONSTRUTOR", titulo: "Agente(...)", texto: "Método com o nome da classe que prepara o objeto. this indica o próprio objeto." },
          { tag: "ENCAPSULAMENTO", titulo: "private + getter", texto: "Os dados ficam protegidos e só são lidos por métodos públicos como getNome()." },
        ],
        questoes: [
          { pergunta: "Qual palavra-chave cria um novo objeto a partir de uma classe?", opcoes: ["create", "new", "object", "make"], correta: 1, explicacao: "new Agente(...) instancia um objeto." },
          { pergunta: "Por que usar private nos atributos?", opcoes: ["Para deixar o código mais rápido", "Para proteger os dados, permitindo acesso só pelos métodos da classe", "Para apagar o atributo", "Para torná-lo global"], correta: 1, explicacao: "Esse é o princípio do encapsulamento." },
        ],
      },
    ],
  },

  // ==========================================================================
  // 06. KOTLIN — O VELOZ
  // ==========================================================================
  {
    id: "kotlin",
    numero: "06",
    nome: "Kotlin",
    funcao: "Veloz",
    papel: "Agente de Velocidade Mobile",
    afinidade: "MOBILE VELOCITY",
    arquivo: "Main.kt",
    linguagem: "kotlin",
    serial: "CW-06-MOB",
    imagem: "", // caminho da imagem (ainda vai ser escolhida)
    descricao:
      "O mais rápido do esquadrão: escreve menos código, evita erros de valores nulos e domina o território dos aplicativos Android.",
    cor: "#10b981", // cor de destaque (brilho da moldura da imagem)
    niveis: [
      {
        titulo: "Primeiros Passos",
        resumo:
          "Kotlin é direto ao ponto: sem ponto e vírgula, com tipos descobertos automaticamente.",
        codigo: `fun main() {
    val nome = "Kotlin"   // imutável
    var velocidade = 120  // mutável

    velocidade += 30
    println("$nome a $velocidade km/h")
}`,
        conceitos: [
          { tag: "ENTRADA", titulo: "fun main()", texto: "A função main é onde o programa começa. fun declara qualquer função." },
          { tag: "VARIÁVEIS", titulo: "val x var", texto: "val não pode ser reatribuída (como const); var pode mudar." },
          { tag: "TEXTO", titulo: "String templates", texto: "$nome dentro das aspas insere o valor da variável no texto." },
        ],
        questoes: [
          { pergunta: "Qual palavra declara uma variável que NÃO pode ser reatribuída?", opcoes: ["var", "val", "let", "const"], correta: 1, explicacao: "val = value (valor fixo)." },
          { pergunta: 'Com nome = "Kotlin", o que println("Olá, $nome") mostra?', opcoes: ["Olá, $nome", "Olá, Kotlin", "Um erro", "Olá, nome"], correta: 1, explicacao: "O $ insere o valor da variável no texto." },
        ],
      },
      {
        titulo: "Null Safety",
        resumo:
          "Kotlin impede o famoso erro de valor nulo: só aceita null quando você permite.",
        codigo: `var codinome: String? = null

println(codinome?.length)        // null
val tamanho = codinome?.length ?: 0
println(tamanho)                 // 0

codinome = "Veloz"
println(codinome?.length)        // 5`,
        conceitos: [
          { tag: "TIPO NULO", titulo: "String?", texto: "Por padrão nenhum tipo aceita null. O ? libera essa possibilidade." },
          { tag: "CHAMADA SEGURA", titulo: "?.", texto: "Só acessa a propriedade se o valor não for null; caso contrário, devolve null." },
          { tag: "ELVIS", titulo: "?:", texto: "Define um valor padrão para quando o resultado da esquerda for null." },
        ],
        questoes: [
          { pergunta: "Como declarar uma String que pode receber null?", opcoes: ["String!", "String?", "Nullable<String>", "String*"], correta: 1, explicacao: "O ? depois do tipo permite null." },
          { pergunta: "O que codinome?.length ?: 0 retorna quando codinome é null?", opcoes: ["null", "Um erro", "0", "-1"], correta: 2, explicacao: "?. devolve null e o Elvis troca por 0." },
        ],
      },
      {
        titulo: "When e Expressões",
        resumo:
          "No Kotlin, if e when devolvem valores, deixando decisões curtas e legíveis.",
        codigo: `val nivel = 3

val rank = when (nivel) {
    1 -> "Recruta"
    2, 3 -> "Operador"
    in 4..5 -> "Elite"
    else -> "Desconhecido"
}

val status = if (nivel >= 3) "Liberado" else "Bloqueado"`,
        conceitos: [
          { tag: "ESCOLHA", titulo: "when", texto: "Compara um valor com vários casos, como um switch muito mais poderoso." },
          { tag: "INTERVALO", titulo: "4..5", texto: "Cria um intervalo de números. in verifica se o valor está dentro dele." },
          { tag: "EXPRESSÃO", titulo: "if que devolve valor", texto: "O resultado do if pode ir direto para uma variável." },
        ],
        questoes: [
          { pergunta: "Com nivel = 3, qual o valor de rank?", opcoes: ["Recruta", "Operador", "Elite", "Desconhecido"], correta: 1, explicacao: "O caso 2, 3 cobre o valor 3." },
          { pergunta: "O que é 4..5 em Kotlin?", opcoes: ["Uma divisão", "Um intervalo (range) de 4 até 5", "Um número decimal", "Um comentário"], correta: 1, explicacao: ".. cria um range, incluindo as duas pontas." },
        ],
      },
      {
        titulo: "Funções e Lambdas",
        resumo:
          "Funções podem ter valores padrão, caber em uma linha e ser passadas como lambdas.",
        codigo: `fun turbo(velocidade: Int, multiplicador: Int = 2): Int {
    return velocidade * multiplicador
}

fun dobro(x: Int) = x * 2

val tempos = listOf(10, 25, 40)
val rapidos = tempos.filter { it < 30 }
println(rapidos) // [10, 25]`,
        conceitos: [
          { tag: "TIPOS", titulo: "nome: Tipo", texto: "Parâmetros e retorno indicam o tipo depois dos dois-pontos." },
          { tag: "ATALHO", titulo: "= expressão", texto: "Funções de uma linha dispensam chaves e return." },
          { tag: "LAMBDA", titulo: "{ it < 30 }", texto: "Bloco de código passado como valor. it é o nome automático do único parâmetro." },
        ],
        questoes: [
          { pergunta: "Qual o resultado de turbo(50)?", opcoes: ["50", "52", "100", "Erro: falta parâmetro"], correta: 2, explicacao: "multiplicador usa o padrão 2: 50 * 2 = 100." },
          { pergunta: "Em { it < 30 }, o que é it?", opcoes: ["Uma palavra reservada para loops", "O nome implícito do único parâmetro da lambda", "Um tipo de dado", "A lista inteira"], correta: 1, explicacao: "it representa cada item recebido pela lambda." },
        ],
      },
      {
        titulo: "Classes e Data Class",
        resumo:
          "Kotlin cria classes em uma linha e a data class já vem com métodos úteis prontos.",
        codigo: `data class Agente(val nome: String, val nivel: Int)

fun main() {
    val kotlin = Agente("Kotlin", 5)
    val copia = kotlin.copy(nivel = 6)

    println(kotlin)          // Agente(nome=Kotlin, nivel=5)
    println(kotlin == copia) // false
}`,
        conceitos: [
          { tag: "CONSTRUTOR", titulo: "Construtor primário", texto: "As propriedades são declaradas direto entre os parênteses da classe." },
          { tag: "DATA CLASS", titulo: "toString, equals, copy", texto: "data class gera esses métodos automaticamente a partir das propriedades." },
          { tag: "INSTÂNCIA", titulo: "Sem new", texto: "Objetos são criados chamando a classe como uma função: Agente(...)." },
        ],
        questoes: [
          { pergunta: "Em Kotlin, como criar um objeto da classe Agente?", opcoes: ['new Agente("K", 1)', 'Agente("K", 1)', 'Agente.new("K", 1)', 'create Agente("K", 1)'], correta: 1, explicacao: "Kotlin não usa a palavra new." },
          { pergunta: "O que copy() de uma data class faz?", opcoes: ["Apaga o objeto", "Cria um novo objeto igual, podendo alterar alguns valores", "Copia para a área de transferência", "Converte em String"], correta: 1, explicacao: "copy(nivel = 6) cria um novo agente só com o nível alterado." },
        ],
      },
    ],
  },
];
