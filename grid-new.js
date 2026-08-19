/* Project grid — wobbly outlines, overshooting ruling, and the hover crumble.

   The crumble only ever runs for the tile under the cursor (plus one fading out),
   so this stays cheap with 40+ projects: two slots, two textures, no atlas and no
   per-pixel loop over every tile. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const grid=document.getElementById('pgrid');
  if(!grid) return;
  let tiles=[...grid.querySelectorAll('.tile')];   // reassigned after the shuffle

  /* ---------- apply grid-config.js ----------
     Sizes, colours and hover media are edited by hand in that file so the
     markup does not have to be regenerated to retune the layout. */
  if(typeof GRID_CONFIG==='object' && GRID_CONFIG){
    const DARK={'--g-navy':1,'--g-teal':1,'--g-moss':1,'--g-vermillion':1};
    tiles.forEach(t=>{
      // keyed by "Name @ Month" so two projects sharing a name stay distinct;
      // a bare name still works for hand-added entries
      const nameEl=t.querySelector('.tn');
      const nm=nameEl?nameEl.textContent.trim():'';
      const cfg=GRID_CONFIG[t.dataset.key] || GRID_CONFIG[nm];
      if(!cfg) return;
      if(cfg.size)   t.dataset.w=String(Math.min(4,Math.max(1,cfg.size|0)));
      if(cfg.colour){
        t.dataset.tint=cfg.colour;
        t.style.setProperty('--t-bg','var('+cfg.colour+')');
        t.style.setProperty('--t-ink', DARK[cfg.colour]?'var(--paper)':'var(--ink)');
      }
      if(cfg.media!==undefined){
        if(cfg.media) t.dataset.img=cfg.media; else delete t.dataset.img;
      }
    });
  }
  const labels=[...grid.querySelectorAll('.mlabel')];
  // set data-shapes on the grid to cut every tile to its category mark
  const SHAPE_TILES = grid.dataset.shapes!==undefined && typeof SHAPES==='object';
  // one seed per tile, shared by the SVG outline and the shader's edge
  tiles.forEach((t,i)=>{ t.dataset.seed=((i*137)%40).toFixed(2); });

  /* ---------- theme ---------- */
  const root=document.documentElement;
  const qsp=new URLSearchParams(location.search);
  const stored=localStorage.getItem('theme');
  const initial=qsp.get('theme')||stored||
    (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  if(initial==='dark') root.setAttribute('data-theme','dark');
  const themeBtn=document.getElementById('themebtn')||document.querySelector('.themebtn');
  if(themeBtn) themeBtn.onclick=()=>{
    const dark=root.getAttribute('data-theme')==='dark';
    if(dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','dark');
    localStorage.setItem('theme',dark?'light':'dark');
  };

  /* ---------- the park in the footer ---------- */
  const parkSvg=document.getElementById('park');
  const parkSeed={seed: qsp.has('seed')?(parseInt(qsp.get('seed'),10)||1):undefined};
  // the marks park is the one the footer uses now; initPark stays as a fallback
  if(parkSvg && typeof initParkMarks==='function') initParkMarks(parkSvg,parkSeed);
  else if(parkSvg && typeof initPark==='function') initPark(parkSvg,parkSeed);

  /* ---------- seeded wobble, so the hand is stable between loads ---------- */
  function rnd(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0;
    let t=Math.imul(seed^seed>>>15,1|seed);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  /* The outline a tile is cut to. Normally the cell itself; in shape mode it is
     the project's category mark, inscribed in the cell at the same proportions
     grid-viz.js draws. crumble clips its canvas to these points, so the hover
     crumble follows whichever outline is in use without knowing about either. */
  function shapeVerts(kind,w,h){
    const cx=w/2, cy=h/2, s=Math.min(w,h)/2;
    if(kind==='square')   return [[0,0],[w,0],[w,h],[0,h]];
    if(kind==='circle'){
      const v=[], n=44;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2;
        v.push([cx+Math.cos(a)*s*0.99, cy+Math.sin(a)*s*0.99]); }
      return v;
    }
    if(kind==='triangle'){ const hh=s*1.02;
      return [[cx,cy-hh],[cx+s,cy+hh*0.72],[cx-s,cy+hh*0.72]]; }
    if(kind==='diamond')  return [[cx,cy-s],[cx+s,cy],[cx,cy+s],[cx-s,cy]];
    const a=s*0.35, b=s;                       // cross
    return [[cx-a,cy-b],[cx+a,cy-b],[cx+a,cy-a],[cx+b,cy-a],[cx+b,cy+a],[cx+a,cy+a],
            [cx+a,cy+b],[cx-a,cy+b],[cx-a,cy+a],[cx-b,cy+a],[cx-b,cy-a],[cx-a,cy-a]];
  }

  function wobblyPoly(verts,r,amt){
    // walk the perimeter, nudging each step, and overshoot the start a little
    const pts=[], N=verts.length;
    for(let e=0;e<N;e++){
      const [x0,y0]=verts[e], [x1,y1]=verts[(e+1)%N];
      const len=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.round(len/26));
      for(let i=0;i<=n;i++){
        const t=i/n;
        pts.push([x0+(x1-x0)*t+(r()-0.5)*amt, y0+(y1-y0)*t+(r()-0.5)*amt]);
      }
    }
    pts.push(pts[0]);
    const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
    // the stroke carries a little past the corner, the way a pen does; the fill
    // must not, or the overshoot closes into a spike
    const over=[pts[1][0]+(r()-0.5)*amt+6, pts[1][1]+(r()-0.5)*amt];
    return {fill:d+'Z', edge:d+'L'+over[0].toFixed(1)+' '+over[1].toFixed(1), pts:pts};
  }

  function drawFrames(){
    tiles.forEach((el,i)=>{
      const b=el.getBoundingClientRect();
      if(!b.width) return;
      let svg=el.querySelector('.fr');
      if(!svg){ svg=document.createElementNS(NS,'svg'); svg.setAttribute('class','fr');
        svg.setAttribute('aria-hidden','true'); el.insertBefore(svg,el.firstChild); }
      svg.setAttribute('viewBox','0 0 '+b.width.toFixed(0)+' '+b.height.toFixed(0));
      svg.innerHTML='';
      const r=rnd(9001+i*137);
      const kind=SHAPE_TILES ? (SHAPES[el.dataset.cat]||'square') : 'square';
      const d=wobblyPoly(shapeVerts(kind,b.width,b.height), r, 2.0);
      el._clip=d.pts;                       // used to clip the shader to this outline
      const fill=document.createElementNS(NS,'path');
      fill.setAttribute('class','fill'); fill.setAttribute('d',d.fill);
      const edge=document.createElementNS(NS,'path');
      edge.setAttribute('class','edge'); edge.setAttribute('d',d.edge);
      svg.appendChild(fill); svg.appendChild(edge);
    });
  }

  /* ---------- a different weave each visit ----------
     Shuffled only within a month: the grid reads as a history, so the months
     themselves must stay in order. Reordering inside one changes how the sizes
     pack against each other, which is what alters the weave's shape.
     ?weave=<n> pins a layout, the way ?seed= pins the park. */
  const weaveSeed = qsp.has('weave') ? (parseInt(qsp.get('weave'),10)||1)
                                     : (Math.random()*99991|0);
  (function shuffleWithinMonths(){
    const wr=rnd(weaveSeed);
    let run=[], anchorEl=null;
    const flush=()=>{
      for(let i=run.length-1;i>0;i--){                     // Fisher-Yates
        const j=Math.floor(wr()*(i+1));
        [run[i],run[j]]=[run[j],run[i]];
      }
      let after=anchorEl;
      run.forEach(el=>{ after.after(el); after=el; });
      run=[];
    };
    [...grid.children].forEach(el=>{
      if(el.classList.contains('mlabel')){ if(anchorEl) flush(); anchorEl=el; }
      else if(el.classList.contains('tile')) run.push(el);
    });
    if(anchorEl) flush();
    tiles=[...grid.querySelectorAll('.tile')];              // DOM order changed
  })();
  // seeds taken after the shuffle, so the drawn hand differs between visits too
  tiles.forEach((t,i)=>{
    const sd=((i*137)+weaveSeed)%40;
    t.dataset.seed=sd.toFixed(2);
    t.style.setProperty('--gd', (sd/10).toFixed(2)+'s');   // staggers the dark-mode glow
  });

  /* ---------- the weave: one lattice, shared with the project grid ----------
     The underlay is drawn on the grid's own pitch and origin rather than an
     arbitrary step, so an empty cell above the blocks is the same cell a project
     would land in. Unfilled lattice at the top reads as room still to come; the
     colour below is the part of the weave already made. */
  const zone=document.getElementById('zone');
  function gridPitch(){
    const cs=getComputedStyle(grid);
    const gap=parseFloat(cs.columnGap)||6;
    const cols=cs.gridTemplateColumns.split(' ').filter(Boolean).length||12;
    const gb=grid.getBoundingClientRect();
    if(!gb.width) return null;
    const col=(gb.width-(cols-1)*gap)/cols;
    return {gap, cols, col, pitch:col+gap, box:gb};
  }
  function drawGrid(){
    if(!zone) return;
    const old=zone.querySelector('.gridsvg'); if(old) old.remove();
    const w=zone.clientWidth, h=zone.clientHeight;
    const G=gridPitch();
    if(!w||!h||!G) return;
    const zb=zone.getBoundingClientRect();
    const ox=G.box.left-zb.left, oy=G.box.top-zb.top;

    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('class','gridsvg');
    svg.setAttribute('viewBox','0 0 '+w.toFixed(0)+' '+h.toFixed(0));
    svg.setAttribute('preserveAspectRatio','none');
    svg.setAttribute('aria-hidden','true');
    const r=rnd(99), J=2.2, wob=()=>(r()-0.5)*2*J;
    const path=(pts,cls)=>{
      const p=document.createElementNS(NS,'path');
      p.setAttribute('d','M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
      if(cls) p.setAttribute('class',cls);
      svg.appendChild(p);
    };

    // lines sit in the gutters, so they run between blocks rather than under them
    const half=G.gap/2;
    for(let k=0;k<=G.cols;k++){
      const x=ox+k*G.pitch-half;
      if(x<-4||x>w+4) continue;
      const pts=[];
      for(let y=0;y<=h;y+=Math.max(30,G.pitch)) pts.push([x+wob(),y]);
      pts.push([x+wob(),h]);
      path(pts);
    }
    // horizontals continue above the grid into the hero — the weave not yet filled
    const first=Math.ceil(-oy/G.pitch), last=Math.floor((h-oy)/G.pitch);
    for(let j=first;j<=last;j++){
      const y=oy+j*G.pitch-half;
      if(y<-4||y>h+4) continue;
      const pts=[];
      for(let x=0;x<=w;x+=Math.max(44,G.pitch)) pts.push([x,y+wob()]);
      pts.push([w,y+wob()]);
      path(pts, j<0?'ahead':null);      // above the first row = still to come
    }
    zone.insertBefore(svg,zone.firstChild);
  }

  /* ---------- the project map in the hero ---------- */
  function buildViz(){
    const hostEl=document.getElementById('viz');
    if(!hostEl||typeof projectMap!=='function') return;
    // records come from projects-data.js; the page no longer has month sections
    // for readProjectRecords() to walk
    const recs=(typeof RECORDS!=='undefined') ? RECORDS : [];
    if(!recs.length) return;
    const big=matchMedia('(min-width:900px)').matches;
    projectMap(hostEl, recs, {legend:false, axis:false,
      cell: big?33:39, radius: big?8:9.6});
    /* projectMap only sets a viewBox. An SVG with no intrinsic size falls back to
       300x150, and .hero's second column is minmax(0,auto) — so the map was pinned
       at 300px wide no matter what `cell` or max-width said. Giving it real
       dimensions makes `cell` mean pixels again. */
    const svg=hostEl.querySelector('svg');
    if(svg){
      const vb=(svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);
      if(vb.length===4 && vb[2] && vb[3]){
        svg.setAttribute('width', vb[2]);
        svg.setAttribute('height', vb[3]);
      }
    }
  }

  /* ---------- ruling that runs past the blocks, as in the reference ---------- */
  // Kept, but off: laid over the colour blocks the ruling fought them. The
  // drafting hand now lives in the underlay behind the sheet instead.
  const RULES_OVER_TILES=false;
  function drawRules(){
    const wrap=document.querySelector('.pwrap'); if(!wrap) return;
    const existing=wrap.querySelector('.prules');
    if(!RULES_OVER_TILES){ if(existing) existing.remove(); return; }
    let svg=wrap.querySelector('.prules');
    if(!svg){ svg=document.createElementNS(NS,'svg'); svg.setAttribute('class','prules');
      svg.setAttribute('aria-hidden','true'); wrap.appendChild(svg); }
    const wb=wrap.getBoundingClientRect();
    const W=wb.width+40, H=wb.height+60;
    svg.setAttribute('viewBox','0 0 '+W.toFixed(0)+' '+H.toFixed(0));
    svg.innerHTML='';
    const r=rnd(4242);
    const line=(pts,faint)=>{
      const p=document.createElementNS(NS,'path');
      p.setAttribute('d','M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
      if(faint) p.setAttribute('class','faint');
      svg.appendChild(p);
    };
    // horizontals pinned to tile edges, carried well past them on both sides
    const seen=new Set();
    tiles.forEach(el=>{
      const b=el.getBoundingClientRect();
      [b.top-wb.top+30, b.bottom-wb.top+30].forEach(y=>{
        const k=Math.round(y/8); if(seen.has(k)) return; seen.add(k);
        if(r()>0.55) return;                       // not every edge earns a line
        const x0=-10+r()*40, x1=W-r()*70;
        const n=Math.max(3,Math.round((x1-x0)/120)), pts=[];
        for(let i=0;i<=n;i++) pts.push([x0+(x1-x0)*i/n, y+(r()-0.5)*2.4]);
        line(pts, r()>0.5);
      });
    });
    // a few verticals for the draughting feel
    for(let i=0;i<9;i++){
      const x=W*(0.06+0.1*i)+ (r()-0.5)*30;
      const y0=-14+r()*50, y1=H-r()*90;
      const n=Math.max(3,Math.round((y1-y0)/120)), pts=[];
      for(let k=0;k<=n;k++) pts.push([x+(r()-0.5)*2.6, y0+(y1-y0)*k/n]);
      line(pts, r()>0.42);
    }
  }

  /* ---------- filters ---------- */
  const btns=[...document.querySelectorAll('.filters button')];
  const stat=document.getElementById('fstat');
  function apply(f){
    btns.forEach(b=>{const on=b.dataset.f===f;
      b.setAttribute('aria-checked',String(on)); b.tabIndex=on?0:-1;});
    const panel=document.querySelector('.filters');
    if(panel) panel.classList.toggle('filtering', f!=='all');
    const headEl=document.querySelector('.idxhead');
    if(headEl) headEl.classList.toggle('filtering', f!=='all');
    let n=0;
    tiles.forEach(t=>{
      const match=f==='all'||t.dataset.cat===f;
      t.classList.toggle('dim', !match);
      if(match) n++;
    });
    labels.forEach(l=>{
      // a month with nothing left in the current filter has no group to label
      let any=false;
      for(let el=l.nextElementSibling; el && !el.classList.contains('mlabel');
          el=el.nextElementSibling){
        if(el.classList.contains('tile') && !el.classList.contains('dim')){ any=true; break; }
      }
      l.classList.toggle('dim', !any);
    });
    // the hero map answers the filter as well
    const vsvg=document.querySelector('#viz svg');
    if(vsvg){
      vsvg.classList.toggle('filtered', f!=='all');
      vsvg.querySelectorAll('.dot').forEach(dt=>
        dt.classList.toggle('on', dt.getAttribute('data-cat')===f));
    }
    if(stat) stat.textContent=n+(f==='all'?' projects':' '+f+' projects')+' shown';
    // nothing moves any more, so the outlines and the weave do not need redrawing
  }
  const clearBtn=document.getElementById('clearf');
  if(clearBtn) clearBtn.addEventListener('click',()=>apply('all'));

  btns.forEach((b,i)=>{
    b.addEventListener('click',()=>apply(b.getAttribute('aria-checked')==='true'?'all':b.dataset.f));
    b.addEventListener('keydown',e=>{
      const d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:
              e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;
      if(e.key==='Escape'){ apply('all'); return; }
      if(!d) return; e.preventDefault();
      const t=btns[(i+d+btns.length)%btns.length]; t.focus(); apply(t.dataset.f);
    });
  });

  /* ---------- icons, from the same shape() the map uses ---------- */
  if(typeof shape==='function'){
    btns.forEach(b=>{
      const kind=SHAPES[b.dataset.f]; if(!kind||b.querySelector('svg')) return;
      const s=document.createElementNS(NS,'svg');
      s.setAttribute('width','15'); s.setAttribute('height','15');
      s.setAttribute('viewBox','-8 -8 16 16'); s.setAttribute('aria-hidden','true');
      s.appendChild(shape(kind,0,0,6));
      b.appendChild(s);
    });
  }
  if(typeof shape==='function'){
    tiles.forEach(t=>{
      const kind=SHAPES[t.dataset.cat]; if(!kind) return;
      const s=document.createElementNS(NS,'svg');
      s.setAttribute('class','tico'); s.setAttribute('width','13'); s.setAttribute('height','13');
      s.setAttribute('viewBox','-7 -7 14 14'); s.setAttribute('aria-hidden','true');
      s.appendChild(shape(kind,0,0,5));
      t.appendChild(s);
    });
  }

  /* ---------- hover crumble ---------- */
  const canvas=document.getElementById('pcanvas');
  const crumble=(typeof initCrumble==='function')
    ? initCrumble(canvas, document.querySelector('.pwrap')) : null;
  if(crumble){
    tiles.forEach(t=>{
      // .hot is applied by crumble itself, in step with what it is drawing
      t.addEventListener('pointerenter',()=>{ if(!t.classList.contains('dim')) crumble.enter(t); });
      t.addEventListener('pointerleave',()=>crumble.leave(t));
      t.addEventListener('focus',      ()=>{ if(!t.classList.contains('dim')) crumble.enter(t,true); });
      t.addEventListener('blur',       ()=>crumble.leave(t));
    });
  }

  // make the row unit match the column width, so the spans come out square
  function sizeRows(){
    const cs=getComputedStyle(grid);
    const gap=parseFloat(cs.columnGap)||6;
    const cols=cs.gridTemplateColumns.split(' ').filter(Boolean).length||12;
    const w=grid.getBoundingClientRect().width;
    if(!w) return;
    const col=(w-(cols-1)*gap)/cols;
    grid.style.setProperty('--row', col.toFixed(2)+'px');
    // one clear row of lattice below the last project, so the weave runs on past
    // the end the same way it does above the first
    const wrap=document.querySelector('.pwrap');
    if(wrap) wrap.style.paddingBottom=(col+gap).toFixed(2)+'px';
  }

  function relayout(){ sizeRows(); buildViz(); requestAnimationFrame(()=>{
    drawFrames(); drawRules(); drawGrid(); if(crumble) crumble.measure(); }); }
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(relayout,160);});
  // scroll fired measure() — rects plus clip-path strings — on every single event
  let sTick=false;
  addEventListener('scroll',()=>{
    if(sTick||!crumble) return;
    sTick=true;
    requestAnimationFrame(()=>{ sTick=false; crumble.measure(); });
  },{passive:true});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(relayout);
  buildViz();
  relayout();
  apply('all');
  // the underlay can only be measured once the grid has settled to its height
  requestAnimationFrame(()=>requestAnimationFrame(drawGrid));
})();
