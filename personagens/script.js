/**
 * CODEWORLD // personagens/script.js
 * Interações exclusivas da tela PERSONAGENS.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js;
 *  os textos das lições ficam em dados.js)
 *
 *   1. Progresso salvo (localStorage)
 *   2. Imagem do agente (ou espaço reservado)
 *   3. Realce de sintaxe do terminal
 *   4. Cartões dos agentes e contador
 *   5. Filtros
 *   6. Modo Agente (janela com os 5 níveis)
 *   7. Mini desafio (perguntas)
 *
 * Regras do Modo Agente:
 *   - Cada agente tem 5 níveis, liberados um por vez.
 *   - Um nível só é concluído quando TODAS as perguntas forem acertadas.
 *   - O próximo agente só é desbloqueado quando os 5 níveis do anterior
 *     estiverem concluídos.
 */

// Este código roda assim que o arquivo é lido (os scripts com defer rodam
// antes do evento DOMContentLoaded). Assim os cartões já existem quando o
// base.js procura os elementos para animar.
(() => {
  const root = document.documentElement;
  const lista = document.getElementById("LISTA-AGENTES");
  if (!lista || typeof AGENTES === "undefined") return;

  const TOTAL_NIVEIS = 5;
  const CHAVE_PROGRESSO = "cw_progresso_agentes";
  const LETRAS = ["A", "B", "C", "D"];

  const doisDigitos = (n) => String(n).padStart(2, "0");

  // Escapa texto para ser colocado dentro do HTML com segurança
  const escapar = (texto) =>
    String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Escapa e destaca trechos de código como <main> dentro de um texto
  const textoComCodigo = (texto) =>
    escapar(texto).replace(/&lt;[^&]*?&gt;/g, (tag) => `<code>${tag}</code>`);

  const iconeCadeado = '<span class="icone-cadeado" aria-hidden="true"></span>';

  // ==========================================================================
  // 1. PROGRESSO SALVO (LOCALSTORAGE)
  // ==========================================================================
  // Guarda quantos níveis cada agente já concluiu: { html: 5, css: 2 }
  let progresso = lerProgresso();

  function lerProgresso() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_PROGRESSO)) || {};
    } catch (erro) {
      return {};
    }
  }

  function salvarProgresso() {
    try {
      localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
    } catch (erro) {}
  }

  const indiceDe = (id) => AGENTES.findIndex((a) => a.id === id);
  const concluidos = (agente) => Math.min(progresso[agente.id] || 0, TOTAL_NIVEIS);
  const completo = (agente) => concluidos(agente) >= TOTAL_NIVEIS;
  const desbloqueado = (i) => i === 0 || completo(AGENTES[i - 1]);
  const porcentagem = (agente) => Math.round((concluidos(agente) / TOTAL_NIVEIS) * 100);
  const xpDoNivel = (nivel) => (nivel + 1) * 100;

  // ==========================================================================
  // 2. IMAGEM DO AGENTE
  // ==========================================================================
  // Enquanto as imagens não forem escolhidas, aparece um espaço reservado.
  // Para colocar a imagem, preencha o campo "imagem" do agente no dados.js
  // (ex.: imagem: "../img/agente-html.png").
  function criarImagem(agente) {
    if (agente.imagem) {
      return `<img class="imagem-agente" src="${agente.imagem}" alt="Imagem do agente ${agente.nome}" />`;
    }
    return `
      <span class="sem-imagem">
        <span class="icone-imagem" aria-hidden="true"></span>
        <span class="texto">IMAGEM EM BREVE</span>
      </span>`;
  }

  // ==========================================================================
  // 3. REALCE DE SINTAXE DO TERMINAL
  // ==========================================================================
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
    js: [
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
    java: [
      ["comentario", /\/\/.*/],
      ["texto", /"[^"]*"|'[^']*'/],
      ["palavra", /\b(?:public|private|protected|class|static|void|int|double|boolean|char|return|if|else|for|while|new|this|true|false|null)\b/],
      ["tipo", /\b[A-Z]\w*/],
      ["numero", NUMERO],
      ["funcao", FUNCAO],
    ],
    kotlin: [
      ["comentario", /\/\/.*/],
      ["texto", /"[^"]*"/],
      ["palavra", /\b(?:fun|val|var|return|if|else|when|for|in|while|class|data|null|true|false|is)\b/],
      ["tipo", /\b[A-Z]\w*/],
      ["numero", NUMERO],
      ["funcao", FUNCAO],
    ],
  };

  function realcar(codigo, linguagem) {
    const regras = REALCE[linguagem] || [];
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

  // ==========================================================================
  // 4. CARTÕES DOS AGENTES E CONTADOR
  // ==========================================================================
  // "animarBarra": na primeira montagem a barra começa vazia e o base.js a
  // enche quando aparece na tela; nas atualizações ela já nasce cheia.
  function conteudoCartao(agente, i, animarBarra) {
    const liberado = desbloqueado(i);
    const pct = porcentagem(agente);
    const classeBarra = animarBarra ? "" : " visivel";

    let selo = `<p class="selo funcao">${agente.funcao}</p>`;
    if (!liberado) selo = `<p class="selo bloqueado">${iconeCadeado} BLOQUEADO</p>`;
    else if (completo(agente)) selo = '<p class="selo status">CONCLUÍDO</p>';

    const anterior = AGENTES[i - 1];

    return `
      <div class="topo agente">
        <p class="rotulo sistema">ID-${agente.numero}</p>
        ${selo}
      </div>
      <div class="tela sprite">
        ${criarImagem(agente)}
        ${liberado ? "" : `<span class="trava" aria-hidden="true">${iconeCadeado}</span>`}
      </div>
      <h3>${agente.nome}</h3>
      <p class="funcao agente">${agente.funcao}</p>
      <div class="nivel agente">
        <span class="lv">LV. ${liberado ? doisDigitos(concluidos(agente)) : "--"}</span>
        <span class="xp">XP: ${liberado ? pct + "%" : "BLOQUEADO"}</span>
      </div>
      <div class="barra progresso">
        <div class="preenchimento progresso${classeBarra}" style="--valor: ${liberado ? pct : 0}%"></div>
      </div>
      ${
        liberado
          ? `<button type="button" class="abrir agente" data-abrir="${agente.id}" aria-label="Abrir Modo Agente: ${agente.nome}">
               <span aria-hidden="true">→</span>
             </button>`
          : `<button type="button" class="abrir agente" disabled aria-label="${agente.nome} bloqueado: conclua os 5 níveis de ${anterior.nome}">
               ${iconeCadeado}
             </button>`
      }`;
  }

  function classesCartao(li, i) {
    const agente = AGENTES[i];
    li.classList.toggle("bloqueado", !desbloqueado(i));
    li.classList.toggle("ativo", desbloqueado(i) && !completo(agente));
    li.classList.toggle("concluido", completo(agente));
  }

  function montarCartoes() {
    AGENTES.forEach((agente, i) => {
      const li = document.createElement("li");
      li.className = "card agente";
      li.dataset.agente = agente.id;
      li.dataset.indice = i;
      li.style.setProperty("--cor", agente.cor); // cor do brilho da moldura
      li.innerHTML = conteudoCartao(agente, i, true);
      classesCartao(li, i);
      lista.appendChild(li);
    });
  }

  function atualizarCartoes() {
    lista.querySelectorAll(".card.agente").forEach((li) => {
      const i = Number(li.dataset.indice);
      li.innerHTML = conteudoCartao(AGENTES[i], i, false);
      classesCartao(li, i);
    });
  }

  // Contador "01 / 06" e barra da coluna lateral
  function atualizarContador() {
    const total = AGENTES.length;
    const ativos = AGENTES.filter((a, i) => desbloqueado(i)).length;
    const pct = Math.floor((ativos / total) * 1000) / 10;

    document.getElementById("CONTAGEM-AGENTES").textContent =
      `${doisDigitos(ativos)} / ${doisDigitos(total)}`;
    document.getElementById("BARRA-AGENTES").style.setProperty("--valor", pct + "%");
    document.getElementById("TEXTO-PROGRESSO").textContent =
      `${pct}% DO BANCO DE DADOS DESCOBERTO`;
  }

  montarCartoes();
  atualizarContador();

  // Clique no cartão (ou no botão) abre o Modo Agente
  lista.addEventListener("click", (e) => {
    const cartao = e.target.closest(".card.agente");
    if (!cartao || cartao.classList.contains("bloqueado")) return;
    abrirModal(cartao.dataset.agente);
  });

  // ==========================================================================
  // 5. FILTROS
  // ==========================================================================
  const filtros = document.getElementById("FILTROS");
  const semResultados = document.getElementById("SEM-RESULTADOS");

  function statusDoAgente(i) {
    if (!desbloqueado(i)) return "bloqueado";
    return completo(AGENTES[i]) ? "concluido" : "desbloqueado";
  }

  function aplicarFiltros() {
    const funcao = filtros.funcao.value;
    const status = filtros.status.value;
    const ordem = filtros.ordem.value;
    const cartoes = [...lista.querySelectorAll(".card.agente")];

    // Mostra / esconde
    let visiveis = 0;
    cartoes.forEach((li) => {
      const i = Number(li.dataset.indice);
      const st = statusDoAgente(i);
      const passaFuncao = funcao === "todos" || AGENTES[i].funcao === funcao;
      // "Desbloqueados" inclui também os que já foram concluídos
      const passaStatus =
        status === "todos" ||
        st === status ||
        (status === "desbloqueado" && st === "concluido");
      li.hidden = !(passaFuncao && passaStatus);
      if (!li.hidden) visiveis++;
    });
    semResultados.hidden = visiveis > 0;

    // Ordena movendo os cartões dentro da lista
    const nivel = (li) => {
      const i = Number(li.dataset.indice);
      return desbloqueado(i) ? concluidos(AGENTES[i]) : -1;
    };
    const comparar = {
      id: (a, b) => a.dataset.indice - b.dataset.indice,
      "nivel-maior": (a, b) => nivel(b) - nivel(a) || a.dataset.indice - b.dataset.indice,
      "nivel-menor": (a, b) => nivel(a) - nivel(b) || a.dataset.indice - b.dataset.indice,
      nome: (a, b) =>
        AGENTES[a.dataset.indice].nome.localeCompare(AGENTES[b.dataset.indice].nome),
    }[ordem];

    cartoes.sort(comparar).forEach((li) => lista.appendChild(li));
  }

  filtros.addEventListener("change", aplicarFiltros);
  filtros.addEventListener("submit", (e) => e.preventDefault());
  // O "reset" do formulário volta os selects ao padrão; depois refiltramos
  filtros.addEventListener("reset", () => setTimeout(aplicarFiltros));

  document.getElementById("REINICIAR").addEventListener("click", () => {
    const ok = window.confirm(
      "Apagar todo o progresso dos agentes? Apenas o HTML ficará desbloqueado.",
    );
    if (!ok) return;
    progresso = {};
    respostas = {};
    salvarProgresso();
    atualizarCartoes();
    atualizarContador();
    aplicarFiltros();
  });

  // ==========================================================================
  // 6. MODO AGENTE (JANELA COM OS 5 NÍVEIS)
  // ==========================================================================
  const modal = document.getElementById("MODAL-AGENTE");
  const atual = { agente: null, nivel: 0 };
  let cursorEstavaAtivo = false;
  let temporizadorAviso;

  // Respostas dadas nesta visita: { "html-0": [{ certa, erradas, ordem }, ...] }
  // "ordem" embaralha as alternativas para a resposta certa não ficar
  // sempre na mesma letra
  let respostas = {};

  function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function estadoDoNivel(agente, nivel) {
    const chave = `${agente.id}-${nivel}`;
    if (!respostas[chave]) {
      respostas[chave] = agente.niveis[nivel].questoes.map((questao) => ({
        certa: false,
        erradas: [],
        ordem: embaralhar(questao.opcoes.map((opcao, k) => k)),
      }));
    }
    return respostas[chave];
  }

  function abrirModal(id, nivel) {
    const i = indiceDe(id);
    if (i < 0 || !desbloqueado(i)) return;

    const agente = AGENTES[i];
    atual.agente = agente;
    // Sem nível informado, abre no primeiro nível ainda não concluído
    atual.nivel = nivel ?? Math.min(concluidos(agente), TOTAL_NIVEIS - 1);

    renderizarModal();
    modal.scrollTop = 0;

    if (!modal.open) {
      // A janela fica numa camada acima de tudo, inclusive do cursor
      // customizado: enquanto ela está aberta, volta o cursor normal
      cursorEstavaAtivo = root.classList.contains("cursor-ativo");
      root.classList.remove("cursor-ativo");
      root.classList.add("modal-aberto");
      modal.showModal();
    }
    history.replaceState(null, "", `#agente-${agente.id}`);
  }

  modal.addEventListener("close", () => {
    root.classList.remove("modal-aberto");
    if (cursorEstavaAtivo) root.classList.add("cursor-ativo");
    history.replaceState(null, "", location.pathname);
  });

  // Clique fora da janela (no fundo escurecido) também fecha
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  // --- Partes da janela ---
  function htmlFicha() {
    const a = atual.agente;
    const pct = porcentagem(a);
    return `
      <figure class="canvas sprite">
        <p class="rotulo sistema">HUD_IMAGE_CANVAS :: AGENTE_${a.numero}</p>
        <div class="palco sprite">${criarImagem(a)}</div>
        <p class="rotulo sistema fps">FPS: 60 SYNC</p>
        <figcaption>
          <span>SERIAL: ${a.serial}</span>
          <span class="sintonia">${pct}% SINTONIZADO</span>
        </figcaption>
      </figure>
      <div class="dados ficha">
        <ul class="etiquetas" aria-label="Informações do agente">
          <li class="etiqueta">ID-${a.numero}</li>
          <li class="etiqueta funcao">${a.funcao.toUpperCase()}</li>
          <li class="etiqueta estado">${completo(a) ? "CONCLUÍDO" : "ATIVO / DESBLOQUEADO"}</li>
          <li class="etiqueta afinidade">AFINIDADE: ${a.afinidade}</li>
        </ul>
        <h3 class="nome agente">${a.nome}</h3>
        <p class="descricao agente">${a.descricao}</p>
        <div class="progresso agente">
          <p class="rotulo sistema">
            NÍVEIS CONCLUÍDOS: <strong>${concluidos(a)} / ${TOTAL_NIVEIS}</strong>
          </p>
          <div class="barra progresso">
            <div class="preenchimento progresso visivel" style="--valor: ${pct}%"></div>
          </div>
        </div>
      </div>`;
  }

  function htmlNiveis() {
    const a = atual.agente;
    return a.niveis
      .map((nivel, i) => {
        const feito = i < concluidos(a);
        const liberado = i <= concluidos(a);
        const ehAtual = i === atual.nivel;
        const estado = feito ? "feito" : liberado ? "liberado" : "travado";
        const icone = feito ? "✓" : liberado ? "●" : iconeCadeado;
        return `
          <li>
            <button type="button" class="botao-nivel ${estado}${ehAtual ? " atual" : ""}"
              data-ir-nivel="${i}" ${liberado ? "" : "disabled"}
              ${ehAtual ? 'aria-current="step"' : ""}
              aria-label="Nível ${i + 1}: ${nivel.titulo}${feito ? " (concluído)" : liberado ? "" : " (bloqueado)"}">
              <span class="numero">NV.${doisDigitos(i + 1)}</span>
              <span class="titulo">${nivel.titulo}</span>
              <span class="estado" aria-hidden="true">${icone}</span>
            </button>
          </li>`;
      })
      .join("");
  }

  function htmlQuestao(questao, q, estado, nivelFeito) {
    const resolvida = nivelFeito || estado.certa;
    const opcoes = estado.ordem
      .map((k, posicao) => {
        const opcao = questao.opcoes[k];
        let classe = "";
        if (resolvida && k === questao.correta) classe = " certa";
        else if (estado.erradas.includes(k)) classe = " errada";
        const travada = resolvida || estado.erradas.includes(k);
        return `
          <button type="button" class="opcao-questao${classe}" data-opcao="${k}" ${travada ? "disabled" : ""}>
            <span class="letra" aria-hidden="true">${LETRAS[posicao]}</span>
            <span class="texto-opcao">${escapar(opcao)}</span>
            <span class="marcador" aria-hidden="true"></span>
          </button>`;
      })
      .join("");

    const retorno = resolvida
      ? `<span class="ok">✓ CORRETO.</span> ${textoComCodigo(questao.explicacao)}`
      : "";

    return `
      <div class="questao${resolvida ? " resolvida" : ""}" data-questao="${q}">
        <p class="rotulo sistema">TESTE DE DIAGNÓSTICO #${doisDigitos(atual.nivel + 1)}${q + 1}</p>
        <p class="pergunta">${textoComCodigo(questao.pergunta)}</p>
        <div class="opcoes-questao" role="group" aria-label="Opções da pergunta ${q + 1}">
          ${opcoes}
        </div>
        <p class="retorno" aria-live="polite">${retorno}</p>
      </div>`;
  }

  function htmlConteudo() {
    const a = atual.agente;
    const n = atual.nivel;
    const nivel = a.niveis[n];
    const nivelFeito = n < concluidos(a);
    const estado = estadoDoNivel(a, n);

    const linhas = realcar(nivel.codigo, a.linguagem)
      .split("\n")
      .map((linha) => `<span class="linha-codigo">${linha || " "}</span>`)
      .join("");

    const conceitos = nivel.conceitos
      .map(
        (c) => `
        <li class="conceito">
          <div class="conceito-topo">
            <span class="icone" aria-hidden="true">◆</span>
            <span class="tag">${escapar(c.tag)}</span>
          </div>
          <h5>${textoComCodigo(c.titulo)}</h5>
          <p>${textoComCodigo(c.texto)}</p>
        </li>`,
      )
      .join("");

    const questoes = nivel.questoes
      .map((questao, q) => htmlQuestao(questao, q, estado[q], nivelFeito))
      .join("");

    return `
      <section class="secao modal" aria-labelledby="SECAO-NUCLEO">
        <div class="titulo secao">
          <h4 id="SECAO-NUCLEO">
            <span class="marca">SEÇÃO 01 // NÚCLEO</span>
            ${nivel.titulo}: ${a.arquivo}
          </h4>
          <span class="rotulo sistema info">&lt;&gt; SYNTAX_HIGHLIGHT: ${a.linguagem.toUpperCase()}</span>
        </div>
        <p class="resumo nivel">${textoComCodigo(nivel.resumo)}</p>
        <div class="terminal codigo">
          <div class="terminal-barra">
            <span class="luzes" aria-hidden="true"><i></i><i></i><i></i></span>
            <code class="comando">bash - run/inspect --file ${a.arquivo}</code>
            <span class="rotulo sistema">UTF-8 LF ${a.linguagem.toUpperCase()}</span>
          </div>
          <pre tabindex="0" aria-label="Código de exemplo"><code>${linhas}</code></pre>
        </div>
      </section>

      <section class="secao modal" aria-labelledby="SECAO-CONCEITOS">
        <div class="titulo secao">
          <h4 id="SECAO-CONCEITOS">
            <span class="marca">SEÇÃO 02 // REGRAS CRÍTICAS</span>
            Estruturas &amp; Diretrizes
          </h4>
        </div>
        <ul class="grade conceitos">${conceitos}</ul>
      </section>

      <section class="secao modal desafio" aria-labelledby="SECAO-DESAFIO">
        <div class="titulo secao">
          <h4 id="SECAO-DESAFIO">
            <span class="marca">SEÇÃO 03 // PROTOCOLO DE COMBATE</span>
            Mini Desafio do Agente
          </h4>
          <span class="recompensa${nivelFeito ? " obtida" : ""}">
            ${nivelFeito ? "✓ RECOMPENSA OBTIDA" : "⚡ RECOMPENSA"}: +${xpDoNivel(n)} XP
          </span>
        </div>
        <p class="instrucao">Acerte <strong>todas</strong> as perguntas para concluir o nível.</p>
        <div class="questoes">${questoes}</div>
      </section>`;
  }

  function htmlRodape() {
    const a = atual.agente;
    const n = atual.nivel;
    const proximo = AGENTES[indiceDe(a.id) + 1];
    const podeAvancar = n < concluidos(a);

    let botoes = "";
    if (n < TOTAL_NIVEIS - 1) {
      botoes += `
        <button type="button" class="botao-modal proximo-nivel" data-ir-nivel="${n + 1}"
          ${podeAvancar ? "" : "disabled"}
          title="${podeAvancar ? "" : "Acerte todas as perguntas para liberar"}">
          <span aria-hidden="true">⚡</span> PRÓXIMO NÍVEL <span aria-hidden="true">→</span>
        </button>`;
    }
    if (proximo) {
      botoes += `
        <button type="button" class="botao-modal proximo-agente" data-ir-agente="${proximo.id}"
          ${completo(a) ? "" : "disabled"}
          title="${completo(a) ? "" : `Conclua os 5 níveis de ${a.nome} para desbloquear`}">
          ${completo(a) ? "" : iconeCadeado}
          PRÓXIMO AGENTE: ${proximo.nome.toUpperCase()} <span aria-hidden="true">→</span>
        </button>`;
    }

    return `
      <button type="button" class="botao-modal voltar" data-fechar>
        <span aria-hidden="true">←</span> VOLTAR PARA GRADE DE AGENTES
      </button>
      <div class="acoes modal">${botoes}</div>`;
  }

  function renderizarModal() {
    const a = atual.agente;
    modal.innerHTML = `
      <div class="modal-moldura" style="--cor: ${a.cor}">
        <header class="modal-topo">
          <span class="icone terminal" aria-hidden="true">&gt;_</span>
          <div>
            <p class="rotulo sistema">MODAL_VIEWPORT / <span class="ciano">AGENT_INSPECTOR.EXE</span></p>
            <h2 id="MODAL-TITULO">ID-${a.numero} // ${a.papel.toUpperCase()}</h2>
          </div>
          <button type="button" class="fechar modal" data-fechar aria-label="Fechar Modo Agente">
            <span aria-hidden="true">✕</span> <span class="texto">FECHAR</span>
          </button>
        </header>

        <div class="aviso conquista" role="status" aria-live="polite"></div>

        <div class="janela">
          <div class="janela-barra">
            <span class="luzes" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="nome-arquivo" data-parte="arquivo"></span>
            <span class="memoria">RAM: 42MB</span>
            <span class="arquivo-fonte">ARQUIVO_FONTE: <code>${a.arquivo}</code></span>
          </div>

          <div class="ficha" data-parte="ficha"></div>

          <nav class="niveis" aria-label="Níveis do agente">
            <ol data-parte="niveis"></ol>
          </nav>

          <div class="conteudo nivel" data-parte="conteudo"></div>
        </div>

        <footer class="modal-rodape" data-parte="rodape"></footer>
        <p class="rotulo sistema salvo">
          <span class="luz online" aria-hidden="true"></span>
          PROGRESSO SALVO NESTE NAVEGADOR
        </p>
      </div>`;
    atualizarPartes(["arquivo", "ficha", "niveis", "conteudo", "rodape"]);
  }

  // Redesenha só as partes pedidas (assim as respostas não somem)
  function atualizarPartes(partes) {
    const a = atual.agente;
    const html = {
      arquivo: () => `FICHA_DETALHADA_${a.id.toUpperCase()}_V${atual.nivel + 1}.EXE`,
      ficha: htmlFicha,
      niveis: htmlNiveis,
      conteudo: htmlConteudo,
      rodape: htmlRodape,
    };
    partes.forEach((parte) => {
      const alvo = modal.querySelector(`[data-parte="${parte}"]`);
      if (alvo) alvo.innerHTML = html[parte]();
    });
  }

  function irParaNivel(nivel) {
    const a = atual.agente;
    if (nivel < 0 || nivel >= TOTAL_NIVEIS || nivel > concluidos(a)) return;
    atual.nivel = nivel;
    atualizarPartes(["arquivo", "niveis", "conteudo", "rodape"]);

    const conteudo = modal.querySelector('[data-parte="conteudo"]');
    conteudo.classList.remove("trocando");
    void conteudo.offsetWidth; // reinicia a animação de troca
    conteudo.classList.add("trocando");
    modal.querySelector(".niveis").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // Botões da janela (delegação de eventos)
  modal.addEventListener("click", (e) => {
    const alvo = e.target.closest("button");
    if (!alvo || alvo.disabled) return;

    if (alvo.hasAttribute("data-fechar")) modal.close();
    else if (alvo.dataset.irNivel) irParaNivel(Number(alvo.dataset.irNivel));
    else if (alvo.dataset.irAgente) {
      abrirModal(alvo.dataset.irAgente, 0);
      modal.querySelector(".modal-moldura").classList.add("trocando");
    } else if (alvo.classList.contains("opcao-questao")) responder(alvo);
  });

  // Mostra uma mensagem de conquista no topo da janela
  function avisar(titulo, texto) {
    const aviso = modal.querySelector(".aviso.conquista");
    if (!aviso) return;
    aviso.innerHTML = `<strong>${titulo}</strong><span>${texto}</span>`;
    aviso.classList.remove("visivel");
    void aviso.offsetWidth;
    aviso.classList.add("visivel");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 4000);
  }

  // ==========================================================================
  // 7. MINI DESAFIO (PERGUNTAS)
  // ==========================================================================
  function responder(botao) {
    const a = atual.agente;
    const n = atual.nivel;
    const caixa = botao.closest(".questao");
    const q = Number(caixa.dataset.questao);
    const k = Number(botao.dataset.opcao);
    const questao = a.niveis[n].questoes[q];
    const estado = estadoDoNivel(a, n)[q];
    const retorno = caixa.querySelector(".retorno");

    if (k === questao.correta) {
      estado.certa = true;
      botao.classList.add("certa");
      caixa.classList.add("resolvida");
      caixa.querySelectorAll(".opcao-questao").forEach((b) => (b.disabled = true));
      retorno.innerHTML = `<span class="ok">✓ CORRETO.</span> ${textoComCodigo(questao.explicacao)}`;
      verificarNivel();
    } else {
      estado.erradas.push(k);
      botao.classList.add("errada");
      botao.disabled = true;
      caixa.classList.remove("tremendo");
      void caixa.offsetWidth;
      caixa.classList.add("tremendo");
      retorno.innerHTML =
        '<span class="erro">✗ RESPOSTA INCORRETA.</span> Revise os conceitos acima e tente outra opção.';
    }
  }

  // O nível só conta como concluído quando todas as perguntas foram acertadas
  function verificarNivel() {
    const a = atual.agente;
    const n = atual.nivel;
    const todasCertas = estadoDoNivel(a, n).every((q) => q.certa);
    if (!todasCertas || n < concluidos(a)) return;

    progresso[a.id] = n + 1;
    salvarProgresso();
    atualizarCartoes();
    atualizarContador();
    aplicarFiltros();
    atualizarPartes(["ficha", "niveis", "rodape"]);

    const recompensa = modal.querySelector(".recompensa");
    if (recompensa) {
      recompensa.classList.add("obtida");
      recompensa.textContent = `✓ RECOMPENSA OBTIDA: +${xpDoNivel(n)} XP`;
    }

    const proximo = AGENTES[indiceDe(a.id) + 1];
    if (completo(a)) {
      avisar(
        `AGENTE ${a.nome.toUpperCase()} CONCLUÍDO`,
        proximo
          ? `Novo agente desbloqueado: ${proximo.nome}!`
          : "Todos os agentes foram dominados. O núcleo da Super IA espera por você.",
      );
    } else {
      avisar(
        `NÍVEL ${n + 1} CONCLUÍDO • +${xpDoNivel(n)} XP`,
        `Nível ${n + 2} liberado: ${a.niveis[n + 1].titulo}.`,
      );
    }
  }

  // Abre direto um agente pelo endereço (ex.: personagens/index.html#agente-css)
  const doEndereco = location.hash.match(/^#agente-([\w-]+)/);
  if (doEndereco) {
    window.addEventListener("load", () => abrirModal(doEndereco[1]));
  }
})();
