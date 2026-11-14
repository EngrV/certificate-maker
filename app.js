(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('certificateCanvas'), ctx = canvas.getContext('2d');
const state = { logo:null, logoUrl:null, colors:['#173b69','#d4a94f','#e9edf2','#ffffff'], mode:'hybrid', template:'elegant', selected:null, zoom:1, positions:{}, objects:[], signatures:{sign1:null,sign2:null} };
const defaults = {
 org:{x:.5,y:.105,size:30,color:'#173b69',font:'700'}, title:{x:.5,y:.235,size:66,color:'#173b69',font:'700'}, subtitle:{x:.5,y:.34,size:25,color:'#596579',font:'500'},
 recipient:{x:.5,y:.46,size:76,color:'#173b69',font:'600'}, body:{x:.5,y:.59,size:28,color:'#475569',font:'400'},
 date:{x:.5,y:.72,size:23,color:'#596579',font:'400'}, sign1:{x:.29,y:.87,size:22,color:'#173b69',font:'700'}, role1:{x:.29,y:.91,size:17,color:'#596579',font:'400'},
 sign2:{x:.71,y:.87,size:22,color:'#173b69',font:'700'}, role2:{x:.71,y:.91,size:17,color:'#596579',font:'400'}
};
const fields = {org:'orgName',title:'certificateTitle',subtitle:'subtitle',recipient:'recipient',body:'bodyText',date:'dateText',sign1:'sign1',role1:'role1',sign2:'sign2',role2:'role2'};
const presets = {a4:[11.7,8.3],letter:[11,8.5],legal:[14,8.5]};
let drag = null, toastTimer;
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
function luminance(c){const [r,g,b]=hexRgb(c);return .2126*r+.7152*g+.0722*b}
function contrast(c){return luminance(c)>165?'#233247':'#ffffff'}
function setPalette(colors){state.colors=colors;document.querySelectorAll('#swatches i').forEach((el,i)=>el.style.background=colors[i]||'#fff');$('textColor').value=colors[0]}
function extractColors(img){
 const c=document.createElement('canvas'),w=100,h=Math.max(1,Math.round(100*img.height/img.width));c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);const d=x.getImageData(0,0,w,h).data, bins={};
 for(let i=0;i<d.length;i+=16){let a=d[i+3];if(a<100)continue;let r=d[i],g=d[i+1],b=d[i+2];if(Math.max(r,g,b)>247&&Math.min(r,g,b)>232)continue;const key=[Math.round(r/32)*32,Math.round(g/32)*32,Math.round(b/32)*32].join(',');bins[key]=(bins[key]||0)+1}
 const sorted=Object.entries(bins).sort((a,b)=>b[1]-a[1]).map(([k])=>{const [r,g,b]=k.split(',').map(Number);return rgbHex(r,g,b)});
 const result=[];for(const col of sorted){if(result.every(c=>Math.abs(luminance(c)-luminance(col))>22)){result.push(col)}if(result.length===3)break}
 while(result.length<3)result.push(['#173b69','#d4a94f','#e9edf2'][result.length]);result.push('#ffffff');return result;
}
function loadLogo(file){if(!file)return;if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)){toast('Please choose a PNG, JPG, WEBP, or SVG image.');return}
 const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{state.logo=img;state.logoUrl=url;$('logoThumb').src=url;$('logoThumb').hidden=false;$('logoName').textContent=file.name;setPalette(extractColors(img));render();toast('Logo uploaded and brand colors detected.')};img.onerror=()=>toast('Could not read that logo file.');img.src=url}
