import {api} from '../../comum/integracao.js';
// JavaScript runs in a disposable Worker inside a unique opaque-origin iframe.
// A tight loop can be terminated without freezing the UI. No account APIs or
// storage are available in the worker; CSP blocks outbound requests.
export async function executeLab(language,code,output,preview){
 output.textContent='Executando…';preview.replaceChildren();
 try{
  if(code.length>12000)throw new Error('Limite de 12.000 caracteres.');
  if(['html','css'].includes(language)){
   const frame=document.createElement('iframe');frame.title='Prévia isolada do código';frame.setAttribute('sandbox','');
   const policy='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; form-action \'none\'">';
   frame.srcdoc=policy+(language==='css'?'<style>'+code.replace(/<\/style/gi,'')+'</style><div class="quadrado"><span>01</span><span>02</span><span>03</span><span>04</span></div>':code);preview.append(frame);output.textContent='Prévia isolada. Scripts e conexões externas estão bloqueados.';return;
  }
  if(['javascript','python'].includes(language)){
   const frame=document.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');const nonce=crypto.randomUUID();
   const workerCode=language==='javascript'?`self.onmessage=({data})=>{const logs=[];const console={log:(...args)=>{if(logs.length<200)logs.push(args.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(' ').slice(0,1000))},error:(...a)=>logs.push(a.join(' '))};try{new Function('console',data)(console);postMessage({output:logs.join('\\n')||'Executado sem saída.'})}catch(e){postMessage({error:String(e.message)})}};`:
    `self.onmessage=async({data})=>{try{importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');const logs=[];const p=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',stdout:s=>{if(logs.length<200)logs.push(s.slice(0,1000))}});await p.runPythonAsync(data);postMessage({output:logs.join('\\n')||'Executado sem saída.'})}catch(e){postMessage({error:String(e.message)})}};`;
   const str=x=>JSON.stringify(x).replace(/</g,'\\u003c');
   const policy="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src blob:; connect-src "+(language==='python'?'https://cdn.jsdelivr.net':"'none'")+"; form-action 'none'";
   frame.srcdoc=`<meta http-equiv="Content-Security-Policy" content="${policy}"><script>const worker=new Worker(URL.createObjectURL(new Blob([${str(workerCode)}],{type:'text/javascript'})));worker.onmessage=e=>{parent.postMessage({nonce:${str(nonce)},...e.data},'*');worker.terminate()};worker.onerror=e=>{parent.postMessage({nonce:${str(nonce)},error:e.message},'*');worker.terminate()};worker.postMessage(${str(code)});setTimeout(()=>{worker.terminate();parent.postMessage({nonce:${str(nonce)},error:'Tempo limite excedido.'},'*')},${language==='python'?25000:2500});<\/script>`;
   await new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);removeEventListener('message',message);frame.remove();output.textContent=value;resolve()};const message=e=>{if(e.source===frame.contentWindow&&e.data?.nonce===nonce)finish(e.data.error||e.data.output)};addEventListener('message',message);const timer=setTimeout(()=>finish('Tempo limite excedido. A execução foi interrompida.'),language==='python'?27000:3500);preview.append(frame)});return;
  }
  const result=await api('run',{language,code});output.textContent=result.output||'Executado sem saída.';
 }catch(e){output.textContent=e.message}
}
