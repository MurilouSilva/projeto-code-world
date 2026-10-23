# CodeWorld v9.0.1 — aulas, missões e RPG conectados

O MAIN é a base desta versão. O portal original permanece nas suas sete pastas, com as mesmas imagens, vídeos, folhas de estilo e animações. A entrada **JOGAR RPG** abre a expansão.

## Começar no Windows

A v9.0.1 corrige o `UnicodeDecodeError: 'charmap'` ao carregar as aulas no Windows. Os arquivos JSON são lidos explicitamente em UTF-8, inclusive quando o sistema usa outra codificação. Se já extraiu a v9, aplique o pacote pequeno de correção na mesma pasta do projeto, substituindo os arquivos de código. O pacote não contém banco de jogadores.

1. Extraia **todo o ZIP** para uma pasta, por exemplo `C:\CodeWorld`. Não execute dentro do arquivo compactado.
2. Instale Python caso ainda não tenha. O projeto exige Python **3.10 ou superior**, e os testes desta entrega rodaram com **Python 3.12**. Não precisa instalar Node, npm nem pacotes com pip para jogar.
3. Abra a pasta `CodeWorld-Fusao` e dê dois cliques em **INICIAR-WINDOWS.bat**.
4. O navegador deve abrir em **http://127.0.0.1:8000/**. Se não abrir automaticamente, copie esse endereço.
5. Deixe a janela do servidor aberta enquanto estiver usando o site. Para encerrar, pressione **Ctrl+C** nela.

Alternativa pelo PowerShell, dentro da pasta que contém `server.py`:

```powershell
py -3 server.py
```

No Linux/macOS:

```bash
python3 server.py
```

Não abra o HTML com duplo clique: os módulos do RPG, contas e progresso dependem do servidor. O início correto é `/`, que leva à página Sobre original do MAIN.

## Conta e autenticação

Use **ENTRAR / CADASTRAR** na faixa de conta do portal ou **Entrar na resistência** no RPG. Crie um usuário de 3–24 caracteres, informe seu e-mail e uma senha com pelo menos 12 caracteres.

O cadastro apresenta uma chave de autenticação. Adicione-a ao seu aplicativo autenticador usando uma entrada baseada em tempo (TOTP), e digite o código de seis dígitos. A confirmação já entra na conta. O e-mail é um identificador: **não há envio de códigos por e-mail**.

Nos próximos acessos, use e-mail, senha e um código atual. Um código já utilizado não pode ser reutilizado. Se interromper o cadastro antes da ativação, use **Recuperar chave pendente**, com o mesmo e-mail e senha. Uma conta já ativada não expõe novamente a chave por essa função. Não há recuperação por e-mail implementada.

## Primeiro combate, passo a passo

1. Abra **JOGAR RPG → Explorar**. HTML e JavaScript estão disponíveis desde o início.
2. Clique no mapa para dar foco ao teclado. Use **WASD** ou **setas**; no celular, use os botões direcionais.
3. Você começa na posição **3, 3**. Ande duas casas para a direita, até **5, 3**, sobre o terminal rosa.
4. Pressione **E** ou **INTERAGIR**. Leia o prólogo e avance pelos diálogos.
5. Responda às cinco questões do terminal. Uma resposta incorreta permite revisar e tentar novamente.
6. A arena aparece. Selecione o aliado na lista de HP e o inimigo na lista oposta. Cada aliado consciente age uma vez por rodada.
7. Escolha uma habilidade ou **Ataque básico**. O golpe é executado diretamente, sem pergunta entre a escolha e o ataque. As cartas coloridas mostram custo de energia, alvo e efeito.
8. **Defender** reduz o dano recebido e recupera energia. Habilidades de suporte e itens permitem escolher um aliado. Atordoamento impede uma ação; veneno e sangramento exigem cuidado.
9. Após a vitória, os suprimentos são salvos no inventário. A fase fica concluída, sem repetir a recompensa. Caminhe até o próximo terminal para continuar. O nível aumenta ao concluir aulas, não ao vencer batalhas.

A quinta fase de cada capítulo enfrenta o Corruptor e libera o capítulo seguinte. O portal fica no lado inferior direito do mapa. Você também pode viajar pelo seletor para capítulos já liberados. Ao terminar os seis capítulos, há uma operação final no Núcleo: **31 operações ao todo**.

Se perder, use **Recomeçar a fase**. **Abandonar operação** também volta ao mapa e reinicia apenas a operação ativa. Ganhos anteriores permanecem; consumíveis já usados não voltam ao inventário.

## Personagens e academia, agora juntos

Abra **JOGAR RPG → Personagens → Estudar e evoluir**. Cada um dos seis personagens tem **nove aulas em sequência**: as cinco aulas originais do MAIN e quatro aulas complementares. Os conteúdos adicionais do V7 foram integrados às trilhas; as quatro leituras de SQL e C# ficam no acervo extra da página Personagens original. O antigo endereço `/academia/index.html` abre a área unificada.

