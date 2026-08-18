/* Annotation toolbar — click anywhere on the page to leave a comment for the agent.
   Only loads on localhost. Comments POST to the dev server and land in annotations.json.
   Press A to toggle annotate mode, Esc to cancel. */
(function(){
  if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  const API='/__annotations';
  let armed=false, pins=[];

  /* ---- a readable path to whatever was clicked ---- */
  function pathOf(el){
    const out=[];
    while(el && el.nodeType===1 && out.length<4){
      let s=el.tagName.toLowerCase();
      if(el.id) { out.unshift(s+'#'+el.id); break; }
      const cls=(typeof el.className==='string'?el.className:'').trim().split(/\s+/).filter(Boolean)
        .filter(c=>!/^(rules|faint|gridsvg)$/.test(c)).slice(0,2);
      if(cls.length) s+='.'+cls.join('.');
      out.unshift(s);
      el=el.parentElement;
    }
    return out.join(' > ');
  }
  const snippet=el=>(el.innerText||el.getAttribute?.('alt')||'').trim().replace(/\s+/g,' ').slice(0,70);

  /* ---- ui ---- */
  const css=document.createElement('style');
  css.textContent=`
  .an-bar{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:6px;align-items:center;
    font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em}
  .an-bar button{font:inherit;padding:9px 12px;border:1px solid #0003;background:#fff;color:#111;
    cursor:pointer;border-radius:2px;box-shadow:0 2px 8px #0002}
  .an-bar button.on{background:#C44928;color:#fff;border-color:#C44928}
  .an-bar .an-count{background:#111;color:#fff;padding:9px 10px;border-radius:2px}
  .an-armed, .an-armed *{cursor:crosshair !important}
  .an-pin.stale{background:#8A8A8A}
  .an-pin{position:absolute;z-index:2147482000;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
    background:#C44928;color:#fff;font:600 11px/22px ui-monospace,monospace;text-align:center;
    box-shadow:0 2px 6px #0004;cursor:pointer;border:2px solid #fff}
  .an-pin.done{background:#3F6B5C}
  .an-pop{position:absolute;z-index:2147483001;width:290px;background:#fff;color:#111;border:1px solid #0003;
    border-radius:3px;box-shadow:0 8px 30px #0003;padding:10px;font:12px/1.45 ui-monospace,Menlo,monospace}
  .an-pop textarea{width:100%;height:74px;font:inherit;border:1px solid #0002;padding:7px;resize:vertical;
    border-radius:2px;color:#111;background:#fff}
  .an-pop .meta{font-size:10px;opacity:.55;margin-bottom:6px;word-break:break-all}
  .an-pop .btns{display:flex;gap:6px;margin-top:8px;justify-content:flex-end}
  .an-pop button{font:11px ui-monospace,monospace;padding:6px 10px;border:1px solid #0003;background:#fff;
    cursor:pointer;border-radius:2px;color:#111}
  .an-pop button.primary{background:#111;color:#fff;border-color:#111}
  .an-list{position:fixed;right:14px;bottom:62px;z-index:2147483000;width:310px;max-height:52vh;overflow:auto;
    background:#fff;color:#111;border:1px solid #0003;border-radius:3px;box-shadow:0 8px 30px #0003;
    font:11px/1.5 ui-monospace,Menlo,monospace;display:none}
  .an-list.show{display:block}
  .an-list li{list-style:none;padding:9px 10px;border-bottom:1px solid #0001;display:flex;gap:8px}
  .an-list b{color:#C44928;font-weight:600;flex:none}
  .an-list .x{margin-left:auto;cursor:pointer;opacity:.4;flex:none}
  .an-list .x:hover{opacity:1;color:#C44928}
  @media print{.an-bar,.an-list,.an-pin,.an-pop{display:none!important}}`;
  document.head.appendChild(css);

  const bar=document.createElement('div');
  bar.className='an-bar';
  bar.innerHTML=`<span class="an-count" id="anCount">0</span>
    <button id="anList" title="Show comments">LIST</button>
    <button id="anTog" title="Press A">ANNOTATE</button>`;
  document.body.appendChild(bar);
  const list=document.createElement('ul'); list.className='an-list'; document.body.appendChild(list);

  const layer=document.createElement('div');
  layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2147482000';
  document.body.appendChild(layer);

  function render(){
    document.getElementById('anCount').textContent=pins.length;
    [...layer.children].forEach(c=>c.remove());
    list.innerHTML='';
    // measure the page with no pins in it, so stale coordinates can't inflate it
    const docH=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    pins.forEach((p,i)=>{
      // re-anchor to the element if we can still find it; otherwise clamp inside the page
      p.stale = p.y > docH-8;
      if(p.stale) p.y = Math.min(p.y, docH-24);
      const el=document.createElement('div');
      el.className='an-pin'+(p.status==='done'?' done':'')+(p.stale?' stale':'');
      el.style.left=p.x+'px'; el.style.top=p.y+'px'; el.style.pointerEvents='auto';
      el.textContent=i+1; el.title=(p.stale?'[position stale] ':'')+p.text;
      el.onclick=e=>{e.stopPropagation();el.scrollIntoView({block:'center'});alert('#'+(i+1)+'\n\n'+p.text);};
      layer.appendChild(el);
      const li=document.createElement('li');
      li.innerHTML=`<b>${i+1}</b><span>${p.text.replace(/</g,'&lt;')}</span><span class="x">✕</span>`;
      li.querySelector('.x').onclick=async()=>{
        await fetch(API+'?id='+encodeURIComponent(p.id),{method:'DELETE'});
        pins=pins.filter(q=>q.id!==p.id); render();
      };
      li.onclick=e=>{ if(e.target.className!=='x') window.scrollTo({top:p.y-200,behavior:'smooth'}); };
      list.appendChild(li);
    });
  }

  function popup(x,y,target,meta){
    document.querySelectorAll('.an-pop').forEach(n=>n.remove());
    const pop=document.createElement('div'); pop.className='an-pop';
    pop.style.left=Math.min(x,innerWidth+scrollX-310)+'px';
    pop.style.top=(y+16)+'px';
    pop.innerHTML=`<div class="meta">${meta}</div>
      <textarea placeholder="What should change here?"></textarea>
      <div class="btns"><button data-a="cancel">CANCEL</button>
      <button class="primary" data-a="save">SAVE</button></div>`;
    document.body.appendChild(pop);
    const ta=pop.querySelector('textarea'); ta.focus();
    const close=()=>pop.remove();
    pop.querySelector('[data-a="cancel"]').onclick=close;
    pop.querySelector('[data-a="save"]').onclick=async()=>{
      const text=ta.value.trim(); if(!text) return close();
      const rec={text,x,y,target,page:location.pathname.replace(/^\//,'')||'index-new.html',
        viewport:innerWidth+'x'+innerHeight,
        theme:document.documentElement.getAttribute('data-theme')||'light'};
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(rec)}).then(r=>r.json()).catch(()=>null);
      if(r&&r.ok){ rec.id=r.id; pins.push(rec); render(); }
      close();
    };
    ta.onkeydown=e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) pop.querySelector('[data-a="save"]').click();
                      if(e.key==='Escape') close(); };
  }

  function arm(on){
    armed=on;
    document.body.classList.toggle('an-armed',on);
    const b=document.getElementById('anTog');
    b.classList.toggle('on',on); b.textContent=on?'CLICK A SPOT':'ANNOTATE';
  }
  document.getElementById('anTog').onclick=()=>arm(!armed);
  document.getElementById('anList').onclick=()=>list.classList.toggle('show');
  addEventListener('keydown',e=>{
    if(e.target.matches('textarea,input')) return;
    if(e.key==='a'||e.key==='A') arm(!armed);
    if(e.key==='Escape'){ arm(false); document.querySelectorAll('.an-pop').forEach(n=>n.remove()); }
  });
  addEventListener('click',e=>{
    if(!armed) return;
    if(e.target.closest('.an-bar,.an-pop,.an-list,.an-pin')) return;
    e.preventDefault(); e.stopPropagation();
    const el=e.target, p=pathOf(el), s=snippet(el);
    popup(e.pageX,e.pageY,p,p+(s?' — “'+s+'”':''));
    arm(false);
  },true);

  fetch(API).then(r=>r.json()).then(d=>{
    pins=(d||[]).filter(a=>a.page===(location.pathname.replace(/^\//,'')||'index-new.html'));
    render();
  }).catch(()=>render());
})();
