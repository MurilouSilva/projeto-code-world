/**
 * CODEWORLD // rpg/desenho.js
 * Tudo o que o RPG desenha no <canvas>:
 *
 *   1. Utilidades de animação (respeitam "Reduzir movimento")
 *   2. Sprites (pranchas da pasta img/)
 *   3. Mundo: o mapa explorável com o personagem andando
 *   4. Arena: a batalha por turnos e os efeitos de cada golpe
 *
 * As regras ficam no regras.js; aqui só se desenha o estado que elas
 * devolvem. As imagens são apenas desenhadas (nunca lidas pixel a pixel),
 * então o jogo funciona abrindo o index.html direto no navegador.
 */

// ==========================================================================
// 1. UTILIDADES DE ANIMAÇÃO
// ==========================================================================

const semMovimento = () =>
  document.documentElement.classList.contains("sem-animacao") ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Chama desenhar(t) a cada quadro, com t indo de 0 a 1. Pode ser cancelada
// por um AbortSignal (ex.: quando o jogador troca de aba no meio da animação).
function animar(duracao, desenhar, sinal) {
  return new Promise((resolve) => {
    let quadro;
    const inicio = performance.now();
    const total = Math.max(1, semMovimento() ? Math.min(duracao, 90) : duracao);
    const fim = () => {
      cancelAnimationFrame(quadro);
      sinal?.removeEventListener("abort", fim);
      resolve();
    };
    if (sinal?.aborted) return fim();
    sinal?.addEventListener("abort", fim, { once: true });

    const passo = (agora) => {
      if (sinal?.aborted) return fim();
      const t = Math.min(1, (agora - inicio) / total);
      desenhar(t);
      if (t < 1) quadro = requestAnimationFrame(passo);
      else fim();
    };
    quadro = requestAnimationFrame(passo);
  });
}

// Faixas diagonais que cruzam a janela do jogo ao entrar em uma batalha
async function transicao(container) {
  const faixa = document.createElement("div");
  faixa.className = "transicao rpg";
  container.append(faixa);
  const animacao = faixa.animate(
    [{ transform: "translateX(-110%)" }, { transform: "translateX(0)", offset: 0.45 }, { transform: "translateX(110%)" }],
    { duration: semMovimento() ? 100 : 650, easing: "ease-in-out" },
  );
  await animacao.finished.catch(() => {});
  faixa.remove();
}

// ==========================================================================
// 2. SPRITES
// ==========================================================================
// Cada personagem tem uma prancha img/personagem-ID.png com 10 quadros de
// 128 × 128: frente, direita, esquerda, costas e 6 poses (3 de caminhada,
// preparação, ataque e reação). img/inimigos.png tem os 16 inimigos.

const Sprites = (() => {
  const TAMANHO = 128;
  const DIRECOES = { down: 0, right: 1, left: 2, up: 3 };
  const PRIMEIRA_POSE = 4;
  const imagens = {};

  function carregarImagem(chave, src) {
    return new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => {
        imagens[chave] = imagem;
        resolve();
      };
      imagem.onerror = () => reject(new Error("Não foi possível carregar " + src));
      imagem.src = src;
    });
  }

  let carregamento = null;
  function carregar() {
    carregamento ??= Promise.all([
      ...DADOS_RPG.personagens.map(({ id }) => carregarImagem(id, `img/personagem-${id}.png`)),
      carregarImagem("inimigos", "img/inimigos.png"),
    ]);
    return carregamento;
  }

  const retrato = (id) => `img/retrato-${id}.png`;

  // id: "html", "css"... ou "inimigo-3". direcao: down/right/left/up, ou
  // "pose" para usar um dos 6 quadros de pose (0 a 5).
  function desenhar(ctx, id, x, y, tamanho = 64, direcao = "down", pose = 1, espelhar = false) {
    let imagem;
    let quadro;
    if (id.startsWith("inimigo-")) {
      imagem = imagens.inimigos;
      quadro = Number(id.slice(8));
    } else {
      imagem = imagens[id];
      quadro = direcao === "pose" ? PRIMEIRA_POSE + Math.max(0, Math.min(5, pose)) : DIRECOES[direcao] ?? 0;
    }
    if (!imagem) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (espelhar) {
      ctx.translate(Math.round(x + tamanho), Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(imagem, quadro * TAMANHO, 0, TAMANHO, TAMANHO, 0, 0, tamanho, tamanho);
    } else {
      ctx.drawImage(imagem, quadro * TAMANHO, 0, TAMANHO, TAMANHO, Math.round(x), Math.round(y), tamanho, tamanho);
    }
    ctx.restore();
  }

  // De lado usa as poses de caminhada; de frente e de costas a arte original
  // é dividida em tronco + duas pernas que se alternam.
  function desenharCaminhada(ctx, id, x, y, tamanho, direcao, passo) {
    if (direcao === "left" || direcao === "right") {
      desenhar(ctx, id, x, y, tamanho, "pose", passo, direcao === "left");
      return;
    }
    const imagem = imagens[id];
    if (!imagem) return;

    const origem = DIRECOES[direcao] * TAMANHO;
    const k = passo === 0 ? -2 : passo === 2 ? 2 : 0;
    const tronco = Math.round((tamanho * 88) / TAMANHO);
    const pernas = Math.round((tamanho * 40) / TAMANHO);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imagem, origem, 0, 128, 88, Math.round(x), Math.round(y), tamanho, tamanho * 88 / TAMANHO);
    ctx.drawImage(imagem, origem, 88, 64, 40, Math.round(x), Math.round(y + tronco + k), tamanho / 2, pernas);
    ctx.drawImage(imagem, origem + 64, 88, 64, 40, Math.round(x + tamanho / 2), Math.round(y + tronco - k), tamanho / 2, pernas);
    ctx.restore();
  }

  return { carregar, retrato, desenhar, desenharCaminhada };
})();

