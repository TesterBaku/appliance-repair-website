/*
 * site.js — single source for the site's shared interaction JS.
 *
 * Replaces the per-page inline copies of three widgets that used to be
 * duplicated (and had drifted) across ~91 pages:
 *   1. nav dropdowns  — canonicalized to the accessible variant (hover +
 *                       keyboard focus / Escape + aria-expanded sync).
 *   2. mobile nav drawer — two markup families, detected at runtime:
 *        • article family: <div class="nav-drawer" id="mobile-nav-drawer">
 *          (aria-hidden toggle + body scroll lock + focus return)
 *        • main family:    <div class="nav-drawer"> (data-open toggle)
 *   3. FAQ accordion  — single-open (opening one closes the others) + aria.
 *
 * Page-specific filters (blog search/filter, testimonials filter) stay
 * inline on their one page — they are singletons, not a drift class.
 *
 * Loaded with `defer`, so the DOM is parsed before this runs. Every init is
 * feature-detected and no-ops when its elements are absent, so this one file
 * is safe to load on every page regardless of which widgets it contains.
 */
(function () {
  'use strict';

  // 1. Nav dropdowns — hover + keyboard accessible.
  function initDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      var menu = dd.querySelector('.nav-dropdown-menu');
      var toggle = dd.querySelector('.nav-dropdown-toggle');
      var arrow = dd.querySelector('.nav-dropdown-arrow');
      if (!menu || !toggle) return;
      var timer;

      function openMenu() {
        clearTimeout(timer);
        menu.style.display = 'block';
        toggle.setAttribute('aria-expanded', 'true');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
      function closeMenu() {
        menu.style.display = '';
        toggle.setAttribute('aria-expanded', 'false');
        if (arrow) arrow.style.transform = '';
      }
      function scheduleClose() {
        timer = setTimeout(closeMenu, 120);
      }

      dd.addEventListener('mouseenter', openMenu);
      dd.addEventListener('mouseleave', scheduleClose);
      menu.addEventListener('mouseenter', function () { clearTimeout(timer); });
      menu.addEventListener('mouseleave', scheduleClose);

      toggle.addEventListener('focus', openMenu);
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('focus', function () { clearTimeout(timer); });
        a.addEventListener('blur', scheduleClose);
      });
      toggle.addEventListener('blur', scheduleClose);

      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeMenu(); toggle.focus(); }
      });
      menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeMenu(); toggle.focus(); }
      });
    });
  }

  // 2. Mobile nav drawer — family detected by element.
  function initDrawer() {
    var hamburger = document.querySelector('.nav-hamburger');
    if (!hamburger) return;

    var articleDrawer = document.getElementById('mobile-nav-drawer');
    if (articleDrawer) {
      var setNavOpen = function (open) {
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        articleDrawer.setAttribute('aria-hidden', String(!open));
        if (open) { articleDrawer.setAttribute('data-open', ''); } else { articleDrawer.removeAttribute('data-open'); }
        document.body.style.overflow = open ? 'hidden' : '';
      };
      hamburger.addEventListener('click', function () { setNavOpen(hamburger.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') { setNavOpen(false); hamburger.focus(); }
      });
      articleDrawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNavOpen(false); }); });
      document.addEventListener('click', function (e) {
        if (hamburger.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) setNavOpen(false);
      });
      return;
    }

    var drawer = document.querySelector('.nav-drawer');
    if (!drawer) return;
    function openDrawer() { drawer.setAttribute('data-open', ''); hamburger.setAttribute('aria-expanded', 'true'); }
    function closeDrawer() { drawer.removeAttribute('data-open'); hamburger.setAttribute('aria-expanded', 'false'); }
    hamburger.addEventListener('click', function () { drawer.hasAttribute('data-open') ? closeDrawer() : openDrawer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav')) closeDrawer(); });
  }

  // 3. FAQ accordion — single-open.
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (i) {
          i.classList.remove('open');
          var q = i.querySelector('.faq-q');
          if (q) q.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  initDropdowns();
  initDrawer();
  initFaq();
})();
