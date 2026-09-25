/**
 * CODEWORLD // script.js
 * Gerenciador de interações do Menu Hambúrguer, Painel de Acessibilidade,
 * Preferências do Usuário e Cursor Customizado Duplo
 */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  /**
   * Alterna a classe ativa em grupos de botões selecionáveis
   */
  function setOpcaoAtiva(opcoes, selecionada) {
    opcoes.forEach((opt) => opt.classList.remove("ativa"));
    selecionada.classList.add("ativa");
  }

  // ==========================================================================
  // 1. MENU HAMBÚRGUER (MOBILE / TABLET)
  // ==========================================================================
  const btnHamburguer = document.querySelector(".menu-hamburguer");
  const navMenu = document.querySelector("header nav");
  const navLinks = document.querySelectorAll("header nav a");

  if (btnHamburguer && navMenu) {
    btnHamburguer.addEventListener("click", (e) => {
      e.stopPropagation();
      btnHamburguer.classList.toggle("ativo");
      navMenu.classList.toggle("aberto");

      const aberto = navMenu.classList.contains("aberto");
      btnHamburguer.setAttribute("aria-expanded", aberto);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        btnHamburguer.classList.remove("ativo");
        navMenu.classList.remove("aberto");
        btnHamburguer.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ==========================================================================
  // 2. PAINEL DE ACESSIBILIDADE
  // ==========================================================================

  // --- A. Tema (Claro / Escuro) ---
  const opcoesTema = document.querySelectorAll(
    ".grupo.acessibilidade:nth-of-type(2) .opcao"
  );

  opcoesTema.forEach((opt) => {
    opt.addEventListener("click", () => {
      setOpcaoAtiva(opcoesTema, opt);
      const tema = opt.textContent.trim().toLowerCase();

      if (tema === "claro") {
        root.setAttribute("data-tema", "claro");
        localStorage.setItem("cw_tema", "claro");
      } else {
        root.removeAttribute("data-tema");
        localStorage.setItem("cw_tema", "escuro");
      }
    });
  });

  // --- B. Tamanho da Fonte (A-, A, A+, A++) ---
  const opcoesFonte = document.querySelectorAll(
    ".grupo.acessibilidade:nth-of-type(3) .opcao"
  );

  const tamanhos = {
    "a-": "90%",
    a: "100%",
    "a+": "110%",
    "a++": "120%",
  };

  opcoesFonte.forEach((opt) => {
    opt.addEventListener("click", () => {
      setOpcaoAtiva(opcoesFonte, opt);
      const chave = opt.textContent.trim().toLowerCase();

      if (tamanhos[chave]) {
        root.style.fontSize = tamanhos[chave];
        localStorage.setItem("cw_fonte", chave);
      }
    });
  });

  // --- C. Chaves Toggle (Alto Contraste e Reduzir Movimento) ---
  const chaves = document.querySelectorAll(".grupo.acessibilidade .chave");

  // Chave 1: Alto Contraste
  if (chaves[0]) {
    chaves[0].addEventListener("click", () => {
      chaves[0].classList.toggle("ativa");
      const ativo = chaves[0].classList.contains("ativa");
      root.classList.toggle("alto-contraste", ativo);
      localStorage.setItem("cw_alto_contraste", ativo);
    });
  }

  // Chave 2: Reduzir Movimento
  if (chaves[1]) {
    chaves[1].addEventListener("click", () => {
      chaves[1].classList.toggle("ativa");
      const ativo = chaves[1].classList.contains("ativa");
      root.classList.toggle("sem-animacao", ativo);
      localStorage.setItem("cw_reduzir_movimento", ativo);
    });
  }

  // ==========================================================================
  // 3. CARREGAMENTO DE PREFERÊNCIAS SALVAS (LOCALSTORAGE)
  // ==========================================================================
  function carregarPreferencias() {
    if (localStorage.getItem("cw_tema") === "claro") {
      root.setAttribute("data-tema", "claro");
      opcoesTema.forEach((opt) => {
        if (opt.textContent.trim().toLowerCase() === "claro") {
          setOpcaoAtiva(opcoesTema, opt);
        }
      });
    }

    const fonteSalva = localStorage.getItem("cw_fonte");
    if (fonteSalva && tamanhos[fonteSalva]) {
      root.style.fontSize = tamanhos[fonteSalva];
      opcoesFonte.forEach((opt) => {
        if (opt.textContent.trim().toLowerCase() === fonteSalva) {
          setOpcaoAtiva(opcoesFonte, opt);
        }
      });
    }

    if (localStorage.getItem("cw_alto_contraste") === "true" && chaves[0]) {
      chaves[0].classList.add("ativa");
      root.classList.add("alto-contraste");
    }

    if (localStorage.getItem("cw_reduzir_movimento") === "true" && chaves[1]) {
      chaves[1].classList.add("ativa");
      root.classList.add("sem-animacao");
    }
  }

  carregarPreferencias();

  // ==========================================================================
  // 4. CURSOR DUPLO COM LERP E HOVER (TYMPANUS SKETCH 012)
  // ==========================================================================
  const cursorInner = document.querySelector(".cursor-inner");
  const cursorOuter = document.querySelector(".cursor-outer");

  if (cursorInner && cursorOuter && window.matchMedia("(hover: hover)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outerX = mouseX;
    let outerY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorInner.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    function render() {
      outerX += (mouseX - outerX) * 0.15;
      outerY += (mouseY - outerY) * 0.15;

      cursorOuter.style.transform = `translate3d(${outerX}px, ${outerY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    }
    render();

    const interativos = document.querySelectorAll("a, button, summary, input, .opcao, .chave");

    interativos.forEach((el) => {
      el.addEventListener("mouseenter", () => document.body.classList.add("hovered"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("hovered"));
    });
  }
});