// ==========================================================================
// 3. MUNDO (MAPA EXPLORÁVEL)
// ==========================================================================
// Mapa de 25 × 17 casas de 32px. Setas/WASD andam e E/Enter/Espaço
// interagem (sem precisar clicar no mapa antes). Clicar em qualquer ponto do
// chão anda sozinho até lá. Uma trilha rosa mostra o caminho até o objetivo
// e um balão "E" aparece quando há algo para fazer onde o personagem está.

const CASA = 32;
const TECLAS_DIRECAO = {
  ArrowUp: [0, -1],
  w: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
};
const TECLAS_INTERAGIR = ["e", "Enter", " "];

// Cores de chão e parede de cada capítulo
const TEMAS_MAPA = [
  ["#191c31", "#3d425d"],
  ["#152630", "#385865"],
  ["#262139", "#4c4160"],
  ["#162a2a", "#355950"],
  ["#291d2d", "#584458"],
  ["#24202d", "#555064"],
  ["#25172f", "#59445e"],
];

const nomeTecla = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

// Direção de quem anda da casa "de" para a casa "para"
const direcaoEntre = (de, para) =>
  para.y < de.y ? "up" : para.y > de.y ? "down" : para.x < de.x ? "left" : "right";

class Mundo {
  // opcoes: { personagem (líder), seguidores [ids], aoMover(dx, dy),
  //           aoTrocarMundo(), aoInteragir(), aoErro(erro),
  //           objetivo() → {x, y} ou null, dica() → texto ou null }
  constructor(canvas, opcoes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opcoes = opcoes;
    canvas.width = 25 * CASA;
    canvas.height = 17 * CASA;

    this.posicao = { ...Regras.progresso.posicao };
    this.direcao = "down";
    // Os outros membros da equipe andam em fila atrás do líder
    this.seguidores = (opcoes.seguidores || []).map((id) => ({ id, direcao: "down", de: null }));
    this.posicionarSeguidores();
    this.teclas = new Set();
    this.ultimoPasso = 0;
    this.andando = false;
    this.passoAtual = null; // animação do passo em andamento
    this.caminhada = 0; // muda a cada caminhada nova (cancela a anterior)
    this.destino = null; // ponto clicado no mapa
    this.destruido = false;
    this.abortar = new AbortController();
    const { signal } = this.abortar;

    // O teclado vale na página toda enquanto o mapa estiver visível — menos
    // com uma janela aberta, digitando num campo ou com Ctrl/Alt apertado
    this.naTela = true;
    const observador = new IntersectionObserver(([entrada]) => (this.naTela = entrada.isIntersecting));
    observador.observe(canvas);
    signal.addEventListener("abort", () => observador.disconnect());

    const podeUsarTeclado = (e) =>
      this.naTela &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !document.querySelector("dialog[open]") &&
      !e.target.closest?.("input, select, textarea");

    document.addEventListener(
      "keydown",
      (e) => {
        if (!podeUsarTeclado(e)) return;
        const tecla = nomeTecla(e);
        if (TECLAS_INTERAGIR.includes(tecla)) {
          // Enter e Espaço continuam acionando o botão ou link que tem o foco
          if (tecla !== "e" && e.target !== canvas && e.target.closest?.("button, a, summary")) return;
          e.preventDefault();
          if (!e.repeat) opcoes.aoInteragir();
        } else if (TECLAS_DIRECAO[tecla]) {
          e.preventDefault();
          this.caminhada++; // usar o teclado cancela a caminhada automática
          this.destino = null;
          this.teclas.add(tecla);
          // Um toque rápido já anda uma casa; segurar continua andando
          if (!e.repeat) {
            this.mover(...TECLAS_DIRECAO[tecla]);
            this.ultimoPasso = performance.now();
          }
        }
      },
      { signal },
    );
    document.addEventListener("keyup", (e) => this.teclas.delete(nomeTecla(e)), { signal });
    window.addEventListener("blur", () => this.teclas.clear(), { signal });

    // Clicar no chão anda até lá; clicar no próprio personagem interage
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        canvas.focus({ preventScroll: true });
        const r = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - r.left) / r.width) * 25);
        const y = Math.floor(((e.clientY - r.top) / r.height) * 17);
        if (x === this.posicao.x && y === this.posicao.y && !this.andando) opcoes.aoInteragir();
        else this.caminharAte(x, y);
      },
      { signal },
    );

    this.montarFundo();
    this.repetir = (agora) => {
      if (this.destruido) return;
      if (!document.hidden) {
        // Segurar a tecla anda uma casa a cada 170ms
        if (this.teclas.size && agora - this.ultimoPasso > 170) {
          const direcao = TECLAS_DIRECAO[[...this.teclas].at(-1)];
          if (direcao) this.mover(...direcao);
          this.ultimoPasso = agora;
        }
        this.desenhar(agora);
      }
      this.quadro = requestAnimationFrame(this.repetir);
    };
    this.quadro = requestAnimationFrame(this.repetir);
  }

  get mapa() {
    return DADOS_RPG.mapas[this.posicao.mundo];
  }

  get capitulo() {
    return DADOS_RPG.capitulos[this.posicao.mundo];
  }

  // Paredes, chão e decoração não mudam: ficam guardados num canvas à parte
  montarFundo() {
    const fundo = document.createElement("canvas");
    fundo.width = this.canvas.width;
    fundo.height = this.canvas.height;
    const x = fundo.getContext("2d");
    const { mapa, capitulo } = this;
    const [chao, parede] = TEMAS_MAPA[this.posicao.mundo];

    for (let ty = 0; ty < 17; ty++) {
      for (let tx = 0; tx < 25; tx++) {
        const px = tx * CASA;
        const py = ty * CASA;
        const ehParede = mapa.rows[ty][tx] === "#";
        x.fillStyle = ehParede ? parede : chao;
        x.fillRect(px, py, CASA, CASA);
        if (ehParede) {
          x.fillStyle = "#8992a0";
          x.fillRect(px, py, 32, 3);
          x.fillStyle = "#0d0e1f";
          x.fillRect(px, py + 26, 32, 6);
          x.fillStyle = "#50546e";
          x.fillRect(px + 3, py + 6, 26, 16);
          x.fillStyle = capitulo.color;
          x.fillRect(px + 4, py + 7, 16, 2);
          x.fillStyle = "#8294a0";
          x.fillRect(px + 24, py + 18, 3, 4);
        } else {
          x.fillStyle = "#ffffff09";
          x.fillRect(px, py, 31, 1);
          x.fillRect(px, py, 1, 31);
          if ((tx * 3 + ty) % 7 === 0) {
            x.fillStyle = "#ffffff10";
            x.fillRect(px + 7, py + 8, 4, 2);
            x.fillRect(px + 17, py + 20, 7, 1);
          }
          if ((tx + ty * 2) % 13 === 0) {
            x.fillStyle = capitulo.color + "38";
            x.fillRect(px + 4, py + 26, 21, 1);
          }
        }
      }
    }

    // Computadores decorativos (no Jardim dos Dados, cercados de plantas)
    for (const [tx, ty] of [[2, 8], [10, 9], [18, 3], [21, 15]]) {
      const px = tx * CASA;
      const py = ty * CASA;
      x.fillStyle = "#080c1b";
      x.fillRect(px + 4, py + 2, 25, 29);
      x.fillStyle = capitulo.color + "aa";
      x.fillRect(px + 7, py + 5, 19, 13);
      x.fillStyle = "#b2fbff";
      x.fillRect(px + 9, py + 7, 10, 2);
      x.fillStyle = "#38394e";
      x.fillRect(px + 6, py + 22, 20, 4);
      if (capitulo.tile === "garden") {
        x.fillStyle = "#3d8e72";
        for (let k = 0; k < 5; k++) x.fillRect(px + 3 + k * 5, py - 6 - (k % 2) * 6, 5, 20);
      }
    }

    // Placas das áreas
    for (const [sx, sy, rotulo] of [[2, 2, "NEXUS"], [10, 7, "REDE"], [18, 12, "CORRUPTOR"]]) {
      x.fillStyle = capitulo.color + "22";
      x.fillRect(sx * CASA, sy * CASA, 150, 2);
      x.fillRect(sx * CASA, sy * CASA, 2, 26);
      x.font = "10px monospace";
      x.fillStyle = capitulo.color + "99";
      x.fillText(rotulo, sx * CASA + 9, sy * CASA + 19);
    }

    // Terminal de estudo (leva ao Modo Agente)
    const [ex, ey] = mapa.terminal;
    x.fillStyle = "#0a101d";
    x.fillRect(ex * CASA + 6, ey * CASA + 6, 20, 16);
    x.fillStyle = "#00f2fe";
    x.fillRect(ex * CASA + 8, ey * CASA + 8, 16, 2);
    x.fillRect(ex * CASA + 8, ey * CASA + 12, 10, 2);
    x.fillStyle = "#2b3550";
    x.fillRect(ex * CASA + 12, ey * CASA + 22, 8, 6);
    x.font = "8px monospace";
    x.textAlign = "center";
    x.fillStyle = "#7cf9ff";
    x.fillText("AULAS", ex * CASA + 16, ey * CASA + 4);

    this.fundo = fundo;
  }

  // Monta a fila: cada seguidor numa casa de chão vizinha à de quem está à
  // frente — de preferência atrás dele (o líder começa virado para baixo,
  // então "atrás" é a casa de cima). Sem espaço, fica na mesma casa.
  posicionarSeguidores() {
    const ocupadas = new Set([`${this.posicao.x},${this.posicao.y}`]);
    let frente = this.posicao;
    for (const seguidor of this.seguidores) {
      const vizinha = [[0, -1], [-1, 0], [1, 0], [0, 1]]
        .map(([dx, dy]) => ({ x: frente.x + dx, y: frente.y + dy }))
        .find((casa) => this.mapa.rows[casa.y]?.[casa.x] === "." && !ocupadas.has(`${casa.x},${casa.y}`));
      const casa = vizinha || { x: frente.x, y: frente.y };
      ocupadas.add(`${casa.x},${casa.y}`);
      Object.assign(seguidor, casa, { de: null, direcao: direcaoEntre(casa, frente) });
      frente = casa;
    }
  }

  // A fila anda junto: cada seguidor vai para a casa de quem está à frente
  moverSeguidores(lider) {
    let frente = lider;
    for (const seguidor of this.seguidores) {
      const atras = { x: seguidor.x, y: seguidor.y };
      seguidor.de = atras;
      if (frente.x !== atras.x || frente.y !== atras.y) seguidor.direcao = direcaoEntre(atras, frente);
      seguidor.x = frente.x;
      seguidor.y = frente.y;
      frente = atras;
    }
  }

  // Anda uma casa. Devolve true se andou (false: parede, operação aberta...)
  async mover(dx, dy) {
    if (this.andando || this.destruido || Regras.progresso.ativa) return false;
    this.direcao = dy < 0 ? "up" : dy > 0 ? "down" : dx < 0 ? "left" : "right";
    const { x, y } = this.posicao;
    if (this.mapa.rows[y + dy]?.[x + dx] !== ".") return false;

    let resultado;
    try {
      resultado = this.opcoes.aoMover(dx, dy);
    } catch (erro) {
      this.opcoes.aoErro?.(erro);
      return false;
    }

    // Desliza o personagem (e a fila atrás dele) da casa atual até a próxima
    this.andando = true;
    this.de = { x, y };
    this.para = { x: x + dx, y: y + dy };
    this.moverSeguidores(this.de);
    this.inicio = performance.now();
    this.passoAtual = animar(180, () => {}, this.abortar.signal);
    await this.passoAtual;
    this.andando = false;
    this.de = this.para = null;
    this.seguidores.forEach((seguidor) => (seguidor.de = null));
    if (this.destruido) return false;

    this.posicao = { ...Regras.progresso.posicao };
    if (resultado?.mundoMudou) {
      this.opcoes.aoTrocarMundo?.();
      return false;
    }
    return true;
  }

  // Anda sozinho, casa por casa, pelo caminho mais curto até [x, y].
  // aoChegar() é chamado só se o personagem chegar lá.
  async caminharAte(x, y, aoChegar) {
    if (this.destruido || Regras.progresso.ativa) return;
    const id = ++this.caminhada;
    await this.passoAtual; // espera o passo em andamento terminar
    if (this.destruido || id !== this.caminhada) return;

    const passos = Regras.rota(x, y);
    if (!passos) {
      this.opcoes.aoErro?.(new Error("Não dá para chegar aí: clique em um ponto do chão."));
      return;
    }
    this.destino = { x, y };
    for (const [dx, dy] of passos) {
      if (this.destruido || id !== this.caminhada) return;
      if (!(await this.mover(dx, dy))) break;
    }
    if (this.destruido || id !== this.caminhada) return;
    this.destino = null;
    if (this.posicao.x === x && this.posicao.y === y) aoChegar?.();
  }

  // Pontinhos rosa do personagem até o destino (o ponto clicado ou o objetivo)
  desenharTrilha(x, destino, agora) {
    const { mundo, x: ox, y: oy } = Regras.progresso.posicao;
    const chave = `${mundo}:${ox},${oy}>${destino.x},${destino.y}`;
    if (this.trilha?.chave !== chave) this.trilha = { chave, passos: Regras.rota(destino.x, destino.y) || [] };

    let cx = ox;
    let cy = oy;
    const brilho = semMovimento() ? 1 : 0.65 + 0.35 * Math.sin(agora / 300);
    this.trilha.passos.forEach(([dx, dy], i) => {
      cx += dx;
      cy += dy;
      if (i === this.trilha.passos.length - 1) return; // o destino já tem destaque
      x.fillStyle = `rgba(255, 100, 173, ${(0.35 + 0.4 * brilho).toFixed(2)})`;
      x.fillRect(cx * CASA + 13, cy * CASA + 13, 6, 6);
    });

    // Destino clicado no chão (o objetivo já é marcado pelo terminal ou portal)
    if (this.destino) {
      x.strokeStyle = "#ff64ad";
      x.lineWidth = 2;
      x.strokeRect(destino.x * CASA + 4, destino.y * CASA + 4, 24, 24);
    }
  }

  // Balão com a tecla E e o que ela faz ali (ex.: "E INICIAR OPERAÇÃO")
  desenharDica(x, px, py, texto) {
    x.font = "bold 10px monospace";
    const largura = Math.ceil(x.measureText(texto).width) + 26;
    const bx = Math.round(Math.max(2, Math.min(this.canvas.width - largura - 2, px + 16 - largura / 2)));
    const by = Math.round(Math.max(2, py - 44));
    x.fillStyle = "rgba(10, 14, 31, 0.92)";
    x.fillRect(bx, by, largura, 18);
    x.strokeStyle = "#00f2fe";
    x.lineWidth = 1;
    x.strokeRect(bx + 0.5, by + 0.5, largura - 1, 17);
    x.fillStyle = "#00f2fe";
    x.fillRect(bx + 4, by + 4, 12, 10);
    x.fillStyle = "#0a0e1f";
    x.textAlign = "center";
    x.fillText("E", bx + 10, by + 13);
    x.fillStyle = "#e8e6f0";
    x.textAlign = "left";
    x.fillText(texto, bx + 21, by + 13);
  }

  desenhar(agora) {
    const x = this.ctx;
    const { concluidas } = Regras.progresso;
    const atual = Regras.operacaoAtual();
    const reduzido = semMovimento();
    x.drawImage(this.fundo, 0, 0);

    // Trilha até o ponto clicado ou, se não houver, até o objetivo atual
    const destino = this.destino || this.opcoes.objetivo?.();
    if (destino && !Regras.progresso.ativa) this.desenharTrilha(x, destino, agora);

    // Terminais das 5 operações do capítulo: verde = concluída, rosa = próxima
    this.mapa.stages.forEach(([tx, ty], i) => {
      const operacao = DADOS_RPG.operacoes.find((o) => o.world === this.posicao.mundo && o.phase === i + 1);
      if (!operacao) return;
      const feita = concluidas.includes(operacao.id);
      const proxima = atual?.id === operacao.id;
      const px = tx * CASA;
      const py = ty * CASA;
      x.fillStyle = feita ? "#3decc9" : proxima ? "#ff458e" : "#55586a";
      x.fillRect(px + 4, py + 17, 24, 12);
      x.fillStyle = "#0a101d";
      x.fillRect(px + 7, py + 19, 18, 7);
      x.fillStyle = feita ? "#3decc9" : proxima ? "#ff87c2" : "#69717c";
      x.font = "10px monospace";
      x.textAlign = "center";
      x.fillText(feita ? "OK" : String(i + 1), px + 16, py + 26);
      if (proxima) {
        const salto = reduzido ? 0 : Math.round(Math.sin(agora / 240) * 3);
        x.fillStyle = "#ff64ad";
        x.fillRect(px + 13, py - 5 + salto, 6, 6);
        x.strokeStyle = "#ff458e";
        x.strokeRect(px + 1, py + 1, 30, 30);
      }
    });

    // Portal para o próximo capítulo (aceso quando liberado)
    const [portalX, portalY] = this.mapa.portal;
    const aberto = this.posicao.mundo < Regras.mundoLiberado() || !atual;
    x.fillStyle = aberto ? "#3af5cf" : "#5a365c";
    x.fillRect(portalX * CASA + 3, portalY * CASA - 16, 26, 46);
    x.fillStyle = "#0a0e21";
    x.fillRect(portalX * CASA + 7, portalY * CASA - 12, 18, 39);
    if (aberto) {
      x.fillStyle = "#29d9c699";
      x.fillRect(portalX * CASA + 9, portalY * CASA - 9, 14, 34);
    }

    // NPC: a dupla do capítulo (no Núcleo, Kotlin representa a resistência)
    const [nx, ny] = this.mapa.npc;
    Sprites.desenhar(x, this.capitulo.id === "core" ? "kotlin" : this.capitulo.id, nx * CASA - 8, ny * CASA - 22, 48);
    x.font = "9px monospace";
    x.textAlign = "center";
    x.fillStyle = "#b3e7f8";
    x.fillText("NPC", nx * CASA + 16, ny * CASA - 23);

    // Equipe: o líder e a fila atrás dele, deslizando entre duas casas
    // enquanto andam
    const t = this.de ? Math.min(1, (agora - this.inicio) / 145) : 1;
    const ponto = (de, para) => ({
      px: ((de ? de.x + (para.x - de.x) * t : para.x) * CASA),
      py: ((de ? de.y + (para.y - de.y) * t : para.y) * CASA),
    });
    const lider = {
      id: this.opcoes.personagem,
      direcao: this.direcao,
      andando: this.andando,
      lider: true,
      ...ponto(this.de, this.para || this.posicao),
    };
    const equipe = [
      ...this.seguidores.map((s) => ({
        id: s.id,
        direcao: s.direcao,
        andando: Boolean(s.de) && (s.de.x !== s.x || s.de.y !== s.y),
        ...ponto(s.de, s),
      })),
      lider,
    ];

    // Quem está mais embaixo na tela é desenhado por cima; empate: o líder
    equipe.sort((a, b) => a.py - b.py || (a.lider ? 1 : b.lider ? -1 : 0));
    for (const membro of equipe) {
      x.fillStyle = "#02020a99";
      x.fillRect(Math.round(membro.px + 4), Math.round(membro.py + 23), 25, 6);
      if (membro.andando && !reduzido) {
        const passo = Math.floor(agora / 60) % 3;
        Sprites.desenharCaminhada(x, membro.id, membro.px - 9, membro.py - 22, 50, membro.direcao, passo);
      } else {
        Sprites.desenhar(x, membro.id, membro.px - 9, membro.py - 22, 50, membro.direcao);
      }
    }

    // Parado perto de algo, mostra o que a tecla E faz ali (sobre o líder)
    const dica = this.andando ? null : this.opcoes.dica?.();
    if (dica) this.desenharDica(x, lider.px, lider.py, dica);
  }

  destruir() {
    this.destruido = true;
    this.abortar.abort();
    cancelAnimationFrame(this.quadro);
    this.teclas.clear();
  }
}

