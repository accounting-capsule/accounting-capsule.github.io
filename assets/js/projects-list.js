(function () {
  'use strict';
  // Add each new project page here (title, path from the site root).
  var PROJECTS = [
    { t: 'ماكينة قهوة ذاتية الخدمة', u: 'projects/coffee-vending.html' },
    { t: 'استلام وتوصيل ملابس بمغسلة شريكة', u: 'projects/laundry-delivery.html' }
  ];
  var cs = document.currentScript;
  var base = cs && cs.src ? cs.src.replace(/assets\/js\/projects-list\.js.*$/, '') : '/';
  function build(host) {
    var label = document.createElement('label');
    label.setAttribute('for', 'proj-select');
    label.style.cssText = 'display:block;font-weight:700;margin-bottom:.35rem';
    label.textContent = 'اختر مشروعًا';
    var sel = document.createElement('select');
    sel.id = 'proj-select';
    sel.style.cssText = 'width:100%;max-width:420px;padding:.6rem;border:1px solid #9fb0bf;border-radius:8px;font-size:1rem;background:#fff;color:#1b2430';
    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = 'كل المشاريع (' + PROJECTS.length + ')';
    sel.appendChild(ph);
    var here = location.pathname.replace(/^.*\/(projects\/[^/]+)$/, '$1');
    PROJECTS.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.u; o.textContent = p.t;
      if (here === p.u) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { if (sel.value) location.href = base + sel.value; });
    host.style.cssText = 'margin:1rem 0;padding:.9rem 1rem;background:#eef5fa;border:1px solid #b9d3e4;border-radius:10px';
    host.appendChild(label); host.appendChild(sel);
  }
  var hosts = document.querySelectorAll('[data-projects-nav]');
  for (var i = 0; i < hosts.length; i++) build(hosts[i]);
})();
