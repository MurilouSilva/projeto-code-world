/**
 * CODEWORLD // script.js
 * Gerenciador de interações do Menu Hambúrguer, Painel de Acessibilidade e Preferências do Usuário
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elemento raiz <html> para aplicação das configurações globais
  const root = document.documentElement;

  /**
   * Função auxiliar para alternar a classe ativa em grupos de botões
   * @param {NodeListOf<Element>} opcoes
   * @param {Element} selecionada
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
    // Alterna a exibição do menu ao clicar no botão
    btnHamburguer.addEventListener("click", (e) => {
      e.stopPropagation();
      btnHamburguer.classList.toggle("ativo");
      navMenu.classList.toggle("aberto");

      const aberto = navMenu.classList.contains("aberto");
      btnHamburguer.setAttribute("aria-expanded", aberto);
    });

    // Fecha o menu ao clicar em qualquer item da navegação
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
    ".grupo.acessibilidade:nth-of-type(2) .opcao",
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
    ".grupo.acessibilidade:nth-of-type(3) .opcao",
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
    // Restaurar Tema
    if (localStorage.getItem("cw_tema") === "claro") {
      root.setAttribute("data-tema", "claro");
      opcoesTema.forEach((opt) => {
        if (opt.textContent.trim().toLowerCase() === "claro") {
          setOpcaoAtiva(opcoesTema, opt);
        }
      });
    }

    // Restaurar Fonte
    const fonteSalva = localStorage.getItem("cw_fonte");
    if (fonteSalva && tamanhos[fonteSalva]) {
      root.style.fontSize = tamanhos[fonteSalva];
      opcoesFonte.forEach((opt) => {
        if (opt.textContent.trim().toLowerCase() === fonteSalva) {
          setOpcaoAtiva(opcoesFonte, opt);
        }
      });
    }

    // Restaurar Alto Contraste
    if (localStorage.getItem("cw_alto_contraste") === "true" && chaves[0]) {
      chaves[0].classList.add("ativa");
      root.classList.add("alto-contraste");
    }

    // Restaurar Redução de Movimento
    if (localStorage.getItem("cw_reduzir_movimento") === "true" && chaves[1]) {
      chaves[1].classList.add("ativa");
      root.classList.add("sem-animacao");
    }
  }

  // Executa o carregamento das preferências do usuário ao iniciar
  carregarPreferencias();
});
