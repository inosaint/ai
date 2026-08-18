#!/usr/bin/env node
/* Tiny dev server: serves the static site and accepts annotations from annotate.js.
   Comments land in annotations.json, which the agent reads directly.
   Usage: node dev-server.js [port] */
const http=require('http'), fs=require('fs'), path=require('path');
const ROOT=__dirname, PORT=+(process.argv[2]||8765), STORE=path.join(ROOT,'annotations.json');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon',
 '.webp':'image/webp','.mov':'video/quicktime','.mp4':'video/mp4','.webm':'video/webm',
 '.woff2':'font/woff2','.woff':'font/woff'};

const read=()=>{ try{ return JSON.parse(fs.readFileSync(STORE,'utf8')); }catch(e){ return []; } };
const write=d=>fs.writeFileSync(STORE,JSON.stringify(d,null,2));

function body(req){return new Promise(res=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>res(b));});}

http.createServer(async (req,res)=>{
  const u=new URL(req.url,'http://localhost');
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
              'Access-Control-Allow-Headers':'Content-Type'};
  if(req.method==='OPTIONS'){res.writeHead(204,cors);return res.end();}

  if(u.pathname==='/__annotations'){
    if(req.method==='GET'){
      res.writeHead(200,{...cors,'Content-Type':'application/json'});
      return res.end(JSON.stringify(read()));
    }
    if(req.method==='POST'){
      const a=JSON.parse(await body(req)||'{}');
      const all=read();
      a.id=a.id||('a'+Date.now().toString(36)+Math.random().toString(36).slice(2,5));
      a.created=new Date().toISOString();
      a.status=a.status||'open';
      all.push(a); write(all);
      console.log(`\n  ✎ #${all.length} [${a.page||'?'}] ${a.target||''}\n    "${a.text}"`);
      res.writeHead(200,{...cors,'Content-Type':'application/json'});
      return res.end(JSON.stringify({ok:true,id:a.id,count:all.length}));
    }
    if(req.method==='DELETE'){
      const id=u.searchParams.get('id');
      const all=read().filter(x=>x.id!==id); write(all);
      console.log(`  ✕ removed ${id} (${all.length} left)`);
      res.writeHead(200,{...cors,'Content-Type':'application/json'});
      return res.end(JSON.stringify({ok:true,count:all.length}));
    }
  }

  let p=decodeURIComponent(u.pathname); if(p==='/') p='/index-new.html';
  const file=path.join(ROOT,p);
  if(!file.startsWith(ROOT)){res.writeHead(403);return res.end('forbidden');}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('not found: '+p);}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(file).toLowerCase()]||'application/octet-stream',
                       'Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(PORT,()=>{
  console.log(`\n  dev server  →  http://localhost:${PORT}/`);
  console.log(`  annotations →  ${STORE}`);
  console.log(`  press A on the page to start annotating\n`);
});
