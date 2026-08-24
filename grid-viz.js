/* Project map — one mark per project, a column per month, shape by kind.
   Shared by index-new.html (hero, no legend) and playground.html (specimen 01).
     const recs = readProjectRecords();            // from .mo[data-month] sections
     projectMap(host, recs, { legend:true, cell:26 });
   Records may also be passed directly as {mo:'July 2026', cat:'app', nm:'…'}. */
/* ---- project map: derived from the page, newest month on the left ---- */
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHAPES={app:'square',game:'circle',event:'triangle',exploration:'diamond',visualization:'cross'};
/* The marks are drawn with an imperfect edge, the same way the project blocks
   are: the outline is walked point by point with a small nudge at each step.
   Amplitude scales with the mark, so an 8px dot in the map gets a fraction of a
   pixel while a 40px mount in the footer gets a couple.

   markVerts() is the geometry, shared so the crisp proportions live in one
   place; wobbleMark() is the drawn version. Both are exposed globally because
   park-marks.js draws the same five marks in the footer. */
function markVerts(kind,cx,cy,r){
  if(kind==='circle'){
    const v=[],n=26;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;
      v.push([cx+Math.cos(a)*r*0.9, cy+Math.sin(a)*r*0.9]);}
    return v;
  }
  if(kind==='square'){const k=r*0.82;
    return [[cx-k,cy-k],[cx+k,cy-k],[cx+k,cy+k],[cx-k,cy+k]];}
  if(kind==='triangle'){const hh=r*1.02;
    return [[cx,cy-hh],[cx+r,cy+hh*0.72],[cx-r,cy+hh*0.72]];}
  if(kind==='diamond'){const k=r*1.1;
    return [[cx,cy-k],[cx+k,cy],[cx,cy+k],[cx-k,cy]];}
  const a=r*0.35,b=r*1.1;
  return [[cx-a,cy-b],[cx+a,cy-b],[cx+a,cy-a],[cx+b,cy-a],[cx+b,cy+a],[cx+a,cy+a],
          [cx+a,cy+b],[cx-a,cy+b],[cx-a,cy+a],[cx-b,cy+a],[cx-b,cy-a],[cx-a,cy-a]];
}

/* a small deterministic generator, so a mark keeps the same hand across
   redraws, filtering and theme changes */
function markRnd(seed){
  let a=(seed|0)||1;
  return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}

function wobbleMark(kind,cx,cy,r,seed){
  const verts=markVerts(kind,cx,cy,r);
  const rnd=markRnd(seed===undefined ? Math.round(cx*7+cy*13+r*3) : seed);
  // a small mark cannot take much wobble before it stops reading as its shape
  const amt=Math.max(0.28, Math.min(r*0.085, 2.0));
  const step=Math.max(4, r*0.9);
  const pts=[];
  for(let e=0;e<verts.length;e++){
    const [x0,y0]=verts[e], [x1,y1]=verts[(e+1)%verts.length];
    const len=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.round(len/step));
    for(let i=0;i<n;i++){
      const t=i/n;
      pts.push([x0+(x1-x0)*t+(rnd()-0.5)*amt, y0+(y1-y0)*t+(rnd()-0.5)*amt]);
    }
  }
  return 'M'+pts.map(q=>q[0].toFixed(2)+' '+q[1].toFixed(2)).join('L')+'Z';
}

function shape(kind,cx,cy,r,seed){
  const N='http://www.w3.org/2000/svg';
  const e=document.createElementNS(N,'path');
  e.setAttribute('d',wobbleMark(kind,cx,cy,r,seed));
  e.setAttribute('class','dot'); return e;
}
/* Read {mo, cat, nm} records out of a page's month sections. */
function readProjectRecords(root){
  const recs=[];
  (root||document).querySelectorAll('.mo[data-month]').forEach(s=>{
    const [nm,yr]=s.dataset.month.split(' ');
    const idx=(+yr)*12+MN.indexOf(nm);
    s.querySelectorAll('.row').forEach(r=>recs.push({
      i:idx, mo:s.dataset.month, cat:r.dataset.cat,
      nm:(r.querySelector('.rn a,.rn span')||{}).textContent||''
    }));
  });
  return recs;
}

