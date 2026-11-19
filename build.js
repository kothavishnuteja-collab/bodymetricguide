// Builds the static site into /dist. Run: node build.js   (no packages to install)
const fs = require('fs'), path = require('path');
const cfg = require('./site.config.js'), SITE = cfg.SITE_URL.replace(/\/$/, ''), NAME = cfg.SITE_NAME;
const { tools, pages } = require('./src/content.js');
const guides = require('./src/guides.js');
const OUT = path.join(__dirname, 'dist');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ICON = { 'healthy-weight': 'M12 3v18M5 8h14M5 8l-3 7a3 3 0 006 0zM19 8l-3 7a3 3 0 006 0z', 'bmi-calculator': 'M4 20V10M10 20V4M16 20v-7M22 20H2', 'waist-to-height': 'M12 2v20M8 5l4-3 4 3M8 19l4 3 4-3M4 10h16M4 14h16', 'protein-calculator': 'M5 12a7 7 0 1114 0 7 7 0 01-14 0zM9 12h6', 'weight-progress': 'M3 17l6-6 4 4 8-9M15 6h6v6', 'body-measurements': 'M3 8h18v8H3zM7 8v4M11 8v3M15 8v4M19 8v3' };
const icon = s => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[s]}"/></svg>`;
const logo = '<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1f4d3a"/><path d="M7 21h18M9 21v-4M13 21v-3M17 21v-4M21 21v-3M16 8v7M12 12l4-4 4 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1f4d3a"/><path d="M7 21h18M16 8v7M12 12l4-4 4 4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>');

