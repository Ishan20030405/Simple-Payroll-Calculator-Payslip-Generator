const http=require('node:http');
process.title='HR Frontend - localhost:3000';
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
if(!fs.existsSync(path.join(root,'index.html')))throw Error('Frontend build missing. Run npm run build after installing frontend dependencies.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 let file=path.resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
  if(path.extname(pathname)){res.writeHead(404);return res.end();}
  file=path.join(root,'index.html');
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':file.includes(path.sep+'assets'+path.sep)?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD')return res.end();
 fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
}).listen(3000,'127.0.0.1',()=>console.log('Frontend ready: http://localhost:3000'));
