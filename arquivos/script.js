/**
 * CODEWORLD // arquivos/script.js
 * Interações exclusivas da tela ARQUIVOS.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js)
 *
 *   1. Som automático do vídeo da Super IA
 *   2. Fichas dos personagens (abas, abrir/fechar e efeitos de hack)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. SOM AUTOMÁTICO DO VÍDEO DA SUPER IA
  // ==========================================================================
  // O vídeo tenta tocar COM som assim que a página abre. Alguns navegadores
  // bloqueiam som automático até a pessoa interagir com o site; nesse caso o
  // vídeo começa mudo e o som entra sozinho no primeiro clique, toque ou
  // tecla em qualquer lugar da página.
  const video = document.getElementById("VIDEO-SUPERIA");
  const botao = document.getElementById("BOTAO-SOM");
  if (!video) return;

  // Se a pessoa silenciar pelo botão, o som não volta sozinho
  let silenciadoPeloUsuario = false;

  function atualizarBotao() {
    if (!botao) return;
    const mudo = video.muted;
    botao.querySelector(".icone.som").textContent = mudo ? "🔇" : "🔊";
    botao.setAttribute("aria-label", mudo ? "Ativar som do vídeo" : "Silenciar vídeo");
  }

  function tocarComSom() {
    video.muted = false;
    return video.play().then(atualizarBotao);
  }

  // Liga o som na primeira interação (e para de "escutar" depois disso)
  const eventos = ["pointerdown", "keydown", "touchend"];
  function liberarSom(e) {
    eventos.forEach((ev) => document.removeEventListener(ev, liberarSom, true));
    // Clique no próprio botão de som: quem decide é o botão
    if (silenciadoPeloUsuario || (botao && botao.contains(e.target))) return;
    tocarComSom().catch(() => {});
  }

  // Com "Reduzir movimento" ligado o vídeo fica pausado (idioma-e-movimento.js)
  if (!document.documentElement.classList.contains("sem-animacao")) {
    tocarComSom().catch(() => {
      // Som bloqueado: toca mudo por enquanto e espera a primeira interação
      video.muted = true;
      video.play().catch(() => {});
      atualizarBotao();
      eventos.forEach((ev) => document.addEventListener(ev, liberarSom, true));
    });
  }

  botao?.addEventListener("click", (e) => {
    e.stopPropagation();
    silenciadoPeloUsuario = !video.muted;
    video.muted = !video.muted;
    video.play().catch(() => {});
    atualizarBotao();
  });
});

// ==========================================================================
// 2. FICHAS DOS PERSONAGENS
// ==========================================================================
// Cada ficha tem abas (FUNÇÃO, LORE, DESCRIÇÃO...) e um botão ABRIR/FECHAR.
// Ao abrir, o texto aparece "descriptografando": símbolos aleatórios que
// viram o texto real, letra por letra.
// Abas e botão seguem o padrão da W3C (WAI-ARIA): aria-selected nas abas,
// aria-expanded no botão e setas do teclado para trocar de aba.
// (Fica num bloco separado porque o bloco do vídeo para com "return"
// quando não acha o vídeo.)
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const fichas = [...document.querySelectorAll(".card.ficha")];
  if (!fichas.length) return;

  // Os efeitos são feitos em JavaScript, são curtos (menos de 1 s) e só
  // trocam letras e cores, sem mover nada na tela. Por isso aparecem mesmo
  // com as animações do sistema desligadas (que cortam só o CSS).
  // Também funcionam em inglês: o texto real (já traduzido) nunca é
  // alterado; o efeito usa uma cópia por cima, que o Google não traduz.
  // Eles só NÃO rodam com "Reduzir movimento" do painel do site ligado.
  const semEfeito = () => root.classList.contains("sem-animacao");

  const SIMBOLOS = "0123456789ABCDEF#%&";
  const DURACAO = 800; // milissegundos (o mesmo tempo da barra no style.css)

  // Guarda o requestAnimationFrame de cada ficha, para poder cancelar
  const animacoes = new Map();

  // --- A. Fundo de código: o nome da linguagem em hexadecimal e binário ---
  // Ex.: HTML = 0x48 0x54 0x4D 0x4C 01001000 01010100 01001101 01001100
  function criarFundoDeCodigo(ficha) {
    const nome = ficha.querySelector(".nome.ficha").dataset.text;
    const letras = [...nome];
    const hex = letras.map((l) => "0x" + l.charCodeAt(0).toString(16).toUpperCase());
    const bin = letras.map((l) => l.charCodeAt(0).toString(2).padStart(8, "0"));
    const bloco = Array(80).fill(`${hex.join(" ")} ${bin.join(" ")}`).join(" ");

    const fundo = document.createElement("div");
    fundo.className = "codigo ficha notranslate";
    fundo.setAttribute("aria-hidden", "true");
    fundo.setAttribute("translate", "no"); // o tradutor não mexe no código

    const texto = document.createElement("span");
    // Repetido 2 vezes: a animação sobe 50% e recomeça sem "pulo"
    texto.textContent = `${bloco} ${bloco}`;
    fundo.append(texto);
    ficha.prepend(fundo);
  }

  // --- B. Efeito de descriptografia ---
  // O texto real continua no lugar (transparente pelo CSS), então leitores
  // de tela leem normal. Por cima vai uma cópia embaralhada que se revela.
  function descriptografar(ficha, painel) {
    terminarEfeito(ficha);
    if (semEfeito()) return;

    const alvos = [...painel.querySelectorAll("p:not(.rotulo)")].map((p) => {
      const original = p.textContent;
      const cifra = document.createElement("span");
      cifra.className = "cifra notranslate";
      cifra.setAttribute("aria-hidden", "true");
      cifra.setAttribute("translate", "no");
      p.classList.add("cifrado");
      p.append(cifra);

      // Momento em que cada letra "acerta": da esquerda para a direita,
      // com um pouco de sorte para não ficar mecânico
      const tempos = [...original].map(
        (_, i) => (i / original.length) * DURACAO * 0.7 + Math.random() * DURACAO * 0.3,
      );
      return { cifra, original, tempos };
    });

    const porcentagem = ficha.querySelector(".porcentagem");
    const barra = ficha.querySelector(".barra.ficha");
    barra.style.transform = "scaleX(0)"; // a barra começa vazia
    ficha.classList.add("decifrando");
    const inicio = performance.now();

    function quadro(agora) {
      const passou = agora - inicio;

      alvos.forEach(({ cifra, original, tempos }) => {
        let texto = "";
        for (let i = 0; i < original.length; i++) {
          const letra = original[i];
          // Espaços ficam no lugar para as linhas quebrarem como o texto real
          if (letra === " " || passou >= tempos[i]) {
            texto += letra;
          } else {
            texto += SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
          }
        }
        cifra.textContent = texto;
      });

      // Terminal conta até 100% e a barra enche junto (0 = vazia, 1 = cheia)
      const progresso = Math.min(1, passou / DURACAO);
      porcentagem.textContent = Math.floor(progresso * 100) + "%";
      barra.style.transform = `scaleX(${progresso})`;

      if (passou < DURACAO) {
        animacoes.set(ficha, requestAnimationFrame(quadro));
      } else {
        terminarEfeito(ficha);
      }
    }

    animacoes.set(ficha, requestAnimationFrame(quadro));
  }

  // Tira as cópias embaralhadas e deixa só o texto real
  function terminarEfeito(ficha) {
    cancelAnimationFrame(animacoes.get(ficha));
    animacoes.delete(ficha);
    ficha.classList.remove("decifrando");
    ficha.querySelectorAll(".cifra").forEach((cifra) => cifra.remove());
    ficha.querySelectorAll(".cifrado").forEach((p) => p.classList.remove("cifrado"));
    ficha.querySelector(".porcentagem").textContent = "100%";
    ficha.querySelector(".barra.ficha").style.transform = ""; // barra cheia
  }

  // --- C. Glitch no nome ao abrir ---
  // A sombra do texto "racha" em ciano e magenta 5 vezes (cerca de 0,35 s)
  // e depois volta ao brilho normal do CSS.
  const glitches = new Map(); // ficha -> id do setInterval

  function glitch(ficha) {
    if (semEfeito()) return;
    const nome = ficha.querySelector(".nome.ficha");
    clearInterval(glitches.get(ficha));
    let passos = 0;

    const id = setInterval(() => {
      passos++;
      if (passos > 5) {
        clearInterval(id);
        nome.style.textShadow = ""; // volta ao brilho do CSS
        return;
      }
      const desvio = Math.ceil(Math.random() * 3); // 1 a 3 pixels
      nome.style.textShadow = `${desvio}px 0 var(--ciano), ${-desvio}px 0 var(--magenta)`;
    }, 70);

    glitches.set(ficha, id);
  }

  // --- D. Abrir/fechar o arquivo e trocar de aba ---
  function painelAtivo(ficha) {
    const aba = ficha.querySelector('[role="tab"][aria-selected="true"]');
    return document.getElementById(aba.getAttribute("aria-controls"));
  }

  function abrirFicha(ficha, abrir) {
    ficha.classList.toggle("aberta", abrir);
    // O texto do botão (ABRIR/FECHAR) troca pelo CSS, com a classe .aberta
    ficha.querySelector(".botao.abrir").setAttribute("aria-expanded", String(abrir));

    if (abrir) {
      glitch(ficha);
      descriptografar(ficha, painelAtivo(ficha));
    } else {
      terminarEfeito(ficha);
    }
  }

  function selecionarAba(ficha, abaEscolhida) {
    ficha.querySelectorAll('[role="tab"]').forEach((aba) => {
      const ativa = aba === abaEscolhida;
      aba.setAttribute("aria-selected", String(ativa));
      // Só a aba ativa entra no Tab; as outras se alcançam pelas setas
      aba.tabIndex = ativa ? 0 : -1;
      document.getElementById(aba.getAttribute("aria-controls")).hidden = !ativa;
    });

    // Clicar numa aba com o arquivo fechado também abre o arquivo
    if (ficha.classList.contains("aberta")) {
      descriptografar(ficha, painelAtivo(ficha));
    } else {
      abrirFicha(ficha, true);
    }
  }

  // Setas esquerda/direita, Home e End trocam de aba (padrão da W3C)
  function teclasDasAbas(evento, ficha) {
    const abas = [...ficha.querySelectorAll('[role="tab"]')];
    const atual = abas.indexOf(document.activeElement);
    if (atual === -1) return;

    const destinos = {
      ArrowRight: abas[(atual + 1) % abas.length],
      ArrowLeft: abas[(atual - 1 + abas.length) % abas.length],
      Home: abas[0],
      End: abas[abas.length - 1],
    };
    const proxima = destinos[evento.key];
    if (!proxima) return;

    evento.preventDefault();
    proxima.focus();
    selecionarAba(ficha, proxima);
  }

  // --- E. Liga tudo em cada ficha ---
  fichas.forEach((ficha) => {
    criarFundoDeCodigo(ficha);

    ficha.querySelector(".botao.abrir").addEventListener("click", () => {
      abrirFicha(ficha, !ficha.classList.contains("aberta"));
    });

    ficha.querySelectorAll('[role="tab"]').forEach((aba) => {
      aba.addEventListener("click", () => selecionarAba(ficha, aba));
    });

    ficha.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
      teclasDasAbas(e, ficha);
    });
  });
});
