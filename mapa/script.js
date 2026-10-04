/**
 * CODEWORLD // mapa/script.js
 * Interações exclusivas da tela MAPA.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js)
 *
 *   1. Dados dos andares (territórios)
 *   2. Seleção de andar e painel de detalhes
 *   3. Zoom e arraste do mapa
 *   4. Controles (botões e teclado)
 *   5. Cronômetros regressivos dos eventos globais
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. DADOS DOS ANDARES
  // ==========================================================================
  // Para mudar textos, missões ou chefes de um andar, edite esta lista.
  // centro = ponto do andar na imagem (em %), usado para dar zoom nele.
  const ANDARES = [
    {
      nome: "Nível 0",
      linguagens: "HTML + CSS",
      cor: "#ff7a1a",
      centro: { x: 52, y: 15 },
      status: "liberado",
      descricao:
        "A fachada da Internet. Aqui o HTML ergue a estrutura de cada página e o CSS dá cor, forma e movimento ao distrito mais iluminado do CodeWorld.",
      dificuldade: "Fácil",
      chefe: "Bug Invasor",
      ameaca: 25,
      agentes: [
        { id: "html", nome: "HTML" },
        { id: "css", nome: "CSS" },
      ],
      missoes: [
        "Reconstruir a fachada do Nexus",
        "Restaurar as cores do distrito",
        "Alinhar os blocos com Flexbox",
        "Derrotar o Bug Invasor",
      ],
    },
    {
      nome: "Nível 1",
      linguagens: "JavaScript + Java",
      cor: "#2f8dff",
      centro: { x: 55, y: 40 },
      status: "liberado",
      descricao:
        "O distrito da lógica. Os sistemas de decisão da cidade rodam aqui: o JavaScript reage a cada ação e o Java guarda as regras que mantêm tudo seguro.",
      dificuldade: "Média",
      chefe: "Loop Infinito",
      ameaca: 50,
      agentes: [
        { id: "javascript", nome: "JavaScript" },
        { id: "java", nome: "Java" },
      ],
      missoes: [
        "Escape do Loop",
        "Firewall Breach",
        "Reativar os sensores de eventos",
        "Reforçar os escudos de tipos",
        "Derrotar o Loop Infinito",
      ],
    },
    {
      nome: "Nível 2",
      linguagens: "Python + Kotlin",
      cor: "#19d38a",
      centro: { x: 54, y: 62 },
      status: "explorando",
      descricao:
        "O jardim dos dados. Entre árvores digitais, o Python organiza as estratégias e o Kotlin acelera os aplicativos — mas corrupções já se espalham pela região.",
      dificuldade: "Difícil",
      chefe: "Corruptor de Dados",
      ameaca: 75,
      agentes: [
        { id: "python", nome: "Python" },
        { id: "kotlin", nome: "Kotlin" },
      ],
      missoes: [
        "Dados Perdidos",
        "Conter as corrupções no território Python",
        "Mapear as rotas mobile",
        "Recuperar o dicionário central",
        "Limpar os valores nulos",
        "Derrotar o Corruptor de Dados",
      ],
    },
    {
      nome: "Núcleo",
      linguagens: "Super IA",
      cor: "#e30071",
      centro: { x: 53, y: 85 },
      status: "bloqueado",
      descricao:
        "O coração da Super IA. Ninguém que entrou no Núcleo voltou para contar. Os sensores só captam fragmentos de dados corrompidos...",
      dificuldade: "Extrema",
      chefe: "Super IA",
      ameaca: 100,
      agentes: [],
      missoes: ["Protocolo Raiz"],
    },
  ];

  const NOMES_STATUS = {
    liberado: "LIBERADO",
    explorando: "EM EXPLORAÇÃO",
    bloqueado: "BLOQUEADO",
  };

  const viewport = document.getElementById("VIEWPORT-MAPA");
  const palco = document.getElementById("PALCO-MAPA");
  const detalhes = document.getElementById("DETALHES-ANDAR");
  const hud = document.getElementById("HUD-MAPA");
  const zoomAtual = document.getElementById("ZOOM-ATUAL");
  if (!viewport || !palco || !detalhes) return;

  const doisDigitos = (n) => String(n).padStart(2, "0");

  // ==========================================================================
  // 2. SELEÇÃO DE ANDAR E PAINEL DE DETALHES
  // ==========================================================================
  let atual = 0;

  function htmlDetalhes(i) {
    const a = ANDARES[i];
    const bloqueado = a.status === "bloqueado";

    // No Núcleo (ainda bloqueado) as informações aparecem "corrompidas"
    const missoes = a.missoes
      .map((m, k) =>
        bloqueado && k > 0
          ? ""
          : `<li><span class="numero" aria-hidden="true">${doisDigitos(k + 1)}</span> ${m}</li>`,
      )
      .join("");

    const agentes = a.agentes.length
      ? a.agentes
          .map(
            (ag) =>
              `<a class="chip agente" href="../personagens/index.html#agente-${ag.id}">${ag.nome} <span aria-hidden="true">→</span></a>`,
          )
          .join("")
      : '<span class="chip vazio">NENHUM AGENTE DETECTADO</span>';

    const proximo = ANDARES[i + 1];

    return `
      <div class="cabeca detalhes">
        <p class="rotulo sistema">DETALHES DO NÍVEL // ANDAR ${doisDigitos(i)}</p>
        <span class="selo andar ${a.status}">${NOMES_STATUS[a.status]}</span>
      </div>
      <h3>${a.nome} <span class="linguagens">${a.linguagens}</span></h3>
      <p class="descricao andar">${a.descricao}</p>

      <dl class="informacoes nivel">
        <dt class="rotulo sistema">MISSÕES</dt>
        <dd>${bloqueado ? "??" : doisDigitos(a.missoes.length)}</dd>
        <dt class="rotulo sistema">CHEFE</dt>
        <dd>${a.chefe}</dd>
        <dt class="rotulo sistema">DIFICULDADE</dt>
        <dd>${a.dificuldade}</dd>
      </dl>

      <div class="ameaca andar">
        <p class="rotulo sistema">NÍVEL DE AMEAÇA <strong>${a.ameaca}%</strong></p>
        <div class="medidor ameaca" role="meter" aria-valuemin="0" aria-valuemax="100"
          aria-valuenow="${a.ameaca}" aria-label="Nível de ameaça">
          <span style="--valor: ${a.ameaca}%"></span>
        </div>
      </div>

      <div class="bloco-detalhe">
        <p class="rotulo sistema">MISSÕES DO ANDAR</p>
        <ol class="missoes andar">
          ${missoes}
          ${bloqueado ? '<li class="corrompido">█▓▒░ DADOS CORROMPIDOS ░▒▓█</li>' : ""}
        </ol>
      </div>

      <div class="bloco-detalhe">
        <p class="rotulo sistema">AGENTES DO TERRITÓRIO</p>
        <div class="chips">${agentes}</div>
      </div>

      <div class="acoes detalhes">
        ${
          bloqueado
            ? `<p class="aviso bloqueio">Conclua os níveis anteriores para acessar o Núcleo.</p>`
            : `<a class="botao primario" href="../missoes/index.html#SECAO-MISSOES">VER MISSÕES <span aria-hidden="true">→</span></a>`
        }
        ${
          proximo
            ? `<button type="button" class="botao secundario" data-ir-andar="${i + 1}">PRÓXIMO ANDAR <span aria-hidden="true">↓</span></button>`
            : ""
        }
      </div>`;
  }

  function selecionarAndar(i, { focarNoMapa = true } = {}) {
    if (i < 0 || i >= ANDARES.length) return;
    atual = i;
    const andar = ANDARES[i];

    // Destaque do andar no mapa
    palco.querySelectorAll(".andar-mapa").forEach((botao) => {
      const ativo = Number(botao.dataset.andar) === i;
      botao.classList.toggle("selecionado", ativo);
      botao.setAttribute("aria-pressed", ativo);
    });
    viewport.style.setProperty("--cor-andar", andar.cor);

    // Atualiza o painel com uma animação de "troca de sinal"
    detalhes.style.setProperty("--cor-andar", andar.cor);
    detalhes.innerHTML = htmlDetalhes(i);
    detalhes.classList.remove("trocando");
    void detalhes.offsetWidth;
    detalhes.classList.add("trocando");

    // Com zoom, o mapa desliza até o andar escolhido
    if (focarNoMapa && zoom > 1) centralizarEm(andar.centro);
    atualizarHud();
    history.replaceState(null, "", `#nivel-${i}`);
  }

  palco.addEventListener("click", (e) => {
    const botao = e.target.closest(".andar-mapa");
    if (botao && !arrastou) selecionarAndar(Number(botao.dataset.andar));
  });

  // Duplo clique em um andar: seleciona e aproxima
  palco.addEventListener("dblclick", (e) => {
    const botao = e.target.closest(".andar-mapa");
    if (!botao) return;
    const i = Number(botao.dataset.andar);
    zoom = 2;
    selecionarAndar(i);
    centralizarEm(ANDARES[i].centro);
  });

  detalhes.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-ir-andar]");
    if (botao) selecionarAndar(Number(botao.dataset.irAndar));
  });

  // ==========================================================================
  // 3. ZOOM E ARRASTE DO MAPA
  // ==========================================================================
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;
  let zoom = 1;
  let posX = 0;
  let posY = 0;

  // Impede que o mapa saia da área visível
  function limitar() {
    const { width, height } = viewport.getBoundingClientRect();
    posX = Math.min(0, Math.max(width - width * zoom, posX));
    posY = Math.min(0, Math.max(height - height * zoom, posY));
  }

  function aplicarTransformacao() {
    limitar();
    palco.style.transform = `translate(${posX}px, ${posY}px) scale(${zoom})`;
    viewport.classList.toggle("com-zoom", zoom > 1);
    zoomAtual.textContent = `${Math.round(zoom * 100)}%`;
    atualizarHud();
  }

  function atualizarHud() {
    if (hud) {
      hud.textContent = `ANDAR: ${ANDARES[atual].nome.toUpperCase()} // ZOOM ${Math.round(zoom * 100)}%`;
    }
  }

  // Coloca um ponto do mapa (em %) no centro da área visível
  function centralizarEm(ponto) {
    const { width, height } = viewport.getBoundingClientRect();
    posX = width / 2 - (ponto.x / 100) * width * zoom;
    posY = height / 2 - (ponto.y / 100) * height * zoom;
    aplicarTransformacao();
  }

  function mudarZoom(passo) {
    const novo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + passo));
    if (novo === zoom) return;
    zoom = novo;
    // Sempre aproxima / afasta mirando o andar selecionado
    centralizarEm(ANDARES[atual].centro);
  }

  function centralizar() {
    zoom = 1;
    posX = 0;
    posY = 0;
    aplicarTransformacao();
  }

  // Arrastar com mouse ou dedo (só faz sentido com zoom)
  let arrastando = false;
  let arrastou = false;
  let inicio = { x: 0, y: 0, posX: 0, posY: 0 };

  viewport.addEventListener("pointerdown", (e) => {
    if (zoom <= 1 || e.button !== 0) return;
    arrastando = true;
    arrastou = false;
    inicio = { x: e.clientX, y: e.clientY, posX, posY };
    viewport.classList.add("arrastando");
  });

  window.addEventListener("pointermove", (e) => {
    if (!arrastando) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    // Pequenos movimentos ainda contam como clique
    if (Math.abs(dx) + Math.abs(dy) > 6) arrastou = true;
    if (!arrastou) return;
    posX = inicio.posX + dx;
    posY = inicio.posY + dy;
    aplicarTransformacao();
  });

  window.addEventListener("pointerup", () => {
    if (!arrastando) return;
    arrastando = false;
    viewport.classList.remove("arrastando");
    // Libera o clique depois que o arraste terminou
    setTimeout(() => (arrastou = false));
  });

  // Ao redimensionar a janela, o mapa se reajusta
  window.addEventListener("resize", aplicarTransformacao);

  // ==========================================================================
  // 4. CONTROLES (BOTÕES E TECLADO)
  // ==========================================================================
  const acoes = {
    subir: () => selecionarAndar(atual - 1),
    descer: () => selecionarAndar(atual + 1),
    "zoom-mais": () => mudarZoom(0.5),
    "zoom-menos": () => mudarZoom(-0.5),
    centralizar,
  };

  document.querySelectorAll(".ferramenta").forEach((botao) => {
    botao.addEventListener("click", () => acoes[botao.dataset.acao]());
  });

  // O teclado funciona quando o foco está no mapa ou nos controles dele
  // (assim as setas continuam rolando a página no resto do site)
  const explorador = document.querySelector(".explorador.mapa");
  explorador.addEventListener("keydown", (e) => {
    if (e.target.closest(".painel.detalhes")) return;
    const tecla = {
      ArrowUp: "subir",
      ArrowDown: "descer",
      "+": "zoom-mais",
      "=": "zoom-mais",
      "-": "zoom-menos",
      r: "centralizar",
      R: "centralizar",
    }[e.key];
    if (!tecla) return;
    e.preventDefault();
    acoes[tecla]();
  });

  // Começa no andar do endereço (ex.: mapa/index.html#nivel-2) ou no Nível 0
  const doEndereco = location.hash.match(/^#nivel-(\d)/);
  selecionarAndar(doEndereco ? Number(doEndereco[1]) : 0, { focarNoMapa: false });
  aplicarTransformacao();

  // ==========================================================================
  // 5. CRONÔMETROS REGRESSIVOS DOS EVENTOS GLOBAIS
  // ==========================================================================
  // Lê o tempo inicial do próprio HTML (ex.: 02:45:18) e desconta 1 segundo
  // por vez, atualizando também o atributo datetime (formato PT2H45M18S)
  document.querySelectorAll(".tempo.evento time").forEach((relogio) => {
    const [h, m, s] = relogio.textContent.trim().split(":").map(Number);
    let restante = h * 3600 + m * 60 + s;
    if (Number.isNaN(restante)) return;

    const intervalo = setInterval(() => {
      restante = Math.max(restante - 1, 0);

      const horas = Math.floor(restante / 3600);
      const minutos = Math.floor((restante % 3600) / 60);
      const segundos = restante % 60;

      relogio.textContent = `${doisDigitos(horas)}:${doisDigitos(minutos)}:${doisDigitos(segundos)}`;
      relogio.setAttribute("datetime", `PT${horas}H${minutos}M${segundos}S`);

      if (restante === 0) clearInterval(intervalo);
    }, 1000);
  });
});
