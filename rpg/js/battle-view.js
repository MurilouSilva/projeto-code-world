import {drawSprite} from './sprites.js';
export const reduced=()=>document.documentElement.classList.contains('sem-animacao')||matchMedia('(prefers-reduced-motion: reduce)').matches;
export function animate(ms,draw,signal){
 return new Promise(resolve=>{const start=performance.now();let raf;const end=()=>{cancelAnimationFrame(raf);signal?.removeEventListener('abort',end);resolve()};if(signal?.aborted)return end();signal?.addEventListener('abort',end,{once:true});const tick=now=>{if(signal?.aborted)return end();const t=Math.min(1,(now-start)/Math.max(1,reduced()?Math.min(ms,90):ms));draw(t);if(t<1)raf=requestAnimationFrame(tick);else end()};raf=requestAnimationFrame(tick)});
}
export async function transition(container){const overlay=document.createElement('div');overlay.className='transition-swipe';container.append(overlay);const a=overlay.animate([{transform:'translateX(-110%)'},{transform:'translateX(0)',offset:.45},{transform:'translateX(110%)'}],{duration:reduced()?100:650,easing:'ease-in-out'});await a.finished.catch(()=>{});overlay.remove()}
const colors={laser:'#7cfcff',bullet:'#ffe36a',barrage:'#ffb765',slash:'#fbd95e',wave:'#eaff90',fear:'#bb75fa',duo:'#fff59b',bike:'#66f7ec',charge:'#ffb463',punch:'#ff9365',explosion:'#ffad54',missile:'#fe798b',heal:'#6af4cb',serpent:'#53cfff',bind:'#8bc4ff',poison:'#dfd649',genesis:'#b57efc',shield:'#77ecff',barrier:'#70d5ff',boost:'#ffe89b',hack:'#c694fa',grenade:'#c985fc',strike:'#e9edff'};
export class BattleView{
 constructor(canvas,battle,onVisual){this.canvas=canvas;canvas.width=960;canvas.height=420;this.ctx=canvas.getContext('2d');this.b=structuredClone(battle);this.onVisual=onVisual;this.poses={};this.fx=null;this.float=null;this.flash={};this.abort=new AbortController();this.disposed=false;this.audio=null;this.draw(performance.now());this.loop=now=>{if(this.disposed)return;if(!document.hidden)this.draw(now);this.raf=requestAnimationFrame(this.loop)};this.raf=requestAnimationFrame(this.loop)}
 position(uid){let i=this.b.team.findIndex(u=>u.uid===uid);if(i>=0)return{x:130+i*123,y:343+i%2*13,size:122};i=this.b.enemies.findIndex(u=>u.uid===uid);return{x:565+i*(this.b.enemies.length>3?103:125),y:232+i%2*13,size:this.b.enemies.length>3?100:112}}
 unit(uid){return [...this.b.team,...this.b.enemies].find(u=>u.uid===uid)}
 beep(fx){if(!document.querySelector('#sound')?.checked)return;try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type=['slash','punch','bike'].includes(fx)?'sawtooth':'square';o.frequency.setValueAtTime(['heal','shield','genesis'].includes(fx)?560:220,a.currentTime);o.frequency.exponentialRampToValueAtTime(90,a.currentTime+.16);g.gain.setValueAtTime(.025,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.2);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.22)}catch{}}
 draw(now){const c=this.ctx;c.imageSmoothingEnabled=false;c.fillStyle='#080b1b';c.fillRect(0,0,960,420);
  // Pixel skyline, layered machinery and a converging arena grid.
  c.fillStyle='#121b34';c.fillRect(0,128,960,100);
  for(let i=0;i<24;i++){const h=35+(i*17)%76,x=i*43;c.fillStyle=i%2?'#1c2944':'#172139';c.fillRect(x,135-h,37,h+80);c.fillStyle='#306070';for(let k=0;k<5;k++)c.fillRect(x+7,146-h+k*12,5,3);if(i%3===0){c.fillStyle='#a0376b';c.fillRect(x+22,130-h,4,9)}}
  c.fillStyle='#141529';c.fillRect(0,215,960,205);c.strokeStyle='#244b5e';c.lineWidth=1;for(let x=-1000;x<2000;x+=125){c.beginPath();c.moveTo(480+(x-480)*.16,215);c.lineTo(x,420);c.stroke()}for(let y=225;y<420;y+=Math.max(12,(y-200)*.18)){c.beginPath();c.moveTo(0,Math.round(y));c.lineTo(960,Math.round(y));c.stroke()}
  const platform=(x,y,w,color)=>{c.fillStyle='#0a0c17';c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x+w/2,y);c.lineTo(x+w/2+35,y+30);c.lineTo(x-w/2-35,y+30);c.fill();c.fillStyle=color;c.fillRect(x-w/2,y+28,w,3)};platform(245,337,350,'#00c5db');platform(734,224,330,'#d62786');
  const units=[...this.b.enemies,...this.b.team];for(const u of units){const p=this.position(u.uid),pose=this.poses[u.uid]||{},faint=u.hp<=0;const offset=pose.dx||0;c.save();c.globalAlpha=faint?.25:1;
   if(this.flash[u.uid]){c.globalAlpha=.45+.55*Math.abs(Math.sin(now/25))}
   if(u.side==='team')drawSprite(c,u.id,p.x-p.size/2+offset,p.y-p.size+(pose.dy||0),p.size,pose.frame!==undefined?'attack':'right',pose.frame??1);
   else{drawSprite(c,'enemy-'+u.sprite,p.x-p.size/2+offset,p.y-p.size+(pose.dy||0),p.size,'down');}
   c.restore();
   if(u.effects?.length){c.font='10px monospace';c.textAlign='center';c.fillStyle='#e0d8ff';c.fillText(u.effects.map(e=>({poison:'VEN',bleed:'SAN',weakness:'FRQ',stun:'ATD',fortify:'FOR',boost:'POT'}[e.type])).join(' · '),p.x,p.y+14)}
   if(this.b.team[this.b.actor]?.uid===u.uid&&u.hp>0){c.fillStyle='#4df6ff';c.fillRect(p.x-3,p.y-p.size-12,6,5)}
  }
  if(this.fx)this.drawFX(c,this.fx,now);
  if(this.float){const f=this.float,p=this.position(f.uid);c.font='bold 22px monospace';c.textAlign='center';c.fillStyle=f.color;c.fillText(f.text,p.x,p.y-105-f.t*35)}
 }
 drawFX(c,f,now){const p=this.position(f.actor),color=colors[f.type]||'#8cf9ff',t=f.t;c.fillStyle=color;c.strokeStyle=color;
  for(const uid of f.targets){const q=this.position(uid),sx=p.x,sy=p.y-65,tx=q.x,ty=q.y-65;
   if(['shield','barrier','heal','genesis','boost','fear','hack','bind','poison'].includes(f.type)){
    const radius=20+Math.floor(t*35);c.lineWidth=3;c.strokeRect(tx-radius,ty-radius,radius*2,radius*2);
    for(let k=0;k<14;k++){const a=k*2.4+t*5,xx=tx+Math.cos(a)*radius,yy=ty+Math.sin(a)*radius;c.fillRect(Math.round(xx),Math.round(yy),4,6)}
    if(f.type==='heal'||f.type==='genesis'){for(let k=0;k<5;k++){let xx=tx-30+k*15,yy=ty+30-t*70+(k%2)*10;c.fillRect(xx,yy,4,13);c.fillRect(xx-5,yy+5,14,4)}}
   }else if(['slash','wave','duo','punch','strike'].includes(f.type)){
    const n=f.type==='duo'?5:3;c.lineWidth=f.type==='punch'?9:4;for(let k=0;k<n;k++){c.beginPath();c.moveTo(tx-45+k*10,ty-30+Math.floor(t*20));c.lineTo(tx-10+k*15,ty+30);c.stroke()}
    for(let k=0;k<14;k++){const a=k*2.4,dist=t*60;c.fillRect(Math.round(tx+Math.cos(a)*dist),Math.round(ty+Math.sin(a)*dist),4,4)}
   }else if(['explosion','grenade','missile'].includes(f.type)&&t>.5){const rad=(t-.5)*140;for(let k=0;k<20;k++){const a=k*1.9;c.fillStyle=k%2?'#ffe37b':color;c.fillRect(Math.round(tx+Math.cos(a)*rad),Math.round(ty+Math.sin(a)*rad),8,8)}c.fillStyle='#fff0b5';c.fillRect(tx-12,ty-12,24,24)
   }else{
    const n=['bullet','barrage','missile'].includes(f.type)?Math.min(6,f.hits||3):f.type==='serpent'?2:1;
    for(let k=0;k<n;k++){const v=Math.max(0,Math.min(1,t*1.25-k*.08)),px=Math.round(sx+(tx-sx)*v),py=Math.round(sy+(ty-sy)*v+(f.type==='serpent'?Math.sin(v*9+k*3)*18:k*7));c.fillStyle=k%2&&f.type==='serpent'?'#f8da4b':color;c.fillRect(px-14,py-2,28,5);for(let z=0;z<3;z++)c.fillRect(px-z*9,py-1,4,3);if(f.type==='laser'){c.fillStyle='#d5ffff';c.fillRect(sx,sy,Math.max(0,px-sx),2)}}
   }
  }
 }
 async play(events,log){for(const e of events){if(this.disposed)return;if(e.kind==='cast'){
    log(e.name);this.beep(e.fx);this.poses[e.actor]={frame:3};await animate(160,t=>{this.poses[e.actor]={frame:3,dy:-Math.round(Math.sin(t*Math.PI)*5)}},this.abort.signal);
    await animate(['barrage','duo','missile'].includes(e.fx)?600:410,t=>{const close=['charge','bike','punch','strike'].includes(e.fx);this.poses[e.actor]={frame:4,dx:close?Math.round(Math.sin(t*Math.PI)*(this.unit(e.actor)?.side==='team'?90:-90)):0};this.fx={type:e.fx,actor:e.actor,targets:e.targets,t,hits:e.hits};if(e.fx==='duo'){const j=this.b.team.find(u=>u.id==='java');if(j)this.poses[j.uid]={frame:4}}},this.abort.signal);this.fx=null;this.poses={};
   }else if(['damage','heal','poison','bleed'].includes(e.kind)){
    const u=this.unit(e.target);if(u){u.hp=e.hp;this.onVisual?.(this.b)}this.flash[e.target]=e.kind!=='heal';this.poses[e.target]={frame:e.kind==='heal'?1:5};await animate(280,t=>{this.float={uid:e.target,text:(e.kind==='heal'?'+':'−')+e.amount,color:e.kind==='heal'?'#70ffd5':'#fff0ab',t}},this.abort.signal);this.float=null;delete this.flash[e.target];delete this.poses[e.target];
   }else if(e.kind==='effect'){const u=this.unit(e.target);if(u){u.effects=u.effects.filter(x=>x.type!==e.effect);u.effects.push({type:e.effect,turns:e.turns});this.onVisual?.(this.b)}}
   else if(e.kind==='energy'){const u=this.unit(e.target);if(u){u.energy=e.energy;this.onVisual?.(this.b)}log('Bateria: +'+e.amount+' de energia.')}
   else if(e.kind==='stun'){log(this.unit(e.target)?.name+' perdeu a ação por Atordoamento.');await animate(200,()=>{},this.abort.signal)}
   else if(e.kind==='spawn'){this.b.enemies.push(e.unit);this.onVisual?.(this.b);log('Uma duplicata entrou no combate.')}
   else if(e.kind==='round'){log('Rodada '+e.round+' · sua equipe pode agir.');}
  }}
 sync(b){this.b=structuredClone(b);this.poses={};this.fx=null;this.draw(performance.now())}
 destroy(){this.disposed=true;this.abort.abort();cancelAnimationFrame(this.raf);this.audio?.close().catch(()=>{})}
}
