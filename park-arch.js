/* Park illustration — architectural elevation. Drawn by playground.html.

   Usage:  const park = initParkArch(document.getElementById('park'), { seed, onSeed });
   The svg must sit inside an element carrying the .arch class (see park-arch.css),
   which scopes the elevation palette so it can coexist with park.css on one page. */
function initParkArch(svg, opts){
  const NS='http://www.w3.org/2000/svg';
  opts=opts||{};
  const onSeed=opts.onSeed||function(){};
  let SEED=opts.seed!==undefined?opts.seed:(Math.random()*9973|0);
  let motion=true;
  function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  let rnd=mulberry(SEED); const R=(a,b)=>a+rnd()*(b-a);
  function el(n,at,p){const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);
  (p||svg).appendChild(e);return e}

  /* ---- draughting primitives: precise, no wobble ---- */
  const GROUND=648;
  function L(x1,y1,x2,y2,{w=1,op=1,g=svg,cls='ln'}={}){
  return el('line',{x1,y1,x2,y2,'stroke-width':w,opacity:op,class:cls},g);
  }
  function P(pts,{w=1,op=1,g=svg,close=false,cls='ln'}={}){
  let d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
  if(close)d+='Z';
  return el('path',{d,'stroke-width':w,opacity:op,class:cls},g);
  }
  function curve(pts,{w=1,op=1,g=svg,cls='ln'}={}){
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let d='M'+pts[0][0]+' '+pts[0][1];
  for(let i=1;i<pts.length-1;i++){const q=m(pts[i],pts[i+1]);
    d+='Q'+pts[i][0]+' '+pts[i][1]+' '+q[0].toFixed(1)+' '+q[1].toFixed(1);}
  d+='L'+pts[pts.length-1][0]+' '+pts[pts.length-1][1];
  return el('path',{d,'stroke-width':w,opacity:op,class:cls},g);
  }
  // flat colour plane — deliberately offset from the linework, like cut paper
  function plane(x,y,w,h,fill,g,op){
  return el('rect',{x,y,width:w,height:h,fill,class:'plane',opacity:op!==undefined?op:''},g||svg);
  }
  // lattice mast / truss
  function truss(x,yTop,yBot,w,bays,g,{cap=true}={}){
  const step=(yBot-yTop)/bays;
  L(x-w,yBot,x-w*0.34,yTop,{w:.9,g}); L(x+w,yBot,x+w*0.34,yTop,{w:.9,g});
  for(let i=0;i<=bays;i++){
    const t=i/bays, y=yBot+(yTop-yBot)*t, ww=w+(w*0.34-w)*t;
    L(x-ww,y,x+ww,y,{w:.6,op:.8,g});
    if(i<bays){
      const t2=(i+1)/bays, y2=yBot+(yTop-yBot)*t2, w2=w+(w*0.34-w)*t2;
      L(x-ww,y,x+w2,y2,{w:.5,op:.55,g}); L(x+ww,y,x-w2,y2,{w:.5,op:.55,g});
    }
  }
  if(cap){ L(x-w*0.9,yTop,x+w*0.9,yTop,{w:1,g}); L(x,yTop,x,yTop-26,{w:.8,op:.8,g}); }
  }
  // architectural scale figure
  function figure(x,y,h,g){
  const u=h/8;
  el('circle',{cx:x,cy:y-h+u,r:u*0.92,class:'fig'},g);
  P([[x-u*0.9,y-h+u*2],[x+u*0.9,y-h+u*2],[x+u*0.8,y-u*2.6],[x-u*0.8,y-u*2.6]],
    {close:true,g,cls:'fig'}).setAttribute('stroke','none');
  P([[x-u*0.75,y-u*2.6],[x-u*0.2,y-u*2.6],[x-u*0.35,y],[x-u*0.85,y]],{close:true,g,cls:'fig'}).setAttribute('stroke','none');
  P([[x+u*0.2,y-u*2.6],[x+u*0.75,y-u*2.6],[x+u*0.85,y],[x+u*0.35,y]],{close:true,g,cls:'fig'}).setAttribute('stroke','none');
  }
  // glazing grid inside a plane
  function glazing(x,y,w,h,cx,cy,g){
  for(let i=1;i<cx;i++) L(x+i*w/cx,y,x+i*w/cx,y+h,{w:.45,op:.5,g});
  for(let i=1;i<cy;i++) L(x,y+i*h/cy,x+w,y+i*h/cy,{w:.45,op:.5,g});
  }
  function windows(x,y,w,h,cx,cy,g){
  for(let i=0;i<cx;i++) for(let j=0;j<cy;j++){
    if(rnd()<0.45) continue;
    const wx=x+6+i*(w-12)/cx, wy=y+6+j*(h-12)/cy;
    el('rect',{x:wx.toFixed(1),y:wy.toFixed(1),width:8,height:10,class:'lamp'},g);
    el('rect',{x:(wx-3).toFixed(1),y:(wy-3).toFixed(1),width:14,height:16,class:'glow'},g);
  }
  }

  let wheelG, coasterPath, carDot, carUnits=[], carBackG, carFrontG, tick=0;

  function build(){
  svg.innerHTML=''; rnd=mulberry(SEED); carUnits=[];
  const so=document.getElementById('seedout'); so.innerHTML='';
  const a=document.createElement('a');
  a.href='?seed='+SEED+(document.documentElement.getAttribute('data-theme')==='dark'?'&theme=dark':'');
  a.textContent='SEED '+SEED+' — PIN THIS ONE';
  a.style.cssText='color:inherit;text-decoration:underline;text-underline-offset:3px'; so.appendChild(a);

  const planes=el('g',{},svg), cons=el('g',{},svg), lines=el('g',{},svg), fore=el('g',{},svg);

  /* ---- construction lines: verticals running off the sheet ---- */
  for(let i=0;i<26;i++){
    const x=R(90,2330);
    L(x,R(60,190),x,R(660,720),{w:.6,g:cons,cls:'cx'});
  }
  for(let i=0;i<12;i++){ const x=R(120,2300); L(x,GROUND,x,GROUND+R(18,46),{w:.6,g:cons,cls:'cx'}); }

  /* ---- colour planes (behind everything) ---- */
  plane(520,430,300,218,'var(--blush)',planes);
  plane(806,330,164,318,'var(--ochre)',planes);
  plane(1188,300,120,348,'var(--blush)',planes);
  plane(1120,486,430,162,'var(--teal)',planes);
  plane(1404,336,132,312,'var(--ochre)',planes);
  plane(1566,452,164,196,'var(--rust)',planes);
  plane(1980,500,286,148,'var(--blush)',planes);
  plane(238,556,180,92,'var(--blush)',planes,0.42);

  /* ---- ground datum ---- */
  L(40,GROUND,2360,GROUND,{w:1.4,g:lines});
  L(40,GROUND+7,2360,GROUND+7,{w:.5,op:.35,g:lines});

  /* ---------- ferris wheel: pure linework ---------- */
  const WX=395, WY=352, WR=200;
  wheelG=el('g',{},lines);
  [WR,WR-9,WR-22,WR*0.30].forEach((r,i)=>
    el('circle',{cx:WX,cy:WY,r,fill:'none','stroke-width':i?0.7:1.2,opacity:i?.75:1,class:'ln'},wheelG));
  const SP=36;
  for(let i=0;i<SP;i++){
    const t=i/SP*Math.PI*2;
    L(WX+Math.cos(t)*WR*0.30,WY+Math.sin(t)*WR*0.30,WX+Math.cos(t)*(WR-9),WY+Math.sin(t)*(WR-9),
      {w:i%3?.45:.75,op:i%3?.5:.9,g:wheelG});
  }
  for(let i=0;i<SP;i++){            // rim ticks
    const t=(i+.5)/SP*Math.PI*2;
    L(WX+Math.cos(t)*(WR-9),WY+Math.sin(t)*(WR-9),WX+Math.cos(t)*WR,WY+Math.sin(t)*WR,{w:.5,op:.6,g:wheelG});
  }
  const CAB=18;
  for(let i=0;i<CAB;i++){
    const t=i/CAB*Math.PI*2, x=WX+Math.cos(t)*WR, y=WY+Math.sin(t)*WR;
    const c=el('g',{class:'cab'},wheelG);
    L(x,y,x,y+7,{w:.6,g:c});
    P([[x-9,y+7],[x+9,y+7],[x+9,y+19],[x-9,y+19]],{close:true,w:.8,g:c});
    L(x-9,y+11,x+9,y+11,{w:.45,op:.6,g:c});
    el('circle',{cx:x,cy:y+3,r:2.2,class:'lamp'},c);
    el('circle',{cx:x,cy:y+3,r:8,class:'glow'},c);
  }
  truss(WX-88,GROUND-186,GROUND,26,7,lines,{cap:false});
  truss(WX+88,GROUND-186,GROUND,26,7,lines,{cap:false});
  L(WX-88,WY,WX-88,GROUND-186,{w:.9,g:lines}); L(WX+88,WY,WX+88,GROUND-186,{w:.9,g:lines});
  L(WX-88,WY,WX,WY,{w:.7,op:.7,g:lines}); L(WX+88,WY,WX,WY,{w:.7,op:.7,g:lines});
  el('circle',{cx:WX,cy:WY,r:5,fill:'var(--line)',opacity:'var(--line-op)'},lines);

  /* ---------- carousel: line structure, flat elevation ---------- */
  const MX=880, MY=GROUND, MRX=96, TOP=MY-118, APEX=TOP-64;
  const carG=el('g',{},lines);
  P([[MX-MRX-12,TOP],[MX,APEX],[MX+MRX+12,TOP]],{w:1.1,g:carG});
  for(let i=0;i<=10;i++){ const x=MX-MRX-12+(i/10)*(MRX+12)*2;
    L(MX,APEX,x,TOP,{w:.5,op:.55,g:carG}); }
  L(MX-MRX-12,TOP,MX+MRX+12,TOP,{w:.9,g:carG});
  for(let i=0;i<12;i++){ const x0=MX-MRX-12+(i/12)*(MRX+12)*2, x1=MX-MRX-12+((i+1)/12)*(MRX+12)*2;
    curve([[x0,TOP],[(x0+x1)/2,TOP+8],[x1,TOP]],{w:.6,op:.7,g:carG}); }
  L(MX,APEX,MX,APEX-24,{w:.8,g:carG});
  el('circle',{cx:MX,cy:APEX-26,r:2.6,class:'lamp'},carG);
  el('circle',{cx:MX,cy:APEX-26,r:10,class:'glow'},carG);
  carBackG=el('g',{},carG);
  plane(MX-40,TOP+14,80,MY-TOP-18,'var(--rust)',planes);
  P([[MX-40,TOP+14],[MX+40,TOP+14],[MX+40,MY-4],[MX-40,MY-4]],{close:true,w:.9,g:carG});
  carFrontG=el('g',{},carG);
  L(MX-MRX-16,MY-4,MX+MRX+16,MY-4,{w:1,g:carG});
  for(let i=0;i<10;i++){
    const g=el('g',{class:'mu'},carFrontG);
    L(0,-112,0,-4,{w:.7,g});
    const hg=el('g',{},g);                       // hg turns; the pole above stays put
    P([[11,-40],[-10,-40],[-12,-26],[9,-26]],{close:true,w:.7,g:hg});
    P([[-8,-41],[-17,-49],[-20,-42],[-12,-34]],{close:true,w:.6,g:hg});
    L(7,-26,8,-6,{w:.6,g:hg}); L(-6,-26,-7,-6,{w:.6,g:hg});
    g._h=hg;
    carUnits.push(g);
  }

  /* ---------- lattice towers + masts ---------- */
  [[1055,300],[1130,368],[1345,262],[1620,330],[1790,300]].forEach(([x,yTop])=>{
    truss(x,yTop,GROUND,17,Math.round((GROUND-yTop)/44),lines);
    P([[x-30,yTop+6],[x+30,yTop+6],[x+30,yTop+18],[x-30,yTop+18]],{close:true,w:.8,g:lines});
  });
  [1700,1900,2130,2290].forEach(x=>L(x,R(120,220),x,GROUND,{w:.7,op:.75,g:lines}));

  /* ---------- pavilions: cantilevered canopies ---------- */
  function pavilion(x,w,yTop,g){
    P([[x-26,yTop],[x+w+26,yTop],[x+w+18,yTop+9],[x-18,yTop+9]],{close:true,w:1,g});
    L(x-26,yTop,x+w+26,yTop,{w:1.2,g});
    for(let i=0;i<=6;i++) L(x+i*w/6,yTop+9,x+i*w/6,GROUND,{w:.5,op:.65,g});
    L(x,GROUND-62,x+w,GROUND-62,{w:.6,op:.6,g});
    glazing(x,yTop+9,w,GROUND-yTop-9,9,3,g);
    windows(x,yTop+9,w,GROUND-yTop-9,7,2,g);
  }
  pavilion(770,330,556,lines);
  pavilion(1230,380,548,lines);
  pavilion(1990,270,566,lines);

  /* ---------- chimney ---------- */
  plane(1508,268,34,380,'var(--deep)',planes);
  P([[1508,268],[1542,268],[1542,GROUND],[1508,GROUND]],{close:true,w:.9,g:lines});
  L(1502,278,1548,278,{w:.8,g:lines});

  /* ---------- water slide ---------- */
  const slide=[[1120,382],[1078,432],[1108,486],[1058,534],[1006,566],[962,596],[930,GROUND-4]];
  curve(slide,{w:13,g:lines,cls:'slide-fill'});
  curve(slide.map(p=>[p[0]-6,p[1]]),{w:1,g:lines,cls:'slide-edge'});
  curve(slide.map(p=>[p[0]+6,p[1]]),{w:1,g:lines,cls:'slide-edge'});

  /* ---------- rollercoaster: one continuous hairline ---------- */
  const track=[[640,GROUND-6],[700,470],[812,372],[980,330],[1150,346],[1290,300],
               [1420,318],[1540,392],[1610,486],[1690,556],[1790,470],[1880,352],
               [1990,330],[2110,376],[2190,466],[2210,556],[2140,610],[2020,624],
               [1840,626],[1600,626],[1300,626],[1000,626],[790,624],[680,614],[640,GROUND-6]];
  coasterPath=el('path',{d:(function(){
    const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    let d='M'+track[0][0]+' '+track[0][1];
    for(let i=1;i<track.length-1;i++){const q=m(track[i],track[i+1]);
      d+='Q'+track[i][0]+' '+track[i][1]+' '+q[0].toFixed(1)+' '+q[1].toFixed(1);}
    return d+'L'+track[track.length-1][0]+' '+track[track.length-1][1];
  })(),class:'coaster'},lines);
  track.forEach((p,i)=>{ if(i%2===0&&p[1]<GROUND-40) L(p[0],p[1],p[0],GROUND,{w:.5,op:.5,g:lines}); });
  carDot=el('g',{},fore);
  P([[-13,-6],[13,-6],[13,6],[-13,6]],{close:true,w:1,g:carDot});
  el('rect',{x:-13,y:-6,width:26,height:12,fill:'var(--rust)',class:'plane'},carDot);
  el('circle',{cx:0,cy:-11,r:2.4,class:'lamp'},carDot);
  el('circle',{cx:0,cy:-11,r:9,class:'glow'},carDot);

  /* ---------- scale figures ---------- */
  for(let i=0;i<26;i++) figure(R(120,2320),GROUND,R(20,28),fore);
  [[300,26],[326,22],[352,25]].forEach(([x,h])=>figure(x,GROUND,h,fore));

  /* ---------- title block ---------- */
  const tb=el('text',{x:2350,y:730,class:'tblock','text-anchor':'end'},svg);
  tb.textContent="KENNETH'S AI PLAYGROUND — PARK ELEVATION — SCALE 1:200 — SHEET 01";
  L(1560,712,2350,712,{w:.6,op:.4,g:svg});
  }

  /* ---- animation ---- */
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(t){
  if(motion&&!reduce){
    tick=t/1000;
    const ang=tick*5;
    wheelG.setAttribute('transform','rotate('+ang+' 395 352)');
    wheelG.querySelectorAll('.cab').forEach(c=>{
      if(c._cx===undefined){const b=c.getBBox();c._cx=b.x+b.width/2;c._cy=b.y+b.height/2;}
      c.setAttribute('transform','rotate('+(-ang)+' '+c._cx+' '+c._cy+')');
    });
    for(let i=0;i<carUnits.length;i++){
      const g=carUnits[i], a=tick*0.8+i/carUnits.length*Math.PI*2;
      const x=880+Math.cos(a)*96, y=648+Math.sin(tick*2.2+i)*3;
      g.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');
      const t=Math.max(-1,Math.min(1,Math.sin(a)/.3)), u=Math.abs(t);
      const e=u*u*(3-2*u);                       // smoothstep the turn, don't snap it
      g._h.setAttribute('transform','scale('+(t<0?-e:e).toFixed(3)+',1)');
      const want=Math.sin(a)>0?carFrontG:carBackG;
      if(g._p!==want){want.appendChild(g);g._p=want;}
    }
    if(coasterPath&&carDot){
      const Lp=coasterPath.getTotalLength(), d=((tick*0.06)%1)*Lp;
      const p=coasterPath.getPointAtLength(d), q=coasterPath.getPointAtLength((d+10)%Lp);
      carDot.setAttribute('transform','translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+') rotate('+
        (Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI).toFixed(1)+')');
    }
  }
  requestAnimationFrame(frame);
  }
  const reduceQ=matchMedia('(prefers-reduced-motion: reduce)').matches;
  onSeed(SEED);
  build(); requestAnimationFrame(frame);
  return {
    get seed(){ return SEED; },
    redraw(){ SEED=(SEED*31+17)%9973; build(); onSeed(SEED); return SEED; },
    setMotion(on){ motion=!!on; }
  };
}
