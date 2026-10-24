/**
 * CODEWORLD // rpg/script.js
 * Interações exclusivas da tela RPG.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js;
 *  o conteúdo fica em dados.js, as regras em regras.js e o desenho do
 *  canvas em desenho.js)
 *
 *   1. Utilidades (texto seguro, ícones, aviso)
 *   2. Janelas: falas, perguntas e confirmações
 *   3. Painel de progresso e abas
 *   4. Aba EXPLORAR (mapa, NPC e terminais)
 *   5. Operação: cenas, perguntas do terminal e batalha
 *   6. Aba EQUIPE
 *   7. Aba LOJA
 *   8. Aba DESAFIOS
 *   9. Aba DIÁRIO
 *  10. Como jogar, preferências e início
 *
 * Como o jogo funciona:
 *   - Não há conta nem login: o progresso fica salvo neste navegador.
 *   - A equipe é ligada à tela Personagens: só entram nela os agentes
 *     desbloqueados no Modo Agente, com a mesma imagem daquela tela. Cada
 *     nível concluído lá vale 2 níveis aqui e rende Nexus Coins.
 *   - No mapa, o terminal rosa abre a próxima operação: 5 perguntas e uma
 *     batalha por turnos. Vencer rende itens para a mochila.
 */

(() => {
  const tela = document.getElementById("TELA-RPG");
  if (!tela || typeof DADOS_RPG === "undefined" || typeof Regras === "undefined") return;

  const { personagens, capitulos, mapas, operacoes, itens, desafios, prologo } = DADOS_RPG;
  const aviso = document.getElementById("AVISO-RPG");

  const ABAS = ["explorar", "equipe", "loja", "desafios", "diario"];
  const NOMES_ATRIBUTOS = ["VIDA", "INTEL.", "COMBATE", "SANIDADE"];
  const NOMES_ITENS = { patch: "Patch", antidote: "Antídoto", battery: "Bateria", shield: "Escudo" };
  const ALCANCES = {
    all: "TODOS OS INIMIGOS",
    team: "EQUIPE INTEIRA",
    ally: "ESCOLHA UM ALIADO",
    self: "NO PRÓPRIO AGENTE",
    enemy: "NO ALVO SELECIONADO",
  };
  const CHAVE_SOM = "cw_rpg_som";
  const CHAVE_GUIA = "cw_rpg_guia_visto";

  let mundo = null; // mapa aberto (classe Mundo do desenho.js)
  let arena = null; // batalha aberta (classe Arena do desenho.js)
  let ocupado = false; // impede duas ações ao mesmo tempo
  let geracao = 0; // muda a cada troca de aba: ações antigas param no meio
  let vez = 0; // aliado escolhido para agir
  let alvo = null; // inimigo escolhido como alvo
  let filtroDesafios = "TODOS";

  // ==========================================================================
  // 1. UTILIDADES
  // ==========================================================================

  // Escapa texto para ser colocado dentro do HTML com segurança
  const escapar = (texto) =>
    String(texto ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  const doisDigitos = (n) => String(n).padStart(2, "0");
  const personagem = (id) => Regras.personagem(id);

  // Ficha do agente na tela Personagens (personagens/dados.js)
  const agente = (id) => (typeof AGENTES !== "undefined" ? AGENTES.find((a) => a.id === id) : null);

  // A mesma imagem da tela Personagens; se o agente ainda não tiver imagem
  // lá, entra o retrato em pixel art do RPG
  const imagemDe = (id) => agente(id)?.imagem || Sprites.retrato(id);
  const corDe = (id) => agente(id)?.cor || personagem(id)?.color;

  const retrato = (id) => {
    const valido = personagem(id) ? id : "html";
    return `<img class="retrato" src="${imagemDe(valido)}" alt="${escapar(personagem(valido).name)}" width="500" height="500" />`;
  };

  // Ícones em SVG (traço simples, herdam a cor do texto)
  const ICONES = {
    attack: "m5 19 14-14m-1 0h-5m5 0v5M3 15l6 6m-5-1 3-3",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z",
    battery: "m13 2-8 12h6l-1 8 9-12h-7l1-8Z",
    patch: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z",
    antidote: "M9 3h6m-5 0v6l-5 8a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-8V3M8 14h8",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
    star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  };
  const icone = (nome) =>
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES[nome] || ICONES.star}"/></svg>`;

  const textoRecompensas = (recompensas) =>
    Object.entries(recompensas)
      .map(([id, n]) => `${n} × ${NOMES_ITENS[id] || id}`)
      .join(" · ");

  const pilulasRecompensas = (recompensas) =>
    `<span class="recompensas">${Object.entries(recompensas)
      .map(([id, n]) => `<span class="item-pilula ${id}">${icone(id)} ${n} ${NOMES_ITENS[id]}</span>`)
      .join("")}</span>`;

  let temporizadorAviso;
  function avisar(mensagem) {
    aviso.textContent = mensagem;
    aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (aviso.hidden = true), 5000);
  }

  // Executa uma regra; se ela recusar a ação, mostra o motivo
  function tentar(acao) {
    try {
      acao();
      return true;
    } catch (erro) {
      avisar(erro.message);
      return false;
    }
  }

  // Liga um clique a todos os elementos da tela que combinam com o seletor
  function aoClicar(seletor, funcao) {
    tela.querySelectorAll(seletor).forEach((el) => el.addEventListener("click", () => funcao(el.dataset, el)));
  }

  // ==========================================================================
  // 2. JANELAS: FALAS, PERGUNTAS E CONFIRMAÇÕES
  // ==========================================================================
  // Cada janela é um <dialog> criado na hora e removido ao fechar.

  // A janela aberta fica numa camada acima de tudo, inclusive do cursor
  // estilizado do site (comum/base.js). Para ele continuar aparecendo, o
  // cursor entra na janela enquanto ela está aberta e depois volta ao <body>.
  const cursores = document.querySelectorAll(".cursor-inner, .cursor-outer");
  const moverCursor = (destino) => cursores.forEach((cursor) => destino.appendChild(cursor));

  function abrirJanela(rotulo, conteudo) {
    const caixa = document.createElement("dialog");
    caixa.className = "modal rpg";
    caixa.setAttribute("aria-label", rotulo);
    // A animação de entrada fica na moldura, e não na própria janela: assim
    // o cursor (position: fixed) não é deslocado enquanto ela anima
    caixa.innerHTML = `
      <div class="moldura modal">
        <div class="topo modal">
          <p class="rotulo sistema">${escapar(rotulo)}</p>
          <button type="button" class="fechar modal" data-fechar>FECHAR <span aria-hidden="true">✕</span></button>
        </div>
        <div class="conteudo modal">${conteudo}</div>
      </div>`;

    caixa.querySelector("[data-fechar]").addEventListener("click", () => caixa.close());
    // Clique fora da caixa (no fundo escurecido) também fecha
    caixa.addEventListener("click", (e) => {
      if (e.target === caixa) caixa.close();
    });
    caixa.addEventListener("close", () => {
      // O cursor sai antes de a janela ser removida (senão iria junto)
      const outraAberta = [...document.querySelectorAll("dialog.modal.rpg[open]")].at(-1);
      moverCursor(outraAberta || document.body);
      caixa.remove();
      if (!outraAberta) document.documentElement.classList.remove("modal-aberto");
    });

    document.body.appendChild(caixa);
    document.documentElement.classList.add("modal-aberto");
    caixa.showModal();
    moverCursor(caixa);
    return caixa;
  }

  // Fala de personagens com o texto sendo "digitado". Resolve true se o
  // jogador leu até o fim e false se fechou antes.
  function falar(cenas) {
    return new Promise((resolve) => {
      let indice = 0;
      let digitado = 0;
      let temporizador;
      let terminou = false;

      const caixa = abrirJanela(
        "TRANSMISSÃO // REDE NEXUS",
        `<div class="fala">
          <img class="retrato" alt="" width="500" height="500" />
          <div>
            <p class="rotulo sistema"></p>
            <p class="texto" aria-live="polite"></p>
          </div>
        </div>
        <div class="rodape modal">
          <p class="rotulo sistema">ENTER PARA AVANÇAR</p>
          <button type="button" class="botao primario" data-avancar></button>
        </div>`,
      );
      const foto = caixa.querySelector(".fala img");
      const nome = caixa.querySelector(".fala .rotulo");
      const texto = caixa.querySelector(".fala .texto");
      const botao = caixa.querySelector("[data-avancar]");

      function mostrarCena() {
        clearInterval(temporizador);
        const cena = cenas[indice];
        const quem = personagem(cena.portrait) ? cena.portrait : "html";
        foto.src = imagemDe(quem);
        foto.alt = cena.speaker;
        nome.textContent = cena.speaker;
        botao.innerHTML = `${indice === cenas.length - 1 ? "ENTENDIDO" : "CONTINUAR"} <span aria-hidden="true">→</span>`;
        digitado = 0;
        texto.textContent = "";
        if (semMovimento()) {
          texto.textContent = cena.body;
          digitado = cena.body.length;
          return;
        }
        temporizador = setInterval(() => {
          digitado += 3;
          texto.textContent = cena.body.slice(0, digitado);
          if (digitado >= cena.body.length) clearInterval(temporizador);
        }, 22);
      }

      // O primeiro clique completa o texto; o segundo passa para a próxima fala
      function avancar() {
        const cena = cenas[indice];
        if (digitado < cena.body.length) {
          clearInterval(temporizador);
          digitado = cena.body.length;
          texto.textContent = cena.body;
          return;
        }
        if (++indice >= cenas.length) {
          terminou = true;
          caixa.close();
        } else {
          mostrarCena();
        }
      }

      botao.addEventListener("click", avancar);
      caixa.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          avancar();
        }
      });
      caixa.addEventListener("close", () => {
        clearInterval(temporizador);
        resolve(terminou);
      });
      mostrarCena();
      botao.focus();
    });
  }

  // Perguntas de múltipla escolha com resposta na hora, na própria janela:
  //   - acertou: a alternativa fica verde, aparece a explicação e um botão
  //     para seguir (Enter também segue);
  //   - errou: a alternativa fica vermelha e dá para tentar outra.
  // opcoes: { rotulo, total, inicio, pergunta(n), responder(n, indice) →
  //           { correta, explicacao }, rotuloFinal }
  // Resolve true quando a última foi acertada e false se a janela fechar.
  // O foco começa no enunciado (autofocus): um Enter perdido não fecha a
  // janela nem escolhe uma alternativa sem querer.
  function janelaDePerguntas({ rotulo, total, inicio = 0, pergunta, responder, rotuloFinal }) {
    return new Promise((resolve) => {
      let n = inicio;
      let concluiu = false;
      const caixa = abrirJanela(rotulo, '<div class="quiz"></div>');
      const area = caixa.querySelector(".quiz");

      function mostrarPergunta() {
        const q = pergunta(n);
        const passos =
          total > 1
            ? `<div class="passos perguntas" aria-hidden="true">
                ${Array.from({ length: total }, (_, i) => `<span class="${i < n ? "feito" : i === n ? "atual" : ""}"></span>`).join("")}
              </div>
              <p class="rotulo sistema">PERGUNTA ${n + 1} DE ${total}</p>`
            : "";
        area.innerHTML = `
          ${passos}
          <p class="pergunta rpg" tabindex="-1" autofocus>${escapar(q.q)}</p>
          <div class="alternativas">
            ${q.o
              .map(
                (opcao, i) =>
                  `<button type="button" data-resposta="${i}"><span class="letra">${String.fromCharCode(65 + i)}</span> ${escapar(opcao)}</button>`,
              )
              .join("")}
          </div>
          <p class="retorno" role="status" aria-live="polite"></p>
          <div class="acoes jogo" hidden>
            <button type="button" class="botao primario" data-seguir></button>
          </div>`;
        area.querySelector(".pergunta").focus();
        area.querySelectorAll("[data-resposta]").forEach((botao) => botao.addEventListener("click", () => escolher(botao)));
      }

      function escolher(botao) {
        let resultado;
        if (!tentar(() => (resultado = responder(n, Number(botao.dataset.resposta))))) return;
        const retorno = area.querySelector(".retorno");

        if (!resultado.correta) {
          botao.classList.add("errada");
          botao.disabled = true;
          retorno.className = "retorno errada";
          retorno.textContent = "Ainda não. Releia a pergunta e tente outra alternativa.";
          return;
        }

        botao.classList.add("certa");
        area.querySelectorAll("[data-resposta]").forEach((b) => (b.disabled = true));
        retorno.className = "retorno certa";
        retorno.textContent = `Correto! ${resultado.explicacao || ""}`.trim();

        const ultima = n + 1 >= total;
        const seguir = area.querySelector("[data-seguir]");
        seguir.innerHTML = `${ultima ? rotuloFinal : "PRÓXIMA PERGUNTA"} <span aria-hidden="true">→</span>`;
        seguir.parentElement.hidden = false;
        seguir.focus();
        seguir.addEventListener("click", () => {
          if (!ultima) {
            n++;
            mostrarPergunta();
            return;
          }
          concluiu = true;
          caixa.close();
        });
      }

      caixa.addEventListener("close", () => resolve(concluiu));
      mostrarPergunta();
    });
  }

  function confirmar(rotulo, titulo, texto, rotuloBotao) {
    return new Promise((resolve) => {
      let confirmado = false;
      const caixa = abrirJanela(
        rotulo,
        `<h3>${escapar(titulo)}</h3>
        <p>${escapar(texto)}</p>
        <div class="acoes jogo">
          <button type="button" class="botao primario" data-confirmar>${escapar(rotuloBotao)}</button>
          <button type="button" class="botao secundario" data-cancelar>CANCELAR</button>
        </div>`,
      );
      caixa.querySelector("[data-confirmar]").addEventListener("click", () => {
        confirmado = true;
        caixa.close();
      });
      caixa.querySelector("[data-cancelar]").addEventListener("click", () => caixa.close());
      caixa.addEventListener("close", () => resolve(confirmado));
    });
  }

  // Itens e habilidades de suporte pedem um aliado consciente. Com um único
  // aliado de pé, ele é escolhido direto, sem abrir a janela.
  function escolherAliado(batalha, nome, descricao) {
    const conscientes = batalha.aliados.filter((u) => u.vida > 0);
    if (conscientes.length === 1) return Promise.resolve(conscientes[0].uid);

    return new Promise((resolve) => {
      let escolhido = null;
      const caixa = abrirJanela(
        "EM QUEM USAR?",
        `<h3>${escapar(nome)}</h3>
        <p>${escapar(descricao)}</p>
        <div class="alternativas">
          ${conscientes
            .map(
              (u) =>
                `<button type="button" data-aliado="${u.uid}"><span class="letra">${u.vida}/${u.vidaMax} VIDA</span> ${escapar(u.nome)} · ${u.energia} EN</button>`,
            )
            .join("")}
        </div>`,
      );
      caixa.querySelectorAll("[data-aliado]").forEach((botao) =>
        botao.addEventListener("click", () => {
          escolhido = botao.dataset.aliado;
          caixa.close();
        }),
      );
      caixa.addEventListener("close", () => resolve(escolhido));
    });
  }

  // ==========================================================================
  // 3. PAINEL DE PROGRESSO E ABAS
  // ==========================================================================

  function atualizarPainel() {
    const p = Regras.progresso;
    const total = operacoes.length;
    const capitulo = capitulos[p.posicao.mundo];
    document.getElementById("CONTAGEM-OPERACOES").textContent = `${doisDigitos(p.concluidas.length)}/${total}`;
    document.getElementById("CAPITULO-ATUAL").textContent =
      `${doisDigitos(p.posicao.mundo + 1)} · ${capitulo.name.toUpperCase()}`;
    document.getElementById("MOEDAS").textContent = `${p.moedas} NC`;
    document
      .getElementById("BARRA-CAMPANHA")
      .style.setProperty("--valor", `${(p.concluidas.length / total) * 100}%`);
  }

  const abaAtual = () => {
    const aba = location.hash.slice(1);
    return ABAS.includes(aba) ? aba : "explorar";
  };

  function limpar() {
    mundo?.destruir();
    mundo = null;
    arena?.destruir();
    arena = null;
    ocupado = false;
  }

  function mostrar() {
    geracao++;
    limpar();
    const aba = abaAtual();

    document.querySelectorAll("[data-aba]").forEach((link) => {
      const ativa = link.dataset.aba === aba;
      link.classList.toggle("ativa", ativa);
      if (ativa) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    atualizarPainel();

    if (aba === "equipe") mostrarEquipe();
    else if (aba === "loja") mostrarLoja();
    else if (aba === "desafios") mostrarDesafios();
    else if (aba === "diario") mostrarDiario();
    else if (Regras.progresso.ativa && Regras.progresso.ativa.etapa !== "perguntas") mostrarBatalha();
    else mostrarExplorar();
  }

  // Volta para a aba Explorar (mesmo que ela já esteja aberta)
  function irParaExplorar() {
    if (abaAtual() === "explorar") mostrar();
    else location.hash = "explorar";
  }

  // ==========================================================================
  // 4. ABA EXPLORAR
  // ==========================================================================

  function painelLateral() {
    const p = Regras.progresso;
    const m = p.posicao.mundo;
    const capitulo = capitulos[m];
    const doCapitulo = operacoes.filter((o) => o.world === m);
    const proxima = Regras.operacaoAtual();
    const estado = (o) => (p.concluidas.includes(o.id) ? "feita" : o.id === proxima?.id ? "atual" : "");

    let situacao = "Campanha concluída. A cidade está reconectada!";
    if (proxima?.world === m) situacao = "Próxima operação: " + proxima.title + ".";
    else if (proxima) situacao = "Capítulo recuperado. Atravesse o portal para continuar.";

    return `
      <div class="painel detalhes">
        <p class="rotulo sistema">CAPÍTULO ${doisDigitos(m + 1)}</p>
        <h3>${escapar(capitulo.name)}</h3>
        <p>${escapar(situacao)}</p>
        <div class="etapas capitulo" aria-hidden="true">
          ${doCapitulo.map((o) => `<span class="${estado(o) === "atual" ? "proxima" : estado(o)}"></span>`).join("")}
        </div>
        <ol class="lista fases">
          ${doCapitulo.map((o) => `<li class="${estado(o)}"><b>${doisDigitos(o.phase)}</b> ${escapar(o.title)}</li>`).join("")}
        </ol>
      </div>
      <div class="painel detalhes">
        <p class="rotulo sistema">ESQUADRÃO ATIVO</p>
        <div class="esquadrao mini">
          ${p.equipe.map((id) => `<figure>${retrato(id)}<figcaption>NV ${Regras.nivel(id)}</figcaption></figure>`).join("")}
        </div>
        <a class="botao jogo" href="#equipe">GERENCIAR EQUIPE</a>
      </div>
      <div class="painel detalhes">
        <p class="rotulo sistema">SINAL DA RESISTÊNCIA</p>
        <h3>${escapar(capitulo.pair)}</h3>
        <ul class="legenda mapa">
          <li><i style="background: #ff458e"></i> Terminal da próxima operação</li>
          <li><i style="background: #3decc9"></i> Operação concluída / portal aberto</li>
          <li><i style="background: #00f2fe"></i> Terminal de AULAS (Modo Agente)</li>
          <li><i style="background: #b3e7f8"></i> NPC: converse com a dupla</li>
        </ul>
      </div>`;
  }

  // O que a tecla E faz onde o personagem está (null: nada por perto)
  function interacaoAqui() {
    const p = Regras.progresso;
    if (p.ativa) return { tipo: "continuar", rotulo: "CONTINUAR OPERAÇÃO" };

    const { mundo: m, x, y } = p.posicao;
    const distancia = ([ax, ay]) => Math.abs(x - ax) + Math.abs(y - ay);
    const proxima = Regras.operacaoAtual();
    if (proxima && proxima.world === m && distancia(mapas[m].stages[proxima.phase - 1]) === 0) {
      return { tipo: "operacao", rotulo: "INICIAR OPERAÇÃO" };
    }
    if (distancia(mapas[m].npc) <= 2) return { tipo: "npc", rotulo: "CONVERSAR" };
    if (distancia(mapas[m].terminal) <= 1) return { tipo: "aulas", rotulo: "ABRIR AULAS" };
    return null;
  }

  // Faixa acima do mapa dizendo o que fazer agora
  function faixaObjetivo() {
    const p = Regras.progresso;
    const objetivo = Regras.objetivo();
    let texto = "Campanha concluída! O CodeWorld está reconectado.";
    let botao = "";

    if (p.ativa) {
      texto = `Operação em andamento: ${Regras.operacao(p.ativa.id).title}.`;
      botao = "CONTINUAR";
    } else if (objetivo.tipo === "operacao") {
      const numero = operacoes.indexOf(objetivo.operacao) + 1;
      texto = `Operação ${doisDigitos(numero)}/${operacoes.length} · ${objetivo.operacao.title}. Siga a trilha rosa até o terminal ${objetivo.operacao.phase}.`;
      botao = "IR ATÉ LÁ";
    } else if (objetivo.tipo === "portal") {
      texto = "Capítulo recuperado! Siga a trilha até o portal para o próximo capítulo.";
      botao = "IR ATÉ O PORTAL";
    }

    return `
      <div class="objetivo jogo">
        <p><span class="rotulo sistema">OBJETIVO</span> ${escapar(texto)}</p>
        ${botao ? `<button type="button" class="botao jogo destaque" id="IR-OBJETIVO">${botao} <span aria-hidden="true">▸</span></button>` : ""}
      </div>`;
  }

  function mostrarExplorar() {
    const p = Regras.progresso;
    const { mundo: m, x, y } = p.posicao;
    const liberado = Regras.mundoLiberado();

    tela.innerHTML = `
      <div class="layout jogo">
        <div class="janela jogo">
          <div class="janela-barra">
            <strong>
              <span class="luzes" aria-hidden="true"><i></i><i></i><i></i></span>
              SETOR ${doisDigitos(m + 1)} // ${escapar(capitulos[m].name.toUpperCase())}
            </strong>
            <span id="COORDENADAS">X ${doisDigitos(x)} · Y ${doisDigitos(y)}</span>
          </div>
          ${faixaObjetivo()}
          <canvas class="mapa-canvas" tabindex="0" aria-label="Mapa explorável. Clique no chão para andar até lá, ou use as setas ou W A S D. E interage."></canvas>
          <div class="controles jogo">
            <p class="dica teclas">
              <span class="tecla">W</span><span class="tecla">A</span><span class="tecla">S</span><span class="tecla">D</span>
              OU CLIQUE NO MAPA PARA ANDAR · <span class="tecla">E</span> INTERAGIR
            </p>
            <div class="direcional" role="group" aria-label="Controles de movimento">
              <button type="button" data-direcao="0,-1" aria-label="Andar para cima">▲</button>
              <button type="button" data-direcao="-1,0" aria-label="Andar para a esquerda">◀</button>
              <button type="button" data-direcao="0,1" aria-label="Andar para baixo">▼</button>
              <button type="button" data-direcao="1,0" aria-label="Andar para a direita">▶</button>
            </div>
            <button type="button" class="botao jogo" id="INTERAGIR"></button>
          </div>
        </div>
        <aside class="lateral jogo" aria-label="Capítulo e esquadrão">${painelLateral()}</aside>
      </div>
      <div class="seletor capitulo">
        <label class="rotulo sistema" for="VIAJAR">VIAJAR PARA O CAPÍTULO</label>
        <select id="VIAJAR">
          ${capitulos
            .map(
              (c, i) =>
                `<option value="${i}" ${i === m ? "selected" : ""} ${i > liberado ? "disabled" : ""}>${doisDigitos(i + 1)} · ${escapar(c.name)}${i > liberado ? " — bloqueado" : ""}</option>`,
            )
            .join("")}
        </select>
      </div>`;

    mundo = new Mundo(tela.querySelector(".mapa-canvas"), {
      personagem: p.equipe[0], // o líder; os outros da equipe seguem atrás
      seguidores: p.equipe.slice(1),
      aoMover: (dx, dy) => {
        const resultado = Regras.mover(dx, dy);
        const { x: nx, y: ny } = Regras.progresso.posicao;
        document.getElementById("COORDENADAS").textContent = `X ${doisDigitos(nx)} · Y ${doisDigitos(ny)}`;
        atualizarBotaoInteragir();
        return resultado;
      },
      aoTrocarMundo: () => {
        avisar(`Portal atravessado: ${capitulos[Regras.progresso.posicao.mundo].name}.`);
        mostrar();
      },
      aoInteragir: interagir,
      aoErro: (erro) => avisar(erro.message),
      objetivo: () => {
        const objetivo = Regras.objetivo();
        return objetivo.tipo === "fim" ? null : objetivo;
      },
      dica: () => (ocupado ? null : interacaoAqui()?.rotulo),
    });

    atualizarBotaoInteragir();
    document.getElementById("INTERAGIR").addEventListener("click", interagir);

    ligarObjetivo();

    // Segurar uma seta do controle de toque anda continuamente
    tela.querySelectorAll("[data-direcao]").forEach((botao) => {
      let repeticao;
      const parar = () => clearInterval(repeticao);
      const [dx, dy] = botao.dataset.direcao.split(",").map(Number);
      botao.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        botao.setPointerCapture(e.pointerId);
        mundo?.mover(dx, dy);
        repeticao = setInterval(() => mundo?.mover(dx, dy), 190);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((evento) => botao.addEventListener(evento, parar));
      // Pelo teclado (Enter/Espaço no botão) anda uma casa
      botao.addEventListener("click", (e) => {
        if (e.detail === 0) mundo?.mover(dx, dy);
      });
    });

    document.getElementById("VIAJAR").addEventListener("change", (e) => {
      if (tentar(() => Regras.viajar(Number(e.target.value)))) mostrar();
      else e.target.value = String(Regras.progresso.posicao.mundo);
    });
  }

  // "IR ATÉ LÁ": anda sozinho até o objetivo e, se for o terminal, já
  // começa a operação ao chegar
  function ligarObjetivo() {
    document.getElementById("IR-OBJETIVO")?.addEventListener("click", () => {
      if (Regras.progresso.ativa) {
        interagir();
        return;
      }
      const objetivo = Regras.objetivo();
      tela.querySelector(".mapa-canvas")?.focus({ preventScroll: true });
      mundo?.caminharAte(objetivo.x, objetivo.y, () => {
        if (objetivo.tipo === "operacao") interagir();
      });
    });
  }

  // Redesenha a faixa de objetivo (ex.: a operação começou ou foi pausada)
  function atualizarObjetivo() {
    const faixa = tela.querySelector(".objetivo.jogo");
    if (!faixa) return;
    faixa.outerHTML = faixaObjetivo();
    ligarObjetivo();
  }

  // O botão diz o que vai acontecer (e só fica em destaque quando há algo)
  function atualizarBotaoInteragir() {
    const botao = document.getElementById("INTERAGIR");
    if (!botao) return;
    const acao = interacaoAqui();
    botao.textContent = `${acao ? acao.rotulo : "INTERAGIR"} · E`;
    botao.classList.toggle("destaque", Boolean(acao));
  }

  async function interagir() {
    if (ocupado) return;
    ocupado = true;
    try {
      mundo?.teclas.clear();
      const p = Regras.progresso;
      const { mundo: m } = p.posicao;
      const capitulo = capitulos[m];
      const acao = interacaoAqui();

      if (acao?.tipo === "continuar") {
        await continuarOperacao();
      } else if (acao?.tipo === "operacao") {
        Regras.iniciarOperacao(Regras.operacaoAtual().id);
        await continuarOperacao();
      } else if (acao?.tipo === "npc") {
        const ultima = operacoes.filter((o) => o.world === m).at(-1);
        await falar([
          {
            speaker: capitulo.pair,
            portrait: capitulo.id === "core" ? "kotlin" : capitulo.id,
            body: p.concluidas.includes(ultima.id) ? capitulo.outro : capitulo.intro,
          },
          {
            speaker: "Nexus",
            portrait: "html",
            body: "Siga a trilha rosa até o terminal da próxima operação e pressione E — ou use o botão IR ATÉ LÁ. Para andar, também dá para clicar em qualquer ponto do mapa.",
          },
        ]);
      } else if (acao?.tipo === "aulas") {
        abrirTerminalAulas(capitulo.id === "core" ? "html" : capitulo.id);
      } else {
        avisar("Nada por perto. Siga a trilha rosa até o objetivo ou use o botão IR ATÉ LÁ.");
      }
    } catch (erro) {
      avisar(erro.message);
    } finally {
      ocupado = false;
      atualizarBotaoInteragir();
      atualizarObjetivo();
    }
  }

  // Texto que explica como liberar um agente bloqueado
  const comoLiberar = (id) => `Conclua os 5 níveis de ${personagem(Regras.anterior(id)).name} no Modo Agente.`;

  // Link para o Modo Agente: abre o agente direto se ele estiver liberado; se
  // não, abre o que está em andamento (o último liberado)
  const linkModoAgente = (id) =>
    `../personagens/index.html#agente-${Regras.liberado(id) ? id : Regras.liberados().at(-1)}`;

  // O terminal azul do mapa leva ao Modo Agente da linguagem do capítulo
  function abrirTerminalAulas(id) {
    const c = personagem(id);
    const aulas = Regras.aulasConcluidas(id);
    abrirJanela(
      "TERMINAL DE AULAS",
      `<div class="fala">
        ${retrato(id)}
        <div>
          <h3>Evolua ${escapar(c.name)} no Modo Agente.</h3>
          <p>
            Cada nível concluído no Modo Agente vale 2 níveis no RPG (até o
            nível 10), libera habilidades nos níveis 3 e 7 e rende
            +${Regras.MOEDAS_POR_NIVEL} NC uma única vez. Concluir os 5 níveis
            libera o próximo agente para a equipe.
          </p>
          <p class="rotulo sistema">
            ${Regras.liberado(id) ? `MODO AGENTE ${aulas}/${Regras.NIVEIS_MODO_AGENTE} · NÍVEL ${Regras.nivel(id)} NO RPG` : `BLOQUEADO · ${escapar(comoLiberar(id).toUpperCase())}`}
          </p>
        </div>
      </div>
      <div class="acoes jogo">
        <a class="botao primario" href="${linkModoAgente(id)}">ABRIR MODO AGENTE <span aria-hidden="true">→</span></a>
      </div>`,
    );
  }

  // ==========================================================================
  // 5. OPERAÇÃO: CENAS, PERGUNTAS DO TERMINAL E BATALHA
  // ==========================================================================

  async function continuarOperacao() {
    const ativa = Regras.progresso.ativa;
    if (!ativa) return;
    if (ativa.etapa !== "perguntas") {
      mostrarBatalha();
      return;
    }

    const operacao = Regras.operacao(ativa.id);
    // As cenas aparecem antes da primeira pergunta (e o prólogo, na 1ª operação)
    if (ativa.pergunta === 0) {
      const cenas = [...(Regras.progresso.concluidas.length === 0 ? [prologo] : []), ...operacao.scenes];
      if (!(await falar(cenas))) return;
    }

    // As 5 perguntas do terminal numa janela só; fechar pausa no mesmo ponto
    if (Regras.progresso.ativa?.etapa === "perguntas") {
      const terminou = await janelaDePerguntas({
        rotulo: `TERMINAL // ${operacao.title.toUpperCase()}`,
        total: operacao.questions.length,
        inicio: Regras.progresso.ativa.pergunta,
        pergunta: (n) => operacao.questions[n],
        responder: (n, indice) => Regras.responderTerminal(indice),
        rotuloFinal: "IR PARA A BATALHA",
      });
      if (!terminou) return;
    }

    if (Regras.progresso.ativa?.etapa === "batalha") {
      const janelaJogo = tela.querySelector(".janela.jogo");
      if (janelaJogo) await transicao(janelaJogo);
      mostrarBatalha();
    }
  }

  const alvoPadrao = (b) =>
    (b.inimigos.find((u) => u.vida > 0 && !u.chefe) || b.inimigos.find((u) => u.vida > 0))?.uid ?? null;

  const registrarLog = (texto) => {
    const log = document.getElementById("LOG-BATALHA");
    if (log) log.textContent = texto;
  };

  function mostrarBatalha() {
    limpar();
    const ativa = Regras.progresso.ativa;
    const b = ativa?.batalha;
    if (!b) {
      mostrarExplorar();
      return;
    }

    const operacao = Regras.operacao(b.operacao);
    vez = b.vez;
    alvo = alvoPadrao(b);

    // Arena, registro e ações rápidas à esquerda; quem age, alvo e poderes
    // na coluna lateral
    tela.innerHTML = `
      <div class="layout batalha">
        <div class="coluna batalha">
          <div class="janela jogo batalha">
            <div class="linha-topo batalha">
              <strong>${escapar(operacao.title.toUpperCase())}</strong>
              <span id="RODADA">RODADA ${b.rodada} // CONFRONTO</span>
            </div>
            <canvas class="arena-canvas" aria-label="Arena de combate: sua equipe à esquerda e os inimigos à direita"></canvas>
            <div class="hud batalha"></div>
          </div>
          <p class="log batalha" id="LOG-BATALHA" role="status" aria-live="polite">
            Escolha quem age, o alvo e a ação.
          </p>
          <div class="acoes secundarias"></div>
          <p class="dica batalha">
            Clique num inimigo (na arena ou na lista) para mirar nele. Habilidades
            gastam energia (EN); ataque básico e defender recuperam. Atalhos:
            <span class="tecla">1</span>–<span class="tecla">4</span> habilidades,
            <span class="tecla">5</span> ataque básico, <span class="tecla">6</span> defender.
          </p>
        </div>
        <aside class="comandos batalha" aria-label="Poderes e ações">
          <div class="vez batalha"></div>
          <p class="rotulo sistema passo batalha"><b>3</b> ESCOLHA O PODER</p>
          <div class="grade comandos"></div>
        </aside>
      </div>`;

    arena = new Arena(tela.querySelector(".arena-canvas"), b, atualizarHud, (u) =>
      selecionarUnidade(u.lado, Regras.progresso.ativa.batalha[u.lado].findIndex((x) => x.uid === u.uid)),
    );
    arena.alvo = alvo;
    atualizarHud(b);
    desenharComandos();
  }

  // Clicar num aliado escolhe quem age; num inimigo, o alvo (lista ou arena)
  function selecionarUnidade(lado, i) {
    const atual = Regras.progresso.ativa?.batalha;
    if (!atual || ocupado || Regras.progresso.ativa.etapa !== "batalha") return;
    const unidade = atual[lado][i];
    if (!unidade || unidade.vida <= 0) return;
    if (lado === "aliados") {
      if (atual.agiram.includes(i)) {
        avisar(`${unidade.nome} já agiu nesta rodada.`);
        return;
      }
      vez = i;
      if (arena) arena.b.vez = i;
    } else {
      alvo = unidade.uid;
      if (arena) arena.alvo = alvo;
    }
    atualizarHud(atual);
    desenharComandos();
  }

  // Lista de unidades: clicar num aliado escolhe quem age; num inimigo, o alvo
  function atualizarHud(b) {
    const hud = tela.querySelector(".hud.batalha");
    if (!hud) return;

    const lista = (lado) => `
      <div class="lista unidades ${lado}">
        ${b[lado]
          .map((u, i) => {
            const agiu = lado === "aliados" && b.agiram.includes(i);
            const selecionada = lado === "aliados" ? i === vez : u.uid === alvo;
            const classes = [
              "unidade",
              u.vida <= 0 ? "desmaiada" : "",
              selecionada ? (lado === "aliados" ? "vez" : "alvo") : "",
              agiu ? "agiu" : "",
            ].join(" ");
            const efeitos = u.efeitos.map((e) => `${Regras.EFEITOS[e.tipo]} (${e.turnos})`).join(" · ") || "Sem efeitos";
            const detalhes = (lado === "aliados" ? `NV ${u.nivel} · EN ${u.energia}/100 · ` : "") + efeitos + (agiu ? " · JÁ AGIU" : "");
            return `
              <button type="button" class="${classes}" data-lado="${lado}" data-indice="${i}" aria-pressed="${selecionada}" ${ocupado || u.vida <= 0 ? "disabled" : ""}>
                <span>${escapar(u.nome)}</span>
                <span class="vida-barra"><span style="width: ${(u.vida / u.vidaMax) * 100}%"></span></span>
                <span class="vida-valor">${u.vida}/${u.vidaMax}</span>
                <small>${escapar(detalhes)}</small>
              </button>`;
          })
          .join("")}
      </div>`;

    hud.innerHTML = lista("aliados") + lista("inimigos");
    hud.querySelectorAll("[data-lado]").forEach((botao) =>
      botao.addEventListener("click", () => selecionarUnidade(botao.dataset.lado, Number(botao.dataset.indice))),
    );
  }

  function desenharComandos() {
    const ativa = Regras.progresso.ativa;
    const b = ativa?.batalha;
    const painelVez = tela.querySelector(".vez.batalha");
    const grade = tela.querySelector(".grade.comandos");
    const secundarias = tela.querySelector(".acoes.secundarias");
    if (!b || !grade) return;

    if (ativa.etapa === "derrota") {
      painelVez.innerHTML = `
        <div class="derrota batalha">
          <p class="rotulo sistema">DERROTA</p>
          <h4>A equipe caiu.</h4>
          <p>Recomece a fase ou reveja a equipe. Evoluir os agentes no Modo Agente deixa a equipe mais forte.</p>
        </div>`;
      grade.innerHTML = "";
      tela.querySelector(".passo.batalha").hidden = true;
      secundarias.innerHTML = `
        <button type="button" class="botao primario" id="RECOMECAR">RECOMEÇAR A FASE</button>
        <button type="button" class="botao secundario" id="REVER-EQUIPE">REVER EQUIPE</button>`;
      registrarLog("A equipe caiu. As recompensas de operações anteriores estão preservadas.");
      // Recomeçar volta ao mapa, em cima do terminal: basta apertar E de novo
      document.getElementById("RECOMECAR").addEventListener("click", () => {
        Regras.abandonarOperacao();
        mostrar();
      });
      document.getElementById("REVER-EQUIPE").addEventListener("click", () => {
        Regras.abandonarOperacao();
        location.hash = "equipe";
      });
      return;
    }

    const u = b.aliados[vez];
    const inventario = Regras.progresso.inventario;
    const alvoAtual = b.inimigos.find((e) => e.uid === alvo);
    const travado = ocupado ? "disabled" : "";

    // Passos 1 e 2: quem age (seta ciano) e o alvo (seta rosa)
    painelVez.innerHTML = `
      <div class="agente batalha">
        ${retrato(u.id)}
        <div>
          <p class="rotulo sistema passo batalha"><b>1</b> QUEM AGE</p>
          <h4>${escapar(u.nome)} <small>NV ${u.nivel}</small></h4>
          <div class="energia-barra"><span style="width: ${u.energia}%"></span></div>
          <p class="rotulo energia">${u.energia}/100 ENERGIA</p>
        </div>
      </div>
      <div class="alvo batalha">
        <p class="rotulo sistema passo batalha"><b>2</b> ALVO</p>
        <strong>${escapar(alvoAtual?.nome || "Clique num inimigo")}</strong>
        <small>Para trocar, clique em outro inimigo ou aliado.</small>
      </div>`;

    grade.innerHTML = u.habilidades
      .map((h, i) => {
        const nivelMinimo = Regras.NIVEL_HABILIDADE[i];
        const bloqueada = u.nivel < nivelMinimo;
        const tom = h.heal ? "cura" : h.power ? "ataque" : h.target === "enemy" ? "controle" : "suporte";
        const simbolo = h.heal ? "patch" : h.power ? "attack" : h.target === "enemy" ? "code" : "shield";
        // O rodapé do cartão explica o alcance ou por que ele está desativado
        let situacao = ALCANCES[h.target] || ALCANCES.enemy;
        if (bloqueada) situacao = `LIBERA NO NÍVEL ${nivelMinimo} · ESTUDE NO MODO AGENTE`;
        else if (u.energia < h.cost) situacao = `FALTAM ${h.cost - u.energia} EN · USE ATAQUE BÁSICO OU DEFENDER`;
        const desativado = ocupado || bloqueada || u.energia < h.cost;
        return `
          <button type="button" class="comando ${tom}" data-habilidade="${i}" ${desativado ? "disabled" : ""}>
            <span class="comando-topo">
              <span class="comando-icone">${icone(simbolo)}</span>
              <strong>${escapar(h.name)}</strong>
              <span class="comando-custo"><span class="tecla">${i + 1}</span> ${h.cost} EN</span>
            </span>
            <span class="descricao">${escapar(h.desc)}</span>
            <small>${situacao}</small>
          </button>`;
      })
      .join("");

    secundarias.innerHTML = `
      <button type="button" class="botao jogo" data-acao="basico" ${travado}><span class="tecla">5</span> ${icone("attack")} ATAQUE BÁSICO <small>+18 EN</small></button>
      <button type="button" class="botao jogo" data-acao="defender" ${travado}><span class="tecla">6</span> ${icone("shield")} DEFENDER <small>+30 EN</small></button>
      ${Object.keys(itens)
        .map(
          (id) =>
            `<button type="button" class="botao jogo item ${id}" data-acao="item" data-item="${id}" title="${escapar(itens[id].desc)}" ${ocupado || !inventario[id] ? "disabled" : ""}>${icone(id)} ${NOMES_ITENS[id]} ×${inventario[id] || 0}</button>`,
        )
        .join("")}
      <button type="button" class="botao jogo abandonar" id="ABANDONAR" ${travado}>ABANDONAR OPERAÇÃO</button>`;

    grade.querySelectorAll("[data-habilidade]").forEach((botao) =>
      botao.addEventListener("click", () => agir("habilidade", Number(botao.dataset.habilidade))),
    );
    secundarias.querySelectorAll("[data-acao]").forEach((botao) =>
      botao.addEventListener("click", () => agir(botao.dataset.acao, undefined, botao.dataset.item)),
    );
    document.getElementById("ABANDONAR").addEventListener("click", abandonar);
  }

  async function agir(acao, habilidade, item) {
    const b = Regras.progresso.ativa?.batalha;
    if (ocupado || !b || !arena) return;
    const minhaGeracao = geracao;
    const u = b.aliados[vez];
    const intencao = { acao, aliado: vez, habilidade, item, alvo };

    // Itens e habilidades de suporte pedem um aliado como alvo
    if (acao === "item" || (acao === "habilidade" && u.habilidades[habilidade].target === "ally")) {
      const usado = acao === "item" ? itens[item] : u.habilidades[habilidade];
      ocupado = true; // evita outra ação enquanto a janela está aberta
      intencao.alvo = await escolherAliado(b, usado.name, usado.desc);
      ocupado = false;
      if (minhaGeracao !== geracao || !intencao.alvo) return;
    }

    let resultado;
    try {
      resultado = Regras.agir(intencao);
    } catch (erro) {
      avisar(erro.message);
      return;
    }

    // Trava os comandos e anima os eventos da ação
    ocupado = true;
    desenharComandos();
    await arena.tocar(resultado.eventos, registrarLog);
    if (minhaGeracao !== geracao) return;
    ocupado = false;
    atualizarPainel();

    if (resultado.concluida) {
      await comemorarVitoria(resultado, u);
      irParaExplorar();
      return;
    }

    const nova = resultado.batalha;
    arena.sincronizar(nova);
    vez = nova.vez;
    if (!nova.inimigos.some((e) => e.uid === alvo && e.vida > 0)) alvo = alvoPadrao(nova);
    arena.alvo = alvo;
    document.getElementById("RODADA").textContent = `RODADA ${nova.rodada} // CONFRONTO`;
    atualizarHud(nova);
    desenharComandos();
    if (!resultado.derrota) registrarLog(`Rodada ${nova.rodada} · ${nova.aliados[vez].nome}: escolha sua ação.`);
  }

  function comemorarVitoria(resultado, autor) {
    const final = Regras.operacaoAtual()
      ? "Vá até o próximo terminal rosa para continuar."
      : "Você chegou ao fim da campanha: o CodeWorld está reconectado!";
    return falar([
      { speaker: "Nexus · operação concluída", portrait: autor.id, body: resultado.encerramento },
      {
        speaker: "Recompensas confirmadas",
        portrait: autor.id,
        body: `Suprimentos recebidos: ${textoRecompensas(resultado.recompensas)}. ${final}`,
      },
    ]);
  }

  async function abandonar() {
    if (ocupado) return;
    const ok = await confirmar(
      "ABANDONAR OPERAÇÃO",
      "Voltar ao mapa?",
      "Esta operação será reiniciada e os itens usados nela não voltam. As conquistas anteriores continuam salvas.",
      "ABANDONAR",
    );
    if (!ok) return;
    Regras.abandonarOperacao();
    irParaExplorar();
  }

  // ==========================================================================
  // 6. ABA EQUIPE
  // ==========================================================================

  function gradeAtributos(c) {
    return `<div class="grade atributos">
      ${Regras.atributos(c)
        .map((valor, i) => `<div><b>${valor}</b><span>${NOMES_ATRIBUTOS[i]}</span></div>`)
        .join("")}
    </div>`;
  }

  // Cartão de um agente na aba Equipe. Os agentes são os mesmos da tela
  // Personagens: os bloqueados aparecem apagados, com o que falta para liberar.
  function cartaoPersonagem(c) {
    const p = Regras.progresso;
    const liberado = Regras.liberado(c.id);
    const naEquipe = p.equipe.includes(c.id);
    const aulas = Regras.aulasConcluidas(c.id);

    let selo = '<span class="selo bloqueado"><span class="icone-cadeado" aria-hidden="true"></span> BLOQUEADO</span>';
    if (naEquipe) selo = '<span class="selo status">NA EQUIPE</span>';
    else if (liberado) selo = '<span class="selo secundaria">DESBLOQUEADO</span>';

    // O botão diz por que não dá para adicionar (já está ou a equipe encheu)
    let acao = `<a class="botao jogo" href="${linkModoAgente(c.id)}">COMO LIBERAR <span aria-hidden="true">→</span></a>`;
    if (naEquipe) acao = '<button type="button" class="botao jogo" disabled>NA EQUIPE</button>';
    else if (liberado && p.equipe.length >= 3) acao = '<button type="button" class="botao jogo" disabled>EQUIPE CHEIA (3)</button>';
    else if (liberado) acao = `<button type="button" class="botao jogo destaque" data-adicionar="${c.id}">+ EQUIPE</button>`;

    return `
      <li class="card personagem ${liberado ? "" : "bloqueado"}" style="--cor: ${corDe(c.id)}">
        <div class="topo personagem">
          <span class="funcao personagem">${escapar(c.role)} · NV ${Regras.nivel(c.id)}</span>
          ${selo}
        </div>
        <div class="visual personagem">${retrato(c.id)}</div>
        <h4>${escapar(c.name)}</h4>
        ${liberado ? `<p>${escapar(c.lore)}</p>` : `<p class="requisito">${escapar(comoLiberar(c.id))}</p>`}
        ${gradeAtributos(c)}
        <div class="estudo personagem">
          <p class="rotulo sistema">MODO AGENTE ${aulas}/${Regras.NIVEIS_MODO_AGENTE}</p>
          <div class="barra progresso">
            <div class="preenchimento progresso" style="--valor: ${(aulas / Regras.NIVEIS_MODO_AGENTE) * 100}%"></div>
          </div>
        </div>
        <div class="acoes jogo">
          <button type="button" class="botao jogo" data-habilidades="${c.id}">HABILIDADES</button>
          ${acao}
        </div>
      </li>`;
  }

  function mostrarHabilidades(id) {
    const c = personagem(id);
    const nivel = Regras.nivel(id);
    abrirJanela(
      `${c.role.toUpperCase()} // NÍVEL ${nivel}`,
      `<div class="fala">
        ${retrato(id)}
        <div>
          <h3>${escapar(c.name)}</h3>
          <p class="rotulo sistema">${Regras.liberado(id) ? "DESBLOQUEADO NA TELA PERSONAGENS" : `BLOQUEADO · ${escapar(comoLiberar(id).toUpperCase())}`}</p>
        </div>
      </div>
      ${gradeAtributos(c)}
      <ul class="lista habilidades">
        ${c.skills
          .map((h, i) => {
            const minimo = Regras.NIVEL_HABILIDADE[i];
            return `
              <li class="${nivel < minimo ? "bloqueada" : ""}">
                <strong>${escapar(h.name)}</strong>
                <small>${escapar(h.desc)}</small>
                <span class="rotulo sistema">${h.cost} EN · NÍVEL ${minimo}${nivel < minimo ? " · BLOQUEADA" : ""}</span>
              </li>`;
          })
          .join("")}
      </ul>
      <p>
        Os atributos iniciais somam 15 pontos e crescem nos níveis 3, 5, 7, 9
        e 10. Suba de nível concluindo o Modo Agente de ${escapar(c.name)}.
      </p>
      <div class="acoes jogo">
        <a class="botao primario" href="${linkModoAgente(id)}">ABRIR MODO AGENTE <span aria-hidden="true">→</span></a>
      </div>`,
    );
  }

  const chamadaModoAgente = () => `
    <div class="chamada rpg">
      <div>
        <h4>Aprender é o que fortalece a equipe.</h4>
        <p>
          Cada nível concluído no Modo Agente vale 2 níveis no RPG (até o nível
          10), libera habilidades nos níveis 3 e 7 e rende
          +${Regras.MOEDAS_POR_NIVEL} NC para a loja. Concluir os 5 níveis de
          um agente libera o próximo para a equipe.
        </p>
      </div>
      <a class="botao primario" href="../personagens/index.html#SECAO-PERSONAGENS">ABRIR MODO AGENTE <span aria-hidden="true">→</span></a>
    </div>`;

  function mostrarEquipe() {
    const p = Regras.progresso;
    const liberados = Regras.liberados();
    const vaga = (i) => {
      const id = p.equipe[i];
      if (!id) {
        return `<li class="vaga esquadrao vazia">${doisDigitos(i + 1)} // POSIÇÃO DISPONÍVEL</li>`;
      }
      const c = personagem(id);
      return `
        <li class="vaga esquadrao" style="--cor: ${corDe(id)}">
          <span class="posicao">${doisDigitos(i + 1)}</span>
          ${retrato(id)}
          <div>
            <h4>${escapar(c.name)}</h4>
            <p>${escapar(c.role)} · NV ${Regras.nivel(id)}</p>
          </div>
          <div class="acoes jogo">
            ${i > 0 ? `<button type="button" class="botao jogo" data-avancar="${i}" aria-label="Mover ${escapar(c.name)} uma posição para frente">◀ AVANÇAR</button>` : ""}
            <button type="button" class="botao jogo" data-remover="${id}" ${p.equipe.length === 1 ? "disabled" : ""}>REMOVER</button>
          </div>
        </li>`;
    };

    tela.innerHTML = `
      <div class="cabecalho aba">
        <div>
          <p class="rotulo sistema">ESQUADRÃO // ATÉ 3 AGENTES</p>
          <h3>Cada posição importa.</h3>
          <p>
            O primeiro personagem lidera a exploração. Na batalha, cada membro
            consciente age uma vez por rodada.
          </p>
        </div>
      </div>
      <ol class="lista esquadrao">${[0, 1, 2].map(vaga).join("")}</ol>
      <h3 class="subtitulo aba">AGENTES // ${doisDigitos(liberados.length)} DE ${doisDigitos(personagens.length)} DESBLOQUEADOS</h3>
      <p class="dica equipe">
        São os mesmos agentes da
        <a class="link rpg" href="../personagens/index.html#SECAO-PERSONAGENS">tela Personagens</a>:
        só os desbloqueados no Modo Agente podem entrar na equipe.
      </p>
      <ul class="lista cartoes">${personagens.map((c) => cartaoPersonagem(c)).join("")}</ul>
      ${chamadaModoAgente()}`;

    const salvarEquipe = (equipe) => {
      if (tentar(() => Regras.definirEquipe(equipe))) mostrar();
    };
    aoClicar("[data-avancar]", ({ avancar }) => {
      const equipe = [...p.equipe];
      const i = Number(avancar);
      [equipe[i - 1], equipe[i]] = [equipe[i], equipe[i - 1]];
      salvarEquipe(equipe);
    });
    aoClicar("[data-remover]", ({ remover }) => salvarEquipe(p.equipe.filter((id) => id !== remover)));
    aoClicar("[data-adicionar]", ({ adicionar }) => salvarEquipe([...p.equipe, adicionar]));
    aoClicar("[data-habilidades]", ({ habilidades }) => mostrarHabilidades(habilidades));
  }

  // ==========================================================================
  // 7. ABA LOJA
  // ==========================================================================
  // Só suprimentos: os personagens são liberados no Modo Agente.

  // Quando não dá para comprar, o botão diz o motivo
  function botaoComprar(id, item) {
    const p = Regras.progresso;
    if ((p.inventario[id] || 0) >= Regras.LIMITE_ITEM) {
      return `<button type="button" class="botao jogo" disabled>MOCHILA CHEIA (${Regras.LIMITE_ITEM})</button>`;
    }
    if (p.moedas < item.price) {
      return `<button type="button" class="botao jogo" disabled>FALTAM ${item.price - p.moedas} NC</button>`;
    }
    return `<button type="button" class="botao jogo destaque" data-comprar="${id}">COMPRAR · ${item.price} NC</button>`;
  }

  function mostrarLoja() {
    const p = Regras.progresso;
    tela.innerHTML = `
      <div class="cabecalho aba">
        <div>
          <p class="rotulo sistema">MERCADO NEXUS // SALDO ${p.moedas} NC</p>
          <h3>Reforce a resistência.</h3>
          <p>
            Compre suprimentos para usar no seu turno da batalha. As Nexus Coins
            vêm dos níveis concluídos no Modo Agente.
          </p>
        </div>
      </div>
      <h3 class="subtitulo aba">SUPRIMENTOS</h3>
      <ul class="lista suprimentos">
        ${Object.entries(itens)
          .map(
            ([id, item]) => `
              <li class="card suprimento ${id}">
                <span class="icone suprimento">${icone(id)}</span>
                <p class="rotulo sistema quantidade">${p.inventario[id] || 0} NA MOCHILA</p>
                <h4>${escapar(item.name)}</h4>
                <p>${escapar(item.desc)}</p>
                ${botaoComprar(id, item)}
              </li>`,
          )
          .join("")}
      </ul>
      ${chamadaModoAgente()}`;

    aoClicar("[data-comprar]", ({ comprar }) => {
      if (tentar(() => Regras.comprar(comprar))) {
        avisar(`Compra confirmada: ${itens[comprar].name}.`);
        mostrar();
      }
    });
  }

  // ==========================================================================
  // 8. ABA DESAFIOS
  // ==========================================================================

  function mostrarDesafios() {
    const p = Regras.progresso;
    const linguagens = ["TODOS", ...new Set(desafios.map((d) => d.lang))];
    const visiveis = desafios
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => filtroDesafios === "TODOS" || d.lang === filtroDesafios);

    tela.innerHTML = `
      <div class="cabecalho aba">
        <div>
          <p class="rotulo sistema">DESAFIOS RÁPIDOS // ${p.desafios.length}/${desafios.length} CONCLUÍDOS</p>
          <h3>Conhecimento rende suprimentos.</h3>
          <p>Cada pergunta acertada coloca um item na mochila — uma única vez por desafio.</p>
        </div>
      </div>
      <div class="opcoes filtros desafios" role="group" aria-label="Filtrar por linguagem">
        ${linguagens
          .map(
            (l) =>
              `<button type="button" class="opcao ${l === filtroDesafios ? "ativa" : ""}" data-filtro="${escapar(l)}" aria-pressed="${l === filtroDesafios}">${escapar(l.toUpperCase())}</button>`,
          )
          .join("")}
      </div>
      <ol class="lista linhas">
        ${visiveis
          .map(({ d, i }) => {
            const feito = p.desafios.includes(d.id);
            return `
              <li class="linha rpg ${feito ? "feita" : ""}">
                <span class="numero">${doisDigitos(i + 1)}</span>
                <div>
                  <p class="rotulo sistema">${escapar(d.lang)}</p>
                  <h4>${escapar(d.q)}</h4>
                  ${pilulasRecompensas(Regras.recompensaDesafio(i))}
                </div>
                <button type="button" class="botao jogo ${feito ? "" : "destaque"}" data-desafio="${d.id}" ${feito ? "disabled" : ""}>${feito ? "✓ CONCLUÍDO" : "RESPONDER"}</button>
              </li>`;
          })
          .join("")}
      </ol>`;

    aoClicar("[data-filtro]", ({ filtro }) => {
      filtroDesafios = filtro;
      mostrar();
    });
    aoClicar("[data-desafio]", async ({ desafio: id }) => {
      const d = desafios.find((x) => x.id === id);
      const acertou = await janelaDePerguntas({
        rotulo: `DESAFIO // ${d.lang.toUpperCase()}`,
        total: 1,
        pergunta: () => d,
        responder: (n, indice) => {
          const { correta, recompensas } = Regras.responderDesafio(id, indice);
          const ganho = textoRecompensas(recompensas);
          return { correta, explicacao: ganho ? `Item recebido: ${ganho}.` : "" };
        },
        rotuloFinal: "VOLTAR AOS DESAFIOS",
      });
      // Acertou (mesmo fechando a janela no X): atualiza a lista e o painel
      if (acertou || Regras.progresso.desafios.includes(id)) mostrar();
    });
  }

  // ==========================================================================
  // 9. ABA DIÁRIO
  // ==========================================================================

  function mostrarDiario() {
    const p = Regras.progresso;
    const atual = Regras.operacaoAtual();

    const linha = (o) => {
      const feita = p.concluidas.includes(o.id);
      const eAtual = o.id === atual?.id;
      let estado = '<span class="selo bloqueado">BLOQUEADA</span>';
      if (feita) estado = '<span class="selo status">CONCLUÍDA</span>';
      else if (eAtual) estado = `<button type="button" class="botao jogo destaque" data-ir="${o.world}">IR AO MAPA →</button>`;
      return `
        <li class="linha rpg ${feita ? "feita" : eAtual ? "atual" : "bloqueada"}">
          <span class="numero">${doisDigitos(operacoes.indexOf(o) + 1)}</span>
          <div>
            <h4>${escapar(o.title)}${o.boss ? " · CHEFE" : ""}</h4>
            ${pilulasRecompensas(Regras.recompensaOperacao(o))}
          </div>
          ${estado}
        </li>`;
    };

    tela.innerHTML = `
      <div class="cabecalho aba">
        <div>
          <p class="rotulo sistema">DIÁRIO DA CAMPANHA // ${p.concluidas.length}/${operacoes.length} OPERAÇÕES</p>
          <h3>A rota até o Núcleo.</h3>
          <p>
            Cada operação vencida rende suprimentos. Os chefes de cada
            capítulo são mais fortes: evolua a equipe no Modo Agente antes
            de enfrentá-los.
          </p>
        </div>
      </div>
      ${capitulos
        .map(
          (c, m) => `
            <article class="bloco capitulo" style="--cor: ${c.color}">
              <p class="rotulo sistema">CAPÍTULO ${doisDigitos(m + 1)} // ${escapar(c.pair.toUpperCase())}</p>
              <h4>${escapar(c.name)}</h4>
              <p>${escapar(c.threat || c.intro)}</p>
              <ol class="lista linhas">${operacoes.filter((o) => o.world === m).map(linha).join("")}</ol>
            </article>`,
        )
        .join("")}`;

    // Leva ao mapa do capítulo da próxima operação
    aoClicar("[data-ir]", ({ ir }) => {
      const destino = Number(ir);
      const p2 = Regras.progresso;
      if (!p2.ativa && p2.posicao.mundo !== destino) tentar(() => Regras.viajar(destino));
      location.hash = "explorar";
    });
  }

  // ==========================================================================
  // 10. COMO JOGAR, PREFERÊNCIAS E INÍCIO
  // ==========================================================================

  function mostrarGuia() {
    abrirJanela(
      "COMO JOGAR",
      `<h3>Explore. Aprenda. Ataque!</h3>
      <ol class="lista habilidades">
        <li><strong>01 · Estude no Modo Agente</strong><small>Cada nível concluído na tela Personagens fortalece o personagem no RPG e rende Nexus Coins. Concluir os 5 níveis de um agente libera o próximo.</small></li>
        <li><strong>02 · Monte a equipe</strong><small>Até 3 agentes desbloqueados na tela Personagens. O primeiro lidera a exploração.</small></li>
        <li><strong>03 · Siga o objetivo</strong><small>A faixa acima do mapa diz o que fazer e a trilha rosa mostra o caminho. Clique em IR ATÉ LÁ, clique no chão para andar ou use W A S D / setas. O balão E mostra o que dá para fazer onde você está.</small></li>
        <li><strong>04 · Responda ao terminal</strong><small>Cada operação tem 5 perguntas. Errou? A alternativa fica marcada e você tenta outra. Acertou? Aparece a explicação.</small></li>
        <li><strong>05 · Vença a batalha</strong><small>1 · quem age, 2 · o alvo (clique no inimigo), 3 · a ação. Itens da mochila curam, recarregam energia e protegem.</small></li>
      </ol>
      <p>O progresso fica salvo neste navegador — não é preciso criar conta.</p>
      <div class="acoes jogo">
        <button type="button" class="botao primario" data-fechar-guia>COMEÇAR <span aria-hidden="true">→</span></button>
      </div>`,
    )
      .querySelector("[data-fechar-guia]")
      .addEventListener("click", (e) => e.target.closest("dialog").close());
  }

  // Lê o progresso da tela Personagens: moedas dos níveis novos e equipe só
  // com agentes que continuam desbloqueados
  function sincronizarModoAgente() {
    const { moedas, removidos } = Regras.sincronizarModoAgente();
    const mensagens = [];
    if (moedas) mensagens.push(`+${moedas} NC pelos níveis concluídos no Modo Agente.`);
    if (removidos.length) {
      const nomes = removidos.map((id) => personagem(id).name).join(", ");
      mensagens.push(`${nomes} saiu da equipe: está bloqueado na tela Personagens.`);
    }
    if (mensagens.length) avisar(mensagens.join(" "));
  }

  // Som de combate (desligado por padrão)
  const som = document.getElementById("SOM-RPG");
  try {
    som.checked = localStorage.getItem(CHAVE_SOM) === "true";
  } catch (erro) {}
  som.addEventListener("change", () => {
    try {
      localStorage.setItem(CHAVE_SOM, String(som.checked));
    } catch (erro) {}
  });

  document.getElementById("GUIA-RPG").addEventListener("click", mostrarGuia);

  document.getElementById("REINICIAR-RPG").addEventListener("click", async () => {
    const ok = await confirmar(
      "REINICIAR PROGRESSO",
      "Começar o RPG do zero?",
      "Operações, equipe, compras e itens serão apagados. O progresso do Modo Agente continua e volta a render moedas.",
      "REINICIAR",
    );
    if (!ok) return;
    Regras.reiniciar();
    sincronizarModoAgente();
    irParaExplorar();
  });

  window.addEventListener("hashchange", mostrar);

  // Atalhos da batalha: 1 a 4 habilidades, 5 ataque básico, 6 defender
  const ATALHOS_BATALHA = {
    1: '[data-habilidade="0"]',
    2: '[data-habilidade="1"]',
    3: '[data-habilidade="2"]',
    4: '[data-habilidade="3"]',
    5: '[data-acao="basico"]',
    6: '[data-acao="defender"]',
  };
  document.addEventListener("keydown", (e) => {
    if (!arena || ocupado || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector("dialog[open]") || e.target.closest?.("input, select, textarea")) return;
    const botao = ATALHOS_BATALHA[e.key] && tela.querySelector(ATALHOS_BATALHA[e.key]);
    if (!botao) return;
    e.preventDefault();
    if (botao.disabled) avisar(botao.querySelector("small")?.textContent || "Esta ação não está disponível agora.");
    else botao.click();
  });

  // Concluir níveis do Modo Agente em outra aba atualiza esta (no meio de
  // uma batalha ou de uma operação, só o painel é atualizado)
  window.addEventListener("storage", (e) => {
    if (e.key !== "cw_progresso_agentes") return;
    sincronizarModoAgente();
    if (arena || ocupado) atualizarPainel();
    else mostrar();
  });

  // Ao voltar para esta página pelo botão "voltar" do navegador
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    sincronizarModoAgente();
    mostrar();
  });

  Sprites.carregar().catch((erro) => avisar(erro.message));
  sincronizarModoAgente();
  mostrar();

  // Na primeira visita, o guia aparece sozinho
  try {
    if (!localStorage.getItem(CHAVE_GUIA)) {
      localStorage.setItem(CHAVE_GUIA, "true");
      mostrarGuia();
    }
  } catch (erro) {}
})();
