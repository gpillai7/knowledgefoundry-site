let DATA=[],D=[],domain="",category="",query="",current=null,zoom=1,dx=0,dy=0,drag=null;const $=id=>document.getElementById(id);const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));async function boot(){try{const d=await fetch("catalogue.json");if(!d.ok)throw Error("Unable to load catalogue");const x=await d.json();DATA=x.items;D=x.domains;renderDomains();renderCats();render();const url=new URL(location.href);const id=url.searchParams.get("id");if(id)openItem(id,false)}catch(e){$("cards").textContent="Catalogue is currently unavailable.";console.error(e)}}function renderDomains(){$("domainGrid").innerHTML=D.map(d=>'<button class="domain '+(domain===d.id?'selected':'')+'" data-domain="'+esc(d.id)+'"><span class="num">'+esc(d.num)+'</span><strong>'+esc(d.name)+'</strong><small>'+esc(d.desc)+'</small></button>').join("");$("domainGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{domain=domain===b.dataset.domain?"":b.dataset.domain;category="";$("category").value="";renderDomains();render();$("collection").scrollIntoView({behavior:"smooth"})})}function renderCats(){const cats=[...new Set(DATA.map(x=>x.category))];$("category").innerHTML='<option value="">All 12 categories</option>'+cats.map(c=>'<option>'+esc(c)+'</option>').join("")}function render(){const q=query.toLowerCase().trim();const filtered=DATA.filter(x=>(!domain||x.domain===domain)&&(!category||x.category===category)&&(!q||[x.title,x.author,x.category].some(y=>y.toLowerCase().includes(q))));$("active").textContent=(D.find(d=>d.id===domain)?.name||"All intellectual domains")+(category?" / "+category:"");$("count").textContent=filtered.length+" entries";$("cards").replaceChildren();for(const x of filtered){const b=document.createElement("button");b.className="tile";b.type="button";const section=document.createElement("div");section.className="thumb";const fallback=document.createElement("div");fallback.className="missing";fallback.textContent="Ingot illustration";const img=document.createElement("img");if(x.artworkStatus!=="awaiting-upload")img.src=x.thumbnail;img.alt="";img.loading="lazy";img.onerror=()=>{img.remove();fallback.textContent="Illustration pending upload"};fallback.textContent=x.artworkStatus==="awaiting-upload"?"Illustration awaiting upload":"Ingot illustration";section.append(fallback);if(x.artworkStatus!=="awaiting-upload"){section.append(img);img.onload=()=>fallback.remove();}const meta=document.createElement("div");meta.className="tilemeta";meta.innerHTML='<small>Ingot '+String(x.number).padStart(2,"0")+' · '+esc(x.category)+'</small><strong>'+esc(x.title)+'</strong><span>'+esc(x.author)+'</span>';b.append(section,meta);b.onclick=()=>openItem(x.id,true);$("cards").append(b)}}let lastFocus=null;
const MIN_ZOOM=0.5, MAX_ZOOM=5;

// Responsive, keyboard-accessible splitter for both gallery layouts.
const panelResize=$("panelResize");
const viewerMain=document.querySelector(".viewermain");
const desktopPanel=window.matchMedia("(min-width: 951px)");
let detailWidth=310;
let detailHeight=null;
let resizing=null;
function panelWidthBounds(){
  const total=viewerMain.clientWidth;
  return {min:240,max:Math.max(240,Math.min(800,total-320-9))};
}
function panelHeightBounds(){
  const total=viewerMain.clientHeight;
  // Preserve a useful illustration and readable summary on compact phones.
  const min=Math.min(110,Math.max(60,Math.floor(total*0.25)));
  const max=Math.max(min,Math.floor(total-14-Math.min(160,total*0.40)));
  return {min,max};
}
function updateSeparatorAccessibility(){
  const desktop=desktopPanel.matches;
  const b=desktop?panelWidthBounds():panelHeightBounds();
  const value=desktop?detailWidth:detailHeight;
  panelResize.setAttribute("aria-orientation",desktop?"vertical":"horizontal");
  panelResize.setAttribute("aria-label",desktop?"Resize text panel width":"Resize text panel height");
  panelResize.setAttribute("aria-valuemin",String(b.min));
  panelResize.setAttribute("aria-valuemax",String(b.max));
  panelResize.setAttribute("aria-valuenow",String(Math.round(value)));
  panelResize.setAttribute("aria-valuetext",Math.round(value)+" pixels "+(desktop?"wide":"high"));
}
function applyPanelWidth(width,fit=true){
  const b=panelWidthBounds();
  detailWidth=clamp(width,b.min,b.max);
  viewerMain.style.setProperty("--detail-width",detailWidth+"px");
  if(desktopPanel.matches)updateSeparatorAccessibility();
  if(fit&&!$("overlay").hidden)requestAnimationFrame(sizeFitImage);
}
function applyPanelHeight(height,fit=true){
  const b=panelHeightBounds();
  detailHeight=clamp(height,b.min,b.max);
  viewerMain.style.setProperty("--detail-height",detailHeight+"px");
  if(!desktopPanel.matches)updateSeparatorAccessibility();
  if(fit&&!$("overlay").hidden)requestAnimationFrame(sizeFitImage);
}
function syncPanelResize(){
  if(desktopPanel.matches)applyPanelWidth(detailWidth,false);
  else applyPanelHeight(detailHeight===null?viewerMain.clientHeight*0.34:detailHeight,false);
}
panelResize.addEventListener("pointerdown",e=>{
  if($("overlay").hidden||$("overlay").classList.contains("panel-hidden")||e.button!==0)return;
  e.preventDefault();
  resizing={id:e.pointerId,desktop:desktopPanel.matches,startX:e.clientX,startY:e.clientY,
    startSize:desktopPanel.matches?detailWidth:detailHeight};
  panelResize.setPointerCapture(e.pointerId);
  document.body.classList.add("ingot-panel-resizing");
});
panelResize.addEventListener("pointermove",e=>{
  if(!resizing||resizing.id!==e.pointerId)return;
  if(resizing.desktop)applyPanelWidth(resizing.startSize+resizing.startX-e.clientX);
  else applyPanelHeight(resizing.startSize+resizing.startY-e.clientY);
});
function finishPanelResize(e){
  if(!resizing||resizing.id!==e.pointerId)return;
  resizing=null;
  document.body.classList.remove("ingot-panel-resizing");
  if(panelResize.hasPointerCapture(e.pointerId))panelResize.releasePointerCapture(e.pointerId);
}
panelResize.addEventListener("pointerup",finishPanelResize);
panelResize.addEventListener("pointercancel",finishPanelResize);
panelResize.addEventListener("lostpointercapture",()=>{resizing=null;document.body.classList.remove("ingot-panel-resizing")});
panelResize.addEventListener("keydown",e=>{
  const desktop=desktopPanel.matches;
  const delta=(e.shiftKey?60:20);
  if(desktop&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){
    e.preventDefault();applyPanelWidth(detailWidth+(e.key==="ArrowLeft"?delta:-delta));
  }else if(!desktop&&(e.key==="ArrowUp"||e.key==="ArrowDown")){
    e.preventDefault();applyPanelHeight(detailHeight+(e.key==="ArrowUp"?delta:-delta));
  }else if(e.key==="Home"){
    e.preventDefault();
    if(desktop)applyPanelWidth(panelWidthBounds().min);
    else applyPanelHeight(panelHeightBounds().min);
  }else if(e.key==="End"){
    e.preventDefault();
    if(desktop)applyPanelWidth(panelWidthBounds().max);
    else applyPanelHeight(panelHeightBounds().max);
  }
});
window.addEventListener("resize",syncPanelResize);
desktopPanel.addEventListener("change",syncPanelResize);

let imageBaseWidth=0, imageBaseHeight=0;
// Fit is measured from the visible canvas, reserving clearance for viewer controls.
function sizeFitImage(){
  const img=$("big"), canvas=$("art");
  if(!img.complete||!img.naturalWidth||!img.naturalHeight||canvas.clientWidth===0||canvas.clientHeight===0)return;
  const availableWidth=Math.max(1,canvas.clientWidth-32);
  const availableHeight=Math.max(1,canvas.clientHeight-100);
  const factor=Math.min(availableWidth/img.naturalWidth,availableHeight/img.naturalHeight);
  imageBaseWidth=img.naturalWidth*factor;
  imageBaseHeight=img.naturalHeight*factor;
  img.style.width=imageBaseWidth+"px";
  img.style.height=imageBaseHeight+"px";
  transform();
}

const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const activePointers=new Map();
let pinch=null;
function updateZoomButtons(){
  $("minus").disabled=zoom<=MIN_ZOOM+0.001;
  $("plus").disabled=zoom>=5;
  $("art").classList.toggle("is-zoomed",zoom>1.001);
}
function transform(){
  if(zoom<=1){dx=dy=0;}
  $("big").style.transform="translate("+dx+"px,"+dy+"px) scale("+zoom+")";
  updateZoomButtons();
}
function setZoom(next){
  zoom=clamp(next,MIN_ZOOM,MAX_ZOOM);
  transform();
}
function resetViewer(){
  zoom=1;dx=dy=0;drag=null;pinch=null;activePointers.clear();
  $("overlay").classList.remove("panel-hidden");
  $("togglePanel").setAttribute("aria-expanded","true");
  $("togglePanel").textContent="Hide details";
  transform();
}
function openItem(id,push){
  const x=DATA.find(t=>t.id===id);if(!x)return;
  if($("overlay").hidden)lastFocus=document.activeElement;
  current=x;
  resetViewer();
  const image=$("big");
  image.hidden=true;
  $("noArt").hidden=false;
  image.onload=()=>{image.hidden=false;$("noArt").hidden=true;sizeFitImage()};
  image.onerror=()=>{image.hidden=true;$("noArt").hidden=false;transform()};
  if(x.artworkStatus==="awaiting-upload"){
    image.removeAttribute("src");
    $("noArt").textContent="Illustration awaiting upload";
  }else{
    $("noArt").textContent="Illustration awaiting publication";
    image.src=x.image;
  }
  image.alt="The Ingot for "+x.title;
  $("detailTitle").textContent="The Ingot for "+x.title;
  $("detailAuthor").textContent=x.author;
  $("detailCategory").textContent=x.category;
  $("detailDomain").textContent=D.find(d=>d.id===x.domain)?.name||"";
  let summaryBox=$("detailSummary");
  if(!summaryBox){
    summaryBox=document.createElement("section");
    summaryBox.id="detailSummary";
    summaryBox.className="ingot-summary";
    $("details").appendChild(summaryBox);
  }
  summaryBox.replaceChildren();
  summaryBox.hidden=!x.summary;
  if(x.summary){
    const heading=document.createElement("h3");
    heading.textContent="The book in brief";
    summaryBox.appendChild(heading);
    x.summary.split(/\n\s*\n/).forEach(raw=>{
      const para=document.createElement("p");
      const markup=esc(raw.trim()).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>");
      para.innerHTML=markup;
      summaryBox.appendChild(para);
    });
  }
  $("overlay").hidden=false;
  document.body.style.overflow="hidden";
  syncPanelResize();
  requestAnimationFrame(sizeFitImage);
  if(push){const u=new URL(location.href);u.searchParams.set("id",id);history.pushState({id},"",u)}
  $("close").focus();
}
function closeItem(push){
  $("overlay").hidden=true;
  document.body.style.overflow="";
  current=null;
  activePointers.clear();drag=null;pinch=null;
  if(push){const u=new URL(location.href);u.searchParams.delete("id");history.pushState({},"",u)}
  if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
}
$("search").addEventListener("input",e=>{query=e.target.value;render()});
$("category").addEventListener("change",e=>{category=e.target.value;render()});
$("clear").addEventListener("click",()=>{domain=category=query="";$("search").value="";$("category").value="";renderDomains();render()});
$("close").addEventListener("click",()=>closeItem(true));
$("copy").addEventListener("click",async()=>{
  const button=$("copy");
  try{
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(location.href)}
    else{const input=document.createElement("textarea");input.value=location.href;input.style.position="fixed";input.style.opacity="0";document.body.append(input);input.select();if(!document.execCommand("copy"))throw Error("Copy unavailable");input.remove()}
    button.textContent="Link copied ✓";
    window.setTimeout(()=>button.textContent="Copy link ↗",1600);
  }catch(err){window.prompt("Copy this link",location.href)}
});
$("togglePanel").addEventListener("click",()=>{
  const hidden=$("overlay").classList.toggle("panel-hidden");
  $("togglePanel").setAttribute("aria-expanded",String(!hidden));
  $("togglePanel").textContent=hidden?"Show details":"Hide details";
  // Layout transition changes the available image canvas width.
  requestAnimationFrame(sizeFitImage);
});
$("plus").addEventListener("click",()=>setZoom(zoom*1.35));
$("minus").addEventListener("click",()=>setZoom(zoom/1.35));
$("fit").addEventListener("click",()=>{zoom=1;dx=dy=0;sizeFitImage()});
// Recalculate Fit on viewport changes, including browser UI and taskbar bounds.
if("ResizeObserver" in window){
  new ResizeObserver(()=>{if(!$("overlay").hidden)sizeFitImage()}).observe($("art"));
}
window.addEventListener("resize",()=>{if(!$("overlay").hidden)sizeFitImage()});
if(window.visualViewport)window.visualViewport.addEventListener("resize",()=>{if(!$("overlay").hidden)sizeFitImage()});
// Trackpad support: two-finger scrolling pans an enlarged Ingot.
// Trackpad pinch (Ctrl/Meta + wheel) remains zoom; buttons offer explicit zoom.
$("art").addEventListener("wheel",e=>{
  if($("overlay").hidden||e.target.closest(".zoom"))return;
  e.preventDefault();
  if(e.ctrlKey||e.metaKey){
    // Precision trackpad pinch is normally exposed as Ctrl + wheel.
    setZoom(zoom*Math.exp(-e.deltaY*0.01));
  }else if(zoom>1){
    const unit=e.deltaMode===1?16:e.deltaMode===2?$("art").clientHeight:1;
    dx-=e.deltaX*unit;
    dy-=e.deltaY*unit;
    transform();
  }else{
    // Keep the existing scroll-to-zoom behaviour at fitted size.
    setZoom(zoom*(e.deltaY>0?0.88:1.14));
  }
},{passive:false});
// Pan gestures are tracked at window level so a drag continues reliably
// across the artwork, including when the pointer leaves the image viewport.
// The same handler is used for all Ingots (no title-specific behaviour).
const artCanvas=$("art");
function startArtPointer(e){
  if(e.target.closest("button")||e.target.closest(".zoom"))return;
  if(!current||$("big").hidden||e.pointerType==="mouse"&&e.button!==0)return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2){
    const a=[...activePointers.values()];
    pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),startZoom:zoom};
    drag=null;
  }else if(activePointers.size===1&&zoom>1){
    drag={id:e.pointerId,x:e.clientX-dx,y:e.clientY-dy};
  }
  if(zoom>1||activePointers.size>1){
    e.preventDefault();
    try{artCanvas.setPointerCapture(e.pointerId)}catch(err){
      // Window-level listeners still handle the gesture if capture is denied.
    }
  }
}
function moveArtPointer(e){
  if(!activePointers.has(e.pointerId))return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activePointers.size===2&&pinch){
    const a=[...activePointers.values()];
    setZoom(pinch.startZoom*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/Math.max(1,pinch.distance));
  }else if(drag&&drag.id===e.pointerId&&zoom>1){
    dx=e.clientX-drag.x;
    dy=e.clientY-drag.y;
    transform();
  }
}
function endArtPointer(e){
  if(!activePointers.has(e.pointerId))return;
  activePointers.delete(e.pointerId);
  if(drag&&drag.id===e.pointerId)drag=null;
  if(activePointers.size<2)pinch=null;
  if(activePointers.size===1&&zoom>1){
    const [id,p]=[...activePointers.entries()][0];
    drag={id,x:p.x-dx,y:p.y-dy};
  }
  if(artCanvas.hasPointerCapture(e.pointerId)){
    artCanvas.releasePointerCapture(e.pointerId);
  }
}
artCanvas.addEventListener("pointerdown",startArtPointer);
window.addEventListener("pointermove",moveArtPointer);
window.addEventListener("pointerup",endArtPointer);
window.addEventListener("pointercancel",endArtPointer);
artCanvas.addEventListener("dragstart",e=>e.preventDefault());
document.addEventListener("keydown",e=>{
  if($("overlay").hidden)return;
  if(e.target===panelResize&&e.key!=="Escape")return;
  if(e.key==="Escape"){e.preventDefault();closeItem(true)}
  else if(e.key==="+"||e.key==="="){e.preventDefault();setZoom(zoom*1.35)}
  else if(e.key==="-"){e.preventDefault();setZoom(zoom/1.35)}
  else if(e.key==="0"){e.preventDefault();zoom=1;dx=dy=0;sizeFitImage()}
  else if(zoom>1&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
    e.preventDefault();const step=65;dx+=(e.key==="ArrowRight"?-step:e.key==="ArrowLeft"?step:0);dy+=(e.key==="ArrowDown"?-step:e.key==="ArrowUp"?step:0);transform();
  }
});
window.addEventListener("popstate",()=>{
  const id=new URL(location.href).searchParams.get("id");
  if(id)openItem(id,false);else if(current)closeItem(false);
});
boot();
