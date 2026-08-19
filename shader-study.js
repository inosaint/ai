/* Shader study — project cards that crumble around the cursor.

   Hovering a card dissolves a patch of its surface near the pointer: cells break
   off as tiny category marks, drift outward and up, shrink and fade, revealing a
   pastel wash underneath. The dissolve boundary is ordered-dithered, so it breaks
   up in a Bayer pattern rather than as a clean circle.

   One canvas sits behind the whole card grid — the cards' rects are passed in as
   uniforms, so this scales to a real project list without one context per card.
   The icon, title and category label are ordinary DOM on top and stay readable.

   Usage: initShaderStudy(canvas, cardEls, opts) */
function initShaderStudy(canvas, cards, opts){
  opts=opts||{};
  const stage=canvas.parentElement;
  function fail(msg){
    stage.classList.add('no-webgl');
    stage.setAttribute('data-error',msg);
    console.error('[shader-study] '+msg);
  }
  const gl=canvas.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:true});
  if(!gl){ fail('WebGL is unavailable in this browser'); return null; }

  const N=cards.length;
  const KIND={app:0,game:1,event:2,exploration:3,visualization:4};

  const VERT='attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }';

  const FRAG=[
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform vec2  u_res;',
  'uniform float u_time;',
  'uniform vec2  u_mouse;',
  'uniform vec4  u_card['+N+'];',    // x,y,w,h in device px (y up)
  'uniform float u_kind['+N+'];',
  'uniform float u_hover['+N+'];',
  'uniform vec3  u_tint['+N+'];',
  'uniform vec3  u_paper;',
  'uniform vec3  u_ink;',
  'uniform float u_cell;',           // cell size in px
  'uniform float u_reach;            // dissolve radius, fraction of card height',
  'uniform float u_drift;            // how far a piece travels, in cells',
  'uniform float u_dither;           // 0 = smooth edge, 1 = full ordered dither',
  'uniform float u_dpr;',
  'uniform sampler2D u_atlas;',
  'uniform vec4  u_uv['+N+'];',      // this card's tile in the atlas: x,y,w,h
  'uniform float u_hasImg['+N+'];',
  'uniform float u_imgMix;',         // how much image vs pastel wash

  /* ---- shapes: box + rotation + union only, all sign-safe. The triangle is the
     one exception and the one that bit last time, so its normals are explicit. ---- */
  'float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b;',
  '  return length(max(d,0.0))+min(max(d.x,d.y),0.0); }',
  'vec2 rot(vec2 p, float a){ float c=cos(a), s=sin(a);',
  '  return vec2(c*p.x-s*p.y, s*p.x+c*p.y); }',
  // must not be named `half` — reserved word in GLSL ES 1.00
  'float hp(vec2 p, vec2 a, vec2 n){ return dot(p-a,n); }',
  'float sdTri(vec2 p, float r){',
  // r=0 would normalize() zero-length vectors -> NaN, and NaN through smoothstep
  // silently reads as fully-inside. An intact cell asks for exactly r=0.
  '  r=max(r,1e-4);',
  '  float hh=r*1.02;',
  '  vec2 A=vec2(0.0,hh), B=vec2(r,-hh*0.72), C=vec2(-r,-hh*0.72);',
  '  vec2 nAB=normalize(vec2(A.y-B.y, B.x-A.x));',   // outward for this winding
  '  vec2 nBC=normalize(vec2(B.y-C.y, C.x-B.x));',
  '  vec2 nCA=normalize(vec2(C.y-A.y, A.x-C.x));',
  '  float d=hp(p,A,nAB); d=max(d,hp(p,B,nBC)); return max(d,hp(p,C,nCA)); }',
  'float sdShape(int kind, vec2 p, float r){',
  '  if(kind==0) return sdBox(p, vec2(r*0.82));',
  '  if(kind==1) return length(p)-r*0.9;',
  '  if(kind==2) return sdTri(p, r);',
  '  if(kind==3) return sdBox(rot(p,0.7853981634), vec2(r*0.7778));',
  '  return min(sdBox(p, vec2(r*0.35,r*1.1)), sdBox(p, vec2(r*1.1,r*0.35))); }',

  'float hash1(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
  'vec2  hash2(vec2 p){ return vec2(hash1(p), hash1(p+vec2(37.7,11.3))); }',
  'float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
  '  return mix(mix(hash1(i),hash1(i+vec2(1,0)),f.x),',
  '             mix(hash1(i+vec2(0,1)),hash1(i+vec2(1,1)),f.x),f.y); }',

  /* ---- ordered dither. bayer2 nested gives a 4x4 Bayer matrix without an array,
     which GLSL ES 1.00 could not index dynamically anyway. ---- */
  'float bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }',
  'float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }',

  /* ---- pastel: the palette lifted towards paper, the way a wash sits on stock ---- */
  'vec3 pastel(vec3 c, float k){ return mix(c, vec3(1.0), k); }',

  'void main(){',
  '  vec2 p=gl_FragCoord.xy;',
  '  vec3 col=u_paper; float alpha=0.0;',

  '  for(int i=0;i<'+N+';i++){',
  '    vec4 R=u_card[i];',
  '    if(p.x<R.x || p.x>R.x+R.z || p.y<R.y || p.y>R.y+R.w) continue;',
  '    alpha=1.0;',
  '    int kind=int(u_kind[i]);',
  '    vec3 tint=u_tint[i];',
  '    float hov=u_hover[i];',
  '    vec2 lp=p-R.xy;',                       // local px within the card

  /* the wash underneath, and the sheet of paint covering it */
  '    vec2 uv=lp/R.w;',
  '    vec2 uv2=vec2(lp.x/R.z, lp.y/R.w);',
  '    float w1=vnoise(uv*2.6+vec2(u_time*0.05,-u_time*0.04));',
  '    float w2=vnoise(uv*6.0-vec2(u_time*0.03, u_time*0.05));',
  '    vec3 washA=pastel(tint,0.30), washB=pastel(tint,0.62);',
  '    vec3 under=mix(washA,washB,w1*0.75+w2*0.25);',
  '    under=mix(under,pastel(tint,0.80),smoothstep(0.35,1.0,w2)*0.35);',
  // the project image, if one loaded — tiles are pre-cropped to the card ratio in
  // JS, so this is a straight linear map with no cover-fit maths in the shader
  '    vec4 T=u_uv[i];',
  '    vec2 auv=T.xy + clamp(uv2,0.0,1.0)*T.zw;',
  '    vec3 img=texture2D(u_atlas,auv).rgb;',
  '    img=mix(img, pastel(tint,0.55), 0.10);',      // a breath of the palette over it
  '    under=mix(under, img, u_hasImg[i]*u_imgMix);',
  '    vec3 sheet=mix(u_paper,pastel(tint,0.72),0.55);',

  /* per-cell dissolve. A cell is a square of u_cell px; its progress runs 0..1 as
     the dissolve front sweeps past, offset per cell by the dither so the boundary
     crumbles instead of cutting. */
  '    float CS=u_cell*u_dpr;',
  '    vec2 cid=floor(lp/CS);',
  '    float reach=u_reach*length(R.zw)*hov;',
  '    float band=CS*3.2;',
  '    vec2 m=u_mouse-R.xy;',

  '    float dOwn=length((cid+0.5)*CS-m);',
  '    float dith=mix(0.5, (bayer4(cid)*0.82+hash1(cid)*0.18)*0.62+0.19, u_dither);',
  '    float progOwn=clamp((reach-dOwn)/band - dith + 0.5, 0.0, 1.0);',
  '    progOwn*=step(0.001,hov);',

  /* pieces from the neighbourhood, since a cell's piece drifts over its neighbours */
  '    float cov=0.0; vec3 pieceCol=sheet;',
  '    for(int oy=-2;oy<=2;oy++){',
  '      for(int ox=-2;ox<=2;ox++){',
  '        vec2 nid=cid+vec2(float(ox),float(oy));',
  '        vec2 ncc=(nid+0.5)*CS;',
  '        float dN=length(ncc-m);',
  '        float dithN=mix(0.5, (bayer4(nid)*0.82+hash1(nid)*0.18)*0.62+0.19, u_dither);',
  '        float pr=clamp((reach-dN)/band - dithN + 0.5, 0.0, 1.0);',
  '        pr*=step(0.001,hov);',
  '        if(pr<=0.001 || pr>=0.999) continue;',   // intact, or long gone
  '        vec2 rnd=hash2(nid)*2.0-1.0;',
  '        vec2 dir=normalize(ncc-m+rnd*CS*0.6);',
  '        float e=pr*pr;',                          // ease: slow to let go, then away
  '        vec2 off=dir*e*CS*u_drift + vec2(0.0, e*CS*u_drift*0.85);',
  '        float sz=CS*0.62*(1.0-pr*0.75)*(0.72+hash1(nid+7.3)*0.56);',
  '        float sd=sdShape(kind, rot(lp-(ncc+off), rnd.x*pr*2.2), sz);',
  '        float mk=1.0-smoothstep(-1.0,1.0,sd);',
  '        cov=max(cov, mk*(1.0-pr*0.9));',
  '      }',
  '    }',

  '    vec2 occ=(cid+0.5)*CS;',
  '    float sdHole=sdShape(kind, lp-occ, max(CS*0.86*progOwn,1e-4));',
  '    float hole=(progOwn<=0.0) ? 0.0 : (1.0-smoothstep(-1.0,1.0,sdHole));',
  // past ~0.72 the cell clears completely, so the interior cannot keep a lattice
  // of leftover corners the shape never covers
  '    hole=max(hole, smoothstep(0.72,1.0,progOwn));',
  '    col=under;',
  '    col=mix(col, sheet, 1.0-hole);',
  '    col=mix(col, pieceCol, cov);',

  /* a hairline where the sheet is torn, so the break reads as an edge not a fade */
  '    float rim=1.0-smoothstep(0.0,1.6,abs(sdHole)-0.6);',
  '    col=mix(col, mix(col,u_ink,0.20), rim*step(0.02,progOwn)*(1.0-smoothstep(0.72,1.0,progOwn)));',

  '    col+=(hash1(p+fract(u_time)*13.0)-0.5)*0.020;',   // grain
  '  }',
  '  gl_FragColor=vec4(col*alpha, alpha);',
  '}'].join('\n');

  function compile(type,src){
    const s=gl.createShader(type);
    gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s)+'\n'+
        src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n'));
    return s;
  }
  let prog;
  try{
    prog=gl.createProgram();
    gl.attachShader(prog,compile(gl.VERTEX_SHADER,VERT));
    gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  }catch(e){
    fail('shader failed to compile — see the console');
    console.error('[shader-study]',e.message);
    return null;
  }
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 3,-1, -1,3]),gl.STATIC_DRAW);
  const aPos=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);

  const U=n=>gl.getUniformLocation(prog,n);
  const u={res:U('u_res'),time:U('u_time'),mouse:U('u_mouse'),paper:U('u_paper'),ink:U('u_ink'),
    cell:U('u_cell'),reach:U('u_reach'),drift:U('u_drift'),dither:U('u_dither'),dpr:U('u_dpr'),
    card:U('u_card[0]'),kind:U('u_kind[0]'),hover:U('u_hover[0]'),tint:U('u_tint[0]'),
    atlas:U('u_atlas'),uv:U('u_uv[0]'),hasImg:U('u_hasImg[0]'),imgMix:U('u_imgMix')};

  const hover=new Float32Array(N), want=new Float32Array(N);
  const rects=new Float32Array(N*4), kinds=new Float32Array(N), tints=new Float32Array(N*3);
  const uvs=new Float32Array(N*4), hasImg=new Float32Array(N);
  let mouse=[-1e4,-1e4], motion=true, raf=0, dpr=1;
  const state={cell:14, reach:1.0, drift:2.0, dither:1, imgMix:1};

  const hex2rgb=h=>{
    const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((h||'').trim());
    return m?[parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255]:[.5,.5,.5];
  };
  function readPalette(){
    const cs=getComputedStyle(document.documentElement);
    cards.forEach((el,i)=>{
      const c=hex2rgb(cs.getPropertyValue(el.dataset.tint||'--cobalt'));
      tints[i*3]=c[0]; tints[i*3+1]=c[1]; tints[i*3+2]=c[2];
      kinds[i]=KIND[el.dataset.cat]!==undefined?KIND[el.dataset.cat]:0;
    });
    const paper=hex2rgb(cs.getPropertyValue('--paper'));
    const ink=hex2rgb(cs.getPropertyValue('--ink'));
    gl.useProgram(prog);
    gl.uniform3f(u.paper,paper[0],paper[1],paper[2]);
    gl.uniform3f(u.ink,ink[0],ink[1],ink[2]);
    gl.uniform3fv(u.tint,tints);
    gl.uniform1fv(u.kind,kinds);
  }

  const TILE=512, RATIO=0.75;                 // tiles are 512x384, the card's 4:3
  const tex=gl.createTexture();
  function buildAtlas(){
    const cols=Math.ceil(Math.sqrt(N)), rows=Math.ceil(N/cols);
    const cv=document.createElement('canvas');
    cv.width=cols*TILE; cv.height=rows*Math.round(TILE*RATIO);
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,cv.width,cv.height);

    cards.forEach((el,i)=>{
      const cx=(i%cols)*TILE, cy=Math.floor(i/cols)*Math.round(TILE*RATIO);
      uvs[i*4]  = cx/cv.width;
      uvs[i*4+1]= 1-(cy+TILE*RATIO)/cv.height;   // atlas is uploaded flipped
      uvs[i*4+2]= TILE/cv.width;
      uvs[i*4+3]= (TILE*RATIO)/cv.height;
    });

    // Reading back a canvas that has had an image drawn into it throws
    // SecurityError when that image was cross-origin — which, on file://, means
    // every image. Degrade to the pastel wash and say why, rather than dying.
    let tainted=false;
    const upload=()=>{
      if(tainted) return;
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      try{
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
      }catch(e){
        tainted=true;
        for(let i=0;i<N;i++) hasImg[i]=0;
        gl.useProgram(prog); gl.uniform1fv(u.hasImg,hasImg);
        stage.setAttribute('data-warn',
          location.protocol==='file:'
            ? 'Images need a web server — open this over http, not file://'
            : 'Images could not be read into the shader (cross-origin)');
        stage.classList.add('tainted');
        console.warn('[shader-study] '+e.message+
          ' — serve the page over http:// so the project images can be used');
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.useProgram(prog);
      gl.uniform4fv(u.uv,uvs);
      gl.uniform1fv(u.hasImg,hasImg);
    };
    upload();

    cards.forEach((el,i)=>{
      const src=el.dataset.img; if(!src) return;
      const im=new Image();
      im.crossOrigin='anonymous';        // lets a CORS-enabled host stay untainted
      im.onload=()=>{
        const tw=TILE, th=Math.round(TILE*RATIO);
        const cx=(i%cols)*tw, cy=Math.floor(i/cols)*th;
        // cover-fit the crop here, so the shader needs no aspect maths
        const sc=Math.max(tw/im.width, th/im.height);
        const dw=im.width*sc, dh=im.height*sc;
        ctx.save(); ctx.beginPath(); ctx.rect(cx,cy,tw,th); ctx.clip();
        ctx.drawImage(im, cx+(tw-dw)/2, cy+(th-dh)/2, dw, dh);
        ctx.restore();
        hasImg[i]=1; upload();
      };
      im.onerror=()=>console.warn('[shader-study] image failed:',src);
      im.src=src;
    });
  }

  function measure(){
    const sb=stage.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(sb.width*dpr)), h=Math.max(1,Math.round(sb.height*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,w,h);
    cards.forEach((el,i)=>{
      const r=el.getBoundingClientRect();
      rects[i*4]  =(r.left-sb.left)*dpr;
      rects[i*4+1]=(sb.bottom-r.bottom)*dpr;     // GL y is up
      rects[i*4+2]=r.width*dpr;
      rects[i*4+3]=r.height*dpr;
    });
    canvas._sb=sb;
  }

  cards.forEach((el,i)=>{
    el.addEventListener('pointerenter',()=>{ want[i]=1; });
    el.addEventListener('pointerleave',()=>{ want[i]=0; });
    el.addEventListener('focus',()=>{ want[i]=1; centreOn(el); });
    el.addEventListener('blur',()=>{ want[i]=0; });
  });
  function centreOn(el){                        // keyboard has no pointer; use the middle
    const sb=canvas._sb||stage.getBoundingClientRect(), r=el.getBoundingClientRect();
    mouse=[(r.left+r.width/2-sb.left)*dpr, (sb.bottom-(r.top+r.height/2))*dpr];
  }
  stage.addEventListener('pointermove',e=>{
    const sb=canvas._sb||stage.getBoundingClientRect();
    mouse=[(e.clientX-sb.left)*dpr, (sb.bottom-e.clientY)*dpr];
  });

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0=performance.now();
  function frame(now){
    raf=requestAnimationFrame(frame);
    for(let i=0;i<N;i++){
      const k=want[i]>hover[i]?0.14:0.10;
      hover[i]+=(want[i]-hover[i])*k;
      if(Math.abs(want[i]-hover[i])<0.0008) hover[i]=want[i];
    }
    gl.useProgram(prog);
    gl.uniform2f(u.res,canvas.width,canvas.height);
    gl.uniform1f(u.time,(motion&&!reduce)?(now-t0)/1000:8.0);
    gl.uniform2f(u.mouse,mouse[0],mouse[1]);
    gl.uniform4fv(u.card,rects);
    gl.uniform1fv(u.hover,hover);
    gl.uniform1f(u.cell,state.cell);
    gl.uniform1f(u.reach,state.reach);
    gl.uniform1f(u.drift,state.drift);
    gl.uniform1f(u.dither,state.dither);
    gl.uniform1f(u.dpr,dpr);
    gl.uniform1f(u.imgMix,state.imgMix);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.uniform1i(u.atlas,0);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }

  readPalette(); buildAtlas(); measure(); raf=requestAnimationFrame(frame);
  const onResize=()=>measure();
  addEventListener('resize',onResize);
  addEventListener('scroll',onResize,{passive:true});

  return {
    state,
    setMotion(on){ motion=!!on; },
    refresh(){ readPalette(); measure(); },
    destroy(){ cancelAnimationFrame(raf); removeEventListener('resize',onResize);
               removeEventListener('scroll',onResize); }
  };
}
