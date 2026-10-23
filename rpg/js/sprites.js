// Asset importer: reads original directional plates, preserving character pixels.
const cache=new Map();
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Não foi possível carregar '+src));im.src=src});
const rows={html:0,javascript:1,css:2,java:3,kotlin:4,python:5};
function transparentPlate(im,id){
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
 const data=x.getImageData(0,0,c.width,c.height),a=data.data,w=c.width,h=c.height;
 // Flood only the paper connected to the edge; white clothes stay untouched.
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const add=i=>{if(i<0||i>=seen.length||seen[i])return;seen[i]=1;const n=i*4;if(a[n+3]===0||(Math.min(a[n],a[n+1],a[n+2])>(id==='css'&&i/w>h*.72?85:145)&&Math.max(a[n],a[n+1],a[n+2])-Math.min(a[n],a[n+1],a[n+2])<(id==='css'&&i/w>h*.72?70:45))){a[n+3]=0;queue[tail++]=i}};
 for(let i=0;i<w;i++){add(i);add((h-1)*w+i)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
 while(head<tail){const i=queue[head++];if(i%w){add(i-1);add(i-w-1);add(i+w-1)}if(i%w<w-1){add(i+1);add(i-w+1);add(i+w+1)}add(i-w);add(i+w)}
 x.putImageData(data,0,0);return c;
}
function trim(im,sx,sy,sw,sh,size=128){
 const c=document.createElement('canvas');c.width=sw;c.height=sh;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
 const a=ctx.getImageData(0,0,sw,sh).data;let left=sw,top=sh,right=0,bottom=0;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(a[(y*sw+x)*4+3]>120){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 const o=document.createElement('canvas');o.width=o.height=size;const ox=o.getContext('2d');ox.imageSmoothingEnabled=false;if(right<left)return o;
 const bw=right-left+1,bh=bottom-top+1,scale=Math.min((size-8)/bw,(size-8)/bh),dw=Math.round(bw*scale),dh=Math.round(bh*scale);
 ox.drawImage(c,left,top,bw,bh,Math.floor((size-dw)/2),size-4-dh,dw,dh);return o;
}
export async function loadSprites(){
 const jobs=Object.keys(rows).map(async id=>{const im=transparentPlate(await load('/rpg/assets/directions-'+id+'.png'),id);const cuts={html:[0,415,830,1252,1672],javascript:[0,386,821,1272,1672],css:[0,311,837,1361,1672],java:[0,438,834,1227,1672],kotlin:[0,418,826,1251,1672],python:[0,440,832,1230,1672]}[id];const dirs=[];for(let i=0;i<4;i++)dirs.push(trim(im,cuts[i],0,cuts[i+1]-cuts[i],im.height));cache.set(id,{dirs})});
 jobs.push(load('/rpg/assets/poses.png').then(im=>{const bounds=[0,184,366,546,724,891,im.height];for(const [id,row]of Object.entries(rows)){const poses=[];for(let col=0;col<6;col++)poses.push(trim(im,Math.floor(col*im.width/6),bounds[row],Math.floor(im.width/6),bounds[row+1]-bounds[row]));cache.set(id+'-poses',poses)}}));
 jobs.push(load('/rpg/assets/enemies.png').then(im=>{const ys=[0,278,575,932,im.height];for(let i=0;i<16;i++)cache.set('enemy-'+i,trim(im,Math.floor(i%4*im.width/4),ys[Math.floor(i/4)],Math.floor(im.width/4),ys[Math.floor(i/4)+1]-ys[Math.floor(i/4)]))}));
 await Promise.all(jobs);
}
export function spriteImage(id,dir='down',frame=1){
 if(id.startsWith('enemy-'))return cache.get(id);
 if(dir==='attack'||dir==='hurt'||dir==='walk')return cache.get(id+'-poses')?.[Math.max(0,Math.min(5,frame))];
 return cache.get(id)?.dirs[{down:0,right:1,left:2,up:3}[dir]??0];
}
export function portrait(id){return spriteImage(id)?.toDataURL()||''}
export function drawSprite(ctx,id,x,y,size=64,dir='down',frame=1,flip=false){
 const im=spriteImage(id,dir,frame);if(!im)return;ctx.save();ctx.imageSmoothingEnabled=false;
 if(flip){ctx.translate(Math.round(x+size),Math.round(y));ctx.scale(-1,1);ctx.drawImage(im,0,0,size,size)}else ctx.drawImage(im,Math.round(x),Math.round(y),size,size);ctx.restore();
}

export function drawWalk(ctx,id,x,y,size,dir,frame){
 if(dir==='left'||dir==='right'){drawSprite(ctx,id,x,y,size,'walk',frame,dir==='left');return}
 const im=spriteImage(id,dir);if(!im)return;
 // The original front/back art is articulated into actual three-frame cutouts.
 // Upper body remains directional; each leg alternates independently.
 const k=frame===0?-2:frame===2?2:0;ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(im,0,0,128,88,Math.round(x),Math.round(y),size,Math.round(size*88/128));
 ctx.drawImage(im,0,88,64,40,Math.round(x),Math.round(y+size*88/128+k),size/2,Math.round(size*40/128));
 ctx.drawImage(im,64,88,64,40,Math.round(x+size/2),Math.round(y+size*88/128-k),size/2,Math.round(size*40/128));ctx.restore();
}
