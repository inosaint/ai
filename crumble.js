/* Hover crumble — the tile's paint breaks into its category mark and drifts off,
   revealing the project's image underneath.

   Only two tiles are ever live: the one under the cursor and the one fading out
   behind it. That keeps the fragment shader's work independent of how many
   projects are on the page, and needs two textures rather than an atlas.

   Usage: const c = initCrumble(canvas, hostEl); c.enter(tileEl); c.leave(tileEl); */
function initCrumble(canvas, host){
  if(!canvas||!host) return null;
  const CAN_CLIP = typeof CSS!=='undefined' && CSS.supports &&
    (CSS.supports('clip-path','path("M0 0L1 1Z")') ||
     CSS.supports('-webkit-clip-path','path("M0 0L1 1Z")'));
  if(!CAN_CLIP) console.warn('[crumble] clip-path: path() unsupported — crumble disabled');
  if(!CAN_CLIP) return null;
  const gl=canvas.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:true});
  if(!gl){ console.warn('[crumble] no WebGL; tiles stay flat'); return null; }

  const KIND={app:0,game:1,event:2,exploration:3,visualization:4};
  const VERT='attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }';
  const FRAG=[
  '#ifdef GL_FRAGMENT_PRECISION_HIGH','precision highp float;','#else',
  'precision mediump float;','#endif',
  'uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;',
  'uniform vec4 u_card[2]; uniform float u_kind[2]; uniform float u_hover[2];',
  'uniform vec3 u_tint[2]; uniform float u_hasImg[2]; uniform vec2 u_mouseB;',
  'uniform float u_aspect[2];',      // texture width/height, for the cover fit
  'uniform sampler2D u_tex0; uniform sampler2D u_tex1;',
  'uniform vec3 u_paper; uniform vec3 u_ink;',
  'uniform float u_cell,u_reach,u_drift,u_dpr,u_wob;',
  'uniform float u_seed[2];',

  'float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b;',
  '  return length(max(d,0.0))+min(max(d.x,d.y),0.0); }',
  'vec2 rot(vec2 p,float a){ float c=cos(a),s=sin(a); return vec2(c*p.x-s*p.y,s*p.x+c*p.y); }',
  'float hp(vec2 p, vec2 a, vec2 n){ return dot(p-a,n); }',   // not `half` — reserved
  'float sdTri(vec2 p, float r){',
  '  r=max(r,1e-4);',                                          // r=0 would NaN the normalize
  '  float hh=r*1.02;',
  '  vec2 A=vec2(0.0,hh), B=vec2(r,-hh*0.72), C=vec2(-r,-hh*0.72);',
  '  vec2 nAB=normalize(vec2(A.y-B.y,B.x-A.x));',
  '  vec2 nBC=normalize(vec2(B.y-C.y,C.x-B.x));',
  '  vec2 nCA=normalize(vec2(C.y-A.y,A.x-C.x));',
  '  float d=hp(p,A,nAB); d=max(d,hp(p,B,nBC)); return max(d,hp(p,C,nCA)); }',
  'float sdShape(int k, vec2 p, float r){',
  '  if(k==0) return sdBox(p,vec2(r*0.82));',
  '  if(k==1) return length(p)-r*0.9;',
  '  if(k==2) return sdTri(p,r);',
  '  if(k==3) return sdBox(rot(p,0.7853981634),vec2(r*0.7778));',
  '  return min(sdBox(p,vec2(r*0.35,r*1.1)), sdBox(p,vec2(r*1.1,r*0.35))); }',
  'float hash1(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
  'vec2  hash2(vec2 p){ return vec2(hash1(p),hash1(p+vec2(37.7,11.3))); }',
  'float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
  '  return mix(mix(hash1(i),hash1(i+vec2(1,0)),f.x),',
  '             mix(hash1(i+vec2(0,1)),hash1(i+vec2(1,1)),f.x),f.y); }',
  'float bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0+a.y*a.y*0.75); }',
  'float bayer4(vec2 a){ return bayer2(0.5*a)*0.25+bayer2(a); }',

  'void main(){',
  '  vec2 p=gl_FragCoord.xy; vec3 col=vec3(0.0); float alpha=0.0;',
  '  for(int i=0;i<2;i++){',
  '    float hov=u_hover[i]; if(hov<=0.001) continue;',
  '    vec4 R=u_card[i];',
  '    if(p.x<R.x||p.x>R.x+R.z||p.y<R.y||p.y>R.y+R.w) continue;',
  '    int kind=int(u_kind[i]); vec3 tint=u_tint[i];',
  '    vec2 lp=p-R.xy, uv2=vec2(lp.x/R.z, lp.y/R.w);',

  '    vec2 m=(i==0?u_mouse:u_mouseB)-R.xy;',

  // cover-fit: fill the block and crop the overflow, rather than stretching a
  // 16:9 screenshot into a square
  '    float ta=R.z/R.w;',
  '    float ia=max(u_aspect[i],0.0001);',
  '    vec2 iuv=uv2;',
  '    if(ia>ta) iuv.x=0.5+(uv2.x-0.5)*(ta/ia);',   // wider than the block: crop the sides
  '    else      iuv.y=0.5+(uv2.y-0.5)*(ia/ta);',   // taller: crop top and bottom
  '    iuv=clamp(iuv,0.0,1.0);',
  '    vec3 img = (i==0) ? texture2D(u_tex0,iuv).rgb : texture2D(u_tex1,iuv).rgb;',
  '    float w=hash1(floor(uv2*90.0));',
  '    vec3 wash=mix(tint*1.06, tint*0.86, w);',           // if no image, its own colour deepened
  '    vec3 under=mix(wash, img, u_hasImg[i]);',
  '    vec3 sheet=tint;',                                   // the flat block, as CSS paints it

  '    float CS=u_cell*u_dpr;',
  '    vec2 cid=floor(lp/CS);',
  '    float reach=u_reach*length(R.zw)*hov;',
  '    float band=CS*3.2;',
  '    float dith=(bayer4(cid)*0.82+hash1(cid)*0.18)*0.62+0.19;',
  '    float pg=clamp((reach-length((cid+0.5)*CS-m))/band - dith + 0.5, 0.0, 1.0);',

  '    float cov=0.0;',
  '    for(int oy=-2;oy<=2;oy++){ for(int ox=-2;ox<=2;ox++){',
  '      vec2 nid=cid+vec2(float(ox),float(oy)), ncc=(nid+0.5)*CS;',
  '      float dN=(bayer4(nid)*0.82+hash1(nid)*0.18)*0.62+0.19;',
  '      float pr=clamp((reach-length(ncc-m))/band - dN + 0.5, 0.0, 1.0);',
  '      if(pr<=0.001||pr>=0.999) continue;',
  '      vec2 rn=hash2(nid)*2.0-1.0;',
  '      vec2 dir=normalize(ncc-m+rn*CS*0.6);',
  '      float e=pr*pr;',
  '      vec2 off=dir*e*CS*u_drift + vec2(0.0, e*CS*u_drift*0.85);',
  '      float sz=CS*0.62*(1.0-pr*0.75)*(0.72+hash1(nid+7.3)*0.56);',
  '      float sd=sdShape(kind, rot(lp-(ncc+off), rn.x*pr*2.2), sz);',
  '      cov=max(cov, (1.0-smoothstep(-1.0,1.0,sd))*(1.0-pr*0.9));',
  '    }}',

  '    float sdHole=sdShape(kind, lp-(cid+0.5)*CS, max(CS*0.86*pg,1e-4));',
  '    float hole=(pg<=0.0)?0.0:(1.0-smoothstep(-1.0,1.0,sdHole));',
  '    hole=max(hole, smoothstep(0.72,1.0,pg));',
  '    vec3 c=mix(under, sheet, 1.0-hole);',
  '    c=mix(c, sheet, cov);',
  '    float rim=1.0-smoothstep(0.0,1.6,abs(sdHole)-0.6);',
  '    c=mix(c, mix(c,u_ink,0.20), rim*step(0.02,pg)*(1.0-smoothstep(0.72,1.0,pg)));',
  '    c+=(hash1(p+fract(u_time)*13.0)-0.5)*0.018;',
  '    col=c; alpha=1.0;',
  '  }',
  '  gl_FragColor=vec4(col*alpha, alpha);',
  '}'].join('\n');

  function compile(t,src){ const s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s; }
  let prog;
  try{
    prog=gl.createProgram();
    gl.attachShader(prog,compile(gl.VERTEX_SHADER,VERT));
    gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  }catch(e){ console.error('[crumble] shader:',e.message); return null; }
  gl.useProgram(prog);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);

  const U=n=>gl.getUniformLocation(prog,n);
  const u={res:U('u_res'),time:U('u_time'),mouse:U('u_mouse'),mouseB:U('u_mouseB'),
    card:U('u_card[0]'),kind:U('u_kind[0]'),hover:U('u_hover[0]'),tint:U('u_tint[0]'),
    hasImg:U('u_hasImg[0]'),tex0:U('u_tex0'),tex1:U('u_tex1'),paper:U('u_paper'),ink:U('u_ink'),
    aspect:U('u_aspect[0]'),
    cell:U('u_cell'),reach:U('u_reach'),drift:U('u_drift'),dpr:U('u_dpr'),
    wob:U('u_wob'),seed:U('u_seed[0]')};

  // the saved feel: grain 14, drift 2.0; reach 1.0 so the reveal actually completes
  const state={cell:14, reach:1.0, drift:2.0, wob:2.0};
  const hover=new Float32Array(2), want=new Float32Array(2);
  const rects=new Float32Array(8), kinds=new Float32Array(2);
  const tints=new Float32Array(6), hasImg=new Float32Array(2);
  const aspects=new Float32Array([1,1]);
  const slotEl=[null,null], mouse=[[-1e4,-1e4],[-1e4,-1e4]];
  const seeds=new Float32Array(2);
  const texs=[gl.createTexture(),gl.createTexture()];
  let dpr=1, hostRect=null, raf=0;

  texs.forEach(t=>{
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  });

  const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v);
  const parseCol=s=>{
    s=(s||'').trim();
    let m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s);
    if(m) return [parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255];
    m=/rgba?\(([^)]+)\)/.exec(s);
    if(m){ const q=m[1].split(',').map(Number); return [q[0]/255,q[1]/255,q[2]/255]; }
    return [.5,.5,.5];
  };

  const cache=new Map();                         // LRU, capped: decoded bitmaps are
  const CACHE_MAX=8;                             // far heavier than the files on disk
  const media=[null,null];                       // what each slot is sampling
  function remember(src, obj){
    cache.delete(src); cache.set(src,obj);
    while(cache.size>CACHE_MAX){
      const oldest=cache.keys().next().value;
      if(slotEl.some(e=>e&&e.dataset.img===oldest)) break;   // never evict a live slot
      const gone=cache.get(oldest);
      if(gone&&gone.tagName==='VIDEO'){ gone.pause(); gone.removeAttribute('src'); gone.load(); }
      cache.delete(oldest);
    }
  }
  /* 1024 was below what a retina screen actually asks for: the largest tile
     (data-w 4, five of twelve columns) is ~660 CSS px on a 16" laptop, which is
     1320 device px at dpr 2 and more on an external display. Capping at 1024
     upscaled the texture and read as blur. The assets are now exported at their
     display size, so this only guards against something oversized slipping in. */
  const MAXTEX=Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048);
  function fit(src){
    const w=src.naturalWidth||src.videoWidth||0, h=src.naturalHeight||src.videoHeight||0;
    if(!w||!h||Math.max(w,h)<=MAXTEX) return src;
    const k=MAXTEX/Math.max(w,h);
    const c=document.createElement('canvas');
    c.width=Math.round(w*k); c.height=Math.round(h*k);
    c.getContext('2d').drawImage(src,0,0,c.width,c.height);
    return c;
  }
  const isVideo=src=>/\.(mp4|mov|webm|m4v|ogv)$/i.test(src||'');

  function upload(slot, src){
    // the natural size decides the crop; a video only knows it once it has metadata
    const w=src.naturalWidth||src.videoWidth||0, h=src.naturalHeight||src.videoHeight||0;
    if(w&&h) aspects[slot]=w/h;
    try{
      gl.bindTexture(gl.TEXTURE_2D,texs[slot]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,
        src.tagName==='VIDEO'?src:fit(src));
      hasImg[slot]=1;
      return true;
    }catch(e){
      // file:// makes every asset cross-origin, which taints the upload; the tile
      // then reveals its own colour instead of the screenshot
      hasImg[slot]=0;
      console.warn('[crumble] media blocked ('+e.message+') — serve over http://');
      return false;
    }
  }

  function loadImage(slot, el){
    const src=el.dataset.img;
    hasImg[slot]=0; media[slot]=null; aspects[slot]=1;
    if(!src) return;

    if(isVideo(src)){
      let v=cache.get(src);
      if(!v){
        v=document.createElement('video');
        v.muted=true; v.loop=true; v.playsInline=true; v.preload='auto';
        v.crossOrigin='anonymous';
        v.addEventListener('error',()=>console.warn('[crumble] video failed:',src));
        v.src=src;
        remember(src,v);
      }
      media[slot]={kind:'video', el:v, src};
      // a muted, inline video is allowed to play without a gesture
      const go=v.play(); if(go&&go.catch) go.catch(()=>{});
      return;
    }

    let im=cache.get(src);
    if(im && im.complete && im.naturalWidth){
      remember(src,im);
      media[slot]={kind:'image', el:im, src}; upload(slot,im); return;
    }
    if(!im){
      im=new Image(); im.crossOrigin='anonymous';
      im.onerror=()=>console.warn('[crumble] image failed:',src);
      remember(src,im); im.src=src;
    }
    media[slot]={kind:'image', el:im, src};
    im.addEventListener('load',()=>{
      if(media[slot]&&media[slot].src===src) upload(slot,im);
    },{once:true});
    if(im.complete && im.naturalWidth) upload(slot,im);
  }

  function setSlot(slot, el){
    slotEl[slot]=el;
    kinds[slot]=KIND[el.dataset.cat]!==undefined?KIND[el.dataset.cat]:0;
    const c=parseCol(getComputedStyle(el).getPropertyValue('--t-bg')||css(el.dataset.tint||'--g-teal'));
    tints[slot*3]=c[0]; tints[slot*3+1]=c[1]; tints[slot*3+2]=c[2];
    seeds[slot]=(el.dataset.seed!==undefined?+el.dataset.seed:Math.random()*40);
    loadImage(slot, el);
    measureSlot(slot);
  }
  function measureSlot(slot){
    const el=slotEl[slot]; if(!el||!hostRect) return;
    const r=el.getBoundingClientRect();
    rects[slot*4]  =(r.left-hostRect.left)*dpr;
    rects[slot*4+1]=(hostRect.bottom-r.bottom)*dpr;
    rects[slot*4+2]=r.width*dpr;
    rects[slot*4+3]=r.height*dpr;
  }
  /* Clip the canvas to the live tiles' own outlines. Without this the shader
     paints a rectangle while the tile is drawn as a wobbly shape, and the two
     edges disagree — which reads as the border distorting on hover. path()
     takes several subpaths, so both slots fit in one clip. */
  function updateClip(){
    if(!hostRect) return;
    const subs=[];
    for(let i=0;i<2;i++){
      const el=slotEl[i];
      if(!el || hover[i]<=0.003 || !el._clip) continue;
      const r=el.getBoundingClientRect();
      const ox=r.left-hostRect.left, oy=r.top-hostRect.top;
      subs.push('M'+el._clip.map(q=>
        (q[0]+ox).toFixed(1)+' '+(q[1]+oy).toFixed(1)).join('L')+'Z');
    }
    const want=subs.length?'path("'+subs.join(' ')+'")':'none';
    if(canvas._clip!==want){
      canvas.style.clipPath=want;
      canvas.style.webkitClipPath=want;      // Safari still wants the prefix
      canvas._clip=want;
    }
  }

  function measure(){
    hostRect=host.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(hostRect.width*dpr)), h=Math.max(1,Math.round(hostRect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,w,h);
    measureSlot(0); measureSlot(1);
    updateClip();
  }

  host.addEventListener('pointermove',e=>{
    if(!hostRect) return;
    mouse[0]=[(e.clientX-hostRect.left)*dpr, (hostRect.bottom-e.clientY)*dpr];
  });

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0=performance.now();
  function frame(now){
    let live=false;
    for(let i=0;i<2;i++){
      const k=want[i]>hover[i]?0.15:0.20;      // let go faster than it takes hold
      hover[i]+=(want[i]-hover[i])*k;
      if(Math.abs(want[i]-hover[i])<0.004) hover[i]=want[i];
      const on=hover[i]>0.003;
      if(on) live=true;
      // toggled here, not on pointerleave: the class and the drawing have to stop
      // in the same frame or the canvas paints over the tile's own title
      const el=slotEl[i];
      if(el) el.classList.toggle('hot', on);
    }
    updateClip();
    gl.useProgram(prog);
    gl.uniform2f(u.res,canvas.width,canvas.height);
    gl.uniform1f(u.time,reduce?8.0:(now-t0)/1000);
    gl.uniform2f(u.mouse,mouse[0][0],mouse[0][1]);
    gl.uniform2f(u.mouseB,mouse[1][0],mouse[1][1]);
    gl.uniform4fv(u.card,rects); gl.uniform1fv(u.kind,kinds);
    gl.uniform1fv(u.hover,hover); gl.uniform3fv(u.tint,tints);
    gl.uniform1fv(u.hasImg,hasImg); gl.uniform1fv(u.aspect,aspects);
    const paper=parseCol(css('--paper')), ink=parseCol(css('--ink'));
    gl.uniform3f(u.paper,paper[0],paper[1],paper[2]);
    gl.uniform3f(u.ink,ink[0],ink[1],ink[2]);
    gl.uniform1f(u.cell,state.cell); gl.uniform1f(u.reach,state.reach);
    gl.uniform1f(u.drift,state.drift); gl.uniform1f(u.dpr,dpr);
    gl.uniform1f(u.wob,state.wob); gl.uniform1fv(u.seed,seeds);
    for(let i=0;i<2;i++){
      const m=media[i];
      if(!m||m.kind!=='video') continue;
      if(hover[i]<=0.003){ if(!m.el.paused) m.el.pause(); continue; }
      if(m.el.paused){ const g=m.el.play(); if(g&&g.catch) g.catch(()=>{}); }
      if(m.el.readyState>=2) upload(i, m.el);    // HAVE_CURRENT_DATA
    }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texs[0]); gl.uniform1i(u.tex0,0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,texs[1]); gl.uniform1i(u.tex1,1);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    if(live) gl.drawArrays(gl.TRIANGLES,0,3);
    // idle out completely once nothing is hovered or fading; enter() wakes it
    if(!live && !want[0] && !want[1]){ raf=0; return; }
    raf=requestAnimationFrame(frame);
  }
  function kick(){ if(!raf) raf=requestAnimationFrame(frame); }

  /* Safari discards WebGL contexts aggressively — on tab switch, memory pressure,
     or too many live contexts. The tile hides its own fill while hot and trusts
     the canvas to paint it, so a lost context used to leave a blank square.
     Losing the context now simply switches the crumble off. */
  canvas.addEventListener('webglcontextlost', e=>{
    e.preventDefault();
    host.classList.remove('crumble-ok');
    slotEl.forEach(el=>el && el.classList.remove('hot'));
    want[0]=want[1]=hover[0]=hover[1]=0;
    cancelAnimationFrame(raf); raf=0;
    console.warn('[crumble] WebGL context lost — tiles fall back to flat colour');
  });
  canvas.addEventListener('webglcontextrestored', ()=>{
    console.warn('[crumble] WebGL context restored');
    location.reload();          // simplest correct recovery: rebuild everything
  });

  host.classList.add('crumble-ok');

  /* ---------- idle prefetch ----------
     loadImage() used to be the first thing that ever asked for the file, so the
     first hover of every tile paid the whole network round trip before any
     image appeared. Warm the browser's HTTP cache while it is idle instead;
     hover then only costs the decode and the texture upload.

     Deliberately NOT written into `cache`: that LRU holds eight entries because
     decoded bitmaps are heavy, and pushing 36 through it would just evict the
     ones we wanted. These Images are dropped for the GC to collect once the
     bytes have landed — the HTTP cache is what we are actually filling.

     Nearest the viewport first, one at a time, so the grid's own paint keeps
     the connection and the main thread. Videos are skipped: they are megabytes
     each and stream on demand anyway. */
  (function warmMedia(){
    const idle = window.requestIdleCallback || (fn=>setTimeout(()=>fn({timeRemaining:()=>16}),200));
    const seen=new Set(), queue=[];
    host.querySelectorAll('.tile').forEach(t=>{
      const src=t.dataset.img;
      if(!src || isVideo(src) || seen.has(src)) return;
      seen.add(src); queue.push({src, el:t});
    });
    if(!queue.length) return;
    const mid=window.innerHeight/2;
    queue.sort((a,b)=>{
      const da=Math.abs(a.el.getBoundingClientRect().top-mid);
      const db=Math.abs(b.el.getBoundingClientRect().top-mid);
      return da-db;
    });
    let i=0;
    const next=()=>{
      if(i>=queue.length) return;
      const {src}=queue[i++];
      const im=new Image();
      im.decoding='async';
      // fetch only — the reference goes out of scope once it has loaded
      im.onload=im.onerror=()=>idle(next);
      im.src=src;
    };
    idle(next);
  })();
  measure(); kick();

  return {
    state, measure,
    enter(el, centre){
      kick();
      if(slotEl[0]===el){ want[0]=1; return; }
      /* Whatever is in slot 1 is about to be evicted. The frame loop only ever
         clears .hot for tiles still held in a slot, so an evicted tile kept the
         class forever — its fill stayed hidden with nothing left to paint it,
         leaving a blank square. Sweeping across tiles quickly evicted several at
         once, which is exactly when the blanks appeared. */
      if(slotEl[1] && slotEl[1]!==el && slotEl[1]!==slotEl[0])
        slotEl[1].classList.remove('hot');
      // belt and braces: nothing outside the two slots may stay hot
      host.querySelectorAll('.tile.hot').forEach(t=>{
        if(t!==el && t!==slotEl[0] && t!==slotEl[1]) t.classList.remove('hot');
      });
      // push the current tile into the second slot so it can fade out behind
      slotEl[1]=slotEl[0]; hover[1]=hover[0]; want[1]=0; mouse[1]=mouse[0].slice();
      rects.copyWithin(4,0,4); kinds[1]=kinds[0]; hasImg[1]=hasImg[0]; seeds[1]=seeds[0];
      aspects[1]=aspects[0];
      tints[3]=tints[0]; tints[4]=tints[1]; tints[5]=tints[2];
      const tmp=texs[0]; texs[0]=texs[1]; texs[1]=tmp;
      media[1]=media[0];
      hover[0]=0; want[0]=1;
      setSlot(0, el);
      if(centre && hostRect){
        const r=el.getBoundingClientRect();
        mouse[0]=[(r.left+r.width/2-hostRect.left)*dpr,
                  (hostRect.bottom-(r.top+r.height/2))*dpr];
      }
    },
    leave(el){ if(slotEl[0]===el) want[0]=0; if(slotEl[1]===el) want[1]=0; kick(); },
    destroy(){ cancelAnimationFrame(raf); }
  };
}
