/* Park illustration — assembled only from the five category marks.

   Every form in the scene is a square, circle, triangle, diamond or cross: the
   same marks grid-viz.js draws for app, game, event, exploration and
   visualization. Nothing else is used except thin structural lines, so the
   footer speaks the grid's vocabulary back at you.

   Usage: const park = initParkMarks(document.getElementById('park'), { seed, onSeed }); */
function initParkMarks(svg, opts){
  opts=opts||{};
  const NS='http://www.w3.org/2000/svg';
  const onSeed=opts.onSeed||function(){};
  let SEED=(opts.seed!==undefined&&opts.seed!==null)?opts.seed:(Math.random()*9973|0);

  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296; }; }
  /* Two streams. The structure — where the rides, towers and trees stand — is
     drawn from a fixed seed so REDRAW never rearranges the scene. Only detail
     (which windows are lit, where the crowd stands, the balloons) uses SEED, so
     a redraw is a change of hand rather than a different park. */
  const STRUCT=20260819;
  let rnd=mulberry(SEED), srnd=mulberry(STRUCT);
  const R=(a,b)=>a+rnd()*(b-a);
  const S=(a,b)=>a+srnd()*(b-a);
  const pick=arr=>arr[(rnd()*arr.length)|0];
  const spick=arr=>arr[(srnd()*arr.length)|0];

  function el(n,at,p){ const e=document.createElementNS(NS,n);
    for(const k in at) e.setAttribute(k,at[k]); (p||svg).appendChild(e); return e; }

  /* The marks themselves. grid-viz.js owns the canonical geometry; this mirrors
     its proportions exactly so the footer and the project map agree. */
  const KINDS=['square','circle','triangle','diamond','cross'];
  function markPath(kind,cx,cy,r){
    if(kind==='circle') return null;
    if(kind==='square') return 'M'+(cx-r*.82)+' '+(cy-r*.82)+'h'+(r*1.64)+'v'+(r*1.64)+'h'+(-r*1.64)+'Z';
    if(kind==='triangle'){ const hh=r*1.02;
      return 'M'+cx+' '+(cy-hh)+'L'+(cx+r)+' '+(cy+hh*.72)+'L'+(cx-r)+' '+(cy+hh*.72)+'Z'; }
    if(kind==='diamond')
      return 'M'+cx+' '+(cy-r*1.1)+'L'+(cx+r*1.1)+' '+cy+'L'+cx+' '+(cy+r*1.1)+'L'+(cx-r*1.1)+' '+cy+'Z';
    const a=r*.35,b=r*1.1;
    return 'M'+(cx-a)+' '+(cy-b)+'h'+(a*2)+'v'+(b-a)+'h'+(b-a)+'v'+(a*2)+'h'+(-(b-a))+
           'v'+(b-a)+'h'+(-a*2)+'v'+(-(b-a))+'h'+(-(b-a))+'v'+(-a*2)+'h'+(b-a)+'Z';
  }
  function mark(kind,cx,cy,r,o){
    o=o||{};
    const at={class:o.cls||'mk'};
    if(o.fill) at.fill=o.fill;
    if(o.op!==undefined) at.opacity=o.op;
    let e;
    if(kind==='circle'){ at.cx=cx.toFixed(1); at.cy=cy.toFixed(1); at.r=(r*.9).toFixed(1);
      e=el('circle',at,o.g); }
    else { at.d=markPath(kind,cx,cy,r); e=el('path',at,o.g); }
    if(o.rot) e.setAttribute('transform','rotate('+o.rot.toFixed(1)+' '+cx.toFixed(1)+' '+cy.toFixed(1)+')');
    return e;
  }
  /* A rectangle is a square mark stretched — the scene still uses nothing but
     the five marks, which is the whole conceit. */
  function rect(x,y,w,h,fill,g,op){
    const r=Math.max(w,h)/1.64, cx=x+w/2, cy=y+h/2;
    const e=mark('square',cx,cy,r,{fill:fill,cls:'plane',g:g,op:op});
    e.setAttribute('transform','translate('+cx.toFixed(1)+','+cy.toFixed(1)+') scale('+
      (w/Math.max(w,h)).toFixed(4)+','+(h/Math.max(w,h)).toFixed(4)+') translate('+
      (-cx).toFixed(1)+','+(-cy).toFixed(1)+')');
    return e;
  }
  const line=(x1,y1,x2,y2,o)=>el('line',{x1:x1.toFixed(1),y1:y1.toFixed(1),
    x2:x2.toFixed(1),y2:y2.toFixed(1),class:(o&&o.cls)||'ln',
    'stroke-width':(o&&o.w)||1,opacity:(o&&o.op)!==undefined?o.op:1},o&&o.g);

  const GROUND=496;
  const HUES=['var(--m-teal)','var(--m-rust)','var(--m-ochre)','var(--m-moss)',
              'var(--m-navy)','var(--m-coral)'];

  let wheelG, wheelCabs=[], carUnits=[], carFrontG, carBackG,
      coasterPath, cars=[], balloons=[], tick=0, motion=true;

  function build(){
    svg.innerHTML=''; rnd=mulberry(SEED); srnd=mulberry(STRUCT);
    wheelCabs=[]; carUnits=[]; cars=[]; balloons=[];
    const back=el('g',{}), mid=el('g',{}), front=el('g',{});

    /* ---- stars: crosses, only lit after dark ---- */
    for(let i=0;i<46;i++)
      mark('cross', R(30,1970), R(20,300), R(1.6,3.4), {cls:'star', g:back});

    /* ---- skyline ----
       Footprint and height are structural, so REDRAW never rearranges the city.
       Colour is detail, so a redraw repaints it. Shapes vary between squares,
       tall slabs and wide blocks, and some carry a cylindrical top: a circle
       centred on the roofline with the block drawn over its lower half. */
    let x=52;
    while(x<1960){
      const form=srnd();
      let w,h;
      if(form<0.34){ w=S(70,110); h=w*S(0.92,1.08); }        // square
      else if(form<0.74){ w=S(46,76);  h=S(140,260); }       // tall slab
      else { w=S(96,150); h=S(74,120); }                     // wide block
      // only the carousel needs clear air; the city reads well behind the coaster
      if(x>548 && x<866){ x+=w+S(6,16); continue; }
      const hue=pick(HUES);                                  // detail: redraw repaints
      const top=GROUND-h;
      const domed = srnd()<0.42 && w<=110;
      if(domed) mark('circle', x+w/2, top, w/2/0.9, {fill:hue, cls:'plane', g:back});
      rect(x, top, w, h, hue, back);
      const cols=Math.max(1,Math.round(w/34)), rows=Math.max(2,Math.round(h/40));
      for(let c=0;c<cols;c++) for(let r2=0;r2<rows;r2++){
        if(rnd()<0.34) continue;                             // detail: which are lit
        mark('square', x+(c+0.5)*w/cols, top+18+(r2+0.5)*(h-26)/rows, 4.6,
          {cls:'lamp', g:back});
      }
      x+=w+S(4,14);                                          // packed closer together
    }

    /* ---- ferris wheel: a circle of alternating marks ---- */
    const WX=320, WY=250, WR=176;
    wheelG=el('g',{},mid);
    line(WX-64,GROUND,WX,WY,{w:2.2,g:mid}); line(WX+64,GROUND,WX,WY,{w:2.2,g:mid});
    line(WX-88,GROUND,WX+88,GROUND,{w:1.4,op:.5,g:mid});
    el('circle',{cx:WX,cy:WY,r:WR,class:'rim'},wheelG);
    el('circle',{cx:WX,cy:WY,r:WR*0.62,class:'rim',opacity:.4},wheelG);
    const CABS=12;
    for(let i=0;i<CABS;i++){
      const a=i/CABS*Math.PI*2, px=WX+Math.cos(a)*WR, py=WY+Math.sin(a)*WR;
      line(WX,WY,px,py,{w:.9,op:.45,g:wheelG});
      const g=el('g',{},wheelG);
      mark(KINDS[i%KINDS.length], px, py, 15, {fill:HUES[i%HUES.length], cls:'plane', g:g});
      mark('circle', px, py, 3.4, {cls:'lamp', g:g});
      g._c=[px,py]; wheelCabs.push(g);
    }
    mark('circle', WX, WY, 13, {fill:'var(--m-rust)', cls:'plane', g:wheelG});

    /* ---- carousel: triangle canopy, square drum, diamonds on the poles ---- */
    const MX=700, MY=470, MRX=132, TOP=MY-132;   // taller poles
    const carG=el('g',{},front);
    carBackG=el('g',{},carG);
    mark('square', MX, (TOP+MY)/2, 46, {fill:'var(--m-coral)', cls:'plane', g:carG});
    carFrontG=el('g',{},carG);
    // a plinth, so the ride sits on the ground instead of floating above it
    rect(MX-MRX-16, MY+2, (MRX+16)*2, GROUND-(MY+2), 'var(--m-navy)', carG, .9);
    line(MX-MRX-16,MY+2,MX+MRX+16,MY+2,{w:1.6,g:carG});
    for(let i=0;i<10;i++){
      const g=el('g',{class:'mu'},carFrontG);
      line(0,-120,0,4,{w:1,op:.6,g:g});
      mark(KINDS[i%KINDS.length], 0, -34, 15,
        {fill:HUES[(i+2)%HUES.length], cls:'plane', g:g});
      mark('circle', 0, -116, 2.8, {cls:'lamp', g:g});
      carUnits.push(g);
    }

    // the canopy is drawn last so it sits over the poles rather than under them
    for(let i=0;i<9;i++)                                    // canopy of triangles
      mark('triangle', MX-MRX+ (i+0.5)*(MRX*2/9), TOP-10, 34,
        {fill:HUES[i%HUES.length], cls:'plane', g:carG, op:.9});
    mark('cross', MX, TOP-62, 15, {fill:'var(--m-ochre)', cls:'plane', g:carG});
    mark('circle', MX, TOP-62, 4, {cls:'lamp', g:carG});

    /* ---- rollercoaster: a side elevation that actually reads as one ----
       A station, a lift hill, three decreasing airtime hills and a low return
       leg back to the station. The train is spaced along the path by arc length
       and each car is rotated to the local tangent, so it sits ON the track
       instead of drifting near it. Supports are sampled off the same path. */
    const CX0=1180;
    const prof=[
      [CX0+ 40,436],                                        // station
      [CX0+120,320],[CX0+195,262],[CX0+255,254],            // lift hill and crest
      [CX0+310,306],[CX0+350,384],                          // first drop
      [CX0+400,326],[CX0+452,306],[CX0+505,378],            // second hill
      [CX0+560,342],[CX0+610,330],[CX0+660,392],            // third hill
      [CX0+712,372],[CX0+752,392],                          // bunny hop
      [CX0+778,424],[CX0+770,452],                          // right turnaround
      [CX0+700,468],[CX0+460,472],[CX0+220,470],            // return leg
      [CX0+ 90,462],[CX0+ 34,452]                           // left turnaround
    ];
    /* A closed curve through the midpoints, with each listed point as a control.
       The previous version repeated the first point and then closed with Z, which
       put a hard corner at the left turnaround. This has no corner anywhere. */
    const mid2=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const n0=prof.length, m0=mid2(prof[n0-1],prof[0]);
    let cd='M'+m0[0].toFixed(1)+' '+m0[1].toFixed(1);
    for(let i=0;i<n0;i++){
      const pt=prof[i], mm=mid2(pt,prof[(i+1)%n0]);
      cd+='Q'+pt[0]+' '+pt[1]+' '+mm[0].toFixed(1)+' '+mm[1].toFixed(1);
    }
    cd+='Z';
    coasterPath=el('path',{d:cd,class:'track'},mid);

    // legs down to the ground, taken from the path itself so they always meet it
    const CL=coasterPath.getTotalLength();
    for(let d=0; d<CL*0.62; d+=46){
      const q=coasterPath.getPointAtLength(d);
      if(q.y>452) continue;                       // skip the low return leg
      line(q.x,q.y,q.x,GROUND,{w:1,op:.4,cls:'ln',g:back});
    }
    line(CX0+10,GROUND,CX0+790,GROUND,{w:1.2,op:.4,g:back});

    for(let i=0;i<4;i++){                          // a train, not scattered cars
      const g=el('g',{},front);
      mark('square', 0, -9, 10, {fill:HUES[i%HUES.length], cls:'plane', g:g});
      mark('circle', -7, 2, 3.2, {fill:'var(--m-navy)', cls:'plane', g:g});
      mark('circle',  7, 2, 3.2, {fill:'var(--m-navy)', cls:'plane', g:g});
      cars.push(g);
    }

    /* ---- trees, balloons and a crowd, all marks ---- */
    // trees keep out of the rides, and sit behind them, or they bury the carousel
    for(let i=0;i<15;i++){
      const tx=S(40,1960), th=S(46,86);
      if(tx>620&&tx<980) continue;                        // carousel
      if(tx>1240&&tx<1980) continue;                      // coaster
      line(tx,GROUND,tx,GROUND-th*0.5,{w:1.4,op:.6,g:mid});
      for(let k=0;k<3;k++)
        mark('triangle', tx, GROUND-th*0.5-k*th*0.34, th*0.42-k*3,
          {fill:'var(--m-moss)', cls:'plane', g:mid, op:.92});
    }
    for(let i=0;i<7;i++){
      const g=el('g',{},front);
      mark('circle', 0,0, R(15,24), {fill:pick(HUES), cls:'plane', g:g});
      mark('diamond', 0, 24, 6, {fill:'var(--m-ochre)', cls:'plane', g:g});
      g._x=R(60,1940); g._y=R(GROUND-140, GROUND-20); g._sp=R(9,20);
      g._span=R(760,1180);          // how far above the footer it climbs
      balloons.push(g);
    }
    // people: narrow uprights standing on the line, as in the earlier footer
    for(let i=0;i<64;i++){
      const px=R(24,1976), ph=R(9,17), pw=R(3,4.6);
      rect(px-pw/2, GROUND-ph, pw, ph, 'var(--m-figure)', front, R(.55,1));
    }
    // one common baseline, drawn last so everything stands on the same ground
    line(0,GROUND,2000,GROUND,{w:2.6,cls:'base',g:front});
    onSeed(SEED);
  }

  /* The footer is usually far below the fold. Animating it while it is off
     screen, or while the tab is in the background, is pure cost. */
  let onScreen=true, raf=0;
  const idle=()=>document.hidden||!onScreen;
  function kick(){ if(!raf && !idle()) raf=requestAnimationFrame(frame); }
  if(typeof IntersectionObserver==='function'){
    new IntersectionObserver(function(es){ onScreen=es[0].isIntersecting; kick(); },
      {rootMargin:'150px'}).observe(svg);
  }
  document.addEventListener('visibilitychange',kick);

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(t){
    if(idle()){ raf=0; return; }         // stop; kick() restarts it
    raf=requestAnimationFrame(frame);
    if(!motion||reduce) return;
    tick=t/1000;
    const ang=tick*6;
    if(wheelG) wheelG.setAttribute('transform','rotate('+ang+' 320 250)');
    wheelCabs.forEach(g=>g.setAttribute('transform',
      'rotate('+(-ang)+' '+g._c[0].toFixed(1)+' '+g._c[1].toFixed(1)+')'));
    for(let i=0;i<carUnits.length;i++){
      const g=carUnits[i], a=tick*0.8 + i/carUnits.length*Math.PI*2;
      const x=700+Math.cos(a)*132, y=470+Math.sin(tick*2.3+i)*4;
      g.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');
      const want=Math.sin(a)>0?carFrontG:carBackG;
      if(g._p!==want){ want.appendChild(g); g._p=want; }
    }
    if(coasterPath){
      const L=coasterPath.getTotalLength();
      const head=(tick*90)%L;                      // px along the track per second
      cars.forEach((g,i)=>{
        const dd=(head - i*27 + L)%L;
        const p=coasterPath.getPointAtLength(dd);
        const q=coasterPath.getPointAtLength((dd+7)%L);
        let a=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI, flip='';
        // travelling left: bring the angle back inside +-90 the short way round,
        // then mirror. Subtracting 180 in both directions overshoots to -329.
        if(a>90){ a-=180; flip=' scale(-1,1)'; }
        else if(a<-90){ a+=180; flip=' scale(-1,1)'; }
        g.setAttribute('transform','translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+
          ') rotate('+a.toFixed(1)+')'+flip);
      });
    }
    balloons.forEach(g=>{
      // they rise past the top of the viewBox and over the page above, then wrap
      const travel=(tick*g._sp)%g._span;
      const y=g._y-travel;
      const drift=Math.sin(tick*0.35+g._x)*12;
      g.setAttribute('transform','translate('+(g._x+drift).toFixed(1)+','+y.toFixed(1)+')');
      g.setAttribute('opacity',(1-Math.max(0,travel/g._span-0.62)/0.38).toFixed(3));
    });
  }

  build(); kick();
  return {
    get seed(){ return SEED; },
    redraw(s){ SEED=(s!==undefined)?s:(SEED*31+17)%9973; build(); return SEED; },
    setMotion(v){ motion=!!v; },
    rebuild: build
  };
}
