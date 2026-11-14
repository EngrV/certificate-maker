(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('certificateCanvas');
const ctx = canvas.getContext('2d');
const state = {
  logo: null, colors: ['#173b69','#d4a94f','#e9edf2','#ffffff'],
  template: 'elegant', mode: 'hybrid', selected: null, logoScale: 1,
  positions: {}, signatories: [], nextSignatoryId: 1,
  canvasW: 0, canvasH: 0
};
const defaults = {
 org:{x:.5,y:.105,size:30,color:'#173b69',font:'700'},
 title:{x:.5,y:.235,size:66,color:'#173b69',font:'700'},
 subtitle:{x:.5,y:.34,size:25,color:'#596579',font:'500'},
 recipient:{x:.5,y:.46,size:76,color:'#173b69',font:'600'},
 body:{x:.5,y:.59,size:28,color:'#475569',font:'400'},
 date:{x:.5,y:.72,size:23,color:'#596579',font:'400'},

};
const fields = {org:'orgName',title:'certificateTitle',subtitle:'subtitle',recipient:'recipient',body:'bodyText',date:'dateText'};
const presets = {a4:[11.7,8.3],letter:[11,8.5],legal:[14,8.5]};
let toastTimer = null, drag = null;
function toast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
function hexRgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function luminance(c){const [r,g,b]=hexRgb(c);return .2126*r+.7152*g+.0722*b;}
function setPalette(colors){state.colors=colors;document.querySelectorAll('#swatches i').forEach((el,i)=>el.style.background=colors[i]||'#fff');$('textColor').value=colors[0];}
function extractColors(img){
 const c=document.createElement('canvas'),w=100,h=Math.max(1,Math.round(100*img.height/img.width));c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);const d=x.getImageData(0,0,w,h).data,bins={};
 for(let i=0;i<d.length;i+=16){if(d[i+3]<100)continue;const r=d[i],g=d[i+1],b=d[i+2];if(Math.max(r,g,b)>247&&Math.min(r,g,b)>232)continue;const key=[Math.round(r/32)*32,Math.round(g/32)*32,Math.round(b/32)*32].join(',');bins[key]=(bins[key]||0)+1;}
 const sorted=Object.entries(bins).sort((a,b)=>b[1]-a[1]).map(([k])=>{const [r,g,b]=k.split(',').map(Number);return rgbHex(r,g,b);});
 const out=[];for(const col of sorted){if(out.every(c=>Math.abs(luminance(c)-luminance(col))>22))out.push(col);if(out.length===3)break;}
 while(out.length<3)out.push(['#173b69','#d4a94f','#e9edf2'][out.length]);out.push('#ffffff');return out;
}
function dimensions(){const w=Number($('pageWidth').value),h=Number($('pageHeight').value),dpi=Number($('dpi').value);if(!Number.isFinite(w)||!Number.isFinite(h)||w<3||h<3||w>30||h>30){toast('Enter page dimensions between 3 and 30 inches.');return null;}return {w,h,dpi,pw:Math.round(w*dpi),ph:Math.round(h*dpi)};}
function syncCanvasSize(){const d=dimensions();if(!d)return false;if(canvas.width!==d.pw||canvas.height!==d.ph){canvas.width=d.pw;canvas.height=d.ph;state.canvasW=d.pw;state.canvasH=d.ph;}$('canvasDimensions').textContent=`${d.w} × ${d.h} inches · ${d.dpi} DPI`;return true;}
function getPos(key){return {...defaults[key],...(state.positions[key]||{})};}
function loadImageFile(file, callback, allowed){if(!file)return;if(!allowed.includes(file.type)){toast('Please choose a supported image file.');return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{callback(img);URL.revokeObjectURL(url);};img.onerror=()=>{URL.revokeObjectURL(url);toast('Could not read that image.');};img.src=url;}
function loadLogo(file){loadImageFile(file,img=>{state.logo=img;$('logoThumb').src=img.src;$('logoThumb').hidden=false;$('logoName').textContent=file.name;setPalette(extractColors(img));render();renderBackgroundGallery();toast('Logo uploaded. Original proportions will be preserved.');},['image/png','image/jpeg','image/webp','image/svg+xml']);}
function drawBackground(target,w,h,style){
 const [primary,accent,light]=state.colors;target.save();
 target.fillStyle='#ffffff';target.fillRect(0,0,w,h);
 if(style==='modern'){
  // Modern minimalist: generous white space, slim navy and blue rules.
  target.fillStyle='#f8fafc';target.fillRect(0,0,w,h);
  target.fillStyle=primary;target.fillRect(0,0,w*.012,h);
  target.fillStyle=accent;target.fillRect(w*.012,0,w*.004,h);
  target.strokeStyle=primary;target.globalAlpha=.18;target.lineWidth=Math.max(2,w*.0015);
  target.beginPath();target.moveTo(w*.12,h*.18);target.lineTo(w*.88,h*.18);target.stroke();
  target.beginPath();target.moveTo(w*.12,h*.84);target.lineTo(w*.88,h*.84);target.stroke();
 }else if(style==='elegant'){
  // Luxury gold: warm ivory, gold frame and restrained corner details.
  target.fillStyle='#fffdf7';target.fillRect(0,0,w,h);
  target.strokeStyle='#bd9848';target.lineWidth=Math.max(3,w*.004);target.strokeRect(w*.035,h*.045,w*.93,h*.91);
  target.strokeStyle='#e2c987';target.lineWidth=Math.max(1,w*.0015);target.strokeRect(w*.047,h*.06,w*.906,h*.88);
  target.fillStyle='#bd9848';[[w*.035,h*.045],[w*.965,h*.045],[w*.035,h*.955],[w*.965,h*.955]].forEach(([x,y])=>{target.beginPath();target.arc(x,y,Math.min(w,h)*.012,0,Math.PI*2);target.fill();});
 }else if(style==='geometric'){
  // Corporate modern: crisp navy/cobalt diagonals.
  target.fillStyle='#f5f8fc';target.fillRect(0,0,w,h);
  target.fillStyle=primary;target.beginPath();target.moveTo(w*.78,0);target.lineTo(w,0);target.lineTo(w,h);target.lineTo(w*.94,h);target.closePath();target.fill();
  target.fillStyle=accent;target.beginPath();target.moveTo(w*.9,0);target.lineTo(w,0);target.lineTo(w,h*.58);target.lineTo(w*.97,h*.48);target.closePath();target.fill();
  target.globalAlpha=.12;target.fillStyle=primary;target.beginPath();target.moveTo(0,h*.78);target.lineTo(w*.16,h);target.lineTo(0,h);target.closePath();target.fill();
 }else if(style==='classic'){
  // Elegant contemporary: soft sage and a fine botanical-inspired arch motif.
  target.fillStyle='#f8faf7';target.fillRect(0,0,w,h);
  target.strokeStyle='#8a9b83';target.globalAlpha=.55;target.lineWidth=Math.max(2,w*.002);
  target.beginPath();target.arc(w*.5,h*.12,Math.min(w,h)*.24,Math.PI,Math.PI*2);target.stroke();
  target.strokeStyle='#c5d0bf';target.lineWidth=Math.max(1,w*.001);target.strokeRect(w*.045,h*.05,w*.91,h*.9);
  target.fillStyle='#8a9b83';target.globalAlpha=.14;target.fillRect(0,0,w*.018,h);target.fillRect(w*.982,0,w*.018,h);
 }else if(style==='creative'){
  // Creative modern: soft color blocks with contemporary rounded geometry.
  target.fillStyle='#fbf8ff';target.fillRect(0,0,w,h);
  target.globalAlpha=.16;target.fillStyle=primary;target.beginPath();target.arc(w*.98,h*.02,Math.min(w,h)*.3,0,Math.PI*2);target.fill();
  target.fillStyle=accent;target.globalAlpha=.2;target.beginPath();target.arc(w*.02,h*.98,Math.min(w,h)*.25,0,Math.PI*2);target.fill();
  target.globalAlpha=.9;target.fillStyle=primary;target.fillRect(0,0,w*.012,h);target.fillStyle=accent;target.fillRect(0,h*.965,w,h*.035);
 }else if(style==='silver'){
  // Silver professional: cool gray paper, silver double rules and subtle panels.
  target.fillStyle='#f5f6f8';target.fillRect(0,0,w,h);
  target.fillStyle='#ffffff';target.fillRect(w*.075,h*.075,w*.85,h*.85);
  target.strokeStyle='#9aa3af';target.lineWidth=Math.max(3,w*.003);target.strokeRect(w*.045,h*.045,w*.91,h*.91);
  target.strokeStyle='#d1d5db';target.lineWidth=Math.max(1,w*.0015);target.strokeRect(w*.06,h*.06,w*.88,h*.88);
  target.fillStyle='#e5e7eb';target.globalAlpha=.5;target.fillRect(w*.075,h*.075,w*.85,h*.012);
 }
 target.globalAlpha=1;target.restore();
}
function drawBorder(target,w,h){const [p,a]=state.colors,mode=$('borderStyle').value;if(mode==='none')return;const m=Math.min(w,h)*.055;target.save();target.strokeStyle=mode==='single'?p:a;target.lineWidth=Math.max(2,Math.min(w,h)*.003);target.strokeRect(m,m,w-2*m,h-2*m);if(mode==='double'||mode==='ornate'){target.strokeStyle=mode==='double'?a:p;target.lineWidth=Math.max(1,Math.min(w,h)*.0015);target.strokeRect(m*1.18,m*1.18,w-2*m*1.18,h-2*m*1.18);}if(mode==='ornate'){target.strokeStyle=a;target.lineWidth=Math.max(2,Math.min(w,h)*.004);const s=m*.7;[[m,m],[w-m,m],[m,h-m],[w-m,h-m]].forEach(([x,y])=>{target.beginPath();target.arc(x,y,s,0,Math.PI*2);target.stroke();});}target.restore();}
function drawContainedImage(target,img,boxX,boxY,boxW,boxH,align='center'){
 // CONTAIN fit: same scale on X and Y, never stretch an uploaded logo or signature.
 const scale=Math.min(boxW/img.naturalWidth||boxW/img.width,boxH/img.naturalHeight||boxH/img.height);
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,drawW=iw*scale,drawH=ih*scale;
 let x=boxX+(boxW-drawW)/2;if(align==='left')x=boxX;if(align==='right')x=boxX+boxW-drawW;
 target.drawImage(img,x,boxY+(boxH-drawH)/2,drawW,drawH);
}
function drawLogo(target,w,h){if(!state.logo||$('logoPosition').value==='none')return;const scale=state.logoScale||1,boxW=w*.18*scale,boxH=h*.15*scale,boxY=h*.035;let boxX=(w-boxW)/2,align='center';if($('logoPosition').value==='left'){boxX=w*.055;align='left';}if($('logoPosition').value==='right'){boxX=w-boxW-w*.055;align='right';}drawContainedImage(target,state.logo,boxX,boxY,boxW,boxH,align);}
function signatoryX(index,count){if(count===1)return .5;const left=count===2?.29:count===3?.20:.14;const right=1-left;return left+(right-left)*(index/(count-1));}
function drawSignatures(target,w,h){const count=state.signatories.length;state.signatories.forEach((person,index)=>{if(!person.image)return;const x=signatoryX(index,count),boxW=Math.min(.16,.72/count)*w;drawContainedImage(target,person.image,w*x-boxW/2,h*.785,boxW,h*.065);});}
function addSignatory(name='NAME OF SIGNATORY',role='Position / Title'){
 if(state.signatories.length>=4){toast('You can add up to four signatories.');return;}
 const id=state.nextSignatoryId++,nameKey='person'+id+'Name',roleKey='person'+id+'Role';
 const person={id,nameKey,roleKey,image:null};state.signatories.push(person);
 const card=document.createElement('div');card.className='signatory-card';card.dataset.signatoryId=String(id);
 const heading=document.createElement('div');heading.className='signatory-card-heading';
 const title=document.createElement('strong');title.textContent='Signatory '+state.signatories.length;
 const remove=document.createElement('button');remove.type='button';remove.className='remove-signatory';remove.textContent='Remove';remove.setAttribute('aria-label','Remove signatory '+state.signatories.length);
 heading.append(title,remove);
 const nameLabel=document.createElement('label');nameLabel.className='field-label';nameLabel.htmlFor=nameKey;nameLabel.textContent='Full name';
 const nameInput=document.createElement('input');nameInput.id=nameKey;nameInput.value=name;
 const roleLabel=document.createElement('label');roleLabel.className='field-label';roleLabel.htmlFor=roleKey;roleLabel.textContent='Position / title';
 const roleInput=document.createElement('input');roleInput.id=roleKey;roleInput.value=role;
 const sigLabel=document.createElement('label');sigLabel.className='field-label';sigLabel.htmlFor='signature'+id;sigLabel.textContent='Upload signature (optional)';
 const sigInput=document.createElement('input');sigInput.id='signature'+id;sigInput.type='file';sigInput.accept='image/png,image/jpeg,image/webp';
 card.append(heading,nameLabel,nameInput,roleLabel,roleInput,sigLabel,sigInput);$('signatoryList').appendChild(card);
 defaults[nameKey]={x:signatoryX(state.signatories.length-1,state.signatories.length),y:.87,size:22,color:'#173b69',font:'700'};
 defaults[roleKey]={x:signatoryX(state.signatories.length-1,state.signatories.length),y:.92,size:17,color:'#596579',font:'400'};
 fields[nameKey]=nameKey;fields[roleKey]=roleKey;
 nameInput.addEventListener('input',render);roleInput.addEventListener('input',render);
 sigInput.addEventListener('change',e=>{const file=e.target.files[0];if(!file){person.image=null;render();return;}loadImageFile(file,img=>{person.image=img;render();toast('Signature for '+(nameInput.value||'signatory')+' added.');},['image/png','image/jpeg','image/webp']);});
 remove.addEventListener('click',()=>removeSignatory(id));
 updateSignatoryLabels();render();
}
function updateSignatoryLabels(){[...$('signatoryList').children].forEach((card,i)=>{const strong=card.querySelector('strong');if(strong)strong.textContent='Signatory '+(i+1);const btn=card.querySelector('.remove-signatory');if(btn)btn.disabled=state.signatories.length<=1;});$('addSignatory').disabled=state.signatories.length>=4;$('addSignatory').textContent=state.signatories.length>=4?'Maximum of four signatories':'＋ Add another signatory';}
function removeSignatory(id){const index=state.signatories.findIndex(p=>p.id===id);if(index<0||state.signatories.length<=1)return;const [person]=state.signatories.splice(index,1);delete defaults[person.nameKey];delete defaults[person.roleKey];delete fields[person.nameKey];delete fields[person.roleKey];delete state.positions[person.nameKey];delete state.positions[person.roleKey];if(state.selected===person.nameKey||state.selected===person.roleKey)state.selected=null;const card=$('signatoryList').querySelector('[data-signatory-id="'+id+'"]');if(card)card.remove();state.signatories.forEach((p,i)=>{const x=signatoryX(i,state.signatories.length);if(!state.positions[p.nameKey])defaults[p.nameKey].x=x;if(!state.positions[p.roleKey])defaults[p.roleKey].x=x;});updateSignatoryLabels();render();}
function wrapText(target,text,maxWidth){const words=text.split(/\s+/).filter(Boolean);if(!words.length)return [''];const lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(line&&target.measureText(candidate).width>maxWidth){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);return lines;}
function drawText(target,key,w,h){const pos=getPos(key),raw=$(fields[key]).value||'',sourceLines=raw.split(/\r?\n/);const size=pos.size/1000*Math.min(w,h);const family=(key==='title'||key==='recipient')?'Georgia, serif':'Arial, sans-serif';const maxWidth=w*.76;target.save();target.textAlign='center';target.textBaseline='middle';target.fillStyle=pos.color;target.font=`${pos.font} ${size}px ${family}`;const rows=[];sourceLines.forEach(line=>rows.push(...wrapText(target,line,maxWidth)));const lineH=size*1.28,y=pos.y*h;rows.forEach((line,i)=>target.fillText(line,w*pos.x,y+(i-(rows.length-1)/2)*lineH));target.restore();}
function render(){if(!syncCanvasSize())return;const w=canvas.width,h=canvas.height;drawBackground(ctx,w,h,state.template);drawBorder(ctx,w,h);drawLogo(ctx,w,h);drawSignatures(ctx,w,h);Object.keys(defaults).forEach(k=>drawText(ctx,k,w,h));if(state.selected){const p=getPos(state.selected);ctx.save();ctx.strokeStyle='#3478d4';ctx.lineWidth=Math.max(2,w*.001);ctx.setLineDash([8,6]);ctx.strokeRect(p.x*w-w*.17,p.y*h-h*.04,w*.34,h*.08);ctx.restore();}}
function renderBackgroundGallery(){
 const hosts=[$('backgroundChoicesSidebar'),$('backgroundChoicesBelow')].filter(Boolean);
 const options=[['modern','Modern minimalist'],['elegant','Luxury gold'],['geometric','Corporate modern'],['classic','Elegant contemporary'],['creative','Creative modern'],['silver','Silver professional']];
 hosts.forEach(host=>{host.innerHTML='';options.forEach(([style,label])=>{
  const button=document.createElement('button');button.type='button';button.className='background-option'+(state.template===style?' active':'');button.setAttribute('aria-label','Select '+label+' background');
  const thumb=document.createElement('canvas');thumb.width=320;thumb.height=190;const t=thumb.getContext('2d');drawBackground(t,320,190,style);
  t.strokeStyle=state.colors[1];t.lineWidth=3;t.strokeRect(9,9,302,172);t.strokeStyle=state.colors[0];t.lineWidth=1;t.strokeRect(15,15,290,160);t.fillStyle=state.colors[0];t.textAlign='center';t.textBaseline='middle';t.font='bold 14px Georgia';t.fillText('CERTIFICATE',160,78);t.font='11px Arial';t.fillText('Presented to',160,100);t.font='bold 17px Georgia';t.fillText('Recipient Name',160,124);
  const caption=document.createElement('span');caption.textContent=label;button.append(thumb,caption);button.addEventListener('click',()=>{state.template=style;$('template').value=style;render();renderBackgroundGallery();toast(label+' background selected.');});host.appendChild(button);
 });});const count=$('galleryCountSidebar');if(count)count.textContent=options.length+' designs';
}
function applyOrientation(value){let w=Number($('pageWidth').value)||11.7,h=Number($('pageHeight').value)||8.3;if(value==='portrait'&&w>h)[w,h]=[h,w];if(value==='landscape'&&h>w)[w,h]=[h,w];$('pageWidth').value=w.toFixed(1);$('pageHeight').value=h.toFixed(1);render();}
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
function nearest(p){let best=null,dist=.075;Object.keys(defaults).forEach(k=>{const q=getPos(k),d=Math.hypot(q.x-p.x,(q.y-p.y)*.8);if(d<dist){best=k;dist=d;}});return best;}
canvas.addEventListener('pointerdown',e=>{const p=pointerPos(e),key=nearest(p);if(!key){state.selected=null;$('selectionLabel').textContent='No element selected';render();return;}state.selected=key;drag={key};$('selectionLabel').textContent='Selected: '+key;$('fontSize').value=getPos(key).size;$('textColor').value=getPos(key).color;canvas.setPointerCapture(e.pointerId);render();});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=pointerPos(e),pos=getPos(drag.key);pos.x=Math.max(.08,Math.min(.92,p.x));pos.y=Math.max(.08,Math.min(.95,p.y));state.positions[drag.key]=pos;render();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
$('logoInput').addEventListener('change',e=>loadLogo(e.target.files[0]));
$('addSignatory').addEventListener('click',()=>addSignatory());
$('orientation').addEventListener('change',e=>applyOrientation(e.target.value));
$('dropZone').addEventListener('dragover',e=>{e.preventDefault();$('dropZone').classList.add('dragging');});$('dropZone').addEventListener('dragleave',()=>$('dropZone').classList.remove('dragging'));$('dropZone').addEventListener('drop',e=>{e.preventDefault();$('dropZone').classList.remove('dragging');loadLogo(e.dataTransfer.files[0]);});
function onPageChange(){const w=Number($('pageWidth').value),h=Number($('pageHeight').value);if(w&&h)$('orientation').value=w>=h?'landscape':'portrait';render();}
document.querySelectorAll('input:not([type=file]),textarea,select').forEach(el=>el.addEventListener('input',()=>{if(el.id==='paperPreset'&&presets[el.value]){$('pageWidth').value=presets[el.value][0];$('pageHeight').value=presets[el.value][1];$('orientation').value=presets[el.value][0]>=presets[el.value][1]?'landscape':'portrait';}if(el.id==='pageWidth'||el.id==='pageHeight'){$('paperPreset').value='custom';const w=Number($('pageWidth').value),h=Number($('pageHeight').value);if(w&&h)$('orientation').value=w>=h?'landscape':'portrait';}if(el.id==='fontSize'&&state.selected){const p=getPos(state.selected);p.size=Math.max(8,Math.min(120,Number(el.value)||30));state.positions[state.selected]=p;}if(el.id==='textColor'&&state.selected){const p=getPos(state.selected);p.color=el.value;state.positions[state.selected]=p;}render();}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));toast(state.mode==='auto'?'Automatic logo-based design selected.':'Template and automatic generation selected.');}));
$('template').addEventListener('change',e=>{state.template=e.target.value;render();renderBackgroundGallery();});
['borderStyle','logoPosition','dpi'].forEach(id=>$(id).addEventListener('change',render));
$('logoScale').addEventListener('input',e=>{state.logoScale=Number(e.target.value)/100;$('logoScaleValue').textContent=e.target.value+'%';render();});$('pageWidth').addEventListener('change',onPageChange);$('pageHeight').addEventListener('change',onPageChange);
$('generateBtn').addEventListener('click',()=>{if(state.logo)setPalette(extractColors(state.logo));const styles=['modern','elegant','geometric','classic','creative','silver'];if(state.mode==='auto'){const current=styles.indexOf(state.template);state.template=styles[(current+1+Math.floor(Math.random()*(styles.length-1)))%styles.length];$('template').value=state.template;}render();renderBackgroundGallery();toast('Background choices updated. Select a thumbnail to apply it.');});
$('refreshColors').addEventListener('click',()=>{if(state.logo){setPalette(extractColors(state.logo));render();renderBackgroundGallery();toast('Brand colors refreshed.');}else toast('Upload a logo first.');});
$('resetLayout').addEventListener('click',()=>{state.positions={};state.selected=null;$('selectionLabel').textContent='No element selected';render();});
$('zoomIn').addEventListener('click',()=>{const current=parseInt(canvas.style.maxHeight)||65;canvas.style.maxHeight=Math.min(95,current+10)+'vh';});$('zoomOut').addEventListener('click',()=>{const current=parseInt(canvas.style.maxHeight)||65;canvas.style.maxHeight=Math.max(25,current-10)+'vh';});
function baseName(){return (($('recipient').value||'certificate').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'')||'certificate');}
function download(data,name){const a=document.createElement('a');a.href=data;a.download=name;document.body.appendChild(a);a.click();a.remove();}
function exportImage(type){render();const d=dimensions();if(!d)return;download(canvas.toDataURL(type==='jpg'?'image/jpeg':'image/png',type==='jpg'?.95:1),`${baseName()}.${type==='jpg'?'jpg':'png'}`);toast(type.toUpperCase()+' downloaded.');}
$('pngBtn').addEventListener('click',()=>exportImage('png'));$('jpgBtn').addEventListener('click',()=>exportImage('jpg'));
$('pdfBtn').addEventListener('click',()=>{render();const d=dimensions();if(!d)return;if(!window.jspdf){toast('PDF library did not load. Check your internet connection.');return;}const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:d.w>=d.h?'landscape':'portrait',unit:'in',format:[d.w,d.h],compress:true});pdf.addImage(canvas.toDataURL('image/jpeg',.98),'JPEG',0,0,d.w,d.h);pdf.save(baseName()+'.pdf');toast('Print-ready PDF downloaded.');});
$('wordBtn').addEventListener('click',()=>{render();const d=dimensions();if(!d)return;const image=canvas.toDataURL('image/png');const doc=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate</title><style>@page{size:${d.w}in ${d.h}in;margin:0}html,body{margin:0;padding:0}img{display:block;width:${d.w}in;height:${d.h}in;object-fit:contain}</style></head><body><img src="${image}" alt="Certificate"></body></html>`;const blob=new Blob(['\ufeff',doc],{type:'application/msword'}),url=URL.createObjectURL(blob);download(url,baseName()+'.doc');setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Word-compatible document downloaded.');});
$('downloadTop').addEventListener('click',()=>$('pdfBtn').click());
addSignatory();addSignatory();setPalette(state.colors);render();renderBackgroundGallery();
})();
