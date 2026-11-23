/* حساب زكاة المنشآت وفق اللائحة التنفيذية لجباية الزكاة 1445هـ (زاتكا)
   طريقة مصادر الأموال (المادة 21) ونسبة الزكاة (المادة 15).
   Pure functions - unit tested with node. */
(function (root) {
  "use strict";

  // نسبة الزكاة السنوية حسب أيام السنة الفعلية (المادة 15):
  // النسبة = (2.5% ÷ عدد أيام السنة الهجرية) × عدد أيام السنة المالية للمكلف
  function zakatRate(fiscalYearDays, hijriYearDays) {
    if (!(fiscalYearDays > 0) || !(hijriYearDays > 0)) {
      throw new Error("أيام السنة يجب أن تكون أكبر من صفر");
    }
    return 0.025 * (fiscalYearDays / hijriYearDays);
  }

  // الوعاء الزكوي بطريقة مصادر الأموال:
  // الوعاء = مصادر داخلية (حقوق ملكية + تعديلات نتيجة النشاط)
  //        + مصادر خارجية مستخدمة في عناصر محسومة (بحد الأصول المحسومة)
  //        - الأصول غير الزكوية المحسومة - أصول سبقت زكاتها
  // ثم الحد الأدنى (صافي الربح المعدل) والحد الأعلى (مصادر الأموال الداخلية).
  function zakatBase(input) {
    var equity = num(input.equity);                    // حقوق الملكية بالقيمة الدفترية
    var bookProfit = num(input.bookProfit);            // صافي الربح الدفتري (ضمن حقوق الملكية)
    var adjustedProfit = num(input.adjustedProfit);    // صافي الربح المعدل (الزكوي)
    var externalFunds = num(input.externalFunds);      // مصادر أموال خارجية مؤهلة
    var deductedAssets = num(input.deductedAssets);    // الأصول غير الزكوية المحسومة
    var alreadyZakated = num(input.alreadyZakated);    // أصول سبقت جباية زكاتها في منشآت أخرى
    if (deductedAssets < 0 || externalFunds < 0 || alreadyZakated < 0) {
      throw new Error("القيم لا يمكن أن تكون سالبة");
    }
    var internal = equity + (adjustedProfit - bookProfit);   // مصادر الأموال الداخلية بعد التعديل
    var cappedExternal = Math.min(externalFunds, deductedAssets); // لا تتجاوز المحسوم
    var raw = internal + cappedExternal - deductedAssets - alreadyZakated;
    var base = Math.max(raw, adjustedProfit);   // الحد الأدنى للوعاء = صافي الربح المعدل
    base = Math.min(base, internal);            // الحد الأعلى للوعاء = مصادر الأموال الداخلية
    return { raw: raw, base: base, internal: internal, cappedExternal: cappedExternal };
  }

  function zakatDue(input) {
    var b = zakatBase(input);
    var rate = zakatRate(num(input.fiscalYearDays) || 354, num(input.hijriYearDays) || 354);
    return {
      base: b.base,
      rate: rate,
      zakat: round2(b.base * rate),
      detail: b
    };
  }

  function num(v) {
    var n = typeof v === "string" ? parseFloat(v.replace(/[,\s]/g, "")) : Number(v);
    return isFinite(n) ? n : 0;
  }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  var api = { zakatRate: zakatRate, zakatBase: zakatBase, zakatDue: zakatDue };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.ZakatCalc = api; }
})(typeof window !== "undefined" ? window : globalThis);