// ==========================================================================
// 4. ARENA (BATALHA POR TURNOS)
// ==========================================================================
// A arena guarda uma cópia da batalha e vai aplicando os eventos devolvidos
// pelo regras.js, um por vez, com animação: golpe → dano → efeito...

// Cor de cada efeito visual (campo fx das habilidades)
const CORES_FX = {
  laser: "#7cfcff",
  bullet: "#ffe36a",
  barrage: "#ffb765",
  slash: "#fbd95e",
  wave: "#eaff90",
  fear: "#bb75fa",
  duo: "#fff59b",
  bike: "#66f7ec",
  charge: "#ffb463",
  punch: "#ff9365",
  explosion: "#ffad54",
  missile: "#fe798b",
  heal: "#6af4cb",
  serpent: "#53cfff",
  bind: "#8bc4ff",
  poison: "#dfd649",
  genesis: "#b57efc",
  shield: "#77ecff",
  barrier: "#70d5ff",
  boost: "#ffe89b",
  hack: "#c694fa",
  grenade: "#c985fc",
  strike: "#e9edff",
};
const FX_AURA = ["shield", "barrier", "heal", "genesis", "boost", "fear", "hack", "bind", "poison"];
const FX_CORTE = ["slash", "wave", "duo", "punch", "strike"];
const FX_EXPLOSAO = ["explosion", "grenade", "missile"];
const FX_CORPO_A_CORPO = ["charge", "bike", "punch", "strike"];
const SIGLAS_EFEITOS = { poison: "VEN", bleed: "SAN", weakness: "FRQ", stun: "ATD", fortify: "FOR", boost: "POT" };

