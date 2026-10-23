> Relatório histórico da v8. Para as regras atuais de combate, evolução, missões e recompensas, consulte `ALTERACOES-v9.md` e o README da raiz.

# Relatório de integração — CodeWorld

## Base preservada

O projeto `projeto-code-world-main` foi copiado integralmente antes das alterações. Nenhuma mídia original foi removida ou substituída. Todos os CSS originais e os JavaScript de animação compartilhados permanecem byte a byte iguais. O manifesto SHA-256 em `main-manifest.json` permite conferir essa preservação por teste.

As sete páginas originais receberam o link **JOGAR RPG** e os arquivos adicionais `comum/integracao.css` e `comum/integracao.js`. O layout interno, vídeos, conteúdo editorial, fichas, mapa ilustrado, acessibilidade e animações originais continuam nos seus arquivos.

O único JavaScript original com mudanças funcionais é `personagens/script.js`: o progresso educacional passou a ser separado por identidade e sincronizado com o servidor para usuários autenticados. O antigo progresso local de visitante é lido como compatibilidade, sem associá-lo silenciosamente a uma conta. O botão original de reiniciar aulas continua disponível; a lista de recompensas já recebidas impede ganhar moedas novamente depois do reinício.

## O que a auditoria encontrou

| Material | Conteúdo real e decisão |
|---|---|
| MAIN | Site estático HTML/CSS/JS, sete seções, conteúdos extensos de seis agentes, vídeos e imagens. Seu README confirma ausência de build/dependências. Não havia autenticação real nem executor de código ativo no servidor do MAIN. Esses recursos vieram do V7 e foram conectados ao portal. |
| V7 | Servidor Python/SQLite, scrypt, TOTP, sessões, economia, perguntas gerais, campanha Nexus e RPG de quatro mundos. Seus sprites SVG eram muito simples e as habilidades não correspondiam às novas fichas. |
| PDF de fichas | Seis personagens, classes, 15 pontos iniciais e limite total 20. As 24 habilidades foram transcritas com seus nomes e natureza. Custos, multiplicadores e durações não estavam definidos no PDF; são decisões de balanceamento registradas nos dados. |
| PDF de sprites | Seis pranchas com quatro direções por personagem, sem quadros de caminhada. Foram aproveitadas para retratos e direções; poses adicionais foram geradas e integradas como atlas. |
| PDF de história | Treze páginas em imagem. Roteiro com seis capítulos e epílogo, diferente dos quatro mundos do V7. A versão mais recente teve precedência. |

## Integração funcional

- Um servidor, uma sessão, um saldo e um save por conta para o portal e o RPG.
- Nova área RPG com Explorar, Personagens, Equipe, Loja, Missões e Inventário.
- Seis capítulos com cinco operações cada, mais o Núcleo final. Todos têm mapa navegável, terminais de progressão, NPC contextual, perguntas e combate.
- Layouts de mapa distintos para torres, avenida, praça, jardim, fortaleza, oficina e núcleo. Paredes e piso têm contraste e colisão calculada no servidor.
- A próxima fase exige presença física no terminal. Fases concluídas não podem ser recompensadas novamente.
- Aulas originais incorporadas aos personagens; seus conteúdos também continuam na página original. As 14 aulas adicionais do V7 ficam na Academia complementar.
- C# e SQL removidos do elenco, loja, equipe e seleção de desafios do RPG. Conteúdos legados preservados fora dele, inclusive a operação SQL do Nexus.
- Equipes de até três membros, reordenação, aquisições únicas, consumíveis, crescimento até o nível 10 e resgate de agentes ao concluir capítulos.
- Cadastro e login com TOTP, interface de conta, recuperação de configuração pendente e tutor de IA configurável.

## Combate e animações

O resultado da batalha é calculado no servidor. O navegador envia a intenção e a revisão do turno; não pode informar `won=true`, HP, dano, saldo ou conclusão. Requisições antigas são rejeitadas. As mutações são transacionais e a resposta de sucesso só é enviada depois do commit.

O cliente reproduz a sequência de eventos em Canvas: preparação, pose de ataque, efeito, impacto, número de dano/cura, atualização de HP e derrota. A próxima ação fica bloqueada enquanto a sequência é apresentada. As animações usam promessas concluídas pelo `requestAnimationFrame`/Web Animations, e não um temporizador que dispara o turno seguinte independentemente do fim visual.

Há famílias de efeitos para laser, disparo, rajada, corte, onda cortante, implante/medo, ataque em dupla, moto, investida, soco, explosão, mísseis, cura, serpentes, contenção, veneno, Gênesis, escudo, campo de força, potencialização, hack e granada. Golpes de dano também exigem uma resposta correta durante o combate.

