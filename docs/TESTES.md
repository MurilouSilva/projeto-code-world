# Verificações da versão 9.0.1

Comando: `python3 -m unittest discover -s tests -v`.

Resultado: **46 testes passaram em 10,345 segundos**, em Python 3.12.14 no Linux, simulando cp1252 como codificação padrão com `unittest.mock.patch('io.text_encoding', ...)`. Registro completo: `testes-executados-v9.txt`. Bancos e portas temporários foram usados; não há contas ou saves de teste no pacote.

| Área | Evidência |
|---|---|
| Inicialização e codificação | O teste novo reproduziu o mesmo erro da captura antes da correção. Após indicar UTF-8, o servidor inicia, responde em `/api/health` e entrega as 54 aulas em `/api/content` com acentos corretos sob cp1252 simulado. Os dois geradores de conteúdo também foram executados nesse cenário, em pasta temporária. |
| Regressão do jogo | Campanha completa de 31 fases pela API, colisões, ordem de fases, retomada e proteção contra repetição de turno. |
| Combate | Ataques diretos sem questionário, 24 habilidades, 6 personagens, cura, efeitos, derrota, proteção do Núcleo e novos consumíveis. |
| Formação | Todas as 54 aulas verificadas, níveis 1 a 10, recusa de saltos e erros, sincronização com aulas MAIN, revisão sem duplicar recompensa. |
| Missões | Seis desafios permanentes, execução sem entregar recompensa, resgate após validação e quatro resgates simultâneos concedendo uma única recompensa. |
| Diárias | Determinismo por dia, três desafios resolvíveis, renovação à meia-noite de Brasília, recusa de resgate vencido e retorno após dias offline. |
| Campanha Nexus | Quatro terminais, código testado e salvo, rejeição de código alterado inválido na conclusão, itens no inventário. |
| Dados e contas | TOTP, cookies, isolamento entre contas, compras concorrentes, conteúdo público sem gabarito, Host/Origin e arquivos privados. |
| Migração | Save v8 conserva nível, história e posição. XP de combate não sobe níveis. |
| Avaliador | Rejeita importações, chamadas arbitrárias, laços, potências e multiplicação de listas sem limite. Comentários com palavras-chave não passam por código válido. |

O teste de campanha percorre a API com aleatoriedade controlada. A suíte não representa cobertura de 100% das linhas.

## Conferência visual e estática

- 24 arquivos JavaScript passaram por `node --check`.
- As 24 direções dos seis personagens, o mapa, a arena, retratos e um quadro de ataque foram renderizados usando os módulos Canvas reais. Os fundos claros e a base cinza da moto CSS foram removidos durante a importação, preservando as roupas claras.
- No navegador desktop: tutorial de cinco passos, fechamento, cartões de campanha, filtros de missões, mudança de objetivo, edição e preservação de rascunho ao alternar missões, personagens e leitura de aulas.
- 11 páginas HTML sem referências locais ausentes; 61 arquivos originais do MAIN presentes, com 51 idênticos byte a byte. Relatório: `verificacao-arquivos-v9.json`.
- As mídias e folhas de estilo originais do MAIN foram preservadas. O manifesto original é conferido pela suíte, com exceções explícitas para as páginas integradas e os scripts educacionais/missões alterados a pedido.

## Limites da verificação

O cenário de codificação do Windows foi simulado no Linux; não houve execução em uma máquina Windows ou em Python 3.14. O fluxo autenticado completo foi validado pela API, não por login e cliques no navegador. Não foram testados aparelhos móveis, leitores de tela, áudio/vídeo completos, Pyodide remoto, tutor IA ou executor externo. As regras responsivas e de movimento reduzido estão implementadas; não equivalem a teste em dispositivos reais.

## Aceite manual sugerido

1. Inicie o servidor, reveja COMO JOGAR e cadastre/entre em uma conta com TOTP.
2. Complete uma aula e confira o nível do personagem; tente repeti-la sem receber outra recompensa.
3. Execute uma missão errada e depois correta; resgate os itens e confira o inventário após atualizar a página.
4. Entre na primeira batalha e ataque diretamente; teste alvo, bateria, antídoto, escudo e cura.
5. Confira a experiência no celular e serviços opcionais configurados por você.
