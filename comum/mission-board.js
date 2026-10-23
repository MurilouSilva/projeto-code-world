import {api,me,refresh,requireLogin,esc,toast} from './integracao.js';
import {icon,rewardHTML,rewardText} from './game-ui.js';
import {executeLab} from '../rpg/js/lab.js';

export async function mountMissionBoard(root){
 let data=await api('missions'),selected=data.missions.find(m=>!m.completed)?.id||data.missions[0].id,filter='all',working=false,destroyed=false;
 const drafts=new Map();let revision=0;
 const $=s=>root.querySelector(s),current=()=>data.missions.find(m=>m.id===selected);
 function draw(){
  if(destroyed)return;
  root.innerHTML=`<div class="ops-intro"><div><span class="cw-kicker">CENTRAL DE OPERAÇÕES</span><h2>Pequenas missões.<br><span>Grandes poderes.</span></h2><p>Resolva desafios, receba suprimentos e leve suas conquistas para o RPG.</p></div><a class="cw-button" href="/rpg/index.html#inventory">${icon('patch')} Abrir inventário →</a></div>
  <div class="campaign-cards"><a class="campaign-card cyan" href="/rpg/index.html#explore"><span class="campaign-icon">${icon('map')}</span><small>CAMPANHA DA CIDADE</small><h3>Resgate as linguagens</h3><p>31 operações, exploração e batalhas por turnos.</p><strong>${me?.progress.story.cleared.length||0}/31 recuperadas <span>Explorar →</span></strong></a><a class="campaign-card violet" href="/campanha/index.html"><span class="campaign-icon">${icon('code')}</span><small>CAMPANHA NEXUS</small><h3>Do conceito ao código</h3><p>Quatro terminais: HTML, JavaScript, Python e SQL.</p><strong>${me?.progress.nexus.cleared.length||0}/4 concluídos <span>Abrir campanha →</span></strong></a><a class="campaign-card pink" href="/rpg/index.html#characters"><span class="campaign-icon">${icon('book')}</span><small>PERSONAGENS + ACADEMIA</small><h3>Estude. Suba de nível.</h3><p>Aulas e prática para liberar o potencial do seu time.</p><strong>6 trilhas · 9 aulas <span>Treinar agentes →</span></strong></a></div>
  <div class="ops-heading"><div><span class="cw-kicker">QUADRO DE MISSÕES</span><h3>Seu próximo objetivo</h3></div><p class="daily-clock">${icon('star')} 3 diárias · renovação às 00h de Brasília<br><small id="daily-date"></small></p></div>
  <div class="ops-filters" role="group" aria-label="Filtrar missões">${[['all','Todas'],['daily','Diárias'],['permanent','Permanentes'],['completed','Concluídas']].map(([id,label])=>`<button class="cw-button ${filter===id?'primary':''}" data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><div class="ops-workspace"><div class="ops-list" aria-label="Missões disponíveis"></div><article class="ops-terminal"></article></div>`;
  $('#daily-date').textContent='Lote de '+data.day.split('-').reverse().join('/');
  root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{if(working)return;revision++;saveDraft();filter=b.dataset.filter;const rows=visible();if(!rows.some(m=>m.id===selected))selected=rows[0]?.id;draw()});
  drawList();drawTerminal();
 }
 function visible(){return data.missions.filter(m=>filter==='all'||(filter==='daily'?m.daily:filter==='permanent'?!m.daily:m.completed))}
 function saveDraft(){if(current()&&$('.ops-code'))drafts.set(selected,$('.ops-code').value)}
 function drawList(){
  $('.ops-list').innerHTML=visible().map(m=>`<button class="ops-mission ${m.id===selected?'selected':''} ${m.completed?'is-complete':''}" data-mission="${esc(m.id)}" aria-pressed="${m.id===selected}"><span class="mission-meta">${m.daily?'DIÁRIA':'PERMANENTE'} · ${m.language.toUpperCase()} ${m.completed?'✓ CONCLUÍDA':''}</span><strong>${esc(m.title)}</strong>${rewardHTML(m.rewards)}<span class="mission-open">${m.completed?'Revisar desafio':'Abrir terminal'} →</span></button>`).join('')||'<p class="ops-empty">Nenhuma missão aqui ainda. Complete um desafio para ver suas conquistas.</p>';
  root.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>{if(working)return;saveDraft();selected=b.dataset.mission;revision++;drawList();drawTerminal()});
 }
 function drawTerminal(){
  const m=current();if(!m){$('.ops-terminal').innerHTML='<div class="ops-empty">'+icon('code')+'<h3>Escolha sua próxima missão</h3><p>Abra uma missão na lista para começar.</p></div>';return}
  $('.ops-terminal').innerHTML=`<div class="terminal-bar"><span class="terminal-lights" aria-hidden="true">● ● ●</span><span>nexus / ${m.language}</span><span>${m.completed?'CONCLUÍDA':'PRONTO'}</span></div><div class="terminal-body"><span class="cw-kicker">OBJETIVO</span><h3>${esc(m.title)}</h3><p>${esc(m.objective)}</p><label class="editor-label" for="mission-code">SEU CÓDIGO · ${m.language.toUpperCase()}</label><textarea id="mission-code" class="ops-code" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(drafts.get(m.id)??m.starter)}</textarea><details class="ops-hint"><summary>Preciso de uma dica</summary><p>${esc(m.hint)}</p></details><div class="cw-actions"><button class="cw-button primary" id="mission-run">${icon('code')} Executar e testar</button><button class="cw-button" id="mission-reset">Restaurar código</button></div><div class="ops-console" role="status" aria-live="polite"><p>Edite o código e execute para conferir o resultado.</p></div><div class="code-preview"></div><div class="mission-loot"><span class="cw-kicker">SUPRIMENTOS PARA O RPG</span>${rewardHTML(m.rewards)}<button class="cw-button" id="mission-claim" disabled>${m.completed?'Recompensa já recebida':'Conclua os testes para resgatar'}</button></div></div>`;
  $('#mission-run').onclick=()=>run(false);$('#mission-claim').onclick=()=>run(true);
  $('#mission-reset').onclick=()=>{if(working)return;$('.ops-code').value=m.starter;drafts.delete(m.id);invalidate()};
  $('.ops-code').oninput=()=>{saveDraft();invalidate()};
 }
 function invalidate(){const claim=$('#mission-claim');claim.disabled=true;claim.textContent=current().completed?'Recompensa já recebida':'Execute o código atualizado para resgatar'}
 async function run(claim){
  if(working||!requireLogin())return;const m=current(),version=revision,code=$('.ops-code').value;working=true;
  $('#mission-run').disabled=true;$('#mission-claim').disabled=true;$('.ops-code').readOnly=true;$('.ops-console').textContent=claim?'Confirmando recompensa…':'Executando testes…';
  try{
   const result=await api('missions/'+(claim?'claim':'run'),{id:m.id,day:data.day,code});if(destroyed||version!==revision)return;
   if(['html','css'].includes(m.language)){const sink=document.createElement('pre');await executeLab(m.language,code,sink,$('.code-preview'))}
   $('.ops-console').innerHTML=`${result.output?`<pre>${esc(result.output)}</pre>`:''}<ul class="test-checks">${result.checks.map(c=>`<li class="${c.ok?'pass':'fail'}">${c.ok?'✓':'×'} ${esc(c.label)}</li>`).join('')}</ul><strong>${result.passed?'Tudo certo! Código aprovado.':'Ainda falta um ajuste. Veja os testes acima.'}</strong>`;
   if(claim&&result.passed){m.completed=true;await refresh();drawList();toast(result.alreadyClaimed?'Essa recompensa já está no inventário.':'Recebido: '+rewardText(result.granted));$('.ops-console').innerHTML+='<p class="loot-confirmed">✓ Suprimentos salvos no inventário da sua conta.</p>'}
   $('#mission-claim').disabled=!result.passed||m.completed;$('#mission-claim').textContent=m.completed?'✓ Recompensa recebida':'Resgatar suprimentos →';
  }catch(e){if(!destroyed)$('.ops-console').textContent=e.message}
  finally{working=false;if(!destroyed&&version===revision){$('#mission-run').disabled=false;$('.ops-code').readOnly=false}}
 }
 async function renew(){if(working||destroyed||Date.now()<Date.parse(data.expires))return;try{const next=await api('missions');if(next.day!==data.day){saveDraft();data=next;selected=data.missions.find(m=>!m.completed)?.id;revision++;draw();toast('Novas missões diárias disponíveis!')}}catch{}}
 draw();const timer=setInterval(renew,30000);document.addEventListener('visibilitychange',renew);
 return ()=>{destroyed=true;clearInterval(timer);document.removeEventListener('visibilitychange',renew)};
}
