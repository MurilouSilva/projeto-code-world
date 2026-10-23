import {LESSONS} from './legacy-lessons.js';
import {esc} from './integracao.js';
import {executeLab} from '../rpg/js/lab.js';
export function mountLibrary(){
 const root=document.createElement('section');root.className='cw-banner portal-library';root.id='acervo-complementar';
 root.innerHTML='<span class="cw-kicker">PERSONAGENS + ACADEMIA</span><h2>Aprenda para fortalecer seu personagem.</h2><p>As aulas principais e complementares agora formam uma única trilha de evolução por agente.</p><a class="cw-button primary" href="/rpg/index.html#characters">Abrir trilhas de evolução →</a><h3>Acervo extra · SQL e C#</h3>'+LESSONS.filter(l=>['SQL','C#'].includes(l.lang)).map(l=>`<details><summary>${esc(l.title)}</summary><p>${esc(l.intro)}</p>${l.sections.map(s=>`<h4>${esc(s.title)}</h4><p>${esc(s.text)}</p><pre>${esc(s.code)}</pre>`).join('')}<p>${esc(l.activity.prompt)}</p>${l.activity.type==='quiz'?l.activity.options.map((o,i)=>`<button class="cw-button" data-quiz="${l.id}:${i}">${esc(o)}</button>`).join(''):`<textarea class="code-editor" aria-label="Consulta SQL">${esc(l.activity.starter)}</textarea><button class="cw-button" data-sql>Executar consulta</button>`}<pre class="code-output" role="status"></pre><div class="code-preview"></div></details>`).join('');
 document.querySelector('main')?.append(root);
 root.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>{const[id,answer]=b.dataset.quiz.split(':'),l=LESSONS.find(l=>l.id===id);b.closest('details').querySelector('.code-output').textContent=+answer===l.activity.answerIndex?'✓ Correto!':'Revise o conteúdo e tente novamente.'});
 root.querySelectorAll('[data-sql]').forEach(b=>b.onclick=()=>{const d=b.closest('details');executeLab('sql',d.querySelector('textarea').value,d.querySelector('.code-output'),d.querySelector('.code-preview'))});
}
