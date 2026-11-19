// Checks the built site in dist/: unique titles/descriptions, one H1, internal links, nav, placeholders.
const fs = require('fs'), path = require('path'), assert = require('assert'); const D = path.join(__dirname, '..', 'dist');
const files = []; (function walk(d) { fs.readdirSync(d).forEach(f => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); }); })(D);
const titles = new Set(), descs = new Set(); let problems = [], links = 0;
files.forEach(f => {
  const h = fs.readFileSync(f, 'utf8'), rel = path.relative(D, f), t = (h.match(/<title>(.*?)<\/title>/) || [])[1], d = (h.match(/<meta name="description" content="(.*?)"/) || [])[1];
  if (!t || titles.has(t)) problems.push(rel + ': missing/duplicate title'); titles.add(t);
  if (!d || descs.has(d)) problems.push(rel + ': missing/duplicate description'); descs.add(d);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) problems.push(rel + ': needs exactly one h1');
  if (/example\.com|Lorem|TODO/i.test(h)) problems.push(rel + ': placeholder text');
  if (rel !== '404.html' && !/<details>/.test(h) && /healthy-weight|bmi-calc|protein|weight-progress|body-meas|waist/.test(rel) ) problems.push(rel + ': no FAQ');
  (h.match(/(?:href|src)="([^"#]+)"/g) || []).forEach(m => {
    const u = m.replace(/^(href|src)="/, '').replace(/"$/, ''); if (/^(https?:|mailto:|data:)/.test(u)) return; links++;
    let target = u.startsWith('/') ? path.join(D, u) : path.resolve(path.dirname(f), u); if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) problems.push(rel + ': broken link ' + u);
  });
  if (rel !== '404.html' && (h.match(/class="main"[\s\S]*?<\/nav>/)[0].match(/<li>/g) || []).length !== 6) problems.push(rel + ': nav must list six tools');
});
['robots.txt', '404.html', 'assets/css/style.css', 'assets/js/app.js', 'assets/js/core.js'].forEach(x => fs.existsSync(path.join(D, x)) || problems.push('missing ' + x));
assert.equal(files.length, 13, 'expected 13 html pages, got ' + files.length);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('site checks passed: ' + files.length + ' pages, ' + links + ' internal links checked, titles/descriptions unique');
