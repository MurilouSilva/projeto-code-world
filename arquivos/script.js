/**
 * CODEWORLD // arquivos/script.js
 * Interações exclusivas da tela ARQUIVOS.
 * (Menu, acessibilidade e animações gerais ficam em ../comum/base.js)
 *
 *   1. Som do vídeo da Super IA
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. SOM DO VÍDEO DA SUPER IA
  // ==========================================================================
  // Os navegadores só deixam um vídeo tocar sozinho se ele estiver mudo.
  // Por isso: tentamos tocar COM som; se o navegador bloquear, o vídeo toca
  // mudo e o botão "ATIVAR SOM" aparece para o usuário liberar o áudio.
  const video = document.getElementById("VIDEO-SUPERIA");
  const botao = document.getElementById("BOTAO-SOM");
  if (!video || !botao) return;

  const texto = botao.querySelector(".texto.som");
  const icone = botao.querySelector(".icone.som");

  // Mantém o botão de acordo com o estado do som (inclusive quando o usuário
  // usa o botão de volume do próprio player)
  function atualizarBotao() {
    const mudo = video.muted || video.volume === 0;
    texto.textContent = mudo ? "ATIVAR SOM" : "SILENCIAR";
    icone.textContent = mudo ? "🔇" : "🔊";
    botao.classList.toggle("chamando", mudo);
    botao.setAttribute("aria-pressed", !mudo);
  }

  botao.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    // Se o vídeo estava pausado (ex.: bloqueado), o clique também dá o play
    video.play().catch(() => {});
    atualizarBotao();
  });

  video.addEventListener("volumechange", atualizarBotao);

  // Com "Reduzir movimento" ligado o vídeo fica pausado (idioma-e-movimento.js)
  if (document.documentElement.classList.contains("sem-animacao")) {
    botao.hidden = false;
    atualizarBotao();
    return;
  }

  video.muted = false;
  video
    .play()
    .catch(() => {
      // Bloqueado pelo navegador: volta a tocar sem som
      video.muted = true;
      return video.play().catch(() => {});
    })
    .finally(() => {
      botao.hidden = false;
      atualizarBotao();
    });
});