function applyOrientation(value){
 const w=Number($('pageWidth').value),h=Number($('pageHeight').value);
 if(value==='portrait'&&w>h){$('pageWidth').value=h;$('pageHeight').value=w}
 if(value==='landscape'&&h>w){$('pageWidth').value=h;$('pageHeight').value=w}
 render();
}
function loadSignature(file,key){
 if(!file){state.signatures[key]=null;render();return}
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Choose a PNG, JPG, or WEBP signature image.');return}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{state.signatures[key]=img;render();toast('Signature added.')};
 img.onerror=()=>toast('Could not read that signature image.');
 img.src=url;
}
function dimensions(){let w=Number($('pageWidth').value),h=Number($('pageHeight').value),dpi=Number($('dpi').value);if(!Number.isFinite(w)||!Number.isFinite(h)||w<3||h<3||w>30||h>30){toast('Enter page dimensions between 3 and 30 inches.');return null}return {w,h,dpi,pw:Math.round(w*dpi),ph:Math.round(h*dpi)}}
function setCanvasSize(){const d=dimensions();if(!d)return false;canvas.width=d.pw;canvas.height=d.ph;$('canvasDimensions').textContent=`${d.w} × ${d.h} inches · ${d.dpi} DPI`;return true}
function getPos(key){return {...(defaults[key]),...(state.positions[key]||{})}}
function drawBackground(w,h){
 const [primary,accent,light]=state.colors;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 const style=state.template;
 if(style==='modern'){ctx.fillStyle=light;ctx.fillRect(0,0,w,h);ctx.fillStyle=primary;ctx.fillRect(0,0,w*.105,h);ctx.fillStyle=accent;ctx.fillRect(w*.105,0,w*.009,h);ctx.globalAlpha=.08;ctx.fillStyle=primary;ctx.beginPath();ctx.moveTo(w*.82,0);ctx.lineTo(w,h*.0);ctx.lineTo(w,h);ctx.lineTo(w*.96,h);ctx.closePath();ctx.fill();ctx.globalAlpha=1}
 else if(style==='geometric'||style==='creative'){ctx.fillStyle=light;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.12;ctx.fillStyle=primary;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(w*(.72+i*.05),0);ctx.lineTo(w,h*(.12+i*.1));ctx.lineTo(w,h*(.22+i*.1));ctx.closePath();ctx.fill()}ctx.globalAlpha=1;ctx.fillStyle=accent;ctx.fillRect(0,0,w,.018*h)}
 else if(style==='classic'){ctx.fillStyle='#fbf8f0';ctx.fillRect(0,0,w,h);ctx.globalAlpha=.07;ctx.strokeStyle=primary;ctx.lineWidth=2;for(let x=0;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}ctx.globalAlpha=1}
 else {ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,w,h);ctx.globalAlpha=.07;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(w,h*.0,w*.35,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
 // soft watermark-like geometry from logo colors
 ctx.save();ctx.globalAlpha=.045;ctx.strokeStyle=primary;ctx.lineWidth=Math.max(2,w*.0015);for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(w*.5,h*.5,w*(.19+i*.018),0,Math.PI*2);ctx.stroke()}ctx.restore();
}
function drawBorder(w,h){
 const [p,a]=state.colors,mode=$('borderStyle').value;if(mode==='none')return;
 const m=Math.min(w,h)*.055;ctx.save();ctx.strokeStyle=mode==='single'?p:a;ctx.lineWidth=Math.max(2,Math.min(w,h)*.003);
 ctx.strokeRect(m,m,w-2*m,h-2*m);
 if(mode==='double'||mode==='ornate'){ctx.strokeStyle=mode==='double'?a:p;ctx.lineWidth=Math.max(1,Math.min(w,h)*.0015);ctx.strokeRect(m*1.18,m*1.18,w-2*m*1.18,h-2*m*1.18)}
 if(mode==='ornate'){ctx.strokeStyle=a;ctx.lineWidth=Math.max(2,Math.min(w,h)*.004);const s=m*.7;[[m,m],[w-m,m],[m,h-m],[w-m,h-m]].forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,s,i===1?Math.PI/2:0,i===0?Math.PI/2:Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-s*.5,y);ctx.lineTo(x+s*.5,y);ctx.moveTo(x,y-s*.5);ctx.lineTo(x,y+s*.5);ctx.stroke()})}
 ctx.restore();
}
function drawLogo(w,h){if(!state.logo||$('logoPosition').value==='none')return;const maxW=w*.12,maxH=h*.14,ratio=Math.min(maxW/state.logo.width,maxH/state.logo.height),lw=state.logo.width*ratio,lh=state.logo.height*ratio;let x=(w-lw)/2,y=h*.065;if($('logoPosition').value==='left')x=w*.075;if($('logoPosition').value==='right')x=w-lw-w*.075;ctx.drawImage(state.logo,x,y,lw,lh)}
function drawSignatures(w,h){
 [['sign1',.29],['sign2',.71]].forEach(([key,x])=>{
  const img=state.signatures[key];if(!img)return;
  const maxW=w*.13,maxH=h*.055,scale=Math.min(maxW/img.width,maxH/img.height);
  const sw=img.width*scale,sh=img.height*scale;
  ctx.drawImage(img,w*x-sw/2,h*.815-sh/2,sw,sh);
 });
}
function text(key,w,h){
 const pos=getPos(key),raw=$(fields[key]).value||'',sourceLines=raw.split('\\n');
 const page=dimensions();let size=pos.size/1000*8.3*(page?canvas.width/page.w:Math.min(w,h)/2480);
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=pos.color;
 const family=key==='title'||key==='recipient'?'Georgia, serif':'Arial, sans-serif';
 const maxWidth=w*.76;
 // If a single unbreakable word is too wide, reduce the font size uniformly;
 // never squeeze or stretch the text horizontally.
 ctx.font=`${pos.font} ${size}px ${family}`;
 const longestWord=Math.max(0,...sourceLines.flatMap(line=>line.split(/\\s+/).map(word=>ctx.measureText(word).width)));
 if(longestWord>maxWidth){size*=maxWidth/longestWord;ctx.font=`${pos.font} ${size}px ${family}`}
 const rows=[];
 sourceLines.forEach(line=>{
  const words=line.split(/\\s+/).filter(Boolean);
  if(!words.length){rows.push('');return}
  let current='';
  words.forEach(word=>{
   const candidate=current?current+' '+word:word;
   if(current&&ctx.measureText(candidate).width>maxWidth){rows.push(current);current=word}
   else current=candidate;
  });
  if(current)rows.push(current);
 });
 const lineH=size*1.28,y=pos.y*h;
 rows.forEach((line,i)=>ctx.fillText(line,w*pos.x,y+(i-(rows.length-1)/2)*lineH));
 ctx.restore();
}
function render(){if(!setCanvasSize())return;const w=canvas.width,h=canvas.height;drawBackground(w,h);drawBorder(w,h);drawLogo(w,h);drawSignatures(w,h);
 Object.keys(defaults).forEach(k=>text(k,w,h));
 if(state.selected){const p=getPos(state.selected),x=p.x*w,y=p.y*h;ctx.save();ctx.strokeStyle='#3478d4';ctx.lineWidth=Math.max(2,w*.001);ctx.setLineDash([8,6]);ctx.strokeRect(x-w*.17,y-h*.035,w*.34,h*.07);ctx.restore()}
}
function pointerPos(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
function nearest(p){let best=null,dist=.07;for(const k of Object.keys(defaults)){const q=getPos(k),d=Math.hypot(q.x-p.x,(q.y-p.y)*.8);if(d<dist){best=k;dist=d}}return best}
canvas.addEventListener('pointerdown',e=>{const p=pointerPos(e),k=nearest(p);if(!k){state.selected=null;render();return}state.selected=k;drag={key:k};$('selectionLabel').textContent=`Selected: ${k}`;$('fontSize').value=getPos(k).size;$('textColor').value=getPos(k).color;canvas.setPointerCapture(e.pointerId);render()});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pointerPos(e),pos=getPos(drag.key);pos.x=Math.max(.08,Math.min(.92,p.x));pos.y=Math.max(.08,Math.min(.94,p.y));state.positions[drag.key]=pos;render()});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
function update(){render()}
$('logoInput').addEventListener('change',e=>loadLogo(e.target.files[0]));
$('signature1').addEventListener('change',e=>loadSignature(e.target.files[0],'sign1'));
$('signature2').addEventListener('change',e=>loadSignature(e.target.files[0],'sign2'));
$('orientation').addEventListener('change',e=>applyOrientation(e.target.value));
$('dropZone').addEventListener('dragover',e=>{e.preventDefault();$('dropZone').classList.add('dragging')});$('dropZone').addEventListener('dragleave',()=>$('dropZone').classList.remove('dragging'));$('dropZone').addEventListener('drop',e=>{e.preventDefault();$('dropZone').classList.remove('dragging');loadLogo(e.dataTransfer.files[0])});
document.querySelectorAll('input:not([type=file]),textarea,select').forEach(el=>el.addEventListener('input',()=>{if(el.id==='paperPreset'&&presets[el.value]){
 $('pageWidth').value=presets[el.value][0];$('pageHeight').value=presets[el.value][1];
 $('orientation').value=Number($('pageWidth').value)>=Number($('pageHeight').value)?'landscape':'portrait';
 }
 if(el.id==='pageWidth'||el.id==='pageHeight'){
  const w=Number($('pageWidth').value),h=Number($('pageHeight').value);
  if(w&&h)$('orientation').value=w>=h?'landscape':'portrait';
 }if(el.id==='fontSize'&&state.selected){const p=getPos(state.selected);p.size=Math.max(8,Math.min(120,Number(el.value)||30));state.positions[state.selected]=p}if(el.id==='textColor'&&state.selected){const p=getPos(state.selected);p.color=el.value;state.positions[state.selected]=p}render()}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));toast(state.mode==='auto'?'Automatic logo-based design selected.':'Template and automatic generation selected.')}))
