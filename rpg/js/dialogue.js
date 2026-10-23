import {dialog,esc,$} from '../../comum/integracao.js';
import {portrait} from './sprites.js';
import {reduced} from './battle-view.js';
export function speak(scenes){return new Promise(resolve=>{
 let index=0,timer,finished=false;
 const d=dialog('<div class="dialogue"><img alt="Retrato"><div><span class="cw-kicker"></span><p class="body" aria-live="polite"></p></div></div><div class="dialogue-controls"><span class="cw-note">Enter para avançar</span><button class="cw-button primary">Continuar →</button></div>','Diálogo');
 const body=$('.body',d),name=$('.cw-kicker',d),next=$('.primary',d);let typed=0;
 function show(){clearInterval(timer);const s=scenes[index];name.textContent=s.speaker;$('img',d).src=portrait(s.portrait||'html');$('img',d).alt=s.speaker;typed=0;body.textContent='';next.textContent=index===scenes.length-1?'Entendido →':'Continuar →';if(reduced()){body.textContent=s.body;typed=s.body.length}else timer=setInterval(()=>{typed+=3;body.textContent=s.body.slice(0,typed);if(typed>=s.body.length)clearInterval(timer)},22)}
 function advance(){const s=scenes[index];if(typed<s.body.length){typed=s.body.length;clearInterval(timer);body.textContent=s.body;return}if(++index>=scenes.length){finished=true;d.close()}else show()}
 next.onclick=advance;d.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();advance()}});d.addEventListener('close',()=>{clearInterval(timer);resolve(finished)},{once:true});show();next.focus();
})}
