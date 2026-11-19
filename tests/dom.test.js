// OPTIONAL browser-like test using jsdom (a simulated browser, NOT a real one). Setup: npm install jsdom --no-save ; run 'node serve.js' in one terminal, then 'node tests/dom.test.js' in another.
const { JSDOM } = require('jsdom'), path = require('path'), assert = require('assert'); const D = path.join(__dirname, '..', 'dist');
async function open(p, confirms) {
  const errors = []; const dom = await JSDOM.fromURL('http://localhost:8080/' + p + '/', { runScripts: 'dangerously', resources: 'usable', beforeParse(w) { w.confirm = () => confirms === undefined ? true : confirms; w.addEventListener('error', e => errors.push(e.message)); w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () { w.__downloaded = this.download; }; } });
  await new Promise(r => dom.window.addEventListener('load', r)); dom.errors = errors; return dom;
}
const set = (d, f, o) => { for (const k in o) { const el = f.elements[k]; el.value = o[k]; } };
const submit = (d, f) => f.dispatchEvent(new d.window.Event('submit', { cancelable: true, bubbles: true }));
let n = 0; const ok = m => { n++; console.log('ok -', m); };
(async () => {
  let d = await open('bmi-calculator'), f = d.window.document.querySelector('form'), out = f.querySelector('.result');
  set(d, f, { age: '30', cm: '175', weight: '70' }); submit(d, f); assert(out.textContent.includes('22.9') && out.textContent.includes('Healthy weight range')); ok('BMI metric 70kg/175cm -> 22.9');
  f.elements.units.value = 'imperial'; f.elements.units.dispatchEvent(new d.window.Event('change')); set(d, f, { ft: '5', in: '9', weight: '154.3' }); submit(d, f); assert(/22\.[89]/.test(out.textContent)); ok('BMI imperial 5ft9 / 154.3lb -> ~22.8');
  set(d, f, { age: '17' }); submit(d, f); assert(f.querySelector('.err-msg').textContent.includes('Age') && out.textContent === ''); ok('BMI rejects age 17');
  set(d, f, { age: '30', ft: '', weight: '0' }); submit(d, f); assert(f.querySelector('.err-msg').textContent.includes('Height') && f.querySelector('.err-msg').textContent.includes('Weight')); ok('BMI rejects blank height and zero weight');
  f.dispatchEvent(new d.window.Event('reset')); await new Promise(r => setTimeout(r, 20)); assert(f.querySelector('.err-msg').hidden); ok('reset clears errors'); assert.deepEqual(d.errors, []);
  d = await open('healthy-weight'); f = d.window.document.querySelector('form'); set(d, f, { age: '40', cm: '170' }); submit(d, f); const t = f.querySelector('.result').textContent; assert(t.includes('53.5 – 72.0 kg') && t.includes('117.9 – 158.6 lb')); ok('Healthy range 170cm = 53.5–72.0 kg / 117.9–158.6 lb');
  d = await open('waist-to-height'); f = d.window.document.querySelector('form'); set(d, f, { cm: '170', waist: '96.5' }); submit(d, f); assert(f.querySelector('.result').textContent.includes('0.57')); ok('WHtR 96.5/170 -> 0.57');
  set(d, f, { waist: '400' }); submit(d, f); assert(!f.querySelector('.err-msg').hidden); ok('WHtR rejects waist 400');
  d = await open('protein-calculator'); f = d.window.document.querySelector('form'); set(d, f, { weight: '70', goal: 'strength' }); submit(d, f); assert(f.querySelector('.result').textContent.includes('84 – 112 g')); f.elements.wunit.value = 'lb'; set(d, f, { weight: '154.32', goal: 'general' }); submit(d, f); assert(f.querySelector('.result').textContent.includes('56 g')); ok('Protein 70kg strength 84–112 g; 154.32lb general 56 g');
  d = await open('weight-progress'); f = d.window.document.querySelector('form'); set(d, f, { start: '80', current: '76', goal: '72', d1: '2026-01-01', d2: '2026-01-29' }); submit(d, f); let r = f.querySelector('.result').textContent; assert(r.includes('-4.0 kg (-5.0%)') && r.includes('-1.0 kg per week') && r.includes('28 days')); ok('Progress -4kg, -5%, -1 kg/week, 28 days');
  set(d, f, { d2: '2025-01-01' }); submit(d, f); assert(f.querySelector('.err-msg').textContent.includes('on or after')); ok('Progress rejects reversed dates');
  d = await open('body-measurements'); let doc = d.window.document; f = doc.querySelector('form[data-tracker]');
  const add = o => { set(d, f, o); submit(d, f); };
  add({ date: '2026-01-01', weight: '80', waist: '90', hips: '100', chest: '105', notes: 'start' }); add({ date: '2026-02-01', weight: '78', waist: '88', hips: '99', chest: '104', notes: '=cmd' });
  assert.equal(doc.querySelectorAll('#rec-list tr').length, 2); assert(doc.querySelector('#latest').textContent.includes('78.0 kg')); assert(doc.querySelector('#chart polyline')); ok('Tracker add x2, latest + chart shown');
  assert.equal(JSON.parse(d.window.localStorage.getItem('bmg_records_v1')).length, 2); ok('Tracker saved to localStorage');
  doc.querySelector('[data-edit]').click(); assert.equal(f.elements.weight.value, '78.0'); f.elements.weight.value = '77.5'; submit(d, f); assert(doc.querySelector('#latest').textContent.includes('77.5 kg') && doc.querySelectorAll('#rec-list tr').length === 2); ok('Tracker edit saves changes without duplicating');
  doc.querySelector('#export-btn').click(); assert.equal(d.window.__downloaded, 'bodymetricguide-records.csv'); ok('Tracker CSV export triggers download');
  const before = d.window.localStorage.getItem('bmg_records_v1'); add({ date: '2026-03-01', weight: '0', waist: '', hips: 'x', chest: '-1' }); assert.equal(d.window.localStorage.getItem('bmg_records_v1'), before); ok('Tracker rejects invalid record');
  doc.querySelector('[data-del]').click(); assert.equal(doc.querySelectorAll('#rec-list tr').length, 1); ok('Tracker delete works');
  doc.querySelector('#clear-btn').click(); assert.equal(doc.querySelectorAll('#rec-list tr').length, 0); ok('Tracker clear all works after confirmation');
  d = await open('body-measurements', false); doc = d.window.document; f = doc.querySelector('form[data-tracker]'); add({ date: '2026-01-01', weight: '80', waist: '90', hips: '100', chest: '105' }); doc.querySelector('#clear-btn').click(); assert.equal(doc.querySelectorAll('#rec-list tr').length, 1); ok('Clear all cancelled when confirmation declined');
  assert.deepEqual(d.errors, []); console.log(n + ' DOM tests passed (jsdom simulation, no JavaScript errors)');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