// Poses do atlas: 0-2 caminhada, 3 preparação, 4 ataque, 5 reação
const POSE_PREPARO = 3;
const POSE_ATAQUE = 4;
const POSE_REACAO = 5;

class Arena {
  // aoAtualizar(batalha) é chamado quando a vida/energia/efeitos mudam;
  // aoClicarUnidade(unidade) quando o jogador clica num personagem da arena
  constructor(canvas, batalha, aoAtualizar, aoClicarUnidade) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    canvas.width = 960;
    canvas.height = 420;
    this.b = structuredClone(batalha);
    this.aoAtualizar = aoAtualizar;
    this.alvo = null; // uid do inimigo escolhido (ganha a seta rosa)
    this.poses = {};
    this.fx = null;
    this.numero = null;
    this.piscando = {};
    this.abortar = new AbortController();
    this.destruida = false;
    this.audio = null;

    // Clicar num aliado escolhe quem age; num inimigo, o alvo
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * canvas.width;
        const my = ((e.clientY - r.top) / r.height) * canvas.height;
        const clicada = [...this.b.aliados, ...this.b.inimigos].find((u) => {
          const p = this.posicao(u.uid);
          return u.vida > 0 && Math.abs(mx - p.x) <= p.tamanho / 2 && my >= p.y - p.tamanho && my <= p.y;
        });
        if (clicada) aoClicarUnidade?.(clicada);
      },
      { signal: this.abortar.signal },
    );

    this.repetir = (agora) => {
      if (this.destruida) return;
      if (!document.hidden) this.desenhar(agora);
      this.quadro = requestAnimationFrame(this.repetir);
    };
    this.desenhar(performance.now());
    this.quadro = requestAnimationFrame(this.repetir);
  }

  // Aliados em diagonal à esquerda; inimigos à direita
  posicao(uid) {
    let i = this.b.aliados.findIndex((u) => u.uid === uid);
    if (i >= 0) return { x: 130 + i * 123, y: 343 + (i % 2) * 13, tamanho: 122 };
    i = this.b.inimigos.findIndex((u) => u.uid === uid);
    const muitos = this.b.inimigos.length > 3;
    return { x: 565 + i * (muitos ? 103 : 125), y: 232 + (i % 2) * 13, tamanho: muitos ? 100 : 112 };
  }

  unidade(uid) {
    return [...this.b.aliados, ...this.b.inimigos].find((u) => u.uid === uid);
  }

  // Bipe curto de 8 bits (só com "Som de combate" ligado)
  bipe(fx) {
    if (!document.getElementById("SOM-RPG")?.checked) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const a = this.audio;
      const oscilador = a.createOscillator();
      const volume = a.createGain();
      oscilador.type = ["slash", "punch", "bike"].includes(fx) ? "sawtooth" : "square";
      oscilador.frequency.setValueAtTime(["heal", "shield", "genesis"].includes(fx) ? 560 : 220, a.currentTime);
      oscilador.frequency.exponentialRampToValueAtTime(90, a.currentTime + 0.16);
      volume.gain.setValueAtTime(0.025, a.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.2);
      oscilador.connect(volume).connect(a.destination);
      oscilador.start();
      oscilador.stop(a.currentTime + 0.22);
    } catch (erro) {}
  }

  desenharCenario(c) {
    c.fillStyle = "#080b1b";
    c.fillRect(0, 0, 960, 420);

    // Prédios em pixel art ao fundo
    c.fillStyle = "#121b34";
    c.fillRect(0, 128, 960, 100);
    for (let i = 0; i < 24; i++) {
      const altura = 35 + ((i * 17) % 76);
      const x = i * 43;
      c.fillStyle = i % 2 ? "#1c2944" : "#172139";
      c.fillRect(x, 135 - altura, 37, altura + 80);
      c.fillStyle = "#306070";
      for (let k = 0; k < 5; k++) c.fillRect(x + 7, 146 - altura + k * 12, 5, 3);
      if (i % 3 === 0) {
        c.fillStyle = "#a0376b";
        c.fillRect(x + 22, 130 - altura, 4, 9);
      }
    }

    // Chão com grade em perspectiva
    c.fillStyle = "#141529";
    c.fillRect(0, 215, 960, 205);
    c.strokeStyle = "#244b5e";
    c.lineWidth = 1;
    for (let x = -1000; x < 2000; x += 125) {
      c.beginPath();
      c.moveTo(480 + (x - 480) * 0.16, 215);
      c.lineTo(x, 420);
      c.stroke();
    }
    for (let y = 225; y < 420; y += Math.max(12, (y - 200) * 0.18)) {
      c.beginPath();
      c.moveTo(0, Math.round(y));
      c.lineTo(960, Math.round(y));
      c.stroke();
    }

    // Plataformas: ciano para a equipe, magenta para os inimigos
    const plataforma = (x, y, largura, cor) => {
      c.fillStyle = "#0a0c17";
      c.beginPath();
      c.moveTo(x - largura / 2, y);
      c.lineTo(x + largura / 2, y);
      c.lineTo(x + largura / 2 + 35, y + 30);
      c.lineTo(x - largura / 2 - 35, y + 30);
      c.fill();
      c.fillStyle = cor;
      c.fillRect(x - largura / 2, y + 28, largura, 3);
    };
    plataforma(245, 337, 350, "#00c5db");
    plataforma(734, 224, 330, "#d62786");
  }

  desenhar(agora) {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    this.desenharCenario(c);

    for (const u of [...this.b.inimigos, ...this.b.aliados]) {
      const p = this.posicao(u.uid);
      const pose = this.poses[u.uid] || {};
      c.save();
      c.globalAlpha = u.vida <= 0 ? 0.25 : 1;
      if (this.piscando[u.uid]) c.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(agora / 25));
      const x = p.x - p.tamanho / 2 + (pose.dx || 0);
      const y = p.y - p.tamanho + (pose.dy || 0);
      if (u.lado === "aliados") {
        if (pose.quadro !== undefined) Sprites.desenhar(c, u.id, x, y, p.tamanho, "pose", pose.quadro);
        else Sprites.desenhar(c, u.id, x, y, p.tamanho, "right");
      } else {
        Sprites.desenhar(c, "inimigo-" + u.sprite, x, y, p.tamanho);
      }
      c.restore();

      if (u.efeitos?.length) {
        c.font = "10px monospace";
        c.textAlign = "center";
        c.fillStyle = "#e0d8ff";
        c.fillText(u.efeitos.map((e) => SIGLAS_EFEITOS[e.tipo]).join(" · "), p.x, p.y + 14);
      }
      // Setas acima de quem vai agir (ciano) e do alvo escolhido (rosa)
      const vaiAgir = this.b.aliados[this.b.vez]?.uid === u.uid;
      if ((vaiAgir || this.alvo === u.uid) && u.vida > 0) {
        const salto = semMovimento() ? 0 : Math.round(Math.sin(agora / 200) * 2);
        this.desenharSeta(c, p.x, p.y - p.tamanho - 16 + salto, vaiAgir ? "#4df6ff" : "#ff3d9a");
      }
    }

    if (this.fx) this.desenharFx(c, this.fx);
    if (this.numero) {
      const n = this.numero;
      const p = this.posicao(n.uid);
      c.font = "bold 22px monospace";
      c.textAlign = "center";
      c.fillStyle = n.cor;
      c.fillText(n.texto, p.x, p.y - 105 - n.t * 35);
    }
  }

  // Seta em pixel art apontando para baixo
  desenharSeta(c, x, y, cor) {
    c.fillStyle = cor;
    for (let linha = 0; linha < 4; linha++) {
      c.fillRect(Math.round(x - 8 + linha * 2), Math.round(y + linha * 2), 16 - linha * 4, 2);
    }
  }

  desenharFx(c, fx) {
    const origem = this.posicao(fx.autor);
    const cor = CORES_FX[fx.tipo] || "#8cf9ff";
    const t = fx.t;
    c.fillStyle = cor;
    c.strokeStyle = cor;

    for (const uid of fx.alvos) {
      const destino = this.posicao(uid);
      const sx = origem.x;
      const sy = origem.y - 65;
      const tx = destino.x;
      const ty = destino.y - 65;

      if (FX_AURA.includes(fx.tipo)) {
        // Quadrado que cresce ao redor do alvo, com partículas girando
        const raio = 20 + Math.floor(t * 35);
        c.lineWidth = 3;
        c.strokeRect(tx - raio, ty - raio, raio * 2, raio * 2);
        for (let k = 0; k < 14; k++) {
          const a = k * 2.4 + t * 5;
          c.fillRect(Math.round(tx + Math.cos(a) * raio), Math.round(ty + Math.sin(a) * raio), 4, 6);
        }
        if (fx.tipo === "heal" || fx.tipo === "genesis") {
          for (let k = 0; k < 5; k++) {
            const xx = tx - 30 + k * 15;
            const yy = ty + 30 - t * 70 + (k % 2) * 10;
            c.fillRect(xx, yy, 4, 13);
            c.fillRect(xx - 5, yy + 5, 14, 4);
          }
        }
      } else if (FX_CORTE.includes(fx.tipo)) {
        // Riscos diagonais e estilhaços
        const riscos = fx.tipo === "duo" ? 5 : 3;
        c.lineWidth = fx.tipo === "punch" ? 9 : 4;
        for (let k = 0; k < riscos; k++) {
          c.beginPath();
          c.moveTo(tx - 45 + k * 10, ty - 30 + Math.floor(t * 20));
          c.lineTo(tx - 10 + k * 15, ty + 30);
          c.stroke();
        }
        for (let k = 0; k < 14; k++) {
          const a = k * 2.4;
          const distancia = t * 60;
          c.fillRect(Math.round(tx + Math.cos(a) * distancia), Math.round(ty + Math.sin(a) * distancia), 4, 4);
        }
      } else if (FX_EXPLOSAO.includes(fx.tipo) && t > 0.5) {
        const raio = (t - 0.5) * 140;
        for (let k = 0; k < 20; k++) {
          const a = k * 1.9;
          c.fillStyle = k % 2 ? "#ffe37b" : cor;
          c.fillRect(Math.round(tx + Math.cos(a) * raio), Math.round(ty + Math.sin(a) * raio), 8, 8);
        }
        c.fillStyle = "#fff0b5";
        c.fillRect(tx - 12, ty - 12, 24, 24);
      } else {
        // Projéteis que viajam do autor até o alvo (e o míssil antes de explodir)
        const tiros = ["bullet", "barrage", "missile"].includes(fx.tipo)
          ? Math.min(6, fx.golpes || 3)
          : fx.tipo === "serpent"
            ? 2
            : 1;
        for (let k = 0; k < tiros; k++) {
          const v = Math.max(0, Math.min(1, t * 1.25 - k * 0.08));
          const px = Math.round(sx + (tx - sx) * v);
          const ondulacao = fx.tipo === "serpent" ? Math.sin(v * 9 + k * 3) * 18 : k * 7;
          const py = Math.round(sy + (ty - sy) * v + ondulacao);
          c.fillStyle = k % 2 && fx.tipo === "serpent" ? "#f8da4b" : cor;
          c.fillRect(px - 14, py - 2, 28, 5);
          for (let z = 0; z < 3; z++) c.fillRect(px - z * 9, py - 1, 4, 3);
          if (fx.tipo === "laser") {
            c.fillStyle = "#d5ffff";
            c.fillRect(sx, sy, Math.max(0, px - sx), 2);
          }
        }
      }
    }
  }

  // Toca os eventos de uma ação em sequência. registrar(texto) escreve no log.
  async tocar(eventos, registrar) {
    const sinal = this.abortar.signal;
    for (const e of eventos) {
      if (this.destruida) return;

      if (e.tipo === "golpe") {
        registrar(e.nome);
        this.bipe(e.fx);
        await animar(160, (t) => {
          this.poses[e.autor] = { quadro: POSE_PREPARO, dy: -Math.round(Math.sin(t * Math.PI) * 5) };
        }, sinal);
        const corpoACorpo = FX_CORPO_A_CORPO.includes(e.fx);
        const sentido = this.unidade(e.autor)?.lado === "aliados" ? 90 : -90;
        await animar(["barrage", "duo", "missile"].includes(e.fx) ? 600 : 410, (t) => {
          this.poses[e.autor] = { quadro: POSE_ATAQUE, dx: corpoACorpo ? Math.round(Math.sin(t * Math.PI) * sentido) : 0 };
          this.fx = { tipo: e.fx, autor: e.autor, alvos: e.alvos, t, golpes: e.golpes };
          // No ataque em dupla, Java aparece atacando junto
          if (e.fx === "duo") {
            const java = this.b.aliados.find((u) => u.id === "java");
            if (java) this.poses[java.uid] = { quadro: POSE_ATAQUE };
          }
        }, sinal);
        this.fx = null;
        this.poses = {};
      } else if (["dano", "cura", "veneno", "sangramento"].includes(e.tipo)) {
        const u = this.unidade(e.alvo);
        if (u) {
          u.vida = e.vida;
          this.aoAtualizar?.(this.b);
        }
        const cura = e.tipo === "cura";
        if (e.tipo === "veneno") registrar(`${u?.nome} sofre ${e.valor} de veneno.`);
        if (e.tipo === "sangramento") registrar(`${u?.nome} sofre ${e.valor} de sangramento.`);
        this.piscando[e.alvo] = !cura;
        this.poses[e.alvo] = { quadro: cura ? 1 : POSE_REACAO };
        await animar(280, (t) => {
          this.numero = { uid: e.alvo, texto: (cura ? "+" : "−") + e.valor, cor: cura ? "#70ffd5" : "#fff0ab", t };
        }, sinal);
        this.numero = null;
        delete this.piscando[e.alvo];
        delete this.poses[e.alvo];
      } else if (e.tipo === "efeito") {
        const u = this.unidade(e.alvo);
        if (u) {
          u.efeitos = u.efeitos.filter((x) => x.tipo !== e.efeito);
          u.efeitos.push({ tipo: e.efeito, turnos: e.turnos });
          this.aoAtualizar?.(this.b);
        }
      } else if (e.tipo === "resistiu") {
        registrar(`${this.unidade(e.alvo)?.nome} resistiu a ${Regras.EFEITOS[e.efeito]}.`);
      } else if (e.tipo === "energia") {
        const u = this.unidade(e.alvo);
        if (u) {
          u.energia = e.energia;
          this.aoAtualizar?.(this.b);
        }
        registrar(`Bateria: +${e.valor} de energia.`);
      } else if (e.tipo === "atordoado") {
        registrar(`${this.unidade(e.alvo)?.nome} perdeu a ação por Atordoamento.`);
        await animar(200, () => {}, sinal);
      } else if (e.tipo === "reforco") {
        this.b.inimigos.push(e.unidade);
        this.aoAtualizar?.(this.b);
        registrar("Uma duplicata entrou no combate.");
      } else if (e.tipo === "rodada") {
        registrar(`Rodada ${e.rodada} · sua equipe pode agir.`);
      }
    }
  }

  // Troca a cópia local pelo estado final da batalha
  sincronizar(batalha) {
    this.b = structuredClone(batalha);
    this.poses = {};
    this.fx = null;
    this.desenhar(performance.now());
  }

  destruir() {
    this.destruida = true;
    this.abortar.abort();
    cancelAnimationFrame(this.quadro);
    this.audio?.close().catch(() => {});
  }
}
