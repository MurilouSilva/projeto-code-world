/**
 * CODEWORLD // missoes/script.js
 * Interações exclusivas da tela MISSÕES.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js;
 *  as missões de código ficam em dados.js e o jogo em ../rpg/)
 *
 *   1. Ferramentas e sorteio das diárias
 *   2. Missões vencidas (localStorage)
 *   3. Missão ativa do RPG
 *   4. Lista e filtros
 *   5. Terminal e combate
 *   6. Conferência do código
 *   7. Atualizar quando outra aba mudar o progresso
 *
 * Como as recompensas chegam ao RPG:
 *   - Esta tela só anota a vitória em cw_missoes: { "bug-invasor": { patch: 2 } }.
 *   - O RPG lê essa chave e coloca os itens na mochila, uma vez por missão
 *     (Regras.sincronizarMissoes). Assim esta tela nunca mexe no save do jogo.
 */

// Este código roda assim que o arquivo é lido (os scripts com defer rodam
// antes do evento DOMContentLoaded). Assim os cards já existem quando o
// base.js procura os elementos para animar.
(() => {
  const lista = document.getElementById("LISTA-MISSOES");
  if (!lista || typeof MISSOES === "undefined") return;

  // O RPG é opcional: sem ele, a tela continua com as missões de código
  const comRpg = typeof Regras !== "undefined" && typeof DADOS_RPG !== "undefined";

  const CHAVE_VENCIDAS = "cw_missoes";
  const VIDA_MAXIMA = 100;
  const DANO_POR_ERRO = 25;
  const TEMPO_LIMITE = 1500; // milissegundos para o código JS/Python terminar

  // Cor e texto do selo de cada tipo de missão
  const SELOS = {
    principal: { classe: "principal", texto: "PRINCIPAL" },
    secundaria: { classe: "secundaria", texto: "SECUNDÁRIA" },
    epica: { classe: "epica", texto: "ÉPICA" },
    diaria: { classe: "secundaria", texto: "DIÁRIA" },
  };
  const LINGUAGENS = { html: "HTML", css: "CSS", javascript: "JS", python: "PYTHON" };
  // Nome do arquivo mostrado na barra do terminal
  const ARQUIVOS = { html: "index.html", css: "style.css", javascript: "script.js", python: "main.py" };

  // Ícones dos itens: os mesmos desenhos (SVG) do RPG, que herdam a cor do texto
  const ICONES_ITENS = {
    patch: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z",
    antidote: "M9 3h6m-5 0v6l-5 8a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-8V3M8 14h8",
    battery: "m13 2-8 12h6l-1 8 9-12h-7l1-8Z",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z",
  };
  const iconeItem = (id) =>
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES_ITENS[id] || ICONES_ITENS.patch}"/></svg>`;

  // Barra e texto do card de acordo com a situação da missão
  const ESTADOS = {
    pendente: { valor: 0, texto: "PENDENTE" },
    "a-caminho": { valor: 100, texto: "ITENS A RECEBER" },
    "na-mochila": { valor: 100, texto: "CONCLUÍDA" },
  };

  // ==========================================================================
  // 1. FERRAMENTAS E SORTEIO DAS DIÁRIAS
  // ==========================================================================

  const doisDigitos = (n) => String(n).padStart(2, "0");

  // Escapa texto para ser colocado dentro do HTML com segurança
  const escapar = (texto) =>
    String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Junta espaços e quebras de linha, para comparar textos
  const textoNormal = (texto) => texto.replace(/\s+/g, " ").trim();

  // "Reduzir movimento" ligado no painel do site ou no sistema
  const semMovimento = () =>
    document.documentElement.classList.contains("sem-animacao") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Nome do item (vem do RPG): patch → "Patch de reparo"
  const nomeItem = (id) => (comRpg && DADOS_RPG.itens[id] ? DADOS_RPG.itens[id].name : id);

  // { patch: 2, shield: 1 } → "2 × Patch de reparo · 1 × Escudo de dados"
  const textoRecompensas = (recompensas) =>
    Object.entries(recompensas)
      .map(([id, n]) => `${n} × ${nomeItem(id)}`)
      .join(" · ");

  // Data de hoje no horário de Brasília, no formato 2026-10-25
  function diaDeHoje() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  }

  // Sorteio que dá sempre os mesmos números para a mesma data. Cada número
  // nasce do anterior (gerador de Park-Miller), começando pela data.
  function criarSorteio(dia) {
    let semente = Number(dia.replace(/-/g, "")) % 2147483647;
    return (minimo, maximo) => {
      semente = (semente * 16807) % 2147483647;
      return minimo + (semente % (maximo - minimo + 1));
    };
  }

  // As 3 diárias de um dia: os modelos do dados.js com os números do sorteio
  function missoesDoDia(dia) {
    const sortear = criarSorteio(dia);
    const escolher = (opcoes) => opcoes[sortear(0, opcoes.length - 1)];
    const numeros = {
      setor: sortear(10, 99),
      largura: escolher([96, 120, 144, 160]),
      cor: escolher(["#68d8ff", "#b9a1ff", "#78e8b0"]),
      energia: sortear(50, 95),
      custo: sortear(12, 35),
    };
    return MISSOES.diarias.map((modelo, i) => ({
      ...modelo(numeros),
      id: `diaria:${dia}:${i}`,
      tipo: "diaria",
    }));
  }

  // Procura uma missão pelo id (entre as permanentes e as diárias de hoje)
  const buscarMissao = (id) =>
    [...MISSOES.permanentes, ...missoesDoDia(diaDeHoje())].find((m) => m.id === id);

  // ==========================================================================
  // 2. MISSÕES VENCIDAS (LOCALSTORAGE)
  // ==========================================================================

  function lerVencidas() {
    try {
      const vencidas = JSON.parse(localStorage.getItem(CHAVE_VENCIDAS));
      return vencidas && typeof vencidas === "object" && !Array.isArray(vencidas) ? vencidas : {};
    } catch (erro) {
      return {};
    }
  }

  // Anota a vitória e as recompensas. Devolve "nova" (primeira vitória),
  // "repetida" (já tinha vencido) ou "erro" (o navegador não deixou salvar)
  function anotarVitoria(missao) {
    const vencidas = lerVencidas(); // relê: outra aba pode ter anotado algo
    if (vencidas[missao.id]) return "repetida";
    vencidas[missao.id] = missao.recompensas;
    try {
      localStorage.setItem(CHAVE_VENCIDAS, JSON.stringify(vencidas));
    } catch (erro) {
      return "erro";
    }
    return "nova";
  }

  // pendente → a-caminho (vencida, mas o RPG ainda não entregou os itens)
  // → na-mochila (o RPG já colocou os itens na mochila)
  function estadoDe(id, vencidas = lerVencidas()) {
    if (!vencidas[id]) return "pendente";
    if (comRpg && (Regras.progresso.missoesPagas || []).includes(id)) return "na-mochila";
    return "a-caminho";
  }

  // ==========================================================================
  // 3. MISSÃO ATIVA DO RPG
  // ==========================================================================
  const cardRpg = document.getElementById("MISSAO-RPG");

  // Mostra a operação atual da campanha (sem o RPG, fica o card de exemplo)
  function desenharMissaoRpg() {
    if (!comRpg || !cardRpg) return;
    const operacoes = DADOS_RPG.operacoes;
    const op = Regras.operacaoAtual();

    if (!op) {
      cardRpg.innerHTML = `
        <p class="rotulo sistema">MISSÃO ATIVA // CAMPANHA DO RPG</p>
        <h3><span aria-hidden="true">✔</span> CAMPANHA CONCLUÍDA</h3>
        <p class="selo epica">${operacoes.length}/${operacoes.length}</p>
        <p>Você venceu as ${operacoes.length} operações da campanha. Reveja a história no Diário do RPG.</p>
        <a class="botao primario" href="../rpg/index.html#diario">
          ABRIR O DIÁRIO <span aria-hidden="true">→</span>
        </a>`;
      return;
    }

    const numero = operacoes.indexOf(op) + 1;
    const capitulo = DADOS_RPG.capitulos[op.world];
    const fasesDoCapitulo = operacoes.filter((o) => o.world === op.world).length;
    const emAndamento = Boolean(Regras.progresso.ativa);

    let selo = '<p class="selo principal">PRINCIPAL</p>';
    if (op.boss) selo = '<p class="selo ameaca">CHEFE</p>';
    if (emAndamento) selo = '<p class="selo status">EM ANDAMENTO</p>';

    cardRpg.innerHTML = `
      <p class="rotulo sistema">MISSÃO ATIVA // OPERAÇÃO ${doisDigitos(numero)}/${operacoes.length} DO RPG</p>
      <h3><span aria-hidden="true">⚠</span> ${escapar(op.title.toUpperCase())}</h3>
      ${selo}
      <p>${escapar(op.scenes[0] ? op.scenes[0].body : capitulo.intro)}</p>
      <dl class="informacoes missao">
        <dt class="rotulo sistema">CAPÍTULO</dt>
        <dd>${doisDigitos(op.world + 1)} · ${escapar(capitulo.name.toUpperCase())}</dd>
        <dt class="rotulo sistema">ETAPA</dt>
        <dd>FASE ${op.phase}/${fasesDoCapitulo}${op.boss ? ` · ${escapar(capitulo.boss.toUpperCase())}` : ""}</dd>
        <dt class="rotulo sistema">RECOMPENSA</dt>
        <dd>${escapar(textoRecompensas(Regras.recompensaOperacao(op)).toUpperCase())}</dd>
      </dl>
      <a class="botao primario" data-jogar href="../rpg/index.html#explorar">
        ${emAndamento ? "CONTINUAR NO RPG" : "JOGAR NO RPG"} <span aria-hidden="true">→</span>
      </a>`;
  }

  // Antes de abrir o RPG, leva o jogador até o capítulo da operação atual
  // (se nenhuma operação estiver aberta). O próprio link faz a navegação.
  if (cardRpg) {
    cardRpg.addEventListener("click", (e) => {
      if (!comRpg || !e.target.closest("[data-jogar]")) return;
      Regras.recarregar(); // pega o progresso mais novo antes de mexer nele
      const op = Regras.operacaoAtual();
      const p = Regras.progresso;
      if (op && !p.ativa && p.posicao.mundo !== op.world) {
        try {
          Regras.viajar(op.world);
        } catch (erro) {}
      }
    });
  }

  // ==========================================================================
  // 4. LISTA E FILTROS
  // ==========================================================================
  const resumo = document.getElementById("RESUMO-MISSOES");
  const botoesFiltro = document.querySelectorAll("[data-filtro]");
  let filtro = "ativas";
  let aberta = null; // missão que está no terminal

  function cartaoMissao(missao, vencidas) {
    const estado = estadoDe(missao.id, vencidas);
    const selo = SELOS[missao.tipo];
    const icone = missao.tipo === "principal" || missao.tipo === "epica" ? "⚠" : "◆";
    const classes = ["card", "missao"];
    if (missao.tipo === "epica") classes.push("epica");
    if (aberta && aberta.id === missao.id) classes.push("aberta");

    return `
      <li class="${classes.join(" ")}">
        <h4><span aria-hidden="true">${icone}</span> ${escapar(missao.titulo.toUpperCase())}</h4>
        <p>${escapar(missao.resumo)}</p>
        <p class="selo ${selo.classe}">${selo.texto}</p>
        <p class="nivel missao">${LINGUAGENS[missao.linguagem]}</p>
        <p class="experiencia missao" style="--valor: ${ESTADOS[estado].valor}%">${ESTADOS[estado].texto}</p>
        <button type="button" class="botao secundario" data-abrir="${escapar(missao.id)}"${aberta && aberta.id === missao.id ? ' aria-current="true"' : ""}>
          ${estado === "pendente" ? "ABRIR NO TERMINAL" : "TREINAR DE NOVO"}
          <span aria-hidden="true">→</span><span class="somente-leitor">: ${escapar(missao.titulo)}</span>
        </button>
      </li>`;
  }

  // Card de uma operação do RPG já vencida
  function cartaoOperacao(op) {
    const numero = DADOS_RPG.operacoes.indexOf(op) + 1;
    const capitulo = DADOS_RPG.capitulos[op.world];
    return `
      <li class="card missao${op.world === 6 ? " epica" : ""}">
        <h4><span aria-hidden="true">${op.boss ? "⚠" : "◆"}</span> ${escapar(op.title.toUpperCase())}</h4>
        <p>${escapar(capitulo.name)} · operação do RPG</p>
        <p class="selo ${op.boss ? "principal" : "secundaria"}">${op.boss ? "CHEFE" : "OPERAÇÃO"}</p>
        <p class="nivel missao">OP.${doisDigitos(numero)}</p>
        <p class="experiencia missao" style="--valor: 100%">CONCLUÍDA</p>
      </li>`;
  }

  // Atalho para os desafios rápidos do RPG (perguntas que rendem itens)
  function cartaoDesafiosRpg() {
    if (!comRpg) return "";
    const feitos = Regras.progresso.desafios.length;
    const total = DADOS_RPG.desafios.length;
    const porcentagem = Math.round((feitos / total) * 100);
    return `
      <li class="card missao">
        <h4><span aria-hidden="true">◆</span> DESAFIOS RÁPIDOS</h4>
        <p>Perguntas do RPG que rendem itens, uma vez cada.</p>
        <p class="selo secundaria">RPG</p>
        <p class="nivel missao">${feitos}/${total}</p>
        <p class="experiencia missao" style="--valor: ${porcentagem}%">${porcentagem}%</p>
        <a class="botao secundario" href="../rpg/index.html#desafios">ABRIR NO RPG <span aria-hidden="true">→</span></a>
      </li>`;
  }

  const vazio = (texto) => `<li class="vazio">${texto}</li>`;

  // Monta a lista de acordo com o filtro escolhido
  function desenharLista() {
    const vencidas = lerVencidas();
    const diarias = missoesDoDia(diaDeHoje()); // a data é relida: vira à meia-noite
    // Guarda o botão que estava com o foco, para devolver depois de redesenhar
    const focado = lista.contains(document.activeElement) ? document.activeElement.dataset.abrir : null;

    let html = "";
    if (filtro === "ativas") {
      const pendentes = MISSOES.permanentes.filter((m) => !vencidas[m.id]);
      html =
        pendentes.map((m) => cartaoMissao(m, vencidas)).join("") ||
        vazio("Você venceu todas as missões de código. Confira as DIÁRIAS!");
    } else if (filtro === "concluidas") {
      const feitas = [...MISSOES.permanentes, ...diarias].filter((m) => vencidas[m.id]);
      // Operações do RPG já vencidas, da mais recente para a mais antiga
      const operacoes = comRpg
        ? Regras.progresso.concluidas.map((id) => Regras.operacao(id)).filter(Boolean).reverse()
        : [];
      html =
        feitas.map((m) => cartaoMissao(m, vencidas)).join("") + operacoes.map(cartaoOperacao).join("") ||
        vazio("Nenhuma missão concluída ainda.");
    } else {
      html = diarias.map((m) => cartaoMissao(m, vencidas)).join("") + cartaoDesafiosRpg();
    }

    lista.innerHTML = html;
    if (cardRpg) cardRpg.hidden = filtro !== "ativas";
    atualizarResumo(vencidas, diarias);

    if (focado) {
      const botao = lista.querySelector(`[data-abrir="${CSS.escape(focado)}"]`);
      if (botao) botao.focus();
    }
  }

  // Linha de resumo: CAMPANHA 03/31 · DESAFIOS DE CÓDIGO 2/6 · DIÁRIAS 1/3
  function atualizarResumo(vencidas, diarias) {
    const partes = [];
    if (comRpg) {
      partes.push(`CAMPANHA ${doisDigitos(Regras.progresso.concluidas.length)}/${DADOS_RPG.operacoes.length}`);
    }
    partes.push(`DESAFIOS DE CÓDIGO ${MISSOES.permanentes.filter((m) => vencidas[m.id]).length}/${MISSOES.permanentes.length}`);
    partes.push(`DIÁRIAS ${diarias.filter((m) => vencidas[m.id]).length}/${diarias.length}`);
    const texto = partes.join(" · ");
    // Só troca quando muda, para o leitor de tela não repetir à toa
    if (resumo && resumo.textContent !== texto) resumo.textContent = texto;
  }

  function escolherFiltro(botao) {
    filtro = botao.dataset.filtro;
    botoesFiltro.forEach((b) => {
      const ativo = b === botao;
      b.classList.toggle("ativa", ativo);
      b.setAttribute("aria-pressed", String(ativo));
    });
    desenharLista();
  }

  botoesFiltro.forEach((botao) => botao.addEventListener("click", () => escolherFiltro(botao)));

  // Um só "ouvinte" para todos os botões ABRIR (os cards são redesenhados)
  lista.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-abrir]");
    if (botao) abrirMissao(botao.dataset.abrir, true);
  });

  // ==========================================================================
  // 5. TERMINAL E COMBATE
  // ==========================================================================
  const editor = document.getElementById("EDITOR-CODIGO");
  const areaEditor = document.getElementById("EDITOR-AREA");
  const realce = document.getElementById("REALCE-CODIGO");
  const comandoTerminal = document.getElementById("COMANDO-TERMINAL");
  const formatoTerminal = document.getElementById("FORMATO-TERMINAL");
  const objetivo = document.getElementById("OBJETIVO-MISSAO");
  const rotuloTerminal = document.getElementById("ROTULO-TERMINAL");
  const dica = document.getElementById("DICA-MISSAO");
  const painelCombate = document.querySelector(".painel.combate");
  const rotuloCombate = document.getElementById("ROTULO-COMBATE");
  const nomeAgente = document.getElementById("NOME-AGENTE");
  const vidaAgenteTexto = document.getElementById("VIDA-AGENTE");
  const barraAgente = document.getElementById("BARRA-AGENTE");
  const vidaInimigoTexto = document.getElementById("VIDA-INIMIGO");
  const barraInimigo = document.getElementById("BARRA-INIMIGO");
  const log = document.getElementById("LOG-COMBATE");
  const listaRecompensas = document.getElementById("LISTA-RECOMPENSAS");
  const statusRecompensa = document.getElementById("STATUS-RECOMPENSA");
  const botaoExecutar = document.getElementById("BOTAO-EXECUTAR");
  const botaoRestaurar = document.getElementById("BOTAO-RESTAURAR");

  let vidaAgente = VIDA_MAXIMA;
  let vidaInimigo = VIDA_MAXIMA;
  let turno = 1;
  let rodando = false; // evita dois cliques seguidos no EXECUTAR
  // Conta quantas vezes uma missão foi aberta: se o jogador abrir outra (ou
  // a mesma de novo) enquanto o código roda, o resultado antigo é ignorado
  let sessao = 0;

  // --- Realce de sintaxe (o mesmo do Modo Agente, em personagens/script.js) ---
  // Para cada linguagem, uma lista de [tipo do trecho, padrão]. A ordem
  // importa: comentários e textos vêm primeiro para "proteger" o conteúdo.
  const NUMERO = /\b\d+(?:\.\d+)?\b/;
  const FUNCAO = /\b[A-Za-z_]\w*(?=\()/;
  const REALCE = {
    html: [
      ["comentario", /<!--[\s\S]*?-->/],
      ["texto", /"[^"]*"/],
      ["tag", /<\/?[A-Za-z!][\w-]*|\/?>/],
      ["atributo", /\b[a-z-]+(?==)/],
    ],
    css: [
      ["comentario", /\/\*[\s\S]*?\*\//],
      ["texto", /"[^"]*"/],
      ["palavra", /@[\w-]+/],
      ["propriedade", /(?<=^\s+|\{\s*)[\w-]+(?=\s*:)/],
      ["numero", /#[0-9a-fA-F]{3,8}\b|-?\b\d+(?:\.\d+)?(?:px|rem|em|%|ms|s|deg|fr|vw|vh)?/],
      ["seletor", /[.#][A-Za-z][\w-]*/],
    ],
    javascript: [
      ["comentario", /\/\/.*/],
      ["texto", /"[^"]*"|'[^']*'|`[^`]*`/],
      ["palavra", /\b(?:const|let|var|function|return|if|else|for|of|in|while|true|false|null|undefined|new|class|typeof)\b/],
      ["numero", NUMERO],
      ["funcao", FUNCAO],
    ],
    python: [
      ["comentario", /#.*/],
      ["texto", /f?"[^"]*"|f?'[^']*'/],
      ["palavra", /\b(?:def|return|if|elif|else|for|in|while|True|False|None|and|or|not|import|from|class)\b/],
      ["numero", NUMERO],
      ["funcao", FUNCAO],
    ],
  };

  // Devolve o código em HTML, com cada trecho dentro de <span class="tk-...">
  function realcar(codigo, linguagem) {
    const regras = REALCE[linguagem] || [];
    if (!regras.length) return escapar(codigo);
    const padrao = new RegExp(regras.map(([, r]) => `(${r.source})`).join("|"), "gm");
    let saida = "";
    let ultimo = 0;
    let achado;

    while ((achado = padrao.exec(codigo))) {
      if (!achado[0]) {
        padrao.lastIndex++;
        continue;
      }
      // Descobre qual das regras encontrou o trecho
      const qual = achado.slice(1).findIndex((grupo) => grupo !== undefined);
      saida += escapar(codigo.slice(ultimo, achado.index));
      saida += `<span class="tk-${regras[qual][0]}">${escapar(achado[0])}</span>`;
      ultimo = achado.index + achado[0].length;
    }

    return saida + escapar(codigo.slice(ultimo));
  }

  // Desenha a camada de trás do editor: uma linha por vez, cada uma com o
  // número (feito pelo CSS) e as cores. Roda a cada tecla digitada.
  function desenharRealce() {
    realce.innerHTML = editor.value
      .split("\n")
      .map((linha) => `<span class="linha-codigo">${realcar(linha, aberta.linguagem) || " "}</span>`)
      .join("");
  }

  editor.addEventListener("input", desenharRealce);

  // Painel de combate: o agente é o líder da equipe do RPG
  function atualizarCombate() {
    rotuloCombate.textContent = `${aberta.titulo.toUpperCase()} · TURNO ${doisDigitos(turno)}`;

    let nome = "HTML";
    let nivel = 1;
    if (comRpg) {
      const id = Regras.progresso.equipe[0];
      nome = Regras.personagem(id) ? Regras.personagem(id).name : id;
      nivel = Regras.nivel(id);
    }
    nomeAgente.textContent = `${nome.toUpperCase()} · LV.${doisDigitos(nivel)}`;

    vidaAgenteTexto.textContent = `${vidaAgente}/${VIDA_MAXIMA}`;
    barraAgente.style.setProperty("--valor", `${(vidaAgente / VIDA_MAXIMA) * 100}%`);
    vidaInimigoTexto.textContent = `${vidaInimigo}/${VIDA_MAXIMA}`;
    barraInimigo.style.setProperty("--valor", `${(vidaInimigo / VIDA_MAXIMA) * 100}%`);
  }

  // Escreve uma linha no log (classe "erro" = vermelho, "ok" = verde).
  // textContent garante que o texto do jogador nunca vira HTML.
  function escreverLog(texto, classe = "") {
    const linha = document.createElement("li");
    if (classe) linha.className = classe;
    linha.textContent = `> ${texto}`;
    log.append(linha);
    while (log.children.length > 6) log.firstElementChild.remove();
  }

  // Itens da missão aberta e se eles já foram entregues
  function desenharRecompensas() {
    listaRecompensas.innerHTML = Object.entries(aberta.recompensas)
      .map(
        ([id, quantidade]) => `
          <li class="card recompensa">
            <p class="valor recompensa">${iconeItem(id)} +${quantidade}</p>
            <p class="rotulo sistema">${escapar(nomeItem(id).toUpperCase())}</p>
          </li>`,
      )
      .join("");

    const mensagens = {
      pendente: `${aberta.titulo.toUpperCase()}: CONCLUA A MISSÃO PARA RECEBER AS RECOMPENSAS`,
      "a-caminho": "MISSÃO VENCIDA: OS ITENS ENTRAM NA MOCHILA QUANDO VOCÊ ABRIR O RPG",
      "na-mochila": "RECOMPENSA JÁ ENTREGUE NA MOCHILA DO RPG",
    };
    statusRecompensa.textContent = mensagens[estadoDe(aberta.id)];
  }

  // Coloca uma missão no terminal e recomeça o combate
  function abrirMissao(id, focar = false) {
    const missao = buscarMissao(id);
    if (!missao) {
      // Passou da meia-noite com a página aberta: as diárias mudaram
      desenharLista();
      escreverLog("As diárias foram renovadas. Escolha uma missão da lista nova.");
      return;
    }
    aberta = missao;
    sessao++;
    vidaAgente = VIDA_MAXIMA;
    vidaInimigo = VIDA_MAXIMA;
    turno = 1;

    editor.value = missao.inicial;
    desenharRealce();
    areaEditor.classList.add("com-realce"); // agora o texto do campo pode ficar transparente
    objetivo.textContent = missao.objetivo;
    rotuloTerminal.textContent = `TERMINAL DE CÓDIGO · ${LINGUAGENS[missao.linguagem]}`;
    comandoTerminal.textContent = `bash - run/inspect --file ${ARQUIVOS[missao.linguagem]}`;
    formatoTerminal.textContent = `UTF-8 LF ${LINGUAGENS[missao.linguagem]}`;
    dica.innerHTML = `<span aria-hidden="true">◆</span> DICA: ${escapar(missao.dica)}`;

    log.innerHTML = "";
    escreverLog(`IA CORRUPTA bloqueou o setor: ${missao.titulo}.`, "erro");
    escreverLog("Sua vez: corrija o código e clique em EXECUTAR.", "ok");

    atualizarCombate();
    desenharRecompensas();
    desenharLista();

    // O foco vai para o objetivo (e não para o campo, para o teclado do
    // celular não abrir sozinho) e a tela rola até o combate
    if (focar) {
      objetivo.focus({ preventScroll: true });
      painelCombate.scrollIntoView({ behavior: semMovimento() ? "auto" : "smooth", block: "start" });
    }
  }

  // Primeira missão a aparecer: a primeira pendente (permanente ou diária)
  function missaoInicial() {
    const vencidas = lerVencidas();
    return (
      MISSOES.permanentes.find((m) => !vencidas[m.id]) ||
      missoesDoDia(diaDeHoje()).find((m) => !vencidas[m.id]) ||
      MISSOES.permanentes[0]
    );
  }

  function vencer(missao) {
    vidaInimigo = 0;
    escreverLog("IA CORRUPTA derrotada! Setor recuperado.", "ok");
    const anotacao = anotarVitoria(missao);
    if (anotacao === "nova") {
      escreverLog(`${textoRecompensas(missao.recompensas)} a caminho da mochila do RPG.`, "ok");
    } else if (anotacao === "repetida") {
      escreverLog("Missão já concluída antes: treino sem novos itens.");
    } else {
      escreverLog("Não consegui salvar a vitória neste navegador (armazenamento bloqueado ou cheio).", "erro");
    }
    desenharRecompensas();
    desenharLista();
  }

  function levarDano() {
    vidaAgente = Math.max(0, vidaAgente - DANO_POR_ERRO);
    escreverLog(`IA CORRUPTA contra-atacou: -${DANO_POR_ERRO} de vida.`, "erro");
    if (vidaAgente === 0) {
      vidaAgente = VIDA_MAXIMA;
      escreverLog("Seu agente caiu e foi reiniciado. O código continua aí: tente de novo!");
    }
  }

  async function executar() {
    if (rodando || !aberta) return;
    rodando = true;
    // aria-disabled (e não disabled): um botão desativado perde o foco do
    // teclado, e quem usa só o teclado teria que voltar até ele a cada tentativa
    botaoExecutar.setAttribute("aria-disabled", "true");
    const missao = aberta;
    const minhaSessao = sessao; // guarda: o jogador pode abrir outra missão enquanto o código roda

    try {
      const resultado = await verificar(missao, editor.value);
      if (minhaSessao !== sessao) return;
      resultado.linhas.forEach((linha) => escreverLog(linha.texto, linha.classe));
      if (resultado.ok) vencer(missao);
      else levarDano();
      turno++;
      atualizarCombate();
    } finally {
      rodando = false;
      botaoExecutar.removeAttribute("aria-disabled");
    }
  }

  botaoExecutar.addEventListener("click", executar);

  botaoRestaurar.addEventListener("click", () => {
    if (!aberta) return;
    editor.value = aberta.inicial;
    desenharRealce();
    escreverLog("Código restaurado.");
  });

  // ==========================================================================
  // 6. CONFERÊNCIA DO CÓDIGO
  // ==========================================================================
  // Cada conferência devolve { ok, linhas: [{ texto, classe }] }

  async function verificar(missao, codigo) {
    if (missao.regra.tipo === "html") return verificarHtml(codigo, missao.regra);
    if (missao.regra.tipo === "css") return verificarCss(codigo, missao.regra);
    return verificarSaida(codigo, missao.regra, missao.linguagem);
  }

  // --- HTML ---
  // Tags que não têm fechamento
  const TAGS_VAZIAS = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"];

  // O navegador "conserta" HTML errado sozinho (o código quebrado passaria).
  // Por isso, antes, uma pilha confere se cada tag fecha na ordem inversa
  // da abertura. Devolve a mensagem do problema ou null.
  function conferirFechamentos(codigo) {
    const semComentarios = codigo.replace(/<!--[\s\S]*?-->/g, "");
    const abertas = [];
    for (const [, barra, nomeDaTag, autoFechada] of semComentarios.matchAll(/<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
      const nome = nomeDaTag.toLowerCase();
      if (TAGS_VAZIAS.includes(nome) || autoFechada) continue;
      if (!barra) {
        abertas.push(nome);
        continue;
      }
      const ultima = abertas.pop();
      if (ultima === undefined) return `A tag </${nome}> fecha algo que não foi aberto.`;
      if (ultima !== nome) return `Você fechou </${nome}>, mas a última tag aberta foi <${ultima}>.`;
    }
    if (abertas.length) return `Faltou fechar <${abertas.pop()}>.`;
    return null;
  }

  function verificarHtml(codigo, regra) {
    const problema = conferirFechamentos(codigo);
    if (problema) return { ok: false, linhas: [{ texto: `✘ ${problema}`, classe: "erro" }] };

    // O DOMParser só lê o HTML: nenhum script do jogador é executado
    const documento = new DOMParser().parseFromString(codigo, "text/html");
    const linhas = [];
    let ok = true;

    regra.elementos.forEach(({ tag, pai, texto }) => {
      const encontrados = [...documento.body.querySelectorAll(tag)];
      const noPaiCerto = (el) => !pai || (el.parentElement && el.parentElement.localName === pai);
      const comTextoCerto = (el) => texto === undefined || textoNormal(el.textContent) === texto;

      if (encontrados.some((el) => noPaiCerto(el) && comTextoCerto(el))) {
        linhas.push({ texto: `✔ <${tag}> ${pai ? `dentro de <${pai}>` : "encontrado"}`, classe: "ok" });
        return;
      }
      ok = false;
      if (!encontrados.length) linhas.push({ texto: `✘ Falta a tag <${tag}>.`, classe: "erro" });
      else if (!encontrados.some(noPaiCerto)) linhas.push({ texto: `✘ <${tag}> precisa ficar dentro de <${pai}>.`, classe: "erro" });
      else linhas.push({ texto: `✘ O texto de <${tag}> precisa ser exatamente "${texto}".`, classe: "erro" });
    });

    return { ok, linhas };
  }

  // --- CSS ---
  // Nomes diferentes para a mesma propriedade
  const APELIDOS_CSS = { "background-color": "background", "grid-gap": "gap" };

  // Lê as propriedades de um seletor: ".quadrado { display: grid; }" →
  // { display: "grid" }. Se o seletor aparecer duas vezes, vale a última
  // declaração (como no CSS de verdade).
  function lerCss(codigo, seletor) {
    const semComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "");
    const aberturas = (semComentarios.match(/{/g) || []).length;
    const fechamentos = (semComentarios.match(/}/g) || []).length;
    if (aberturas !== fechamentos) return { erro: "As chaves { } não estão fechadas direito." };

    const propriedades = {};
    let achou = false;
    for (const [, seletores, corpo] of semComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!seletores.split(",").some((s) => s.trim() === seletor)) continue;
      achou = true;
      corpo.split(";").forEach((declaracao) => {
        const doisPontos = declaracao.indexOf(":");
        if (doisPontos === -1) return;
        const nome = declaracao.slice(0, doisPontos).trim().toLowerCase();
        const valor = textoNormal(declaracao.slice(doisPontos + 1).replace(/!important/i, "")).toLowerCase();
        propriedades[APELIDOS_CSS[nome] || nome] = valor;
      });
    }
    if (!achou) return { erro: `Não encontrei o seletor ${seletor}.` };
    return { propriedades };
  }

  function verificarCss(codigo, regra) {
    const lido = lerCss(codigo, regra.seletor);
    if (lido.erro) return { ok: false, linhas: [{ texto: `✘ ${lido.erro}`, classe: "erro" }] };

    const linhas = [];
    let ok = true;
    Object.entries(regra.propriedades).forEach(([nome, esperado]) => {
      const valor = lido.propriedades[nome];
      const certo =
        valor !== undefined &&
        (esperado instanceof RegExp ? esperado.test(valor) : valor === String(esperado).toLowerCase());
      if (certo) {
        linhas.push({ texto: `✔ ${nome}: ${valor}`, classe: "ok" });
        return;
      }
      ok = false;
      linhas.push({
        texto: valor === undefined ? `✘ Falta a propriedade ${nome}.` : `✘ ${nome} está "${valor}": confira o objetivo.`,
        classe: "erro",
      });
    });
    return { ok, linhas };
  }

  // --- JavaScript e Python (saída no console) ---
  // Código que roda dentro de um Worker: uma "sala separada" do navegador,
  // onde o código do jogador não alcança a página e pode ser parado a
  // qualquer momento (protege contra loop infinito)
  const CODIGO_DO_WORKER = `
    onmessage = (e) => {
      const saida = [];
      const console = {
        log: (...valores) =>
          saida.push(valores.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(" ")),
      };
      try {
        new Function("console", e.data)(console);
        postMessage({ saida });
      } catch (erro) {
        postMessage({ saida, erro: erro instanceof Error ? erro.name + ": " + erro.message : "Erro: " + String(erro) });
      }
    };`;
  let enderecoWorker = null;

  function rodarCodigo(codigo) {
    return new Promise((resolver) => {
      let worker;
      try {
        enderecoWorker = enderecoWorker || URL.createObjectURL(new Blob([CODIGO_DO_WORKER], { type: "text/javascript" }));
        worker = new Worker(enderecoWorker);
      } catch (erro) {
        resolver(rodarSemWorker(codigo));
        return;
      }

      const limite = setTimeout(() => {
        worker.terminate();
        resolver({ saida: [], erro: "Demorou demais: será um loop infinito?" });
      }, TEMPO_LIMITE);

      worker.onmessage = (e) => {
        clearTimeout(limite);
        worker.terminate();
        // O código do jogador também pode chamar postMessage: confere a resposta
        const resposta = e.data;
        if (resposta && Array.isArray(resposta.saida)) resolver(resposta);
        else resolver({ saida: [], erro: "O código enviou uma resposta inesperada." });
      };
      worker.onerror = (e) => {
        e.preventDefault();
        clearTimeout(limite);
        worker.terminate();
        resolver({ saida: [], erro: e.message || "Erro ao rodar o código." });
      };
      worker.postMessage(codigo);
    });
  }

  // Plano B, para navegador sem Worker: roda aqui mesmo (sem como parar um loop)
  function rodarSemWorker(codigo) {
    const saida = [];
    const aviso = "Atenção: este navegador não isolou o código; um loop infinito pode travar a aba.";
    const console = {
      log: (...valores) =>
        saida.push(valores.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(" ")),
    };
    try {
      new Function("console", codigo)(console);
      return { saida, aviso };
    } catch (erro) {
      return { saida, aviso, erro: erro instanceof Error ? `${erro.name}: ${erro.message}` : `Erro: ${erro}` };
    }
  }

  // "Python simplificado": o navegador não roda Python, então print, sum e
  // len viram funções JavaScript e os comentários # são apagados.
  // Dá conta de variáveis, listas, contas, print(), sum() e len().
  function pythonParaJs(codigo) {
    const ajudantes =
      "var print = (...v) => console.log(...v);\n" +
      "var sum = (lista) => lista.reduce((a, b) => a + b, 0);\n" +
      "var len = (lista) => lista.length;\n";
    return ajudantes + codigo.replace(/#.*$/gm, "");
  }

  async function verificarSaida(codigo, regra, linguagem) {
    const js = linguagem === "python" ? pythonParaJs(codigo) : codigo;
    const { saida, erro, aviso } = await rodarCodigo(js);
    // Mostra no log só as 3 últimas linhas impressas
    const linhas = saida.slice(-3).map((texto) => ({ texto: `saída: ${texto}` }));
    if (aviso) linhas.unshift({ texto: aviso, classe: "erro" });

    if (erro) {
      linhas.push({ texto: `✘ ${erro}`, classe: "erro" });
      if (linguagem === "python") {
        linhas.push({ texto: "Este terminal entende um Python simplificado: variáveis, listas, print() e sum()." });
      }
      return { ok: false, linhas };
    }

    const ultima = saida.length ? saida[saida.length - 1].trim() : undefined;
    if (ultima === String(regra.esperado)) {
      linhas.push({ texto: `✔ Saída correta: ${ultima}`, classe: "ok" });
      return { ok: true, linhas };
    }
    linhas.push({
      texto: ultima === undefined ? "✘ Nada foi impresso no console." : `✘ A saída foi ${ultima}: confira o objetivo.`,
      classe: "erro",
    });
    return { ok: false, linhas };
  }

  // ==========================================================================
  // 7. ATUALIZAR QUANDO OUTRA ABA MUDAR O PROGRESSO
  // ==========================================================================
  // O RPG avançou em outra aba (ou a página voltou pelo botão "voltar"):
  // atualiza cards, lista e recompensas sem apagar o código do terminal
  function ressincronizar() {
    if (comRpg) Regras.recarregar();
    desenharMissaoRpg();
    desenharLista();
    if (aberta) {
      atualizarCombate();
      desenharRecompensas();
    }
  }
  window.addEventListener("storage", (e) => {
    if (["cw_rpg_progresso", "cw_progresso_agentes", CHAVE_VENCIDAS].includes(e.key)) ressincronizar();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) ressincronizar();
  });

  // Primeiro desenho da tela
  desenharMissaoRpg();
  abrirMissao(missaoInicial().id);
})();