/* Draw the map. opts: {newestFirst, legend, cell, radius, showReadout} */
function projectMap(host, recs, opts){
  opts=opts||{}; if(!host) return;
  host.innerHTML='';
  const N='http://www.w3.org/2000/svg';
  recs=(recs||[]).map(r=>{
    if(r.i!==undefined) return r;
    const [nm,yr]=r.mo.split(' ');
    return {...r, i:(+yr)*12+MN.indexOf(nm)};
  });
  if(!recs.length) return;
  const now=new Date(), end=now.getFullYear()*12+now.getMonth();
  const start=Math.min(...recs.map(r=>r.i));
  let cols=[];
  for(let i=end;i>=start;i--) cols.push({i,y:Math.floor(i/12),m:i%12,items:recs.filter(r=>r.i===i)});
  // drop empty months at the leading edge (e.g. a current month with nothing in it yet)
  if(opts.trimEmpty!==false){ while(cols.length && !cols[0].items.length) cols.shift(); }
  if(opts.newestFirst===false) cols.reverse();
  const maxN=Math.max(...cols.map(c=>c.items.length),1);
  const CELL=opts.cell||21, R=opts.radius||5.1, PADT=8, LABH=(opts.axis===false?4:24);
  const W=cols.length*CELL, H=maxN*CELL+PADT+LABH, base=maxN*CELL+PADT;

  let read={textContent:''};
  if(opts.showReadout!==false){ read=document.createElement('div'); read.className='viz-read'; host.appendChild(read); }
  const svg=document.createElementNS(N,'svg');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label',recs.length+' projects over '+cols.length+' months, newest first; shape shows kind');
  host.appendChild(svg);

  if(opts.axis!==false){
    const bl=document.createElementNS(N,'line');
    bl.setAttribute('class','base');bl.setAttribute('x1',0);bl.setAttribute('x2',W);
    bl.setAttribute('y1',base+.5);bl.setAttribute('y2',base+.5);svg.appendChild(bl);
  }

  const MI=['J','F','M','A','M','J','J','A','S','O','N','D'];
  cols.forEach((c,ci)=>{
    const g=document.createElementNS(N,'g'), cx=ci*CELL+CELL/2;
    c.items.forEach((it,ri)=>{
      const cy=base-ri*CELL-CELL/2;
      const e=shape(SHAPES[it.cat]||'circle',cx,cy,R);
      e.setAttribute('data-cat',it.cat);
      const t=document.createElementNS(N,'title'); t.textContent=it.nm+' — '+it.mo;
      e.appendChild(t); g.appendChild(e);
      const hit=document.createElementNS(N,'rect');
      hit.setAttribute('class','hit');hit.setAttribute('x',cx-CELL/2);hit.setAttribute('y',cy-CELL/2);
      hit.setAttribute('width',CELL);hit.setAttribute('height',CELL);
      hit.addEventListener('pointerenter',()=>read.textContent=it.nm+' · '+it.mo);
      hit.addEventListener('pointerleave',()=>read.textContent='');
      g.appendChild(hit);
    });
    if(!c.items.length){
      if(c.i===end){const p=document.createElementNS(N,'circle');p.setAttribute('class','now');
        p.setAttribute('cx',cx);p.setAttribute('cy',base-CELL/2);p.setAttribute('r',R*0.9);
        const t=document.createElementNS(N,'title');t.textContent='This month — nothing logged yet';
        p.appendChild(t);g.appendChild(p);}
      else{const d=document.createElementNS(N,'rect');d.setAttribute('class','gap');
        d.setAttribute('x',cx-1);d.setAttribute('y',base-3);d.setAttribute('width',2);d.setAttribute('height',2);g.appendChild(d);}
    }
    if(opts.axis!==false){
      const lab=document.createElementNS(N,'text');
      lab.setAttribute('class',c.m===0?'yr':'lab');lab.setAttribute('x',cx);lab.setAttribute('y',base+13);
      lab.setAttribute('text-anchor','middle');lab.textContent=MI[c.m];svg.appendChild(lab);
      if(c.m===0||ci===cols.length-1){
        const y=document.createElementNS(N,'text');y.setAttribute('class','yr');
        y.setAttribute('x',cx);y.setAttribute('y',base+23);y.setAttribute('text-anchor','middle');
        y.textContent="'"+String(c.y).slice(2);svg.appendChild(y);
      }
    }
    svg.appendChild(g);
  });

  if(opts.legend){
    const L=document.createElement('div'); L.className='viz-legend';
    Object.keys(SHAPES).forEach(k=>{
      const d=document.createElement('span');
      const s2=document.createElementNS(N,'svg');
      s2.setAttribute('width',13);s2.setAttribute('height',13);s2.setAttribute('viewBox','0 0 13 13');
      s2.appendChild(shape(SHAPES[k],6.5,6.5,4.6));
      d.appendChild(s2);
      d.appendChild(document.createTextNode(k.toUpperCase()));
      L.appendChild(d);
    });
    host.appendChild(L);
  }
  return {columns:cols.length, projects:recs.length};
}
