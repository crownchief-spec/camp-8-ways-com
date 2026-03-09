/**
 * camp.8-ways.com — Main scripts（參考 joyforest-site-full）
 * 導覽選單開合、露營指南下拉、點連結關閉選單、平滑捲動
 */
(function () {
  'use strict';

  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  document.querySelectorAll('.dropdown > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parent = btn.closest('.dropdown');
      var isOpen = parent.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
  document.addEventListener('click', function (e) {
    var dd = e.target.closest('.dropdown');
    document.querySelectorAll('.dropdown').forEach(function (d) {
      if (d !== dd) d.classList.remove('open');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === '#') return;
    var target = document.querySelector(href);
    if (target) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (menu) menu.classList.remove('open');
      });
    }
  });
})();