Uma aula concluída aumenta um nível, começando no nível 1 e chegando ao 10. Ler ou abrir a aula não basta: é preciso acertar o questionário ou cumprir os testes da atividade prática. É possível revisar as aulas concluídas, mas elas não concedem outra recompensa. As cinco primeiras dão 25 NC cada; as complementares dão 50 NC cada. Você pode estudar um personagem antes de recrutá-lo.

As habilidades 1 e 2 estão disponíveis no nível 1; a terceira abre no nível 3 e a quarta no nível 7. Os atributos começam com 15 pontos totais e chegam ao limite total de 20 no nível 10. O golpe **7.7.7 em Dupla** exige Java consciente na equipe de JavaScript.

Em **Equipe**, escolha de um a três personagens adquiridos. O primeiro lidera a exploração. Finalize ou abandone a operação antes de trocar a equipe. Em **Loja**, use as moedas obtidas nas aulas para recrutar personagens. Vencer o Corruptor de um capítulo também recruta o personagem correspondente. Uma compra duplicada não cobra novamente.

## Missões, terminal e diárias

A página **Missões** do MAIN e a aba **Missões** do RPG abrem a mesma central. Ela tem seis desafios permanentes e três diárias, com filtros, dicas, editor, resultado dos testes e resgate separado da recompensa.

1. Escolha uma missão e leia o objetivo.
2. Edite o código e use **Executar e testar**. A resposta mostra a saída e cada critério aprovado ou pendente. HTML/CSS também têm prévia isolada.
3. Quando os testes passarem, use **Resgatar suprimentos**. Só esse passo entrega os itens. A conta deve estar conectada.
4. Use o inventário no seu turno de combate, escolhendo um aliado consciente.

As diárias são geradas automaticamente por modelos com parâmetros variados, usando a **data do servidor, com renovação às 00h de Brasília (UTC−03)**. Não dependem de IA, cron ou chave externa. O painel consulta novamente na virada do dia, em até 30 segundos, e quando a aba volta a ficar visível. Se o servidor ficou desligado, o próximo acesso recebe as missões do dia atual. Não há acúmulo dos dias perdidos. Cada recompensa pode ser recebida uma vez por conta; uma diária vencida não pode ser resgatada depois da renovação.

| Consumível | Efeito no RPG |
|---|---|
| Patch de reparo | Recupera 40% da vida máxima de um aliado consciente. |
| Antídoto | Remove veneno, sangramento, fraqueza e atordoamento. |
| Bateria de energia | Recupera até 45 pontos de energia, respeitando o limite de 100. |
| Escudo de dados | Reduz o dano recebido em 35% por duas ações do aliado. |

História, missões, desafios rápidos e campanha Nexus dão itens utilizáveis. As moedas ficam como recompensa das aulas e podem comprar personagens e consumíveis. Usar um item consome uma ação e uma unidade; não ressuscita aliados derrotados.

Os cartões de campanhas levam à exploração da cidade, aos quatro terminais Nexus ou às trilhas de personagens. A campanha Nexus mantém cinco perguntas por operação e agora valida o resultado do código (HTML, JavaScript, Python ou SQL), salva o rascunho testado e verifica novamente o código ao concluir. As perguntas dos terminais educativos continuam; foram removidas as perguntas exigidas **a cada ataque**.

## Tutorial do site

Um guia de cinco passos abre no primeiro acesso por navegador e identidade de conta. Ele explica acesso, aulas, evolução, missões, inventário e controles do RPG. Pode ser pulado e reaberto a qualquer momento em **COMO JOGAR**, no topo do site. Apagar os dados locais do navegador faz o guia reaparecer.

## Testar persistência

Conclua uma fase ou uma aula, observe seu saldo, altere a equipe e atualize a página. Saia e entre na mesma conta. Os dados devem permanecer. Pare o servidor e inicie novamente: o progresso continua no banco `data/players.sqlite3`.

Cada conta tem seu próprio saldo, equipe, inventário e campanha. Preferências visuais ficam neste navegador. O Modo Agente original continua funcionando para visitantes, com progresso local separado. Ao entrar, usa o progresso educacional da conta.

## Executores e tutor

| Recurso | Funcionamento |
|---|---|
| HTML e CSS | Prévia em quadro isolado, sem scripts nem conexões externas. |
| JavaScript no laboratório livre | Worker descartável dentro de quadro com origem isolada; interrupção por tempo limite. |
| Python no laboratório livre | Pyodide 0.26.2 herdado do V7, carregado em Worker isolado. Exige internet para baixar o interpretador. |
| Novas atividades verificadas de JavaScript e Python | Avaliador numérico limitado: variáveis, listas, operações e print/console.log. Funciona sem internet e sem executar código arbitrário no servidor. Laços, funções e bibliotecas ficam no laboratório livre. |
| SQL na campanha Nexus | SELECT limitado sobre uma base descartável em memória. Não acessa o banco de jogadores. |
| Java, Kotlin e outras linguagens compiladas | Exigem um executor externo isolado configurado pelo administrador. |
| Tutor Nexus | Exige um provedor de IA e credenciais no servidor. |

