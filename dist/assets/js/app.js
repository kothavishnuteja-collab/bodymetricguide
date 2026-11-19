/* Calculator and tracker behaviour. Needs core.js (window.BMG) loaded first. */
(function () {
  'use strict';
  var C = window.BMG, L = C.LIMITS;
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function f1(n) { return n.toFixed(1); }
  function showErrors(form, errs) {
    var box = $('.err-msg', form);
    if (!errs.length) { box.hidden = true; box.innerHTML = ''; return false; }
    box.hidden = false; box.innerHTML = '<p><strong>Please check your entries:</strong></p><ul>' + errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>'; box.focus(); return true;
  }
  // unit toggle: elements with data-unit="metric|imperial" show/hide based on the select[name=units]
  function applyUnits(form) {
    var u = $('[name=units]', form); if (!u) return;
    [].forEach.call(form.querySelectorAll('[data-unit]'), function (el) {
      var on = el.getAttribute('data-unit') === u.value; el.hidden = !on;
      [].forEach.call(el.querySelectorAll('input,select'), function (i) { i.disabled = !on; });
    });
  }
  function val(form, name) { var e = form.elements[name]; return e && !e.disabled ? e.value : ''; }
  // Each reader returns a value in metric, or null and pushes an error.
  function readHeight(form, errs, label) {
    label = label || 'Height';
    if (val(form, 'units') === 'imperial') {
      var ft = C.num(val(form, 'ft'), 1, 8), inch = C.num(val(form, 'in') === '' ? '0' : val(form, 'in'), 0, 11.99);
      if (ft === null || inch === null) { errs.push(label + ': enter feet (1–8) and inches (0–11.9).'); return null; }
      var cm = C.ftInToCm(ft, inch); if (cm < L.heightCm[0] || cm > L.heightCm[1]) { errs.push(label + ' looks unrealistic.'); return null; } return cm;
    }
    var h = C.num(val(form, 'cm'), L.heightCm[0], L.heightCm[1]); if (h === null) errs.push(label + ': enter a height between ' + L.heightCm[0] + ' and ' + L.heightCm[1] + ' cm.'); return h;
  }
  function readWeight(form, errs, name, label) {
    var imp = val(form, 'units') === 'imperial' || val(form, 'wunit') === 'lb';
    var raw = val(form, name), v = C.num(raw, imp ? 44 : 20, imp ? 1100 : 500);
    if (v === null) { errs.push(label + ': enter a weight between ' + (imp ? '44 and 1100 lb.' : '20 and 500 kg.')); return null; } return imp ? C.lbToKg(v) : v;
  }
  function readLen(form, errs, name, label) {
    var imp = val(form, 'units') === 'imperial', v = C.num(val(form, name), imp ? 8 : 20, imp ? 120 : 300);
    if (v === null) { errs.push(label + ': enter a value between ' + (imp ? '8 and 120 inches.' : '20 and 300 cm.')); return null; } return imp ? v * 2.54 : v;
  }
  function readAge(form, errs) { var a = C.num(val(form, 'age'), L.age[0], L.age[1]); if (a === null) errs.push('Age: enter a whole-number age from 18 to 120. These tools are for adults only.'); else if (a !== Math.floor(a)) { errs.push('Age: use a whole number.'); a = null; } return a; }
  function heightText(cm, form) { if (val(form, 'units') === 'imperial') { var x = C.cmToFtIn(cm); return Math.floor(x.ft) + ' ft ' + f1(x.inch) + ' in (' + f1(cm) + ' cm)'; } return f1(cm) + ' cm (' + Math.floor(C.cmToFtIn(cm).ft) + ' ft ' + f1(C.cmToFtIn(cm).inch) + ' in)'; }

  var tools = {
    'healthy-weight': function (form, out) {
      var e = []; readAge(form, e); var h = readHeight(form, e); if (showErrors(form, e)) { out.innerHTML = ''; return; }
      var r = C.healthyRange(h);
      out.innerHTML = '<p class="big">' + f1(r.lowKg) + ' – ' + f1(r.highKg) + ' kg</p><p class="big">' + f1(C.kgToLb(r.lowKg)) + ' – ' + f1(C.kgToLb(r.highKg)) + ' lb</p><p>Height entered: ' + esc(heightText(h, form)) + '.</p><p>This is a broad, BMI-based screening range (BMI 18.5–24.9) for adults. It is not an individualised ideal weight, and weights outside it are not automatically unhealthy.</p>';
    },
    'bmi': function (form, out) {
      var e = []; readAge(form, e); var h = readHeight(form, e), w = readWeight(form, e, 'weight', 'Weight'); if (showErrors(form, e)) { out.innerHTML = ''; return; }
      var b = C.bmi(w, h), pos = Math.max(0, Math.min(100, (b - 15) / 20 * 100));
      out.innerHTML = '<p class="big">BMI ' + f1(b) + '</p><p><strong>' + C.bmiCategory(b) + '</strong> (adult screening category)</p><div class="scale" role="img" aria-label="BMI position on a scale from 15 to 35"><i style="left:' + pos + '%"></i></div><div class="scale-labels"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35+</span></div><p>BMI is a screening measure. It does not measure body fat directly, cannot tell muscle from fat, and does not show where fat is stored. These categories are for adults and must not be used for children or teenagers.</p>';
    },
    'waist-to-height': function (form, out) {
      var e = []; var h = readHeight(form, e), w = readLen(form, e, 'waist', 'Waist'); if (!e.length && w >= h) e.push('Waist: this is not smaller than your height. Please check both values.'); if (showErrors(form, e)) { out.innerHTML = ''; return; }
      var r = C.whtr(w, h), band = C.whtrBand(r), pos = Math.max(0, Math.min(100, (r - 0.3) / 0.4 * 100));
      out.innerHTML = '<p class="big">Ratio ' + r.toFixed(2) + '</p><p><strong>' + band.label + '</strong></p><p>' + band.text + '</p><div class="scale" role="img" aria-label="Ratio position on a scale from 0.30 to 0.70"><i style="left:' + pos + '%"></i></div><div class="scale-labels"><span>0.30</span><span>0.40</span><span>0.50</span><span>0.60</span><span>0.70</span></div><p>A ratio of 0.5 is a practical screening threshold, not a diagnosis.</p>';
    },
    'protein': function (form, out) {
      var e = []; var kg = readWeight(form, e, 'weight', 'Body weight'); if (showErrors(form, e)) { out.innerHTML = ''; return; }
      var key = form.elements.goal.value, p = C.PROTEIN[key], r = C.protein(kg, key), same = p.lo === p.hi;
      out.innerHTML = '<p class="big">' + (same ? Math.round(r.lo) : Math.round(r.lo) + ' – ' + Math.round(r.hi)) + ' g per day</p><p>Calculation: ' + f1(kg) + ' kg × ' + (same ? p.lo : p.lo + '–' + p.hi) + ' g/kg/day (' + esc(p.label) + ').</p><p>This is a broad educational estimate, not a prescription. Protein needs can differ with age, health conditions, pregnancy, kidney disease and other circumstances. More protein is not always better. Ask a qualified professional if you have a medical condition.</p>';
    },
    'weight-progress': function (form, out) {
      var e = [], g = null; var s = readWeight(form, e, 'start', 'Starting weight'), c = readWeight(form, e, 'current', 'Current weight');
      if (val(form, 'goal').trim() !== '') g = readWeight(form, e, 'goal', 'Goal weight');
      var d1 = C.parseDate(val(form, 'd1')), d2 = C.parseDate(val(form, 'd2'));
      if (d1 === null) e.push('Start date: choose a valid date.'); if (d2 === null) e.push('Current date: choose a valid date.');
      if (d1 !== null && d2 !== null && d2 < d1) e.push('Current date must be on or after the start date.');
      if (showErrors(form, e)) { out.innerHTML = ''; return; }
      var r = C.progress(s, c, g, d1, d2), imp = val(form, 'wunit') === 'lb', k = imp ? C.kgToLb : function (x) { return x; }, u = imp ? 'lb' : 'kg', sign = function (n) { return (n > 0 ? '+' : '') + f1(n); };
      var html = '<p class="big">' + sign(k(r.change)) + ' ' + u + ' (' + sign(r.pct) + '%)</p><p>Time elapsed: ' + r.days + ' day' + (r.days === 1 ? '' : 's') + (r.days >= 7 ? ' (about ' + f1(r.days / 7) + ' weeks)' : '') + '.</p>';
      html += r.perWeek !== null ? '<p>Average change: ' + sign(k(r.perWeek)) + ' ' + u + ' per week. Short periods give unreliable averages because weight naturally varies day to day.</p>' : '<p>Choose different dates to see an average weekly change.</p>';
      if (g !== null) html += '<p>Difference from goal weight: ' + f1(Math.abs(k(r.toGoal))) + ' ' + u + (r.toGoal === 0 ? ' (at goal)' : r.toGoal < 0 ? ' lower than current' : ' higher than current') + '.</p>';
      out.innerHTML = html + '<p>This tool does not predict future weight. Gradual, sustainable habits tend to work better than quick fixes. If you have health concerns or want a plan, consider talking with a qualified healthcare professional.</p>';
    }
  };

  function initCalc(form) {
    var name = form.getAttribute('data-tool'), out = $('.result', form);
    applyUnits(form);
    var u = $('[name=units]', form); if (u) u.addEventListener('change', function () { applyUnits(form); });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); tools[name](form, out); });
    form.addEventListener('reset', function () { setTimeout(function () { out.innerHTML = ''; showErrors(form, []); applyUnits(form); }, 0); });
  }

  /* ---------- Body Measurement Tracker ---------- */
  var KEY = 'bmg_records_v1', recs = [], editing = null, view = 'weightKg';
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || '[]'); recs = Array.isArray(d) ? d : []; return true; } catch (x) { recs = []; return false; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(recs)); return true; } catch (x) { return false; } }
  function initTracker(form) {
    var unitSel = form.elements.units, list = $('#rec-list'), latest = $('#latest'), status = $('#tracker-status'), chart = $('#chart'), cform = form;
    var storageOk = load(); if (!storageOk) status.textContent = 'Browser storage is unavailable, so records cannot be saved in this browser.';
    form.elements.date.value = new Date().toISOString().slice(0, 10);
    function disp(kg, kind) { var imp = unitSel.value === 'imperial'; return kind === 'w' ? (imp ? f1(C.kgToLb(kg)) + ' lb' : f1(kg) + ' kg') : (imp ? f1(kg / 2.54) + ' in' : f1(kg) + ' cm'); }
    function rowVals(r) { return [r.date, disp(r.weightKg, 'w'), disp(r.waistCm, 'l'), disp(r.hipsCm, 'l'), disp(r.chestCm, 'l')]; }
    function render() {
      var s = recs.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      var l = s[s.length - 1];
      latest.innerHTML = l ? '<h3>Latest measurement (' + esc(l.date) + ')</h3><p>Weight ' + disp(l.weightKg, 'w') + ' · Waist ' + disp(l.waistCm, 'l') + ' · Hips ' + disp(l.hipsCm, 'l') + ' · Chest ' + disp(l.chestCm, 'l') + (l.notes ? '<br>Notes: ' + esc(l.notes) : '') + '</p>' : '<p>No records yet. Add your first record above.</p>';
      list.innerHTML = s.slice().reverse().map(function (r) { var v = rowVals(r); return '<tr>' + v.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '<td>' + esc(r.notes || '') + '</td><td><button type="button" class="btn alt sm" data-edit="' + esc(r.id) + '" aria-label="Edit record from ' + esc(r.date) + '">Edit</button> <button type="button" class="btn danger sm" data-del="' + esc(r.id) + '" aria-label="Delete record from ' + esc(r.date) + '">Delete</button></td></tr>'; }).join('');
      drawChart(s);
    }
    function drawChart(s) {
      var imp = unitSel.value === 'imperial', conv = function (v) { return view === 'weightKg' ? (imp ? C.kgToLb(v) : v) : (imp ? v / 2.54 : v); }, unit = view === 'weightKg' ? (imp ? 'lb' : 'kg') : (imp ? 'in' : 'cm');
      if (s.length < 2) { chart.innerHTML = '<text x="300" y="110" text-anchor="middle" fill="#5b6266" font-size="15">Add at least two records to see a chart.</text>'; return; }
      var ys = s.map(function (r) { return conv(r[view]); }), mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys), pad = (mx - mn) * 0.15 || 1; mn -= pad; mx += pad;
      var X = function (i) { return 60 + i * (510 / (s.length - 1)); }, Y = function (v) { return 190 - (v - mn) / (mx - mn) * 160; };
      var pts = ys.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ');
      chart.innerHTML = '<line x1="60" y1="190" x2="570" y2="190" stroke="#d9d8cf"/><line x1="60" y1="30" x2="60" y2="190" stroke="#d9d8cf"/><text x="54" y="34" text-anchor="end" font-size="12" fill="#5b6266">' + f1(mx) + '</text><text x="54" y="194" text-anchor="end" font-size="12" fill="#5b6266">' + f1(mn) + '</text><text x="60" y="212" font-size="12" fill="#5b6266">' + esc(s[0].date) + '</text><text x="570" y="212" text-anchor="end" font-size="12" fill="#5b6266">' + esc(s[s.length - 1].date) + '</text><text x="570" y="20" text-anchor="end" font-size="12" fill="#5b6266">' + unit + '</text><polyline fill="none" stroke="#1f4d3a" stroke-width="2.5" points="' + pts + '"/>' + ys.map(function (v, i) { return '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="4" fill="#1f4d3a"/>'; }).join('');
    }
    function setEdit(r) {
      editing = r ? r.id : null; var imp = unitSel.value === 'imperial', E = form.elements;
      if (r) { E.date.value = r.date; E.weight.value = (imp ? C.kgToLb(r.weightKg) : r.weightKg).toFixed(1); ['waist', 'hips', 'chest'].forEach(function (k) { E[k].value = (imp ? r[k + 'Cm'] / 2.54 : r[k + 'Cm']).toFixed(1); }); E.notes.value = r.notes || ''; }
      $('#save-btn').textContent = r ? 'Save changes' : 'Add record'; $('#cancel-edit').hidden = !r; if (r) E.date.focus();
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); var e = [], E = form.elements, imp = unitSel.value === 'imperial';
      var date = C.parseDate(E.date.value); if (date === null) e.push('Date: choose a valid date.');
      var w = C.num(E.weight.value, imp ? 44 : 20, imp ? 1100 : 500); if (w === null) e.push('Weight: enter ' + (imp ? '44–1100 lb.' : '20–500 kg.'));
      var g = {}; [['waist', 'Waist'], ['hips', 'Hips'], ['chest', 'Chest']].forEach(function (p) { var v = C.num(E[p[0]].value, imp ? 8 : 20, imp ? 120 : 300); if (v === null) e.push(p[1] + ': enter ' + (imp ? '8–120 inches.' : '20–300 cm.')); g[p[0]] = v; });
      if (E.notes.value.length > 200) e.push('Notes: keep notes under 200 characters.');
      if (showErrors(form, e)) return;
      var rec = { id: editing || String(Date.now()) + Math.random().toString(36).slice(2, 6), date: E.date.value, weightKg: imp ? C.lbToKg(w) : w, waistCm: imp ? g.waist * 2.54 : g.waist, hipsCm: imp ? g.hips * 2.54 : g.hips, chestCm: imp ? g.chest * 2.54 : g.chest, notes: E.notes.value.trim() };
      if (editing) recs = recs.map(function (r) { return r.id === editing ? rec : r; }); else recs.push(rec);
      status.textContent = save() ? (editing ? 'Record updated.' : 'Record added.') : 'Could not save: browser storage is unavailable or full. Export a CSV to keep your data.';
      form.reset(); form.elements.date.value = new Date().toISOString().slice(0, 10); setEdit(null); render();
    });
    form.addEventListener('reset', function () { setTimeout(function () { setEdit(null); showErrors(form, []); form.elements.date.value = new Date().toISOString().slice(0, 10); }, 0); });
    $('#cancel-edit').addEventListener('click', function () { form.reset(); });
    unitSel.addEventListener('change', function () { var r = recs.filter(function (x) { return x.id === editing; })[0]; document.querySelectorAll('[data-ulabel]').forEach(function (el) { el.textContent = unitSel.value === 'imperial' ? el.getAttribute('data-imp') : el.getAttribute('data-met'); }); if (r) setEdit(r); render(); });
    list.addEventListener('click', function (ev) {
      var t = ev.target, id = t.getAttribute('data-edit') || t.getAttribute('data-del'); if (!id) return;
      var r = recs.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      if (t.hasAttribute('data-edit')) { setEdit(r); if (form.scrollIntoView) form.scrollIntoView(); }
      else if (confirm('Delete the record from ' + r.date + '? This cannot be undone.')) { recs = recs.filter(function (x) { return x.id !== id; }); if (editing === id) form.reset(); status.textContent = save() ? 'Record deleted.' : 'Could not save the change.'; render(); }
    });
    $('#chart-metric').addEventListener('change', function (ev) { view = ev.target.value; render(); });
    $('#export-btn').addEventListener('click', function () {
      if (!recs.length) { status.textContent = 'There are no records to export yet.'; return; }
      var blob = new Blob(['\ufeff' + C.toCsv(recs)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'bodymetricguide-records.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); status.textContent = 'CSV file downloaded.';
    });
    $('#clear-btn').addEventListener('click', function () {
      if (!recs.length) { status.textContent = 'There are no records to clear.'; return; }
      if (confirm('Delete ALL ' + recs.length + ' records from this browser? This cannot be undone. Export a CSV first if you want a backup.') && confirm('Are you sure? All records will be permanently deleted.')) { recs = []; status.textContent = save() ? 'All records cleared.' : 'Could not save the change.'; setEdit(null); render(); }
    });
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    [].forEach.call(document.querySelectorAll('form[data-tool]'), initCalc);
    var t = $('form[data-tracker]'); if (t) initTracker(t);
  });
})();
