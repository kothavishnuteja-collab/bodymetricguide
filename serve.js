// Tiny local preview server (no dependencies): node serve.js  -> http://localhost:8080
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, 'dist'), types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, ''); let f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': types['.html'] }); return res.end(fs.readFileSync(path.join(root, '404.html'))); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(8080, () => console.log('Preview running at http://localhost:8080  (press Ctrl+C to stop)'));