O jogo não precisa de chave de IA. Sem os serviços opcionais, o site informa sua indisponibilidade; não simula uma resposta nem executa código de usuários diretamente no servidor. O Python pode demorar no primeiro carregamento. A disponibilidade externa do Pyodide e dos serviços não pôde ser validada nesta entrega.

Configuração opcional no PowerShell, antes de iniciar (troque os valores; não publique suas chaves):

```powershell
$env:CODEWORLD_AI_URL = "https://SEU-PROVEDOR/endpoint-chat-completions"
$env:CODEWORLD_AI_KEY = "SUA-CHAVE"
$env:CODEWORLD_AI_MODEL = "MODELO-DO-SEU-PROVEDOR"
$env:CODEWORLD_RUNNER_URL = "https://SEU-EXECUTOR-ISOLADO"
$env:CODEWORLD_RUNNER_KEY = "SUA-CHAVE-DO-EXECUTOR"
py -3 server.py
```

O executor recebe `POST /execute` com `language` e `code`, e devolve um objeto JSON com `output`. Ele precisa ter isolamento próprio, limite de CPU, memória, duração, rede e arquivos. Um arquivo `.env` não é carregado automaticamente por este servidor.

## Testes automatizados

Na pasta do projeto:

```powershell
py -3 -m unittest discover -s tests -v
```

No Linux/macOS, substitua `py -3` por `python3`. Os testes usam banco temporário e porta local temporária; não modificam suas contas. A suíte cobre contas/2FA, isolamento entre usuários, compras simultâneas, recompensas únicas, colisões, fases, combate, efeitos, habilidades, aulas, campanha Nexus, bloqueio de arquivos privados e preservação do MAIN. Um teste percorre as 31 operações pela API.

Os **46 testes** passaram, com a codificação padrão cp1252 do Windows simulada. O registro atual está em `docs/TESTES.md` e `docs/testes-executados-v9.txt`. O tutorial, os filtros, a edição do terminal e a navegação pública foram conferidos em navegador desktop. Fluxos autenticados foram exercitados pela API; o fluxo autenticado completo na interface e aparelhos móveis não foram validados. O mapa, a arena e as 24 direções de sprites foram renderizados pelos módulos Canvas reais para inspeção.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `py` ou `python` não reconhecido | Instale Python e abra um novo terminal. |
| `UnicodeDecodeError: 'charmap'` em `training.py` | Aplique a correção v9.0.1. A leitura de `curriculum.json` deve usar `.read_text(encoding='utf-8')`. |
| Página não abre | Deixe o servidor aberto e confira `http://127.0.0.1:8000/`. |
| Porta ocupada | Feche o servidor anterior ou defina `$env:CODEWORLD_PORT="8001"` antes de iniciar. |
| Sprite ou módulo não carrega | Extraia todo o ZIP; não mova apenas o HTML. Confira o terminal do servidor e atualize com Ctrl+F5. |
| Código 2FA inválido | Ative data/hora automática no celular e no computador; use o próximo código se o atual já foi usado. |
| Não consigo trocar equipe | Termine ou abandone a operação ativa. |
| Próxima fase bloqueada | Conclua a anterior e caminhe até o terminal indicado no mapa. |
| Java/Kotlin não executam ou tutor não responde | Configure os serviços opcionais acima. |
| Progresso parece diferente | Confirme a conta e o caminho do banco. Não crie uma pasta nova a cada execução. |

## Backup e saves antigos

Com o servidor parado, copie `data/players.sqlite3` para um local seguro. Para restaurar, pare o servidor e reponha esse arquivo. Não coloque o banco em repositórios públicos nem envie o banco junto com o ZIP do projeto.

Para atualizar da **v8 para a v9**, extraia o novo pacote em outra pasta. Pare os dois servidores, faça backup e copie **somente** `data/players.sqlite3` da instalação antiga para `data/` na nova. A migração preserva contas, moedas, inventário, posição, campanha e níveis conquistados na v8; as aulas passam a reger os próximos avanços. Não copie os scripts antigos sobre o pacote novo.

Contas do V7 usam o mesmo esquema de autenticação. Para migrar, faça backup e copie o banco antigo para `data/` com ambos os servidores parados. Moedas, aquisições, XP e campanha Nexus permanecem. Como a história antiga tem quatro mundos e a atual tem seis capítulos, a história antiga é guardada como `storyV7`, e a nova campanha começa no prólogo. C# e SQL adquiridos ficam no registro legado, mas não entram na equipe do RPG novo.

O servidor inicia apenas em `127.0.0.1`. Publicação na internet exige configuração de hospedagem, HTTPS, proteção de rede, backups e revisão operacional. A entrega é um projeto local executável, não uma hospedagem pública já configurada. Consulte `docs/ARQUITETURA.md` e `docs/RELATORIO-INTEGRACAO.md`.
