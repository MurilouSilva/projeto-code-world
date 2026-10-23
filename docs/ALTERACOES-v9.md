# Alterações v9

## Correção v9.0.1 — inicialização no Windows

- Leitura explícita em UTF-8 em `training.py`, nos dois geradores de conteúdo e no teste do manifesto original. Corrige o `UnicodeDecodeError: 'charmap'` ao importar as aulas.
- Novo teste inicia o servidor com cp1252 simulado e verifica a API de saúde, as 54 aulas e seus acentos. Total: 46 testes aprovados.
- Sem alteração do banco ou do progresso dos jogadores.

## Recursos da v9

Esta versão substitui o comportamento de combate, evolução e recompensas descrito no relatório histórico da v8.

- Comandos de combate com cores por função, ícones, descrições, energia, aliado ativo e alvo destacado. Ataques não abrem perguntas.
- Recorte do fundo conectado à borda por oito vizinhos, incluindo a base neutra da moto CSS. Bitmaps originais preservados.
- Personagens e academia em seis trilhas de nove aulas; conclusão verificada concede um nível até o máximo 10. Conteúdos originais e complementares preservados.
- Central de missões compartilhada pelo MAIN e RPG: seis permanentes e três diárias geradas pelo servidor. Terminal editável, dicas, testes, prévia, rascunhos por missão e resgate separado.
- Recompensas das missões e campanhas convertidas em patch, antídoto, bateria e escudo, consumíveis reais no RPG. Aulas dão moedas.
- Campanhas com cartões navegáveis e progresso; Nexus valida comportamento e refaz a verificação na conclusão.
- Tutorial automático com cinco passos, opção de pular e reabertura por COMO JOGAR.
- Migração v8 sem reiniciar história, posição, saldo ou níveis já obtidos.

Consulte README.md para instalação, atualização e limites dos laboratórios. Consulte TESTES.md para as verificações realizadas.
