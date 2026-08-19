/* Kenneth's AI playground — page behaviour */
(function(){
  const root=document.documentElement;
  const qs=new URLSearchParams(location.search);

  /* theme: url > stored > system */
  const stored=localStorage.getItem('theme');
  const initial=qs.get('theme')||stored||
    (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  if(initial==='dark') root.setAttribute('data-theme','dark');
  const tb=document.getElementById('theme');
  if(tb) tb.onclick=()=>{
    const dark=root.getAttribute('data-theme')==='dark';
    if(dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','dark');
    localStorage.setItem('theme',dark?'light':'dark');
  };

  /* the park */
  const svg=document.getElementById('park');
  if(svg && typeof initPark==='function'){
    initPark(svg,{seed: qs.has('seed')?(parseInt(qs.get('seed'),10)||1):undefined});
  }

  /* drafting underlay — same hand as the park */
  const zone=document.getElementById('zone');
  function drawGrid(){
    if(!zone) return;
    const old=zone.querySelector('.gridsvg'); if(old) old.remove();
    const w=zone.clientWidth, h=zone.clientHeight;
    if(!w||!h) return;
    const NS='http://www.w3.org/2000/svg';
    const s=document.createElementNS(NS,'svg');
    s.setAttribute('class','gridsvg');
    s.setAttribute('viewBox','0 0 '+w+' '+h);
    s.setAttribute('preserveAspectRatio','none');
    s.setAttribute('aria-hidden','true');
    const STEP=84, J=3.2;
    const rnd=(()=>{let a=99;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
      t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();
    const wob=()=> (rnd()-0.5)*2*J;
    const path=(pts)=>{
      const p=document.createElementNS(NS,'path');
      p.setAttribute('d','M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
      s.appendChild(p);
    };
    for(let x=STEP;x<w;x+=STEP){
      const pts=[]; for(let y=0;y<=h;y+=Math.max(34,h/14)) pts.push([x+wob(),y]);
      pts.push([x+wob(),h]); path(pts);
    }
    for(let y=STEP;y<h;y+=STEP){
      const pts=[]; for(let x=0;x<=w;x+=Math.max(48,w/16)) pts.push([x,y+wob()]);
      pts.push([w,y+wob()]); path(pts);
    }
    zone.insertBefore(s,zone.firstChild);
  }
  drawGrid();
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{drawGrid();if(window.__drawRules)window.__drawRules();},180)});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(drawGrid);

  /* project map — implementation lives in grid-viz.js */
  function buildViz(){
    const host=document.getElementById('viz');
    if(host && typeof projectMap==='function')
      projectMap(host, readProjectRecords(), {legend:false, axis:false, cell:39, radius:9.6});
  }

  /* the month headings end in a rule; it needs to be a real element so drawRules
     can measure where to put the wobbly path (a ::after pseudo cannot be) */
  document.querySelectorAll('.mo h3').forEach(h=>{
    if(!h.querySelector('.rulegap')) h.appendChild(document.createElement('i')).className='rulegap';
  });

  /* ---- hand-drawn rules: one overlay per container, measured from layout ---- */
  const NSS='http://www.w3.org/2000/svg';
  function mkRnd(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);
    t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function overlay(host,w,h){
    const old=host.querySelector(':scope > .rules'); if(old) old.remove();
    const s=document.createElementNS(NSS,'svg');
    s.setAttribute('class','rules'); s.setAttribute('viewBox','0 0 '+w+' '+h);
    s.setAttribute('preserveAspectRatio','none'); s.setAttribute('aria-hidden','true');
    host.appendChild(s); return s;
  }
  function hline(s,x1,x2,y,r,{j=1.5,faint=false}={}){
    const n=Math.max(3,Math.round((x2-x1)/90)), pts=[];
    for(let i=0;i<=n;i++) pts.push([x1+(x2-x1)*i/n, y+(r()-0.5)*2*j]);
    const p=document.createElementNS(NSS,'path');
    p.setAttribute('d','M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
    if(faint) p.setAttribute('class','faint');
    s.appendChild(p);
  }
  function vline(s,y1,y2,x,r,{j=1.5,faint=false}={}){
    const n=Math.max(3,Math.round((y2-y1)/90)), pts=[];
    for(let i=0;i<=n;i++) pts.push([x+(r()-0.5)*2*j, y1+(y2-y1)*i/n]);
    const p=document.createElementNS(NSS,'path');
    p.setAttribute('d','M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
    if(faint) p.setAttribute('class','faint');
    s.appendChild(p);
  }

  const sheet=document.querySelector('.sheet');
  function drawRules(){
    if(!sheet) return;
    const sb=sheet.getBoundingClientRect(), W=sb.width, H=sb.height;
    if(!W||!H) return;
    const s=overlay(sheet,W,H), r=mkRnd(4242);
    const rel=el=>{const b=el.getBoundingClientRect();
      return {x:b.left-sb.left,y:b.top-sb.top,w:b.width,h:b.height};};


    // the month headings' trailing rules, drawn wobbly rather than as a CSS hairline
    document.querySelectorAll('.mo h3 .rulegap').forEach(gap=>{
      const b=rel(gap);
      if(b.w>8) hline(s,b.x,b.x+b.w,b.y+b.h/2,r,{j:1.1,faint:true});
    });

    // the highlight grid's own dividers, in its own overlay
    const hl=document.querySelector('.hl');
    if(hl){
      const hb=hl.getBoundingClientRect();
      const hs=overlay(hl,hb.width,hb.height), hr=mkRnd(777);
      hline(hs,0,hb.width,0.5,hr); hline(hs,0,hb.width,hb.height-0.5,hr);
      vline(hs,0,hb.height,0.5,hr); vline(hs,0,hb.height,hb.width-0.5,hr);
      const cells=[...hl.querySelectorAll('.cell')];
      const xs=new Set(), ys=new Set();
      cells.forEach(c=>{const b=c.getBoundingClientRect();
        const x=b.right-hb.left, y=b.bottom-hb.top;
        if(x<hb.width-2) xs.add(Math.round(x));
        if(y<hb.height-2) ys.add(Math.round(y));
      });
      xs.forEach(x=>vline(hs,0,hb.height,x,hr));
      ys.forEach(y=>hline(hs,0,hb.width,y,hr));
    }

  }
  window.__drawRules=drawRules;

  /* each project row is bulleted with its kind — same shapes as the map and filters */
  if(typeof shape==='function'){
    const NSB='http://www.w3.org/2000/svg';
    document.querySelectorAll('.row').forEach(row=>{
      if(row.querySelector('.rbullet')) return;
      const kind=SHAPES[row.dataset.cat]; if(!kind) return;
      row.setAttribute('data-cat',row.dataset.cat);
      const s=document.createElementNS(NSB,'svg');
      s.setAttribute('class','rbullet'); s.setAttribute('width',10); s.setAttribute('height',10);
      s.setAttribute('viewBox','0 0 10 10'); s.setAttribute('aria-hidden','true');
      s.appendChild(shape(kind,5,5,3.8));
      row.insertBefore(s,row.firstChild);
    });
  }

  /* filters — real radiogroup, hash-synced, keyboard navigable */
  const btns=[...document.querySelectorAll('.filters button')];
  // the filters speak the same language as the map: shape, not word
  if(typeof shape==='function'){
    const NSV='http://www.w3.org/2000/svg';
    btns.forEach(b=>{
      const f=b.dataset.f, label=b.textContent.trim();
      b.setAttribute('aria-label',label); b.title=label;
      b.textContent='';
      const s=document.createElementNS(NSV,'svg');
      // sized to sit on the same x-height as the section title
      s.setAttribute('width',11); s.setAttribute('height',11); s.setAttribute('viewBox','0 0 11 11');
      s.appendChild(shape(SHAPES[f],5.5,5.5,4.2));
      b.appendChild(s);
    });
  }
  const rows=[...document.querySelectorAll('.row')];
  const stat=document.getElementById('fstat');

  function apply(f,push){
    btns.forEach(b=>{
      const on=b.dataset.f===f;
      b.setAttribute('aria-checked',String(on));
      b.tabIndex=on?0:-1;
    });
    let n=0;
    rows.forEach(r=>{
      const show=f==='all'||r.dataset.cat===f;
      r.hidden=!show; if(show) n++;
    });
    document.querySelectorAll('.mo').forEach(s=>{
      s.hidden=![...s.querySelectorAll('.row')].some(r=>!r.hidden);
    });
    if(stat) stat.textContent=n+(f==='all'?' projects':' '+f+' projects')+' shown';
    // the map answers the filter too
    const vsvg=document.querySelector('#viz svg');
    if(vsvg){
      vsvg.classList.toggle('filtered', f!=='all');
      vsvg.querySelectorAll('.dot').forEach(d=>d.classList.toggle('on', d.getAttribute('data-cat')===f));
    }
    if(push) history.replaceState(null,'',f==='all'?location.pathname:'#'+f);
    if(window.__drawRules) requestAnimationFrame(window.__drawRules);
  }
  btns.forEach((b,i)=>{
    b.addEventListener('click',()=>apply(b.getAttribute('aria-checked')==='true'?'all':b.dataset.f,true));
    b.addEventListener('keydown',e=>{
      const d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:
              e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;
      if(!d) return;
      e.preventDefault();
      const t=btns[(i+d+btns.length)%btns.length];
      t.focus(); apply(t.dataset.f,true);
    });
  });
  const fromHash=(location.hash||'').slice(1);
  apply(btns.some(b=>b.dataset.f===fromHash)?fromHash:'all',false);

  /* draw the rules once layout has settled, and again when images land */
  buildViz();
  drawRules();
  addEventListener('load',()=>{drawGrid();drawRules();});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{drawGrid();drawRules();});
})();
