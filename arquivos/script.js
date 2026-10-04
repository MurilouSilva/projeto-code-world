/**
 * CODEWORLD // arquivos/script.js
 * Interações exclusivas da tela ARQUIVOS.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js)
 *
 *   1. Som automático do vídeo da Super IA
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
