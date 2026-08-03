(function(){
  var input=document.getElementById('q'), res=document.getElementById('qres'), idx=null, timer=null;
  if(!input||!res) return;
  function load(){ if(idx) return Promise.resolve(idx);
    return fetch('search-index.json').then(function(r){return r.json();}).then(function(d){idx=d;return d;}).catch(function(){idx=[];return [];}); }
  function esc(s){return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function snippet(text,tokens){
    var low=text.toLowerCase(), pos=-1;
    tokens.forEach(function(t){var p=low.indexOf(t); if(p>=0&&(pos<0||p<pos))pos=p;});
    if(pos<0)pos=0;
    var start=Math.max(0,pos-55), end=Math.min(text.length,pos+120);
    var s=(start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
    s=esc(s);
    tokens.forEach(function(t){ if(t.length>1){ s=s.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>'); } });
    return s;
  }
  function run(q){
    var tokens=q.toLowerCase().split(/\s+/).filter(function(t){return t.length>1;});
    if(!tokens.length){ res.hidden=true; res.innerHTML=''; return; }
    var scored=idx.map(function(doc){
      var hay=(doc.t+' '+doc.d+' '+doc.x).toLowerCase(), score=0;
      tokens.forEach(function(t){
        if(doc.t.toLowerCase().indexOf(t)>=0) score+=8;
        score+=hay.split(t).length-1;
      });
      return {doc:doc,score:score};
    }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,8);
    if(!scored.length){ res.innerHTML='<div class="rsearch-none">No matches</div>'; res.hidden=false; return; }
    res.innerHTML=scored.map(function(x){
      return '<a class="rsearch-item" href="'+x.doc.u+'"><span class="rsearch-t">'+esc(x.doc.t)+'</span><span class="rsearch-s">'+snippet(x.doc.x,tokens)+'</span></a>';
    }).join('');
    res.hidden=false;
  }
  input.addEventListener('focus',load);
  input.addEventListener('input',function(){ clearTimeout(timer); var q=input.value; timer=setTimeout(function(){ load().then(function(){ run(q); }); },120); });
  input.addEventListener('keydown',function(e){ if(e.key==='Escape'){ input.value=''; res.hidden=true; input.blur(); } });
  document.addEventListener('click',function(e){ if(!e.target.closest('.rsearch')) res.hidden=true; });
})();