$('template').addEventListener('change',e=>{state.template=e.target.value;render();renderBackgroundGallery()});$('borderStyle').addEventListener('change',render);$('logoPosition').addEventListener('change',render);$('dpi').addEventListener('change',render);$('pageWidth').addEventListener('change',render);$('pageHeight').addEventListener('change',render);
function renderBackgroundGallery(){
 const wrap=$('backgroundChoices');if(!wrap)return;
 const names=[['elegant','Elegant gold'],['modern','Modern minimal'],['geometric','Geometric'],['classic','Classic formal'],['creative','Creative colorful']];
 wrap.innerHTML='';
 names.forEach(([style,label])=>{
  const item=document.createElement('button');item.type='button';item.className='background-option'+(state.template===style?' active':'');
  const thumb=document.createElement('canvas');thumb.width=320;thumb.height=190;
  const temp=thumb.getContext('2d'),[primary,accent,light]=state.colors;
  temp.fillStyle='#fff';temp.fillRect(0,0,320,190);
  if(style==='modern'){temp.fillStyle=light;temp.fillRect(0,0,320,190);temp.fillStyle=primary;temp.fillRect(0,0,34,190);temp.fillStyle=accent;temp.fillRect(34,0,3,190)}
  else if(style==='geometric'||style==='creative'){temp.fillStyle=light;temp.fillRect(0,0,320,190);temp.globalAlpha=.18;temp.fillStyle=primary;for(let i=0;i<7;i++){temp.beginPath();temp.moveTo(225+i*14,0);temp.lineTo(320,40+i*18);temp.lineTo(320,65+i*18);temp.closePath();temp.fill()}temp.globalAlpha=1;temp.fillStyle=accent;temp.fillRect(0,0,320,3)}
  else if(style==='classic'){temp.fillStyle='#fbf8f0';temp.fillRect(0,0,320,190);temp.strokeStyle=primary;temp.globalAlpha=.13;for(let x=0;x<320;x+=12){temp.beginPath();temp.moveTo(x,0);temp.lineTo(x,190);temp.stroke()}temp.globalAlpha=1}
  else{temp.fillStyle='#fffdf8';temp.fillRect(0,0,320,190);temp.globalAlpha=.16;temp.fillStyle=accent;temp.beginPath();temp.arc(320,0,110,0,Math.PI*2);temp.fill();temp.globalAlpha=1}
  temp.strokeStyle=accent;temp.lineWidth=2;temp.strokeRect(9,9,302,172);temp.strokeStyle=primary;temp.lineWidth=1;temp.strokeRect(14,14,292,162);
  temp.fillStyle=primary;temp.textAlign='center';temp.font='bold 13px Georgia';temp.fillText('CERTIFICATE',160,83);temp.font='10px Arial';temp.fillText('Presented to',160,103);temp.font='bold 17px Georgia';temp.fillText('Recipient Name',160,129);
  const caption=document.createElement('span');caption.textContent=label;item.appendChild(thumb);item.appendChild(caption);
  item.addEventListener('click',()=>{state.template=style;$('template').value=style;render();renderBackgroundGallery();toast(label+' background selected.')});
  wrap.appendChild(item);
 });
}
$('generateBtn').addEventListener('click',()=>{if(state.logo)setPalette(extractColors(state.logo));if(state.mode==='auto'){const styles=['modern','geometric','elegant','creative'];state.template=styles[Math.floor(Math.random()*styles.length)];$('template').value=state.template}render();renderBackgroundGallery();toast('New branded certificate background generated.')});
$('refreshColors').addEventListener('click',()=>{if(state.logo){setPalette(extractColors(state.logo));render();toast('Brand colors refreshed.')}else toast('Upload a logo first.')});
$('resetLayout').addEventListener('click',()=>{state.positions={};state.selected=null;$('selectionLabel').textContent='No element selected';render()});
$('zoomIn').addEventListener('click',()=>{canvas.style.maxHeight=(Math.min(90,parseInt(getComputedStyle(canvas).maxHeight)||70)+10)+'vh'});$('zoomOut').addEventListener('click',()=>{canvas.style.maxHeight=(Math.max(25,parseInt(getComputedStyle(canvas).maxHeight)||70)-10)+'vh'});
function download(data,name){const a=document.createElement('a');a.href=data;a.download=name;a.click()}
function baseName(){return (($('recipient').value||'certificate').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'')||'certificate')}
function exportImage(type){render();const d=dimensions();if(!d)return;const mime=type==='jpg'?'image/jpeg':'image/png';download(canvas.toDataURL(mime,type==='jpg'?.95:1),`${baseName()}.${type==='jpg'?'jpg':'png'}`);toast(`${type.toUpperCase()} downloaded.`)}
$('pngBtn').addEventListener('click',()=>exportImage('png'));$('jpgBtn').addEventListener('click',()=>exportImage('jpg'));
$('pdfBtn').addEventListener('click',()=>{render();const d=dimensions();if(!d)return;if(!window.jspdf){toast('PDF library did not load. Check your internet connection.');return}const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:d.w>=d.h?'landscape':'portrait',unit:'in',format:[d.w,d.h],compress:true});pdf.addImage(canvas.toDataURL('image/jpeg',.98),'JPEG',0,0,d.w,d.h);pdf.save(`${baseName()}.pdf`);toast('Print-ready PDF downloaded.')});
$('wordBtn').addEventListener('click',()=>{
 render();const d=dimensions();if(!d)return;
 const image=canvas.toDataURL('image/png');
 const htmlDoc=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate</title>
 <style>@page{size:${d.w}in ${d.h}in;margin:0}html,body{margin:0;padding:0;width:${d.w}in;height:${d.h}in}img{display:block;width:${d.w}in;height:${d.h}in}</style></head>
 <body><img src="${image}" alt="Certificate"></body></html>`;
 const blob=new Blob(['\\ufeff',htmlDoc],{type:'application/msword'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=baseName()+'.doc';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Word-compatible document downloaded.');
});
$('downloadTop').addEventListener('click',()=>$('pdfBtn').click());
setPalette(state.colors);render();renderBackgroundGallery();
})();
