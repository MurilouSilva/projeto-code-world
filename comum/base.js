/**
 * CODEWORLD // comum/base.js
 * Comportamento compartilhado por todas as telas:
 *   1. Menu hambúrguer (mobile / tablet)
 *   2. Painel de acessibilidade (tema, fonte, contraste, movimento)
 *   3. Preferências salvas (localStorage)
 *   4. Cabeçalho compacto, barra de rolagem e botão "voltar ao topo"
 *   5. Revelar elementos ao rolar
 *   6. Contadores e barras de progresso animados
 *   7. Efeito 3D (tilt) nos cartões
 *   8. Cursor customizado duplo
 *   9. Transição suave entre as páginas
 */

// Marca que o JS está ativo: o CSS só esconde os blocos para animar se
// esta classe existir (sem JS, tudo aparece normalmente)
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const body = document.body;

  // Lê/grava no localStorage sem quebrar em modo privado
  const salvar = (chave, valor) => {
    try {
      localStorage.setItem(chave, valor);
    } catch (erro) {}
  };
  const ler = (chave) => {
    try {
      return localStorage.getItem(chave);
    } catch (erro) {
      return null;
    }
  };

  // Reduzir movimento: chave do painel OU preferência do sistema
  const sistemaSemMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const semMovimento = () =>
    root.classList.contains("sem-animacao") || sistemaSemMovimento.matches;

  /**
   * Alterna a classe ativa em grupos de botões selecionáveis
   */
  function setOpcaoAtiva(opcoes, selecionada) {
    opcoes.forEach((opt) => {
      opt.classList.toggle("ativa", opt === selecionada);
      opt.setAttribute("aria-pressed", opt === selecionada);
    });
  }

  // ==========================================================================
  // 1. MENU HAMBÚRGUER (MOBILE / TABLET)
  // ==========================================================================
  const btnHamburguer = document.querySelector(".menu-hamburguer");
  const navMenu = document.querySelector("header nav");

  // Ordem de cada item, usada para a animação em cascata do menu
  document.querySelectorAll("header nav li").forEach((item, i) => {
    item.style.setProperty("--ordem", i);
  });

  function abrirMenu(abrir) {
    btnHamburguer.classList.toggle("ativo", abrir);
    navMenu.classList.toggle("aberto", abrir);
    root.classList.toggle("menu-aberto", abrir);
    btnHamburguer.setAttribute("aria-expanded", abrir);
    btnHamburguer.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  }

  if (btnHamburguer && navMenu) {
    btnHamburguer.addEventListener("click", () => {
      abrirMenu(!navMenu.classList.contains("aberto"));
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => abrirMenu(false));
    });

    // Esc fecha o menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("aberto")) {
        abrirMenu(false);
        btnHamburguer.focus();
      }
    });

    // Se a tela crescer até o modo desktop, o menu volta ao normal
    window.matchMedia("(min-width: 1200px)").addEventListener("change", (e) => {
      if (e.matches) abrirMenu(false);
    });
  }

  // ==========================================================================
  // 2. PAINEL DE ACESSIBILIDADE
  // ==========================================================================
  const painel = document.querySelector("details.acessibilidade");

  // Fecha o painel ao clicar fora dele ou apertar Esc
  if (painel) {
    document.addEventListener("click", (e) => {
      if (painel.open && !painel.contains(e.target)) painel.open = false;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && painel.open) {
        painel.open = false;
        painel.querySelector("summary").focus();
      }
    });
  }

  // --- A. Tema (Claro / Escuro) ---
  const opcoesTema = document.querySelectorAll("[data-tema-opcao]");

  function aplicarTema(tema) {
    if (tema === "claro") root.setAttribute("data-tema", "claro");
    else root.removeAttribute("data-tema");
    opcoesTema.forEach((opt) => {
      if (opt.dataset.temaOpcao === tema) setOpcaoAtiva(opcoesTema, opt);
    });
  }

  opcoesTema.forEach((opt) => {
    opt.addEventListener("click", () => {
      aplicarTema(opt.dataset.temaOpcao);
      salvar("cw_tema", opt.dataset.temaOpcao);
    });
  });

  // --- B. Tamanho da Fonte (A-, A, A+, A++) ---
  const opcoesFonte = document.querySelectorAll("[data-fonte]");
  const tamanhos = { "a-": "90%", a: "100%", "a+": "110%", "a++": "120%" };

  function aplicarFonte(chave) {
    if (!tamanhos[chave]) return;
    root.style.fontSize = tamanhos[chave];
    opcoesFonte.forEach((opt) => {
      if (opt.dataset.fonte === chave) setOpcaoAtiva(opcoesFonte, opt);
    });
  }

  opcoesFonte.forEach((opt) => {
    opt.addEventListener("click", () => {
      aplicarFonte(opt.dataset.fonte);
      salvar("cw_fonte", opt.dataset.fonte);
    });
  });

  // --- C. Chaves (Alto Contraste e Reduzir Movimento) ---
  // Cada chave diz no HTML qual classe liga no <html> e onde fica salva
  const chaves = document.querySelectorAll(".grupo.acessibilidade > .chave");

  function aplicarChave(chave, ativo) {
    chave.classList.toggle("ativa", ativo);
    chave.setAttribute("aria-checked", ativo);
    root.classList.toggle(chave.dataset.classe, ativo);
  }

  chaves.forEach((chave) => {
    chave.addEventListener("click", () => {
      const ativo = !chave.classList.contains("ativa");
      aplicarChave(chave, ativo);
      salvar(chave.dataset.salvar, ativo);
    });
  });

  // ==========================================================================
  // 3. CARREGAMENTO DE PREFERÊNCIAS SALVAS (LOCALSTORAGE)
  // ==========================================================================
  aplicarTema(ler("cw_tema") === "claro" ? "claro" : "escuro");
  aplicarFonte(ler("cw_fonte") || "a");
  chaves.forEach((chave) => {
    aplicarChave(chave, ler(chave.dataset.salvar) === "true");
  });

  // ==========================================================================
  // 4. CABEÇALHO COMPACTO, BARRA DE ROLAGEM E VOLTAR AO TOPO
  // ==========================================================================
  const header = document.querySelector("header");
  const barraRolagem = document.querySelector(".barra-rolagem");

  const btnTopo = document.createElement("button");
  btnTopo.type = "button";
  btnTopo.className = "voltar-topo";
  btnTopo.setAttribute("aria-label", "Voltar ao topo");
  btnTopo.innerHTML = '<span aria-hidden="true">▲</span>';
  btnTopo.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: semMovimento() ? "auto" : "smooth" });
  });
  body.appendChild(btnTopo);

  let agendado = false;
  function aoRolar() {
    const y = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle("rolado", y > 20);
    btnTopo.classList.toggle("visivel", y > 600);
    barraRolagem?.style.setProperty("--rolagem", total > 0 ? y / total : 0);
    agendado = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(aoRolar);
      }
    },
    { passive: true },
  );
  aoRolar();

  // ==========================================================================
  // 5. REVELAR ELEMENTOS AO ROLAR
  // ==========================================================================
  // Blocos principais de cada seção + itens das listas (que entram em cascata)
  const blocos = document.querySelectorAll(
    "main > section > *:not(.visual):not(ul):not(dialog), main > section > ul > li, main ul[class*='lista'] > li, main ol[class*='lista'] > li",
  );

  blocos.forEach((el) => {
    el.classList.add("revelar");
    // Itens de lista recebem um atraso pela posição (efeito cascata)
    if (el.tagName === "LI") {
      const irmaos = [...el.parentElement.children];
      el.style.setProperty("--ordem", Math.min(irmaos.indexOf(el), 8));
    }
  });

  const barras = document.querySelectorAll(".preenchimento.progresso");

  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("visivel");
          if (entrada.target.matches(".contagem")) animarContagem(entrada.target);
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    blocos.forEach((el) => observador.observe(el));
    barras.forEach((el) => observador.observe(el));
    document.querySelectorAll(".contagem").forEach((el) => observador.observe(el));
  } else {
    // Navegador antigo: mostra tudo de uma vez
    [...blocos, ...barras].forEach((el) => el.classList.add("visivel"));
  }

  // ==========================================================================
  // 6. CONTADOR ANIMADO (ex.: "01 / 06" conta de 00 até 01)
  // ==========================================================================
  function animarContagem(el) {
    const texto = el.textContent;
    const achado = texto.match(/\d+/);
    if (!achado || semMovimento()) return;

    const alvo = parseInt(achado[0], 10);
    const digitos = achado[0].length;
    const antes = texto.slice(0, achado.index);
    const depois = texto.slice(achado.index + digitos);
    const duracao = 1200;
    const inicio = performance.now();

    function passo(agora) {
      const t = Math.min((agora - inicio) / duracao, 1);
      const suave = 1 - Math.pow(1 - t, 3);
      const valor = String(Math.round(alvo * suave)).padStart(digitos, "0");
      el.textContent = antes + valor + depois;
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // ==========================================================================
  // 6.1 EFEITO DE DIGITAÇÃO NOS CONSOLES (Nexus e Arquivos)
  // ==========================================================================
  // Cada console com linhas <span class="linha"> é "digitado" quando aparece
  document.querySelectorAll(".linhas.console").forEach((console_) => {
    const linhas = [...console_.querySelectorAll(".linha")];
    if (!linhas.length) return;

    // Cursor de terminal que acompanha a linha sendo digitada
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "█";

    if (semMovimento() || !("IntersectionObserver" in window)) {
      linhas.at(-1).appendChild(cursor);
      return;
    }

    const textos = linhas.map((linha) => linha.textContent);
    linhas.forEach((linha) => (linha.textContent = ""));
    linhas[0].appendChild(cursor);

    let atual = 0;
    let letra = 0;

    function digitar() {
      const linha = linhas[atual];
      linha.textContent = textos[atual].slice(0, ++letra);
      linha.appendChild(cursor);

      if (letra < textos[atual].length) {
        setTimeout(digitar, 22 + Math.random() * 40);
      } else if (atual < linhas.length - 1) {
        atual++;
        letra = 0;
        setTimeout(digitar, 350); // pausa entre as linhas
      }
    }

    new IntersectionObserver((entradas, obs) => {
      if (!entradas[0].isIntersecting) return;
      obs.disconnect();
      setTimeout(digitar, 600);
    }).observe(console_);
  });

  // ==========================================================================
  // 7. EFEITO 3D (TILT) NOS CARTÕES
  // ==========================================================================
  const mouseFino = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (mouseFino.matches) {
    document
      .querySelectorAll(".card.agente, .card.linguagem, .card.recompensa, .card.territorio")
      .forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          if (semMovimento()) return;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
        });
      });
  }

  // ==========================================================================
  // 8. CURSOR DUPLO COM LERP E HOVER (TYMPANUS SKETCH 012)
  // ==========================================================================
  // Só existe em telas com mouse: no celular ele não aparece
  const cursorInner = document.querySelector(".cursor-inner");
  const cursorOuter = document.querySelector(".cursor-outer");

  if (cursorInner && cursorOuter && mouseFino.matches) {
    let mouseX = -100;
    let mouseY = -100;
    let outerX = mouseX;
    let outerY = mouseY;
    let primeiroMovimento = true;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (primeiroMovimento) {
        // Só troca o cursor nativo depois que o mouse se mexer
        root.classList.add("cursor-ativo");
        outerX = mouseX;
        outerY = mouseY;
        primeiroMovimento = false;
      }
      cursorInner.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    });

    document.addEventListener("mouseleave", () => body.classList.add("cursor-fora"));
    document.addEventListener("mouseenter", () => body.classList.remove("cursor-fora"));

    (function render() {
      outerX += (mouseX - outerX) * 0.15;
      outerY += (mouseY - outerY) * 0.15;
      cursorOuter.style.transform = `translate3d(${outerX}px, ${outerY}px, 0)`;
      requestAnimationFrame(render);
    })();

    // Delegação: funciona também para elementos criados depois
    const interativos = "a, button, summary, input, label, .opcao, .chave";
    document.addEventListener("mouseover", (e) => {
      body.classList.toggle("hovered", !!e.target.closest(interativos));
    });
  }

  // ==========================================================================
  // 9. TRANSIÇÃO SUAVE ENTRE AS PÁGINAS
  // ==========================================================================
  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const destino = new URL(link.href, location.href);
      const mesmaPagina = destino.pathname === location.pathname;
      const novaAba = link.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey;

      if (destino.origin !== location.origin || mesmaPagina || novaAba || semMovimento()) {
        return;
      }

      e.preventDefault();
      body.classList.add("saindo");
      setTimeout(() => (location.href = destino.href), 230);
    });
  });

  // Ao voltar pelo botão "voltar" do navegador, a página não fica apagada
  window.addEventListener("pageshow", () => body.classList.remove("saindo"));
});
