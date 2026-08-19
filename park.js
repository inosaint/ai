/* Park illustration — generated entirely in JS, no image assets.
   Usage:  const park = initPark(document.getElementById('park'), { seed, onSeed });
           park.redraw();  park.setMotion(bool);  park.seed; */
function initPark(svg, opts){
  opts = opts || {};
const NS='http://www.w3.org/2000/svg';
let SEED=(opts.seed!==undefined&&opts.seed!==null)?opts.seed:(Math.random()*9973|0);
  let motion=opts.motion!==false;

/* seeded rng so a redraw is reproducible */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=mulberry(SEED);
const R=(a,b)=>a+rnd()*(b-a);

function el(n,attrs,parent){const e=document.createElementNS(NS,n);
  for(const k in attrs) e.setAttribute(k,attrs[k]);
  (parent||svg).appendChild(e); return e}

/* ---- hand-drawn primitives ---------------------------------- */
// a wobbling polyline through points, drawn as a smooth path
function wobble(pts,amt){
  return pts.map(p=>[p[0]+R(-amt,amt),p[1]+R(-amt,amt)]);
}
// straight segments with sharp corners (buildings, cabins, paint blocks)
function d_poly(pts,close){
  if(!pts.length) return '';
  let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
  for(let i=1;i<pts.length;i++) d+='L'+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1);
  if(close) d+='Z';
  return d;
}
// subdivide each edge so the sides wobble like a brush stroke but corners stay sharp
function edges(pts,seg,amt){
  const out=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[i], b=pts[(i+1)%pts.length];
    out.push(a);
    if(i===pts.length-1) break;
    for(let s=1;s<seg;s++){
      const t=s/seg;
      out.push([a[0]+(b[0]-a[0])*t+R(-amt,amt), a[1]+(b[1]-a[1])*t+R(-amt,amt)]);
    }
  }
  return out;
}
function d_from(pts,close){
  if(!pts.length) return '';
  let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
  for(let i=1;i<pts.length;i++){
    const p=pts[i],q=pts[i-1];
    const cx=(q[0]+p[0])/2, cy=(q[1]+p[1])/2;
    d+='Q'+q[0].toFixed(1)+' '+q[1].toFixed(1)+' '+cx.toFixed(1)+' '+cy.toFixed(1);
  }
  const last=pts[pts.length-1];
  d+='L'+last[0].toFixed(1)+' '+last[1].toFixed(1);
  if(close) d+='Z';
  return d;
}
// a closed loop with every junction rounded, including the wrap-around
function d_loop(pts){
  const n=pts.length, mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const m0=mid(pts[n-1],pts[0]);
  let d='M'+m0[0].toFixed(1)+' '+m0[1].toFixed(1);
  for(let i=0;i<n;i++){
    const p=pts[i], m=mid(p,pts[(i+1)%n]);
    d+='Q'+p[0].toFixed(1)+' '+p[1].toFixed(1)+' '+m[0].toFixed(1)+' '+m[1].toFixed(1);
  }
  return d+'Z';
}
// sketch a line 1-2 times, slight offset each pass — reads as pencil
function sketch(pts,{w=1.4,amt=1.6,passes=2,close=false,g=svg,op=1,sharp=false}={}){
  for(let i=0;i<passes;i++){
    const src = sharp ? edges(pts,3,amt*0.9) : pts;
    const dd = sharp ? d_poly(wobble(src,amt*0.5),close) : d_from(wobble(src,amt),close);
    el('path',{d:dd,class:'ink',
      'stroke-width':(w*(i?0.72:1)).toFixed(2),
      opacity:(op*(i?0.5:1)).toFixed(2)},g);
  }
}
function line(x1,y1,x2,y2,o){ sketch([[x1,y1],[x2,y2]],o) }
function circle(cx,cy,r,o={}){
  const n=Math.max(18,r/3|0), p=[];
  for(let i=0;i<=n;i++){const a=i/n*Math.PI*2; p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
  sketch(p,{...o,close:false});
}
function ellipsePts(cx,cy,rx,ry,n=40,from=0,to=Math.PI*2){
  const p=[]; for(let i=0;i<=n;i++){const a=from+(to-from)*i/n; p.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}
  return p;
}
function boxOutline(x,y,w,h,o){ sketch([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],{...o,sharp:true}) }
// flat gouache block, deliberately offset from its outline
function paint(x,y,w,h,fill,g,extra={}){
  const dx=R(-7,7), dy=R(-6,6);
  const p=[[x+dx,y+dy],[x+w+dx+R(-4,4),y+dy+R(-3,3)],
           [x+w+dx+R(-4,4),y+h+dy+R(-3,3)],[x+dx+R(-3,3),y+h+dy]];
  return el('path',{d:d_poly(edges(p,3,2.6),true),fill:fill,class:'paint',...extra},g||svg);
}

/* ---- scene -------------------------------------------------- */
const GROUND=496;
let wheelG, carEls=[], coasterPath, tick=0;
let carUnits=[], carBackG, carFrontG;

function build(){
  svg.innerHTML='';
  rnd=mulberry(SEED);
  carEls=[]; carUnits=[];
  if(typeof opts.onSeed==="function") opts.onSeed(SEED);

  const back=el('g',{},svg), mid=el('g',{},svg), front=el('g',{},svg);

  /* night sky specks (dark mode only) */
  for(let i=0;i<70;i++) el('circle',{cx:R(20,1980),cy:R(20,330),r:R(.7,1.9).toFixed(1),class:'star'},back);

  /* horizon + loose perimeter path */
  line(0,GROUND,2000,GROUND,{w:1.5,amt:2.2,g:back});
  sketch([[120,GROUND+92],[430,GROUND+58],[900,GROUND+46],[1400,GROUND+62],[1880,GROUND+96]],
         {w:1.1,amt:3,g:back,op:.6});
  sketch([[60,GROUND+40],[520,GROUND+14],[1080,GROUND+8],[1620,GROUND+20],[1960,GROUND+44]],
         {w:1,amt:3,g:back,op:.45});

  /* ---------- ferris wheel ---------- */
  const WX=300, WY=256, WR=148, CABS=14;
  // A-frame legs, tapered, with cross braces
  [-1,1].forEach(s=>{
    const tx=WX+s*11, bx=WX+s*100;
    el('path',{d:d_poly(edges([[tx-7,WY],[tx+7,WY],[bx+16,GROUND],[bx-14,GROUND]],3,1.6),true),
      fill:'var(--cobalt)',class:'paint'},back);
    sketch([[tx,WY],[bx,GROUND]],{w:1.5,amt:1.3,g:back});
  });
  line(WX-54,GROUND-86,WX+54,GROUND-86,{w:1.2,amt:1.3,g:back});
  line(WX-31,GROUND-148,WX+31,GROUND-148,{w:1,amt:1.2,g:back,op:.6});

  wheelG=el('g',{},back);
  circle(WX,WY,WR,{w:1.6,amt:1.2,g:wheelG});
  circle(WX,WY,WR-11,{w:1.3,amt:1.2,g:wheelG});          // double rim
  circle(WX,WY,WR*0.58,{w:.9,amt:1.4,g:wheelG,op:.45});
  for(let i=0;i<CABS*2;i++){                              // spokes + tension wires
    const a=i/(CABS*2)*Math.PI*2;
    line(WX,WY,WX+Math.cos(a)*(WR-11),WY+Math.sin(a)*(WR-11),
      {w:i%2?.65:1.1,amt:1,g:wheelG,op:i%2?.35:.7});
  }
  for(let i=0;i<CABS*2;i++){                              // ticks across the rim band
    const a=(i+.5)/(CABS*2)*Math.PI*2;
    line(WX+Math.cos(a)*(WR-11),WY+Math.sin(a)*(WR-11),WX+Math.cos(a)*WR,WY+Math.sin(a)*WR,
      {w:.8,amt:.5,g:wheelG,op:.5,passes:1});
  }
  for(let i=0;i<12;i++){                                  // hub rosette
    const a=i/12*Math.PI*2;
    el('path',{d:d_poly([[WX,WY],[WX+Math.cos(a-.13)*27,WY+Math.sin(a-.13)*27],
      [WX+Math.cos(a+.13)*27,WY+Math.sin(a+.13)*27]],true),fill:'var(--terracotta)',class:'paint'},wheelG);
  }
  circle(WX,WY,28,{w:1,amt:.9,g:wheelG});
  el('circle',{cx:WX,cy:WY,r:6,fill:'var(--ink)',opacity:'var(--ink-op)'},wheelG);

  for(let i=0;i<CABS;i++){                                // open gondolas with riders
    const a=i/CABS*Math.PI*2, x=WX+Math.cos(a)*WR, y=WY+Math.sin(a)*WR;
    const cab=el('g',{class:'cab'},wheelG);
    const c=i%3===0?'var(--mustard)':(i%3===1?'var(--terracotta)':'var(--field)');
    sketch([[x,y-3],[x,y+6]],{w:1,amt:.4,g:cab,passes:1});
    el('path',{d:d_poly(edges([[x-15,y+7],[x+15,y+7],[x+15,y+22],[x-15,y+22]],2,1.1),true),
      fill:c,class:'paint'},cab);
    sketch([[x-15,y+7],[x+15,y+7],[x+15,y+22],[x-15,y+22],[x-15,y+7]],{w:1,amt:.8,g:cab,sharp:true});
    sketch([[x-18,y+6],[x+18,y+6]],{w:1.1,amt:.6,g:cab,passes:1});     // canopy rail
    [-13,0,13].forEach(dx=>sketch([[x+dx,y+6],[x+dx,y+22]],{w:.65,amt:.4,g:cab,op:.55,passes:1}));
    [-7,7].forEach(dx=>el('circle',{cx:x+dx,cy:y+13,r:2.7,fill:'var(--navy)',class:'paint'},cab));
    el('circle',{cx:x,cy:y+4,r:3,class:'lamp'},cab);
    el('circle',{cx:x,cy:y+4,r:11,class:'glow'},cab);
  }
  for(let i=0;i<34;i++){                                   // rim lamps
    const a=i/34*Math.PI*2, x=WX+Math.cos(a)*(WR-5.5), y=WY+Math.sin(a)*(WR-5.5);
    el('circle',{cx:x,cy:y,r:2.2,class:'lamp'},wheelG);
    el('circle',{cx:x,cy:y,r:7,class:'glow'},wheelG);
  }

  /* ---------- buildings: the skyline row (varied rooflines, not apartments) ---------- */
  const blds=[
    [560,206,84,290,'var(--blush)','flat'],   [652,268,68,228,'var(--terracotta)','pitch'],
    [738,306,116,190,'var(--mustard)','step'], [868,336,72,160,'var(--green)','flat'],
    [1150,300,92,196,'var(--mustard)','pitch'],[1290,356,116,140,'var(--navy)','flat'],
    [1452,330,70,166,'var(--blush)','step']
  ];
  blds.forEach(([x,y,w,hh,c,roof])=>{
    paint(x,y,w,hh,c,mid);
    boxOutline(x,y,w,hh,{w:1.2,amt:1.6,g:mid,op:.9});
    if(roof==='pitch'){
      el('path',{d:d_poly([[x-9,y],[x+w/2,y-30],[x+w+9,y]],true),fill:'var(--terracotta)',class:'paint'},mid);
      sketch([[x-9,y],[x+w/2,y-30],[x+w+9,y]],{w:1.1,amt:1.1,g:mid});
    } else if(roof==='step'){
      paint(x+12,y-16,w-24,17,c,mid);
      sketch([[x+12,y-16],[x+w-12,y-16]],{w:1.1,amt:1,g:mid});
      sketch([[x-6,y],[x+w+6,y]],{w:1.2,amt:1,g:mid});
    } else {
      sketch([[x-7,y],[x+w+7,y]],{w:1.2,amt:1,g:mid});          // parapet lip
    }
    const cols=Math.max(2,w/32|0), rows=Math.max(2,hh/48|0);
    for(let cx=0;cx<cols;cx++) for(let ry=0;ry<rows;ry++){
      if(rnd()<0.4) continue;
      const wx=x+11+cx*(w-18)/cols, wy=y+16+ry*(hh-28)/rows;
      el('rect',{x:wx.toFixed(1),y:wy.toFixed(1),width:9,height:12,class:'lamp',rx:1},mid);
      el('rect',{x:(wx-4).toFixed(1),y:(wy-4).toFixed(1),width:17,height:20,class:'glow',rx:5},mid);
    }
  });

  /* ---------- observation tower ---------- */
  const OX=1000, OT=250;
  paint(OX-10,OT+38,20,GROUND-OT-38,'var(--cobalt)',mid);
  sketch([[OX-10,OT+38],[OX-10,GROUND]],{w:1.2,amt:.9,g:mid});
  sketch([[OX+10,OT+38],[OX+10,GROUND]],{w:1.2,amt:.9,g:mid});
  for(let i=1;i<5;i++) sketch([[OX-10,OT+38+i*44],[OX+10,OT+38+i*44]],{w:.7,amt:.6,g:mid,op:.45,passes:1});
  paint(OX-46,OT,92,38,'var(--mustard)',mid);
  boxOutline(OX-46,OT,92,38,{w:1.2,amt:1.3,g:mid});
  sketch([[OX-53,OT+38],[OX+53,OT+38]],{w:1.3,amt:.9,g:mid});
  for(let i=-3;i<=3;i++) sketch([[OX+i*14,OT],[OX+i*14,OT+13]],{w:.7,amt:.4,g:mid,op:.55,passes:1});
  sketch([[OX,OT],[OX,OT-32]],{w:1.1,amt:.7,g:mid});
  el('path',{d:d_poly([[OX,OT-32],[OX+23,OT-26],[OX,OT-19]],true),fill:'var(--rust)',class:'paint'},mid);
  [-28,-9,10,29].forEach(dx=>{
    el('rect',{x:OX+dx,y:OT+16,width:9,height:12,class:'lamp',rx:1},mid);
    el('rect',{x:OX+dx-4,y:OT+12,width:17,height:20,class:'glow',rx:5},mid);
  });

  /* ---------- rollercoaster ---------- */
  const track=[[1130,364],[1200,326],[1300,300],[1420,302],[1520,332],[1590,394],
               [1652,462],[1722,436],[1800,362],[1880,360],[1938,414],[1948,472],
               [1900,506],[1808,516],[1660,514],[1500,510],[1350,508],[1240,506],
               [1160,492],[1112,462],[1096,414]];
  track.forEach((p,i)=>{ if(i%2===0 && p[1]<GROUND-20) line(p[0],p[1],p[0]+R(-6,6),GROUND,{w:.9,amt:1.4,g:mid,op:.5}) });
  el('path',{d:d_loop(track),fill:'none',stroke:'var(--terracotta)','stroke-width':15,
    'stroke-linecap':'round','stroke-linejoin':'round',class:'paint'},mid);
  coasterPath=el('path',{d:d_loop(track),fill:'none',stroke:'var(--rust)','stroke-width':2.2,
    opacity:.85,'stroke-linecap':'round'},mid);
  for(let i=0;i<3;i++){                              // cars only — riders would invert on the loop
    const g=el('g',{},front);
    el('path',{d:d_poly(edges([[-16,-8],[16,-8],[16,8],[-16,8]],2,1.2),true),
      fill:i?'var(--navy)':'var(--rust)',class:'paint'},g);
    sketch([[-16,-8],[16,-8],[16,8],[-16,8],[-16,-8]],{w:1,amt:.7,g:g,sharp:true});
    el('circle',{cx:0,cy:-13,r:2.8,class:'lamp'},g);
    el('circle',{cx:0,cy:-13,r:11,class:'glow'},g);
    carEls.push(g);
  }

  /* ---------- merry-go-round (front layer, flat elevation) ---------- */
  const MX=650, MY=482, MRX=112, DRUM=44, TOP=MY-98;
  const carG=el('g',{},front);
  paint(MX-MRX,MY+2,MRX*2,14,'var(--terracotta)',carG);
  paint(MX-MRX,MY-9,MRX*2,13,'var(--field)',carG);
  sketch([[MX-MRX-5,MY-9],[MX+MRX+5,MY-9]],{w:1.2,amt:1,g:carG});
  carBackG=el('g',{},carG);
  paint(MX-DRUM,TOP,DRUM*2,MY-TOP-6,'var(--blush)',carG);
  sketch([[MX-DRUM,TOP],[MX+DRUM,TOP],[MX+DRUM,MY-6],[MX-DRUM,MY-6],[MX-DRUM,TOP]],
    {w:1,amt:1.1,g:carG,sharp:true});
  carFrontG=el('g',{},carG);
  const APEX=TOP-74, CRX=MRX+10;
  el('path',{d:d_poly([[MX-CRX,TOP],[MX,APEX],[MX+CRX,TOP]],true),fill:'var(--field)',class:'paint'},carG);
  ['var(--cobalt)','var(--rust)','var(--mustard)'].forEach((cc,k)=>{
    for(let i=k;i<9;i+=3){
      const x0=MX-CRX+(i/9)*CRX*2, x1=MX-CRX+((i+1)/9)*CRX*2;
      el('path',{d:d_poly([[MX,APEX],[x0,TOP],[x1,TOP]],true),fill:cc,class:'paint',opacity:.55},carG);
    }
  });
  sketch([[MX-CRX,TOP],[MX,APEX],[MX+CRX,TOP]],{w:1.2,amt:1.2,g:carG});
  sketch([[MX-CRX,TOP],[MX+CRX,TOP]],{w:1.1,amt:1,g:carG});
  for(let i=0;i<11;i++){
    const x0=MX-CRX+(i/11)*CRX*2, x1=MX-CRX+((i+1)/11)*CRX*2;
    sketch([[x0,TOP],[(x0+x1)/2,TOP+9],[x1,TOP]],{w:.9,amt:.7,g:carG,op:.7,passes:1});
  }
  el('path',{d:d_poly([[MX-11,APEX],[MX,APEX-22],[MX+11,APEX]],true),fill:'var(--rust)',class:'paint'},carG);
  el('circle',{cx:MX,cy:APEX-24,r:3.4,class:'lamp'},carG);
  el('circle',{cx:MX,cy:APEX-24,r:13,class:'glow'},carG);
  el('ellipse',{cx:MX,cy:MY+16,rx:MRX+34,ry:20,class:'pool'},carG);
  for(let i=0;i<10;i++){
    const g=el('g',{class:'mu'},carFrontG);
    sketch([[0,-100],[0,6]],{w:1.05,amt:.5,g:g,passes:1});
    const hc=i%2?'var(--rust)':'var(--blush)';
    // horse drawn facing left (-x), the way the near side of the ring travels;
    // hg flips on the far side so every mount still leads with its head
    const hg=el('g',{},g);
    el('path',{d:d_poly(edges([[14,-32],[-12,-32],[-14,-17],[12,-17]],2,1.3),true),fill:hc,class:'paint'},hg);
    el('path',{d:d_poly([[-9,-33],[-21,-42],[-25,-34],[-14,-25]],true),fill:hc,class:'paint'},hg);
    [[9,-17],[-7,-17]].forEach(([lx,ly])=>sketch([[lx,ly],[lx+2,-4]],{w:1.1,amt:.4,g:hg,passes:1}));
    el('circle',{cx:-1,cy:-42,r:3.6,fill:'var(--navy)',class:'paint'},hg);
    el('circle',{cx:0,cy:-96,r:2.2,class:'lamp'},g);
    g._h=hg;
    carUnits.push(g);
  }

  /* ---------- triangle umbrellas — and they light the crowd at night ---------- */
  const UMB=[[356,'var(--rust)'],[476,'var(--green)'],[880,'var(--terracotta)'],
             [1096,'var(--rust)'],[1340,'var(--green)'],[1600,'var(--terracotta)'],[1830,'var(--cobalt)']];
  UMB.forEach(([ux,uc])=>{
    const uy=GROUND+R(30,58), r=R(38,52);
    el('ellipse',{cx:ux,cy:uy+14,rx:r*2.1,ry:20,class:'pool'},front);     // pool of lamplight
    el('path',{d:d_poly([[ux-r,uy],[ux,uy-r*0.82],[ux+r,uy]],true),fill:uc,class:'paint'},front);
    sketch([[ux-r,uy],[ux,uy-r*0.82],[ux+r,uy]],{w:1.1,amt:1.2,g:front,sharp:true});
    sketch([[ux,uy],[ux,uy+18]],{w:1,amt:.7,g:front,op:.75,passes:1});
    el('circle',{cx:ux,cy:uy-2,r:2.8,class:'lamp'},front);
    el('circle',{cx:ux,cy:uy-2,r:14,class:'glow'},front);
    for(let k=0;k<R(2,5)|0;k++){                                          // people gathered under it
      const px=ux+R(-r*1.7,r*1.7), py=uy+R(6,20), ph=R(9,14);
      el('path',{d:d_from([[px,py],[px,py-ph]],false),class:'figure lit',
        'stroke-width':R(3,4.6).toFixed(1),'stroke-linecap':'round',fill:'none'},front);
    }
  });

  /* ---------- pavilion ---------- */
  paint(250,528,250,66,'var(--blush)',front);
  boxOutline(250,528,250,66,{w:1.2,amt:1.6,g:front});
  paint(478,524,32,70,'var(--rust)',front);

  /* ---------- the rest of the crowd ---------- */
  for(let i=0;i<30;i++){
    const x=R(170,1900), y=R(GROUND+16,GROUND+100), hh=R(9,15);
    el('path',{d:d_from([[x,y],[x,y-hh]],false),class:'figure',
      'stroke-width':R(3,4.6).toFixed(1),'stroke-linecap':'round',fill:'none'},front);
  }
}

/* ---- animation ---------------------------------------------- */
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(t){
  if(motion && !reduce){
    tick=t/1000;
    // wheel turns; cabins counter-rotate so they hang level
    const ang=tick*7;
    wheelG.setAttribute('transform','rotate('+ang+' 300 256)');
    wheelG.querySelectorAll('.cab').forEach(c=>{
      if(c._cx===undefined){ const b=c.getBBox(); c._cx=b.x+b.width/2; c._cy=b.y+b.height/2; }
      c.setAttribute('transform','rotate('+(-ang)+' '+c._cx+' '+c._cy+')');
    });
    // merry-go-round: flat elevation; far-side units simply pass behind the drum
    for(let i=0;i<carUnits.length;i++){
      const g=carUnits[i];
      const a=tick*0.85 + i/carUnits.length*Math.PI*2;
      const front=Math.sin(a)>0;
      // flat elevation: no perspective scale, no vertical arc — just travel + bob
      const x=650+Math.cos(a)*112, y=482+Math.sin(tick*2.4+i)*4;
      g.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');
      // the horse turns about its pole rather than snapping: scaleX eases through 0
      // over a short arc at each end, where the horse reads edge-on
      const sn=Math.sin(a), TURN=.3;
      const t=Math.max(-1,Math.min(1,sn/TURN)), u=Math.abs(t);
      const e=u*u*(3-2*u);                                 // smoothstep, so it eases in and out
      g._h.setAttribute('transform','scale('+(t<0?-e:e).toFixed(3)+',1)');
      const want=front?carFrontG:carBackG;
      if(g._p!==want){ want.appendChild(g); g._p=want; }   // swap depth only on crossing,
    }                                                      // where the turn hides it
    // cars run the track
    if(coasterPath){
      const L=coasterPath.getTotalLength();
      carEls.forEach((g,i)=>{
        const d=((tick*0.075+i*0.028)%1)*L;
        const p=coasterPath.getPointAtLength(d);
        const q=coasterPath.getPointAtLength((d+9)%L);
        const a=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
        g.setAttribute('transform','translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+') rotate('+a.toFixed(1)+')');
      });
    }
  }
  requestAnimationFrame(frame);
}
if(new URLSearchParams(location.search).get('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');document.getElementById('theme').textContent='LIGHT MODE';}



  build();
  requestAnimationFrame(frame);
  return {
    get seed(){ return SEED; },
    redraw(s){ SEED = (s!==undefined) ? s : (SEED*31+17)%9973; build(); return SEED; },
    setMotion(v){ motion=!!v; },
    rebuild: build
  };
}
