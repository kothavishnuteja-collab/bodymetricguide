/* Pure calculation + validation helpers. Works in the browser and in Node tests. */
(function (root) {
  var C = {};
  var LB = 0.45359237, IN = 2.54;
  C.lbToKg = function (l) { return l * LB; };
  C.kgToLb = function (k) { return k / LB; };
  C.ftInToCm = function (ft, inch) { return (ft * 12 + inch) * IN; };
  C.cmToFtIn = function (cm) { var t = cm / IN, f = Math.floor(t / 12); return { ft: f, inch: t - f * 12 }; };
  // Reads a number; returns null if blank/invalid/outside [min,max].
  C.num = function (v, min, max) {
    if (v === null || v === undefined) return null;
    var s = String(v).trim().replace(',', '.');
    if (s === '' || !/^-?\d*\.?\d+$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) && n >= min && n <= max ? n : null;
  };
  C.LIMITS = { age: [18, 120], heightCm: [50, 272], weightKg: [20, 500], waistCm: [20, 300], girthCm: [20, 300] };
  C.bmi = function (kg, cm) { var m = cm / 100; return kg / (m * m); };
  C.bmiCategory = function (b) { return b < 18.5 ? 'Underweight' : b < 25 ? 'Healthy weight range' : b < 30 ? 'Overweight' : 'Obesity category'; };
  C.healthyRange = function (cm) { var m = cm / 100; return { lowKg: 18.5 * m * m, highKg: 24.9 * m * m }; };
  C.whtr = function (waist, height) { return waist / height; };
  C.whtrBand = function (r) {
    if (r < 0.4) return { key: 'low', label: 'Below 0.40', text: 'This is below the 0.40–0.49 band that NICE describes as healthy. A low ratio is not classified here; if you are unsure what it means for you, ask a healthcare professional.' };
    if (r < 0.5) return { key: 'ok', label: '0.40 to 0.49', text: 'This is within the 0.40–0.49 band that NICE describes as healthy central fat, and is under the commonly used 0.5 screening threshold.' };
    if (r < 0.6) return { key: 'mid', label: '0.50 to 0.59', text: 'This is at or above the commonly used 0.5 screening threshold. NICE describes this band as increased central fat. It is a screening signal, not a diagnosis.' };
    return { key: 'high', label: '0.60 or more', text: 'NICE describes this band as high central fat. It is a screening signal, not a diagnosis. Consider discussing it with a healthcare professional.' };
  };
  C.PROTEIN = { general: { label: 'General adult reference', lo: 0.8, hi: 0.8 }, active: { label: 'Recreationally active', lo: 1.0, hi: 1.2 }, strength: { label: 'Strength or muscle training', lo: 1.2, hi: 1.6 } };
  C.protein = function (kg, key, table) { var p = (table || C.PROTEIN)[key]; return { lo: kg * p.lo, hi: kg * p.hi, perKgLo: p.lo, perKgHi: p.hi }; };
  C.parseDate = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; var t = Date.UTC(+m[1], +m[2] - 1, +m[3]); var d = new Date(t); return d.getUTCMonth() === +m[2] - 1 ? t : null; };
  C.progress = function (startKg, nowKg, goalKg, d1, d2) {
    var r = { change: nowKg - startKg, pct: (nowKg - startKg) / startKg * 100 };
    r.days = Math.round((d2 - d1) / 86400000);
    r.perWeek = r.days >= 1 ? r.change / (r.days / 7) : null;
    if (goalKg != null) r.toGoal = goalKg - nowKg;
    return r;
  };
  C.csvCell = function (v) { var s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  C.toCsv = function (recs) {
    var rows = [['Date', 'Weight (kg)', 'Waist (cm)', 'Hips (cm)', 'Chest (cm)', 'Notes']];
    recs.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (r) { rows.push([r.date, r.weightKg, r.waistCm, r.hipsCm, r.chestCm, r.notes]); });
    return rows.map(function (r) { return r.map(C.csvCell).join(','); }).join('\r\n');
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.BMG = C;
})(this);
