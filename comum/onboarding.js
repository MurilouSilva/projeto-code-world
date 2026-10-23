import {dialog,me,esc} from './integracao.js';
import {icon} from './game-ui.js';
const steps=[
 {icon:'map',tag:'BEM-VINDO À RESISTÊNCIA',title:'Sua jornada começa aqui.',text:'CodeWorld conecta programação e aventura. Aprenda com os personagens, conquiste suprimentos e explore a cidade.',points:['Personagens: suas aulas e evolução','Missões: desafios e recompensas','Jogar RPG: exploração e batalhas']},
 {icon:'shield',tag:'01 / SALVE SUA JORNADA',title:'Uma conta para tudo.',text:'Use ENTRAR / CADASTRAR no topo. A mesma conta guarda suas aulas, personagens, inventário e campanhas.',points:['Crie usuário, e-mail e senha','Adicione a chave ao seu aplicativo autenticador','Confirme o código de seis dígitos para entrar']},
 {icon:'book',tag:'02 / APRENDA E EVOLUA',title:'Aulas que viram poder.',text:'A academia está junto dos personagens. Complete as aulas na ordem: cada conclusão aumenta um nível, até o nível 10.',points:['9 aulas por personagem','Desafios verificados para concluir','Novas habilidades nos níveis 3 e 7']},
 {icon:'battery',tag:'03 / MONTE SUA MOCHILA',title:'Missões rendem suprimentos.',text:'Abra uma missão, edite o código e clique em Executar e testar. Quando passar, resgate os itens para usar no RPG.',points:['Patch recupera vida; bateria recupera energia','Antídoto remove efeitos; escudo reduz dano','3 diárias novas às 00h de Brasília']},
 {icon:'attack',tag:'04 / ENTRE NO RPG',title:'Explore. Escolha. Ataque!',text:'Monte uma equipe de até 3 personagens. No mapa, use WASD ou setas e E para interagir; no celular, use os botões.',points:['Terminais abrem as operações da história','No combate, escolha aliado, alvo e ação','Ataques são diretos: não exigem responder perguntas']}
];
export function startTutorial(){
 if(document.querySelector('.cw-tour'))return;
 let index=0;const key='cw_guide_v9_'+(me?.id||'visitor'),d=dialog('<div class="tour-content"></div>','Tutorial CodeWorld');d.classList.add('cw-tour');
 function show(){const s=steps[index];d.querySelector('.tour-content').innerHTML=`<div class="tour-symbol">${icon(s.icon)}</div><span class="cw-kicker">${s.tag}</span><h2>${s.title}</h2><p>${s.text}</p><ol>${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><div class="tour-dots" aria-label="Passo ${index+1} de ${steps.length}">${steps.map((_,i)=>`<span class="${i===index?'active':''}"></span>`).join('')}</div><div class="cw-actions">${index?'<button class="cw-button" data-back>Voltar</button>':'<button class="cw-button" data-skip>Ver depois</button>'}${index===steps.length-1?'<a class="cw-button primary" data-finish href="/rpg/index.html#characters">Estudar primeiro →</a><a class="cw-button" data-finish href="/rpg/index.html#explore">Explorar RPG</a>':'<button class="cw-button primary" data-next>Próximo →</button>'}</div><small class="cw-note">Reabra este guia em COMO JOGAR, no topo do site.</small>`;
  d.querySelector('[data-next]')?.addEventListener('click',()=>{index++;show()});d.querySelector('[data-back]')?.addEventListener('click',()=>{index--;show()});d.querySelector('[data-skip]')?.addEventListener('click',()=>d.close());d.querySelectorAll('[data-finish]').forEach(a=>a.addEventListener('click',()=>d.close()));d.querySelector('[data-next], [data-finish]')?.focus();
 }
 d.addEventListener('close',()=>{try{localStorage.setItem(key,'done')}catch{}},{once:true});show();
}
export function initTutorial(){
 addEventListener('cw-help',startTutorial);
 try{if(!localStorage.getItem('cw_guide_v9_'+(me?.id||'visitor')))startTutorial()}catch{}
}
