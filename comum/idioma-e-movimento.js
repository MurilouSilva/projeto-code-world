document.addEventListener("DOMContentLoaded", () => {
  // Elemento raiz <html>, onde ficam as classes de preferência do painel
  const root = document.documentElement;

  // ==========================================================================
  // 1. IDIOMA (GOOGLE TRADUTOR)
  // ==========================================================================
  // A escolha fica salva no localStorage, como as outras preferências do
  // painel, e é reaplicada em cada página que o usuário abrir.

  const CHAVE_IDIOMA = "cw_idioma";

  // Botões PT-BR / EN, achados pelo texto e não pela posição no painel
  const botoesIdioma = [
    ...document.querySelectorAll(".painel.acessibilidade .opcao"),
  ].filter((opt) => ["PT-BR", "EN"].includes(opt.textContent.trim()));

  // --- A. O que o Google NÃO deve traduzir ---
  // - Opções de tema e fonte: o script.js reconhece o botão clicado pelo
  //   texto ("claro", "a+"); traduzido, o botão pararia de funcionar
  // - Grupo de idioma: "IDIOMA / LANGUAGE" e "PT-BR / EN" já são bilíngues
  // - Marca CODEWORLD, título com data-text (o efeito copia o texto) e código
  const naoTraduzir = [
    ...document.querySelectorAll(
      ".painel.acessibilidade .opcao, .logo, [data-text], pre, code",
    ),
  ];
  const grupoIdioma = botoesIdioma[0]?.closest(".grupo.acessibilidade");
  if (grupoIdioma) naoTraduzir.push(grupoIdioma);

  naoTraduzir.forEach((el) => {
    el.classList.add("notranslate");
    el.setAttribute("translate", "no");
  });

  // --- B. Carregamento do Google Tradutor ---
  // O script do Google só é baixado quando alguém escolhe EN: em português
  // a página não depende de nada externo.
  let googlePronto = null;

  function carregarGoogle() {
    if (googlePronto) return googlePronto;

    googlePronto = new Promise((resolve, reject) => {
      // O Google monta sua caixa de idiomas dentro deste elemento (escondido
      // pelo CSS). Nem toda página tem ele no HTML, então é criado se faltar.
      if (!document.getElementById("google_translate_element")) {
        const caixa = document.createElement("div");
        caixa.id = "google_translate_element";
        document.body.appendChild(caixa);
      }

      // Função que o Google chama quando termina de carregar
      window.cwIniciarGoogleTradutor = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: "pt", includedLanguages: "en", autoDisplay: false },
          "google_translate_element",
        );
        resolve();
      };

      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=cwIniciarGoogleTradutor";
      script.onerror = () => {
        googlePronto = null; // permite tentar de novo no próximo clique
        reject(new Error("sem conexão com o Google Tradutor"));
      };
      document.head.appendChild(script);
    });

    return googlePronto;
  }

  /**
   * Repete a verificação a cada 100 ms até ela dar certo ou o tempo acabar.
   * @param {Function} condicao - Retorna algo verdadeiro quando estiver pronto.
   * @param {number} tempoMaximo - Tempo limite em milissegundos.
   */
  function esperar(condicao, tempoMaximo) {
    return new Promise((resolve) => {
      const inicio = Date.now();
      const checar = () => {
        const resultado = condicao();
        if (resultado) return resolve(resultado);
        if (Date.now() - inicio >= tempoMaximo) return resolve(null);
        setTimeout(checar, 100);
      };
      checar();
    });
  }

  // --- C. Tradução e volta ao original ---
  const paginaEmIngles = () => root.classList.contains("translated-ltr");

  // O Google cria um <select class="goog-te-combo"> escondido: traduzir é
  // escolher "en" nele e avisar que o valor mudou.
  async function traduzirParaIngles() {
    await carregarGoogle();

    const combo = await esperar(() => {
      const select = document.querySelector(".goog-te-combo");
      return select && select.querySelector('option[value="en"]') ? select : null;
    }, 10000);
    if (!combo) throw new Error("o Google Tradutor não respondeu");

    // Às vezes o Google ignora a primeira troca: tenta mais uma vez
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      combo.value = "en";
      combo.dispatchEvent(new Event("change", { bubbles: true }));

      // O Google marca o <html> com "translated-ltr" quando termina
      const traduziu = await esperar(
        () => root.classList.contains("translated-ltr"),
        5000,
      );
      if (traduziu) return;
    }
    throw new Error("a tradução não foi aplicada");
  }
  async function voltarAoPortugues() {
    const botaoOriginal = [...document.querySelectorAll("iframe")]
      .map((quadro) => quadro.contentDocument?.querySelector('[id$=".restore"]'))
      .find(Boolean);
    if (!botaoOriginal) throw new Error('botão "Mostrar o original" não encontrado');

    botaoOriginal.click();
    if (!(await esperar(() => !paginaEmIngles(), 5000))) {
      throw new Error("o texto original não voltou");
    }
  }

  // --- D. Escolha de idioma ---
  let idiomaDesejado = "pt"; // último idioma pedido pelo usuário
  let trocando = false;

  function marcarIdioma(idioma) {
    botoesIdioma.forEach((botao) => {
      const ativo = botao.dataset.idioma === idioma;
      botao.classList.toggle("ativa", ativo);
      botao.setAttribute("aria-pressed", ativo);
    });
  }

  // Leva a página até o idioma pedido. Se o usuário clicar de novo durante
  // uma troca, o laço termina a atual e depois atende o último pedido.
  async function aplicarIdioma() {
    if (trocando) return;
    trocando = true;

    try {
      while ((paginaEmIngles() ? "en" : "pt") !== idiomaDesejado) {
        if (idiomaDesejado === "en") await traduzirParaIngles();
        else await voltarAoPortugues();
      }
    } catch (erro) {
      console.warn("[CodeWorld] Não foi possível trocar o idioma:", erro.message);
      if (idiomaDesejado === "pt") {
        // Plano B: recarregar (sem o Google a página abre em português),
        // reabrindo o painel em seguida
        sessionStorage.setItem("cw_reabrir_painel", "sim");
        location.reload();
      } else {
        idiomaDesejado = "pt"; // sem internet, por exemplo
        marcarIdioma("pt");
      }
    } finally {
      trocando = false;
    }
  }

  function escolherIdioma(idioma) {
    idiomaDesejado = idioma;
    localStorage.setItem(CHAVE_IDIOMA, idioma);
    marcarIdioma(idioma);
    aplicarIdioma();
  }

  // --- E. Botões PT-BR / EN ---
  botoesIdioma.forEach((botao) => {
    botao.dataset.idioma = botao.textContent.trim() === "EN" ? "en" : "pt";

    // São <span>: role e tabindex os tornam acessíveis pelo teclado
    botao.setAttribute("role", "button");
    botao.setAttribute("tabindex", "0");

    botao.addEventListener("click", () => escolherIdioma(botao.dataset.idioma));
    botao.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        escolherIdioma(botao.dataset.idioma);
      }
    });
  });

  // Reaplica o idioma salvo ao abrir a página
  if (localStorage.getItem(CHAVE_IDIOMA) === "en") {
    escolherIdioma("en");
  } else {
    marcarIdioma("pt");
  }

  // Plano B da volta ao português: o painel reabre depois de recarregar
  if (sessionStorage.getItem("cw_reabrir_painel")) {
    sessionStorage.removeItem("cw_reabrir_painel");
    const painel = document.querySelector("details.acessibilidade");
    if (painel) painel.open = true;
  }

  // ==========================================================================
  // 2. REDUZIR MOVIMENTO
  // ==========================================================================
  // O script.js liga/desliga a classe "sem-animacao" no <html>, e o style.css
  // já para as animações CSS com ela. Vídeo não obedece CSS: pausamos aqui.
  // (O anel do cursor customizado é escondido pelo idioma-e-movimento.css.)

  const videosDeFundo = [...document.querySelectorAll("video[autoplay]")];
  let movimentoReduzido = false;

  function aplicarReducaoDeMovimento() {
    const reduzir = root.classList.contains("sem-animacao");
    if (reduzir === movimentoReduzido) return; // só age quando o estado muda
    movimentoReduzido = reduzir;

    videosDeFundo.forEach((video) => {
      if (reduzir) {
        video.autoplay = false; // sem isso o autoplay poderia religar o vídeo
        video.pause();
      } else {
        video.autoplay = true;
        video.play().catch(() => {}); // se o navegador bloquear, só fica parado
      }
    });
  }

  // ==========================================================================
  // 3. CHAVE "REDUZIR MOVIMENTO"
  // ==========================================================================
  const chaveMovimento = document.querySelectorAll(
    ".grupo.acessibilidade > .chave",
  )[1];

  chaveMovimento?.addEventListener(
    "click",
    () => {
      const antes = root.classList.contains("sem-animacao");
      // Se o script.js for corrigido, ele mesmo troca o estado neste clique:
      // só trocamos aqui se, no fim do clique, ninguém trocou
      setTimeout(() => {
        if (root.classList.contains("sem-animacao") !== antes) return;
        root.classList.toggle("sem-animacao", !antes);
        localStorage.setItem("cw_reduzir_movimento", !antes);
      });
    },
    { capture: true },
  );

  // Mostra o estado na chave certa (ao restaurar a preferência salva, o
  // script.js marca a bolinha do contraste no lugar dela)
  function marcarChaveMovimento() {
    document
      .querySelectorAll(".grupo.acessibilidade .botao.chave.ativa")
      .forEach((bolinha) => bolinha.classList.remove("ativa"));
    chaveMovimento?.classList.toggle(
      "ativa",
      root.classList.contains("sem-animacao"),
    );
  }

  // Observa a classe do <html>: reage tanto ao clique na chave quanto à
  // preferência salva que o script.js restaura ao abrir a página
  const aoMudarMovimento = () => {
    aplicarReducaoDeMovimento();
    marcarChaveMovimento();
  };
  new MutationObserver(aoMudarMovimento).observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });
  aoMudarMovimento();
});