function layout(p, body, ldjson) {
  const b = p.base, href = s => b + s, canon = SITE && !p.noindex ? SITE + p.url : '';
  const nav = tools.map(t => `<li><a href="${href(t.slug + '/')}"${p.slug === t.slug ? ' aria-current="page"' : ''}>${t.nav}</a></li>`).join('') + `<li><a href="${href('guides/')}"${p.guides ? ' aria-current="page"' : ''}>Guides</a></li>`;
  const foot = pages.filter(x => x.footer).map(x => `<li><a href="${href(x.slug + '/')}">${x.nav}</a></li>`).join(''), ftools = tools.map(t => `<li><a href="${href(t.slug + '/')}">${t.nav}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.desc)}">
${p.noindex ? '<meta name="robots" content="noindex">' : ''}${canon ? `<link rel="canonical" href="${canon}">` : ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="${NAME}"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}">${canon ? `<meta property="og:url" content="${canon}">` : ''}
${SITE && !p.noindex ? `<meta property="og:image" content="${SITE}/assets/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/assets/og-image.png">` : '<meta name="twitter:card" content="summary">'}<meta name="theme-color" content="#1f4d3a"><link rel="icon" href="${favicon}">
<link rel="stylesheet" href="${href('assets/css/style.css')}">${ldjson ? `<script type="application/ld+json">${JSON.stringify(ldjson)}</script>` : ''}
</head><body><a class="skip" href="#main">Skip to main content</a>
<header class="site"><div class="wrap bar"><a class="brand" href="${href('')}">${logo}${NAME}</a><nav class="main" aria-label="Main"><ul>${nav}</ul></nav></div></header>
<main id="main">${body}</main>
<footer class="site"><div class="wrap"><div class="fcols"><div><p class="fbrand">${NAME}</p><p>Simple, private calculators for body measurements and everyday fitness planning. Calculations run in your browser.</p></div><div><p class="fh">Calculators</p><ul>${ftools}</ul></div><div><p class="fh">Learn and information</p><ul><li><a href="${href('guides/')}">Guides</a></li>${foot}</ul></div></div><p class="fine">${NAME} offers general educational calculators for adults. It is not a medical service and does not give medical advice. See the <a href="${href('medical-disclaimer/')}">medical disclaimer</a>.</p><p class="fine">&copy; ${new Date().getFullYear()} ${NAME}. Last updated ${cfg.LAST_UPDATED}.</p></div></footer>
<script src="${href('assets/js/core.js')}" defer></script><script src="${href('assets/js/app.js')}" defer></script></body></html>`;
}
const faqHtml = f => `<section class="band" aria-labelledby="faq"><h2 id="faq">Frequently asked questions</h2>${f.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>`;
const faqLd = f => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
const ad = '<!-- Reserved for future advertising. Intentionally empty: no ads are displayed. Keep clear of calculator buttons. --><aside class="adslot" aria-label="Advertisement space"></aside>';
const disclaimer = b => `<div class="note" role="note"><p><strong>Educational estimates only.</strong> Results are not medical advice, a diagnosis, or a treatment plan. Talk to a qualified healthcare professional about your health. <a href="${b}medical-disclaimer/">Read the full medical disclaimer</a>.</p></div>`;

function toolPage(t) {
  const b = '../', rel = t.related.map(s => tools.find(x => x.slug === s)).map(r => `<a class="card" href="${b}${r.slug}/"><h3>${r.nav}</h3><p>${r.short}</p></a>`).join('');
  const body = `<div class="wrap"><section class="hero tool-hero"><h1>${t.h1}</h1><p class="lead">${t.intro}</p></section>
${disclaimer(b)}${t.form}
<section aria-labelledby="how"><h2 id="how">How to use this calculator</h2><ol>${t.how.map(x => `<li>${x}</li>`).join('')}</ol></section>
<section aria-labelledby="formula"><h2 id="formula">The formulas</h2>${t.formula}</section>
${t.more || ''}${t.guide ? `<p class="readmore">Want more detail? Read the guide: <a href="${b}guides/${t.guide[0]}/">${t.guide[1]}</a>.</p>` : ''}${ad}${faqHtml(t.faq)}
${t.refs.length ? `<section aria-labelledby="refs"><h2 id="refs">Sources and further reading</h2><ul class="refs">${t.refs.map(([n, u]) => `<li><a href="${u}" rel="noopener" target="_blank">${n}</a></li>`).join('')}</ul></section>` : ''}
<section aria-labelledby="related"><h2 id="related">Related tools</h2><div class="grid">${rel}</div></section></div>`;
  return layout({ ...t, base: b, url: '/' + t.slug + '/' }, body, faqLd(t.faq));
}
const guideCards = b => guides.map(g => `<a class="card" href="${b}guides/${g.slug}/"><h3>${g.nav}</h3><p>${g.desc}</p></a>`).join('');
function home() {
  const b = '', cards = tools.map(t => `<a class="card tool-card" href="${t.slug}/">${icon(t.slug)}<h3>${t.nav}</h3><p>${t.short}</p><span class="go">Open calculator</span></a>`).join('');
  const H = pages.find(x => x.slug === ''), q = [['What weight range matches my height?', 'healthy-weight'], ['What is my BMI?', 'bmi-calculator'], ['Is my waist small enough for my height?', 'waist-to-height'], ['How much protein might I need?', 'protein-calculator'], ['How much has my weight changed?', 'weight-progress'], ['I want to keep a private log.', 'body-measurements']];
  const body = `<div class="wrap"><section class="hero hero-home"><div><h1>Understand Your Body. Make Informed Choices.</h1><p class="lead">Simple, practical calculators for body measurements, healthy weight ranges, and everyday fitness planning.</p><p><a class="btn" href="#calculators">Explore Calculators</a> <a class="btn alt" href="guides/">Read the guides</a></p><ul class="trust"><li>No sign-up</li><li>Metric and imperial</li><li>Private: runs in your browser</li></ul></div><aside class="startcard" aria-labelledby="start"><h2 id="start">Start with a question</h2><ul>${q.map(([t, s]) => `<li><a href="${s}/">${t}</a></li>`).join('')}</ul></aside></section><div class="ruler" aria-hidden="true"></div>
<section class="band" id="calculators" aria-labelledby="calcs"><h2 id="calcs">Six calculators</h2><div class="grid">${cards}</div></section>
<section class="band" aria-labelledby="how"><h2 id="how">How it works</h2><ol><li>Pick a calculator and choose metric (kg, cm) or imperial (lb, feet, inches).</li><li>Enter your numbers. Friendly messages tell you if something looks wrong.</li><li>Read your estimate and the explanation of what it can and cannot tell you.</li></ol></section>
<section class="band" aria-labelledby="learn"><h2 id="learn">Learn before you measure</h2><p>Short, plain-English guides on what the numbers mean and where they fall short.</p><div class="grid">${guideCards(b)}</div></section>
<section class="band split"><div aria-labelledby="priv"><h2 id="priv">Privacy first</h2>${H.privacy}</div><div aria-labelledby="lim"><h2 id="lim">What these tools cannot do</h2>${H.limits}</div></section>${ad}${faqHtml(H.faq)}</div>`;
  return layout({ ...H, base: b, url: '/', slug: '' }, body, faqLd(H.faq));
}
function guidePage(g) {
  const b = '../../', rel = g.related.map(s => tools.find(x => x.slug === s)).map(r => `<a class="card" href="${b}${r.slug}/"><h3>${r.nav}</h3><p>${r.short}</p></a>`).join('');
  const body = `<div class="wrap"><article class="article"><header class="hero tool-hero"><h1>${g.h1}</h1><p class="lead">${g.intro}</p></header>${disclaimer(b)}${g.sections.map(([h, t]) => `<h2>${h}</h2>${t}`).join('')}<h2>Sources and further reading</h2><ul class="refs">${g.refs.map(([n, u]) => `<li><a href="${u}" rel="noopener" target="_blank">${n}</a></li>`).join('')}</ul></article>${ad}<section aria-labelledby="related"><h2 id="related">Related calculators</h2><div class="grid">${rel}</div></section></div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.desc, datePublished: '2026-11-19', dateModified: '2026-11-19', author: { '@type': 'Organization', name: NAME }, publisher: { '@type': 'Organization', name: NAME } };
  return layout({ ...g, base: b, url: '/guides/' + g.slug + '/', guides: true }, body, ld);
}
function guideHub() {
  const b = '../', body = `<div class="wrap"><section class="hero tool-hero"><h1>Guides</h1><p class="lead">Plain-English explanations to help you understand what your results mean, and what they do not.</p></section><h2>All guides</h2><div class="grid">${guideCards(b)}</div>${ad}<section class="band"><h2>Calculators</h2><div class="grid">${tools.map(t => `<a class="card" href="${b}${t.slug}/"><h3>${t.nav}</h3><p>${t.short}</p></a>`).join('')}</div></section></div>`;
  return layout({ title: 'Health Calculator Guides | ' + NAME, desc: 'Educational guides on BMI, waist-to-height ratio, protein needs and tracking body measurements, with links to the matching calculators.', base: b, url: '/guides/', slug: 'guides', guides: true }, body);
}
function plain(p) {
  const b = p.slug ? '../' : '', body = `<div class="wrap"><section class="hero" style="padding-bottom:1rem"><h1>${p.h1}</h1></section><div class="prose">${typeof p.body === 'function' ? p.body(cfg) : p.body}</div></div>`;
  return layout({ ...p, base: b, url: '/' + p.slug + '/' }, body);
}
const write = (f, c) => { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), c); };
write('index.html', home());
tools.forEach(t => write(t.slug + '/index.html', toolPage(t)));
write('guides/index.html', guideHub());
guides.forEach(g => write('guides/' + g.slug + '/index.html', guidePage(g)));
pages.filter(p => p.slug).forEach(p => write(p.slug + '/index.html', plain(p)));
write('404.html', layout({ title: 'Page not found | ' + NAME, desc: 'The page you requested could not be found.', base: '/', url: '/404.html', slug: '404', noindex: true }, '<div class="wrap"><section class="hero"><h1>Page not found</h1><p class="lead">That page does not exist or has moved.</p><p><a class="btn" href="/">Go to the homepage</a></p></section></div>'));
if (fs.existsSync(path.join(__dirname, '_headers'))) fs.copyFileSync(path.join(__dirname, '_headers'), path.join(OUT, '_headers'));
fs.cpSync(path.join(__dirname, 'assets'), path.join(OUT, 'assets'), { recursive: true });
const urls = ['/'].concat(tools.map(t => '/' + t.slug + '/'), ['/guides/'], guides.map(g => '/guides/' + g.slug + '/'), pages.filter(p => p.slug).map(p => '/' + p.slug + '/'));
if (SITE) write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n${SITE ? `\nSitemap: ${SITE}/sitemap.xml\n` : '\n# Add a Sitemap line here after setting SITE_URL in site.config.js\n'}`);
console.log('Built ' + (urls.length + 1) + ' pages into dist/' + (SITE ? '' : '  (SITE_URL empty: no canonical tags or sitemap.xml)'));