Envenenado causa dano no início das ações; Sangramento causa dano ao tentar uma ação ofensiva. Fraqueza reduz ataque; Fortificação reduz dano recebido; Atordoamento impede uma ação. Cada efeito tem duração e indicador. Há ainda Potencialização, para as habilidades oficiais que fortalecem ataque. A IA alterna pressão sobre alvos feridos, defesa e efeitos; Clones ecoam golpes, Bugs variam sua força, Pragas podem gerar duplicatas, e a Super IA alterna protocolos das seis linguagens.

Os sprites direcionais vêm do PDF. Caminhada lateral, preparação, ataque e reação usam os quadros adicionais do atlas. A caminhada frontal/traseira articula recortes de pernas da arte direcional original. Isso é uma técnica de animação por recortes; não há uma folha manual completa e inédita para todos os estados e todas as direções. Inimigos têm sprites próprios e movimentação/efeitos procedurais, não animações desenhadas quadro a quadro para cada criatura.

## História: correspondência e limites da fonte

| Capítulo | Dupla | Corruptor |
|---|---|---|
| Torres da Estrutura / HTML | Matheus e Alan | Corruptor de Estruturas |
| Avenida / CSS | Isabelly e Richard | Apagador de Cores |
| Praça das Conexões / JavaScript | Giovanna e Italo | Loop Infinito |
| Jardim dos Dados / Python | Murilo e Carla | Corruptor de Dados |
| Fortaleza dos Sistemas / Java | Isabela e Marcos | A Exceção |
| Oficina de Sucata / Kotlin | Vinícius e K.O | Guardião do Núcleo |
| Núcleo | Seis duplas reunidas | Super IA |

O final preserva a revelação de que destruir a IA não resolve os dados contaminados: as duplas reconstroem estrutura, identidade, respostas, dados, sistemas e acesso.

A página 3 do PDF termina no meio do capítulo HTML; a página 4 já começa no meio da apresentação dos designers. Não há, nesse arquivo, a transição completa nem o cabeçalho do capítulo CSS. O nome **A Avenida das Cores**, o encerramento curto de HTML e os objetivos intermediários das cinco operações são adaptações editoriais coerentes com o trecho disponível, e não transcrições de texto ausente. O roteiro também não forneceu 25 perguntas distintas por capítulo: os conceitos das aulas do MAIN são revisitados entre operações. Os diálogos operacionais são adaptações do roteiro, identificadas como tais, enquanto os acontecimentos e pares centrais foram preservados.

As duplas são representadas nos mapas por um contato ligado à linguagem e nos diálogos pelo retrato do agente. Não foram criados doze sprites individuais exclusivos para os integrantes humanos das duplas. Objetos e terminais interativos abrem conteúdo e fases; não existe um sistema separado de quebra-cabeças de empurrar objetos.

## Segurança e execução

Foram preservados scrypt, TOTP e cookies HttpOnly/SameSite. Foram adicionadas serialização transacional, validação autoritativa de combate, controle de revisões, bloqueio de arquivos privados em GET e HEAD, restrição de Host/Origin e validação de equipes. O executor JavaScript foi movido para Worker descartável em origem opaca, com restrições de rede e tempo. O Python usa Pyodide em Worker; Java/Kotlin continuam dependendo de executor isolado externo.

O banco SQLite contém informações sensíveis, inclusive os segredos TOTP necessários à validação. O projeto local não oferece criptografia de disco, recuperação de conta por e-mail, administração de recuperação de 2FA, limitação distribuída de tráfego, operação multi-instância ou hospedagem pública pronta. Esses itens exigem projeto operacional antes de exposição pública. Não há credenciais reais, banco de jogadores ou dependências reinstaláveis dentro do ZIP.

## Referência Pokémon

Foi consultado o repositório público `https://github.com/JSLegendDev/Pokemon-p5js`, incluindo a organização de cenas descrita no README, `main.js` e os utilitários de colisão/recorte de tiles em `utils.js`. A leitura direta de `scenes/battle.js` foi bloqueada pela ferramenta de consulta, portanto não se afirma uma auditoria integral desse arquivo.

A implementação usa as mesmas ideias gerais de separação mundo/arena, pixels sem suavização, animação por quadros, lados opostos e comandos por turno. O código do combate foi escrito para este projeto em Canvas nativo e servidor Python, sem copiar sprites, música ou outros assets de Pokémon e sem incorporar p5.js desnecessariamente.

## Verificação e pendências reais

Os testes e o fluxo completo pela API estão documentados em `TESTES.md`. Foram também renderizados o mapa, a arena, um ataque e os retratos pelo próprio código Canvas, e corrigidos recortes que incluíam parte do sprite vizinho da CSS.

O navegador de QA não respondeu. Por isso a interação DOM real, a reprodução dos vídeos em navegador, a responsividade e o comportamento dos Workers/iframes sob CSP continuam **sem verificação em navegador**. O desenho responsivo e os controles estão implementados, mas isso não equivale a uma aprovação visual em dispositivos reais.

As integrações de IA e executor externo exigem configuração do dono da instalação. O download remoto do Pyodide não foi validado. Não foi publicada uma versão hospedada; a entrega é o ZIP executável solicitado.
