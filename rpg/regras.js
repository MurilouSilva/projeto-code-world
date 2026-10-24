/**
 * CODEWORLD // rpg/regras.js
 * Regras do RPG. Antes elas ficavam no servidor em Python (combat.py,
 * campaign.py, items.py e server.py); agora rodam direto no navegador, sem
 * conta nem login, e o progresso fica salvo no localStorage.
 *
 *   1. Progresso salvo (localStorage)
 *   2. Desbloqueio e evolução pelo Modo Agente (tela Personagens)
 *   3. Itens e recompensas
 *   4. Exploração e operações da história
 *   5. Combate por turnos
 *   6. Loja, equipe e desafios rápidos
 *
 * A tela Personagens é quem libera os personagens: só entram na equipe os
 * agentes desbloqueados no Modo Agente (mesma regra e mesma ordem do
 * personagens/dados.js, carregado antes deste arquivo).
 *
 * Nada aqui mexe na tela: o script.js chama estas regras e desenha o
 * resultado. Quando uma ação não é permitida, as funções lançam um
 * ErroRegra com a mensagem que deve aparecer para o jogador.
 */

const Regras = (() => {
  const { personagens, inimigos, mapas, operacoes, itens, desafios } = DADOS_RPG;

  const CHAVE_SAVE = "cw_rpg_progresso";
  // Progresso do Modo Agente, salvo pela tela Personagens: { html: 5, css: 2 }
  const CHAVE_AGENTES = "cw_progresso_agentes";
  const NIVEIS_MODO_AGENTE = 5;
  const MOEDAS_POR_NIVEL = 50;
  const LIMITE_ITEM = 20;

  // Nível mínimo de cada uma das 4 habilidades
  const NIVEL_HABILIDADE = [1, 1, 3, 7];
  // Níveis em que um atributo cresce (o campo growth diz qual atributo)
  const MARCOS_CRESCIMENTO = [3, 5, 7, 9, 10];

  const EFEITOS = {
    poison: "Envenenado",
    bleed: "Sangramento",
    stun: "Atordoamento",
    weakness: "Fraqueza",
    fortify: "Fortificação",
    boost: "Potencialização",
  };
  const NEGATIVOS = ["poison", "bleed", "weakness", "stun"];

  const ATAQUE_BASICO = { name: "Ataque básico", cost: 0, power: 0.85, target: "enemy", energy: 18, fx: "strike" };

  const NOMES_ATAQUES = {
    stun: "Interrupção",
    poison: "Dados contaminados",
    weakness: "Interferência",
    bleed: "Fragmentação",
  };

  // A Super IA troca de protocolo a cada rodada: [linguagem, visual, efeito]
  const PROTOCOLOS_SUPER_IA = [
    ["HTML", "charge", "stun"],
    ["CSS", "missile", "weakness"],
    ["JavaScript", "wave", "bleed"],
    ["Python", "poison", "poison"],
    ["Java", "barrage", "weakness"],
    ["Kotlin", "laser", "stun"],
  ];

  const porId = (lista) => Object.fromEntries(lista.map((x) => [x.id, x]));
  const PERSONAGENS = porId(personagens);
  const INIMIGOS = porId(inimigos);
  const OPERACOES = porId(operacoes);

  // Ordem de desbloqueio da tela Personagens (AGENTES, do personagens/dados.js).
  // Se aquele arquivo não estiver na página, vale a ordem do dados.js do RPG.
  const ORDEM = (typeof AGENTES !== "undefined" ? AGENTES : personagens)
    .map((agente) => agente.id)
    .filter((id) => PERSONAGENS[id]);

  const copiar = (valor) => JSON.parse(JSON.stringify(valor));

  class ErroRegra extends Error {}

  // ==========================================================================
  // 1. PROGRESSO SALVO (LOCALSTORAGE)
  // ==========================================================================

  function progressoInicial() {
    const [x, y] = mapas[0].spawn;
    return {
      versao: 1,
      moedas: 0,
      equipe: [ORDEM[0]],
      inventario: { patch: 3, antidote: 2 },
      posicao: { mundo: 0, x, y },
      concluidas: [], // ids das operações vencidas
      ativa: null, // { id, etapa: "perguntas" | "batalha" | "derrota", pergunta, batalha }
      aulasPagas: [], // níveis do Modo Agente que já renderam moedas ("html:0")
      desafios: [], // desafios rápidos que já renderam itens
    };
  }

  function carregar() {
    let salvo = null;
    try {
      salvo = JSON.parse(localStorage.getItem(CHAVE_SAVE));
    } catch (erro) {}

    const p = Object.assign(progressoInicial(), salvo && salvo.versao === 1 ? salvo : {});

    // Saves antigos guardavam os liberados; agora quem libera é o Modo Agente
    delete p.liberados;
    // Só corrige a estrutura aqui: quem tira da equipe os agentes bloqueados
    // (e avisa o jogador) é o sincronizarModoAgente
    const equipe = Array.isArray(p.equipe) ? p.equipe : [];
    p.equipe = equipe.filter((id, i) => PERSONAGENS[id] && equipe.indexOf(id) === i).slice(0, 3);
    if (!p.equipe.length) p.equipe = [ORDEM[0]];
    return p;
  }

  // Só personagens desbloqueados, sem repetir, até 3 — e nunca vazia
  function equipeLiberada(equipe) {
    const lista = Array.isArray(equipe) ? equipe : [];
    const valida = lista.filter((id, i) => liberado(id) && lista.indexOf(id) === i).slice(0, 3);
    return valida.length ? valida : [ORDEM[0]];
  }

  let progresso = carregar();

  function salvar() {
    try {
      localStorage.setItem(CHAVE_SAVE, JSON.stringify(progresso));
    } catch (erro) {}
  }

  // Relê o save (ex.: o jogo foi aberto em outra aba)
  function recarregar() {
    progresso = carregar();
  }

  function reiniciar() {
    progresso = progressoInicial();
    salvar();
  }

  // ==========================================================================
  // 2. DESBLOQUEIO E EVOLUÇÃO PELO MODO AGENTE
  // ==========================================================================
  // Os personagens não são comprados nem evoluem lutando: tudo vem do Modo
  // Agente (tela Personagens). Cada nível concluído lá vale 2 níveis no RPG e
  // rende Nexus Coins uma vez; concluir os 5 níveis libera o próximo agente.

  function lerModoAgente() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_AGENTES)) || {};
    } catch (erro) {
      return {};
    }
  }

  function aulasConcluidas(id) {
    const concluidos = Math.floor(Number(lerModoAgente()[id]) || 0);
    return Math.max(0, Math.min(NIVEIS_MODO_AGENTE, concluidos));
  }

  // Mesma regra da tela Personagens: o primeiro agente começa liberado e cada
  // um dos outros é liberado quando os 5 níveis do anterior são concluídos.
  function liberado(id) {
    const i = ORDEM.indexOf(id);
    return i === 0 || (i > 0 && aulasConcluidas(ORDEM[i - 1]) >= NIVEIS_MODO_AGENTE);
  }

  // 0 níveis no Modo Agente → nível 1; 1 → 3; 2 → 5; 3 → 7; 4 → 9; 5 → 10
  const nivel = (id) => Math.min(10, 1 + aulasConcluidas(id) * 2);

  function atributos(personagem, nivelAtual = nivel(personagem.id)) {
    const valores = [...personagem.stats];
    MARCOS_CRESCIMENTO.forEach((marco, i) => {
      if (nivelAtual >= marco) valores[personagem.growth[i]]++;
    });
    return valores;
  }

  // Relê o Modo Agente: paga os níveis que ainda não renderam moedas e tira
  // da equipe quem deixou de estar desbloqueado (ex.: progresso reiniciado
  // na tela Personagens). Uma batalha em andamento não é alterada.
  function sincronizarModoAgente() {
    let moedas = 0;
    personagens.forEach(({ id }) => {
      for (let i = 0; i < aulasConcluidas(id); i++) {
        const chave = `${id}:${i}`;
        if (progresso.aulasPagas.includes(chave)) continue;
        progresso.aulasPagas.push(chave);
        moedas += MOEDAS_POR_NIVEL;
      }
    });
    progresso.moedas += moedas;

    const removidos = progresso.ativa ? [] : progresso.equipe.filter((id) => !liberado(id));
    if (removidos.length) progresso.equipe = equipeLiberada(progresso.equipe);

    if (moedas || removidos.length) salvar();
    return { moedas, removidos };
  }

  // ==========================================================================
  // 3. ITENS E RECOMPENSAS
  // ==========================================================================

  function conceder(recompensas) {
    Object.entries(recompensas).forEach(([id, quantidade]) => {
      if (itens[id] && quantidade > 0) {
        progresso.inventario[id] = (progresso.inventario[id] || 0) + quantidade;
      }
    });
  }

  function recompensaOperacao(operacao) {
    if (operacao.world === 6) return { patch: 5, antidote: 3, battery: 3, shield: 3 };
    if (operacao.boss) return { patch: 2, battery: 1, shield: 1 };
    return { patch: 1, [["battery", "antidote", "shield"][operacao.phase % 3]]: 1 };
  }

  const recompensaDesafio = (indice) => ({ [Object.keys(itens)[indice % 4]]: 1 });

  // ==========================================================================
  // 4. EXPLORAÇÃO E OPERAÇÕES DA HISTÓRIA
  // ==========================================================================
  // São 5 operações por capítulo. Cada 5 vencidas liberam o capítulo
  // seguinte; o Núcleo (capítulo 7) tem uma única operação final.

  const mundoLiberado = () => Math.min(6, Math.floor(progresso.concluidas.length / 5));
  const operacaoAtual = () => operacoes[progresso.concluidas.length] || null;

  // Para onde o jogador deve ir agora no capítulo em que está: o terminal da
  // próxima operação ou, se ela é de um capítulo à frente, o portal
  function objetivo() {
    const proxima = operacaoAtual();
    if (!proxima) return { tipo: "fim" };
    const { mundo } = progresso.posicao;
    if (proxima.world === mundo) {
      const [x, y] = mapas[mundo].stages[proxima.phase - 1];
      return { tipo: "operacao", operacao: proxima, x, y };
    }
    const [x, y] = mapas[mundo].portal;
    return { tipo: "portal", x, y };
  }

  // Caminho mais curto (busca em largura) da posição atual até [x, y] no
  // mapa do capítulo. Devolve a lista de passos [dx, dy] ou null se não der.
  function rota(x, y) {
    const { mundo, x: ox, y: oy } = progresso.posicao;
    const linhas = mapas[mundo].rows;
    if (linhas[y]?.[x] !== ".") return null;

    const chave = (cx, cy) => cy * 100 + cx;
    const veioDe = new Map([[chave(ox, oy), null]]);
    const fila = [[ox, oy]];
    while (fila.length) {
      const [cx, cy] = fila.shift();
      if (cx === x && cy === y) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (linhas[ny]?.[nx] !== "." || veioDe.has(chave(nx, ny))) continue;
        veioDe.set(chave(nx, ny), [cx, cy, dx, dy]);
        fila.push([nx, ny]);
      }
    }
    if (!veioDe.has(chave(x, y))) return null;

    // Refaz o caminho de trás para frente
    const passos = [];
    for (let k = chave(x, y); veioDe.get(k); ) {
      const [cx, cy, dx, dy] = veioDe.get(k);
      passos.unshift([dx, dy]);
      k = chave(cx, cy);
    }
    return passos;
  }

  function exigirSemOperacao(mensagem) {
    if (progresso.ativa) throw new ErroRegra(mensagem);
  }

  function irPara(mundo) {
    const [x, y] = mapas[mundo].spawn;
    progresso.posicao = { mundo, x, y };
  }

  function mover(dx, dy) {
    exigirSemOperacao("Conclua ou abandone a operação atual antes de explorar.");
    if (!Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) + Math.abs(dy) !== 1) {
      throw new ErroRegra("Movimento inválido.");
    }

    const { mundo } = progresso.posicao;
    const mapa = mapas[mundo];
    const x = progresso.posicao.x + dx;
    const y = progresso.posicao.y + dy;
    if (mapa.rows[y]?.[x] !== ".") throw new ErroRegra("Parede: procure uma passagem.");

    progresso.posicao = { mundo, x, y };

    // O portal leva ao próximo capítulo quando ele já foi liberado
    let mundoMudou = false;
    if (x === mapa.portal[0] && y === mapa.portal[1] && mundo < mundoLiberado()) {
      irPara(mundo + 1);
      mundoMudou = true;
    }
    salvar();
    return { mundoMudou };
  }

  function viajar(mundo) {
    exigirSemOperacao("Conclua ou abandone a operação atual antes de viajar.");
    if (!Number.isInteger(mundo) || mundo < 0 || mundo > mundoLiberado()) {
      throw new ErroRegra("Capítulo ainda bloqueado.");
    }
    irPara(mundo);
    salvar();
  }

  function iniciarOperacao(id) {
    const esperada = operacaoAtual();
    if (!esperada || id !== esperada.id) throw new ErroRegra("Esta fase está concluída ou ainda bloqueada.");

    const [x, y] = mapas[esperada.world].stages[esperada.phase - 1];
    const { mundo, x: px, y: py } = progresso.posicao;
    if (mundo !== esperada.world || px !== x || py !== y) {
      throw new ErroRegra("Pise no terminal desta fase para iniciar.");
    }

    if (!progresso.ativa) progresso.ativa = { id, etapa: "perguntas", pergunta: 0, batalha: null };
    salvar();
  }

  // Volta ao mapa; a operação recomeça do zero e os itens gastos não voltam
  function abandonarOperacao() {
    progresso.ativa = null;
    salvar();
  }

  // As 5 perguntas do terminal precisam ser acertadas para a batalha começar
  function responderTerminal(resposta) {
    const ativa = progresso.ativa;
    if (!ativa || ativa.etapa !== "perguntas") throw new ErroRegra("Nenhum terminal aguarda resposta.");

    const operacao = OPERACOES[ativa.id];
    const pergunta = operacao.questions[ativa.pergunta];
    if (!Number.isInteger(resposta) || resposta < 0 || resposta >= pergunta.o.length) {
      throw new ErroRegra("Resposta inválida.");
    }

    const correta = resposta === pergunta.a;
    if (correta) {
      const ultima = ativa.pergunta + 1 === operacao.questions.length;
      // A batalha é criada antes de mudar o estado: se der erro, nada muda
      const batalha = ultima ? criarBatalha(progresso.equipe, operacao) : null;
      ativa.pergunta++;
      if (ultima) Object.assign(ativa, { etapa: "batalha", batalha });
      salvar();
    }
    return { correta, explicacao: pergunta.explanation || "" };
  }

  // Uma ação de um aliado na batalha. Devolve os eventos para a animação.
  function agir(intencao) {
    const ativa = progresso.ativa;
    if (!ativa || ativa.etapa !== "batalha") throw new ErroRegra("Não há batalha ativa.");

    const operacao = OPERACOES[ativa.id];
    const batalha = ativa.batalha;
    executarTurno(batalha, intencao, progresso.inventario);

    const resultado = { eventos: batalha.eventos, batalha };

    if (batalha.resultado === "vitoria") {
      const recompensas = recompensaOperacao(operacao);
      conceder(recompensas);
      progresso.concluidas.push(operacao.id);
      progresso.ativa = null;
      Object.assign(resultado, { concluida: true, recompensas, encerramento: operacao.outro });
    } else if (batalha.resultado === "derrota") {
      ativa.etapa = "derrota";
      resultado.derrota = true;
    }

    salvar();
    return resultado;
  }

  // ==========================================================================
  // 5. COMBATE POR TURNOS
  // ==========================================================================
  // Cada aliado consciente age uma vez por rodada; quando todos agem, os
  // inimigos respondem. Cada passo vira um evento ({ tipo, ... }) que o
  // desenho.js anima na arena.

  function criarAliado(id, nivelAtual) {
    const personagem = PERSONAGENS[id];
    const [vida, inteligencia, combate, sanidade] = atributos(personagem, nivelAtual);
    const vidaMax = 120 + vida * 24 + (nivelAtual - 1) * 14;
    return {
      id,
      uid: id,
      lado: "aliados",
      nome: personagem.name,
      nivel: nivelAtual,
      vidaMax,
      vida: vidaMax,
      energia: 45,
      ataque: 15 + combate * 8 + inteligencia * 2 + (nivelAtual - 1) * 4,
      defesa: 8 + vida * 2 + sanidade * 2,
      sanidade,
      inteligencia,
      efeitos: [],
      defendendo: false,
      habilidades: personagem.skills,
    };
  }

  // Vida, ataque e defesa dos inimigos crescem com o capítulo e a fase
  function criarInimigo(id, indice, mundo, fase) {
    const dados = INIMIGOS[id];
    const chefe = Boolean(dados.boss);
    const vidaMax = chefe ? 330 + mundo * 70 + fase * 10 : 120 + mundo * 33 + fase * 10;
    return {
      id,
      uid: "inimigo" + indice,
      lado: "inimigos",
      nome: dados.name,
      sprite: dados.sprite,
      chefe,
      vidaMax,
      vida: vidaMax,
      energia: 100,
      ataque: 25 + mundo * 7 + fase * 2 + (chefe ? 10 : 0),
      defesa: 10 + mundo * 3,
      sanidade: 3,
      efeitos: [],
      defendendo: false,
      efeito: dados.effect,
      fx: dados.fx,
    };
  }

  function criarBatalha(equipe, operacao) {
    const aliados = equipe.filter((id) => PERSONAGENS[id] && liberado(id)).map((id) => criarAliado(id, nivel(id)));
    if (!aliados.length) throw new ErroRegra("Escolha pelo menos um personagem na Equipe.");

    return {
      operacao: operacao.id,
      revisao: 0,
      rodada: 1,
      vez: 0, // índice do aliado escolhido para agir
      agiram: [], // índices dos aliados que já agiram nesta rodada
      aliados,
      inimigos: operacao.enemies.map((id, i) => criarInimigo(id, i, operacao.world, operacao.phase)),
      resultado: null, // "vitoria" ou "derrota"
      eventos: [],
      ultimaHabilidade: null, // copiada pelo Clone Cinzento
    };
  }

  const registrar = (b, tipo, dados = {}) => b.eventos.push({ tipo, ...dados });
  const vivos = (unidades) => unidades.filter((u) => u.vida > 0);
  const tem = (u, efeito) => u.efeitos.some((e) => e.tipo === efeito);

  function aplicarEfeito(b, u, tipo, duracao) {
    if (!EFEITOS[tipo]) return;
    const turnos = duracao || (tipo === "stun" ? 1 : 2);
    u.efeitos = u.efeitos.filter((e) => e.tipo !== tipo);
    // A "marca" impede que o efeito perca um turno na mesma ação em que entrou
    u.efeitos.push({ tipo, turnos, marca: b.revisao });
    registrar(b, "efeito", { alvo: u.uid, efeito: tipo, turnos });
  }

  function ferir(b, u, quantidade, tipo = "dano") {
    const valor = Math.min(u.vida, Math.max(0, Math.trunc(quantidade)));
    u.vida -= valor;
    registrar(b, tipo, { alvo: u.uid, valor, vida: u.vida });
    if (u.vida === 0) registrar(b, "desmaio", { alvo: u.uid });
  }

  function calcularDano(autor, alvo, habilidade) {
    let valor = Math.max(4, autor.ataque * (habilidade.power ?? 1) - alvo.defesa * 0.55);
    if (tem(autor, "weakness")) valor *= 0.7;
    if (tem(autor, "boost")) valor *= 1.3;
    if (tem(alvo, "fortify")) valor *= 0.65;
    if (alvo.defendendo) valor *= 0.45;
    return Math.max(1, Math.round(valor));
  }

  // Cada ação da própria unidade tira um turno dos efeitos dela
  function envelhecer(u, revisao) {
    u.efeitos.forEach((e) => {
      if (e.marca < revisao) e.turnos--;
    });
    u.efeitos = u.efeitos.filter((e) => e.turnos > 0);
  }

  // Veneno e sangramento ferem no início do turno; atordoamento faz perder a vez
  function inicioDoTurno(b, u, atacando = true) {
    if (tem(u, "poison")) ferir(b, u, Math.max(1, Math.round(u.vidaMax * 0.045)), "veneno");
    if (atacando && tem(u, "bleed") && u.vida > 0) {
      ferir(b, u, Math.max(1, Math.round(u.vidaMax * 0.06)), "sangramento");
    }
    if (u.vida <= 0) return false;
    if (tem(u, "stun")) {
      registrar(b, "atordoado", { alvo: u.uid });
      u.efeitos = u.efeitos.filter((e) => e.tipo !== "stun");
      return false;
    }
    return true;
  }

  function verificarFim(b) {
    if (!vivos(b.inimigos).length) b.resultado = "vitoria";
    else if (!vivos(b.aliados).length) b.resultado = "derrota";
    if (b.resultado) registrar(b, b.resultado);
    return Boolean(b.resultado);
  }

  function executar(b, autor, habilidade, alvos) {
    registrar(b, "golpe", {
      autor: autor.uid,
      alvos: alvos.map((alvo) => alvo.uid),
      nome: habilidade.name,
      fx: habilidade.fx || "strike",
      golpes: habilidade.hits || 1,
    });
    autor.energia = Math.max(
      0,
      Math.min(100, (autor.energia ?? 100) - (habilidade.cost || 0) + (habilidade.energy || 0)),
    );

    alvos.forEach((alvo) => {
      if (habilidade.power) ferir(b, alvo, calcularDano(autor, alvo, habilidade));
      if (habilidade.heal) {
        const valor = Math.min(alvo.vidaMax - alvo.vida, Math.round(alvo.vidaMax * habilidade.heal));
        alvo.vida += valor;
        registrar(b, "cura", { alvo: alvo.uid, valor, vida: alvo.vida });
      }
      if (alvo.vida <= 0) return;

      [habilidade.effect, habilidade.extraEffect].forEach((efeito) => {
        if (!efeito) return;
        // A sanidade dá chance de resistir aos efeitos negativos dos inimigos
        const resiste =
          autor.lado === "inimigos" &&
          NEGATIVOS.includes(efeito) &&
          Math.random() < Math.min(0.4, alvo.sanidade * 0.04);
        if (resiste) registrar(b, "resistiu", { alvo: alvo.uid, efeito });
        else aplicarEfeito(b, alvo, efeito, habilidade.duration);
      });
    });

    if (habilidade.selfEffect) aplicarEfeito(b, autor, habilidade.selfEffect);
  }

  function golpeInimigo(b, inimigo, i) {
    const golpe = { name: NOMES_ATAQUES[inimigo.efeito] || "Impacto", fx: inimigo.fx, power: 1 };
    if ((b.rodada + i) % 2 === 0 && inimigo.efeito !== "fortify") golpe.effect = inimigo.efeito;

    // O Clone Cinzento repete o último golpe da equipe
    if (inimigo.id === "clone" && b.ultimaHabilidade) {
      const copia = b.ultimaHabilidade;
      Object.assign(golpe, {
        name: "Eco de " + copia.name,
        fx: copia.fx || "strike",
        power: Math.min(1.35, copia.power || 1),
      });
    }
    if (inimigo.id === "bug") golpe.power = [0.8, 1.25, 1.0][b.rodada % 3];
    if (inimigo.id === "boss6") {
      const [linguagem, fx, efeito] = PROTOCOLOS_SUPER_IA[(b.rodada - 1) % 6];
      Object.assign(golpe, { name: "Protocolo corrompido · " + linguagem, fx, effect: efeito });
    }
    return golpe;
  }

  function rodadaInimiga(b) {
    // Percorre uma cópia da lista: duplicatas criadas agora só agem na próxima rodada
    for (const [i, inimigo] of [...b.inimigos].entries()) {
      if (inimigo.vida <= 0) continue;
      b.revisao++;

      if (inicioDoTurno(b, inimigo)) {
        const seProtege =
          inimigo.efeito === "fortify" &&
          !tem(inimigo, "fortify") &&
          (inimigo.vida < inimigo.vidaMax * 0.6 || b.rodada === 1);

        if (seProtege) {
          const defesa = { name: "Defesa do sistema", fx: "shield", target: "self", effect: "fortify" };
          executar(b, inimigo, defesa, [inimigo]);
        } else {
          const candidatos = vivos(b.aliados);
          if (!candidatos.length) break;
          // Alterna a pressão entre o aliado mais ferido e um aliado qualquer
          const alvo =
            (b.rodada + i) % 3
              ? candidatos.reduce((menor, u) => (u.vida / u.vidaMax < menor.vida / menor.vidaMax ? u : menor))
              : candidatos[Math.floor(Math.random() * candidatos.length)];
          executar(b, inimigo, golpeInimigo(b, inimigo, i), [alvo]);
        }
      }

      envelhecer(inimigo, b.revisao);
      if (verificarFim(b)) return;

      // A praga de duplicatas se multiplica na 3ª rodada
      if (["duplicate", "boss3"].includes(inimigo.id) && b.rodada === 3 && b.inimigos.length < 4) {
        const vidaMax = Math.max(60, Math.floor(inimigo.vidaMax / 3));
        const duplicata = {
          ...copiar(inimigo),
          uid: "inimigo" + b.inimigos.length,
          id: "duplicate",
          nome: "Duplicata instável",
          chefe: false,
          vidaMax,
          vida: vidaMax,
          efeitos: [],
        };
        b.inimigos.push(duplicata);
        registrar(b, "reforco", { unidade: copiar(duplicata) });
      }
    }

    b.rodada++;
    b.agiram = [];
    vivos(b.aliados).forEach((u) => {
      u.defendendo = false;
      u.energia = Math.min(100, u.energia + 8 + u.inteligencia);
    });
    registrar(b, "rodada", { rodada: b.rodada });
  }

  // Descobre a habilidade usada pela ação (ou null para "defender")
  function habilidadeDaAcao(autor, intencao, inventario) {
    const { acao, item } = intencao;
    if (acao === "habilidade") {
      const n = intencao.habilidade;
      if (!Number.isInteger(n) || n < 0 || n > 3) throw new ErroRegra("Habilidade inválida.");
      if (autor.nivel < NIVEL_HABILIDADE[n]) throw new ErroRegra("Habilidade ainda bloqueada pelo nível.");
      return autor.habilidades[n];
    }
    if (acao === "basico") return ATAQUE_BASICO;
    if (acao === "item") {
      if (!itens[item] || !(inventario[item] >= 1)) throw new ErroRegra("Item indisponível.");
      const uso = { name: itens[item].name, fx: item === "shield" ? "shield" : "heal", target: "ally" };
      if (item === "patch") uso.heal = 0.4;
      if (item === "shield") Object.assign(uso, { effect: "fortify", duration: 2 });
      return uso;
    }
    if (acao === "defender") return null;
    throw new ErroRegra("Ação desconhecida.");
  }

  function alvosDaHabilidade(b, autor, habilidade, uidAlvo) {
    const modo = habilidade.target || "enemy";
    let alvos;
    if (modo === "self") alvos = [autor];
    else if (modo === "team") alvos = vivos(b.aliados);
    else if (modo === "all") alvos = vivos(b.inimigos).slice(0, habilidade.maxTargets || 99);
    else {
      const lado = modo === "ally" ? b.aliados : b.inimigos;
      alvos = lado.filter((u) => u.uid === uidAlvo && u.vida > 0);
    }
    if (!alvos.length) throw new ErroRegra("Selecione um alvo vivo.");

    // No Núcleo, a Super IA só pode ser atingida depois da carapaça e dos braços
    if (b.operacao === "c7s1" && vivos(b.inimigos.filter((u) => !u.chefe)).length) {
      alvos = alvos.filter((u) => !u.chefe);
      if (!alvos.length) throw new ErroRegra("Destrua a carapaça e os braços antes de atingir o Núcleo.");
    }
    return alvos;
  }

  // Valida a ação inteira antes de mudar qualquer coisa na batalha
  function executarTurno(b, intencao, inventario) {
    if (b.resultado) throw new ErroRegra("Esta batalha já terminou.");

    const indice = intencao.aliado ?? b.vez;
    const autor = b.aliados[indice];
    if (!Number.isInteger(indice) || !autor) throw new ErroRegra("Aliado inválido.");
    if (autor.vida <= 0 || b.agiram.includes(indice)) {
      throw new ErroRegra("Este aliado já agiu ou está derrotado.");
    }

    const habilidade = habilidadeDaAcao(autor, intencao, inventario);
    let alvos = [];
    if (habilidade) {
      if (autor.energia < (habilidade.cost || 0)) {
        throw new ErroRegra("Energia insuficiente. Use ataque básico ou defenda.");
      }
      if (habilidade.requires && !vivos(b.aliados).some((u) => u.id === habilidade.requires)) {
        const parceiro = PERSONAGENS[habilidade.requires].name;
        throw new ErroRegra(`${parceiro} precisa estar consciente na equipe para o ataque em dupla.`);
      }
      alvos = alvosDaHabilidade(b, autor, habilidade, intencao.alvo);
    }

    // A partir daqui a ação é válida: a batalha muda
    b.eventos = [];
    b.revisao++;
    const atacando = intencao.acao === "basico" || intencao.acao === "habilidade";

    if (inicioDoTurno(b, autor, atacando)) {
      if (!habilidade) {
        autor.defendendo = true;
        autor.energia = Math.min(100, autor.energia + 30);
        registrar(b, "golpe", { autor: autor.uid, alvos: [autor.uid], nome: "Defender", fx: "shield", golpes: 1 });
      } else {
        executar(b, autor, habilidade, alvos);
        if (habilidade.power) {
          b.ultimaHabilidade = { name: habilidade.name, power: habilidade.power, fx: habilidade.fx };
        }
        if (intencao.acao === "item") usarItem(b, intencao.item, alvos, inventario);
      }
    }

    envelhecer(autor, b.revisao);
    b.agiram.push(indice);

    if (!verificarFim(b)) {
      const proximo = () => b.aliados.findIndex((u, i) => u.vida > 0 && !b.agiram.includes(i));
      if (proximo() < 0) rodadaInimiga(b);
      b.vez = Math.max(0, proximo());
    }
    return b;
  }

  function usarItem(b, item, alvos, inventario) {
    inventario[item]--;
    alvos.forEach((alvo) => {
      if (item === "antidote") alvo.efeitos = alvo.efeitos.filter((e) => !NEGATIVOS.includes(e.tipo));
      if (item === "battery") {
        const valor = Math.min(45, 100 - alvo.energia);
        alvo.energia += valor;
        registrar(b, "energia", { alvo: alvo.uid, valor, energia: alvo.energia });
      }
    });
  }

  // ==========================================================================
  // 6. LOJA, EQUIPE E DESAFIOS RÁPIDOS
  // ==========================================================================

  // A loja vende só suprimentos: personagens são liberados no Modo Agente
  function comprar(id) {
    exigirSemOperacao("Finalize a operação antes de comprar.");
    const item = itens[id];
    if (!item) throw new ErroRegra("Item desconhecido.");
    if ((progresso.inventario[id] || 0) >= LIMITE_ITEM) {
      throw new ErroRegra(`Limite de ${LIMITE_ITEM} unidades por item.`);
    }
    if (progresso.moedas < item.price) throw new ErroRegra("Saldo insuficiente.");
    progresso.inventario[id] = (progresso.inventario[id] || 0) + 1;
    progresso.moedas -= item.price;
    salvar();
  }

  function definirEquipe(equipe) {
    exigirSemOperacao("Finalize ou abandone a operação antes de alterar a equipe.");
    const valida =
      Array.isArray(equipe) &&
      equipe.length >= 1 &&
      equipe.length <= 3 &&
      new Set(equipe).size === equipe.length &&
      equipe.every((id) => PERSONAGENS[id] && liberado(id));
    if (!valida) {
      throw new ErroRegra("Monte a equipe com 1 a 3 personagens desbloqueados na tela Personagens, sem repetir.");
    }
    progresso.equipe = [...equipe];
    salvar();
  }

  // Cada desafio rende itens só na primeira vez que é acertado
  function responderDesafio(id, resposta) {
    const indice = desafios.findIndex((d) => d.id === id);
    const desafio = desafios[indice];
    if (!desafio || !Number.isInteger(resposta) || resposta < 0 || resposta >= desafio.o.length) {
      throw new ErroRegra("Resposta inválida.");
    }
    if (resposta !== desafio.a) return { correta: false, recompensas: {} };

    let recompensas = {};
    if (!progresso.desafios.includes(id)) {
      recompensas = recompensaDesafio(indice);
      progresso.desafios.push(id);
      conceder(recompensas);
      salvar();
    }
    return { correta: true, recompensas };
  }

  return {
    ErroRegra,
    EFEITOS,
    NIVEL_HABILIDADE,
    NIVEIS_MODO_AGENTE,
    MOEDAS_POR_NIVEL,
    LIMITE_ITEM,
    get progresso() {
      return progresso;
    },
    recarregar,
    reiniciar,
    personagem: (id) => PERSONAGENS[id],
    operacao: (id) => OPERACOES[id],
    aulasConcluidas,
    liberado,
    liberados: () => ORDEM.filter(liberado),
    anterior: (id) => ORDEM[ORDEM.indexOf(id) - 1] || null,
    nivel,
    atributos,
    sincronizarModoAgente,
    recompensaOperacao,
    recompensaDesafio,
    mundoLiberado,
    operacaoAtual,
    objetivo,
    rota,
    mover,
    viajar,
    iniciarOperacao,
    abandonarOperacao,
    responderTerminal,
    agir,
    comprar,
    definirEquipe,
    responderDesafio,
  };
})();
