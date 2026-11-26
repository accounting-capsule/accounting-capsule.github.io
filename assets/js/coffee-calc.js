(function (root) {
  'use strict';
  var FIELDS = [
    ['price', 'سعر بيع الكوب (جنيه)', 25, 1, 500, 'g1'],
    ['cups', 'عدد الأكواب يوميًا', 60, 1, 250, 'g1'],
    ['days', 'أيام التشغيل شهريًا', 26, 1, 31, 'g1'],
    ['kg', 'سعر كيلو البن (جنيه)', 999, 50, 10000, 'g2'],
    ['dose', 'جرعة البن للكوب (جرام)', 10, 1, 50, 'g2'],
    ['cup', 'كوب وغطاء وأدوات (جنيه/كوب)', 1.5, 0, 50, 'g2'],
    ['milk', 'حليب وسكر وإضافات (جنيه/كوب)', 1, 0, 50, 'g2'],
    ['fee', 'رسوم الدفع الإلكتروني (% من المبيعات)', 1.5, 0, 10, 'g2'],
    ['rent', 'مقابل الموقع (جنيه/شهر)', 2000, 0, 200000, 'g3'],
    ['worker', 'عامل جزئي (جنيه/شهر)', 3000, 0, 200000, 'g3'],
    ['maint', 'صيانة وقطع غيار (جنيه/شهر)', 800, 0, 100000, 'g3'],
    ['kwh', 'استهلاك الكهرباء (ك.و.س/شهر)', 150, 0, 5000, 'g3'],
    ['tariff', 'سعر الكيلووات ساعة (جنيه)', 2.16, 0, 20, 'g3'],
    ['elecfee', 'رسم الكهرباء الشهري (جنيه)', 30, 0, 1000, 'g3'],
    ['misc', 'مصروفات متنوعة (جنيه/شهر)', 400, 0, 100000, 'g3'],
    ['machine', 'سعر الماكينة (جنيه)', 185000, 1000, 5000000, 'g4'],
    ['pay', 'وحدة دفع (جنيه)', 15000, 0, 1000000, 'g4'],
    ['install', 'توصيل وتركيب (جنيه)', 2000, 0, 1000000, 'g4'],
    ['license', 'ترخيص وتجهيز (جنيه)', 3000, 0, 1000000, 'g4'],
    ['stock', 'مخزون أول (جنيه)', 5000, 0, 1000000, 'g4']
  ];
  function validate(v) {
    var errs = [];
    FIELDS.forEach(function (f) {
      var x = v[f[0]];
      if (typeof x !== 'number' || !isFinite(x)) { errs.push(f[1] + ': اكتب رقمًا.'); return; }
      if (x < f[3] || x > f[4]) errs.push(f[1] + ': القيمة بين ' + f[3] + ' و ' + f[4] + '.');
    });
    return errs;
  }
  function calc(v) {
    var varCup = v.kg / 1000 * v.dose + v.cup + v.milk + v.fee / 100 * v.price;
    var sold = v.cups * v.days;
    var revenue = v.price * sold;
    var variable = varCup * sold;
    var elec = v.kwh * v.tariff + v.elecfee;
    var fixed = v.rent + v.worker + v.maint + elec + v.misc;
    var surplus = revenue - variable - fixed;
    var capex = v.machine + v.pay + v.install + v.license;
    var reserve = 2 * fixed;
    var funding = capex + v.stock + reserve;
    var unit = v.price - varCup;
    var dep = (v.machine + v.pay + v.install) / 60;
    return {
      varCup: varCup, revenue: revenue, variable: variable, elec: elec, fixed: fixed,
      surplus: surplus, capex: capex, reserve: reserve, funding: funding,
      paybackCapex: surplus > 0 ? Math.ceil(capex / surplus - 1e-9) : null,
      paybackFunding: surplus > 0 ? Math.ceil(funding / surplus - 1e-9) : null,
      breakeven: unit > 0 ? Math.ceil(fixed / unit / v.days - 1e-9) : null,
      unit: unit, depreciation: dep, afterDep: surplus - dep
    };
  }
  function surplusAt(v, cups) { var c = {}; for (var k in v) c[k] = v[k]; c.cups = cups; return calc(c).surplus; }
  var api = { FIELDS: FIELDS, validate: validate, calc: calc, surplusAt: surplusAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CoffeeCalc = api;
})(this);
