# Origem e organização dos recursos visuais

- `img/`: todas as mídias originais do MAIN, sem substituição, incluindo os três vídeos.
- `rpg/assets/directions-html.png`: página 1 do PDF de sprites, extraída sem redesenho.
- `rpg/assets/directions-javascript.png`: página 2.
- `rpg/assets/directions-css.png`: página 3.
- `rpg/assets/directions-java.png`: página 4.
- `rpg/assets/directions-kotlin.png`: página 5.
- `rpg/assets/directions-python.png`: página 6.
- `rpg/assets/poses.png`: atlas gerado a partir dessas referências, com correção posterior das poses de Kotlin. Seis linhas e seis quadros por linha; o recorte usa as fronteiras visuais reais, pois a distribuição da arte não é perfeitamente uniforme.
- `rpg/assets/enemies.png`: atlas original gerado com dezesseis criaturas/chefes/companheiro. As fichas usam regiões deste atlas; variações narrativas podem compartilhar uma silhueta.

As duas artes novas foram produzidas com a ferramenta integrada de geração de imagens, não por API/CLI externo. O fundo tem canal alfa; cores presentes em pixels totalmente transparentes não são renderizadas. Nenhuma arte de Pokémon ou Undertale foi incorporada. O terreno, partículas, projéteis, escudos e impactos são desenhados pelo próprio código Canvas.

O importador remove apenas o papel branco conectado à borda das pranchas originais; preserva pixels brancos internos, como partes de roupas. Escalonamento usa `imageSmoothingEnabled=false` e CSS `image-rendering:pixelated`.

## Direção usada nos prompts

Atlas de poses: seis personagens correspondentes ao PDF, identidade e cores preservadas, todos em vista lateral direita. Três quadros de caminhada, preparação, execução e reação. CSS permanece na moto; Kotlin mantém óculos laranja, traje roxo/laranja e K.O; Python mantém as serpentes azul e amarela. Pixels definidos, grade de seis por seis e fundo transparente. A revisão corrigiu a troca indevida de aparência de Kotlin por Python nas duas poses de ataque.

Atlas de inimigos: grade quatro por quatro, criaturas voltadas para a esquerda, estética retro cyberpunk com ciano, violeta e coral. Drone, sentinela, inseto, clone, planta de dados, fantasma nulo, robô de sucata, bloqueador; chefes de estrutura, névoa, loop, dados, exceção, guardião e núcleo; um pequeno K.O. Sem textos ou símbolos de interface substituindo personagens.

Animações laterais usam os quadros gerados; caminhada frontal/traseira articula recortes da arte direcional. A arte gerada foi inspecionada em renderizações nativas do jogo; esta inspeção não substitui a revisão visual de toda a interface no navegador.
