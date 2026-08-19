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

  // Focus-trap helpers shared by both drawer families (P6-57).
  // Native tabbability check, not a hand-maintained selector list: the selector
  // list this function shipped with in this very PR omitted <summary>, which is
  // natively tabbable (tabIndex === 0) but matched none of the selector's
  // clauses, and the main-family drawer's Services/Brands/Service Areas
  // sections are <details><summary>. That silently trapped keyboard users in a
  // 3-item loop on every main-family page (~150 pages) whenever focus landed on
  // a <summary> mid-cycle. tabIndex >= 0 gets <summary>, <a href>, buttons, and
  // [tabindex="0"] right without a list to maintain, and correctly excludes the
  // <details> element itself (tabIndex === -1) and disabled controls.
  // Ancestor walk used by focusablesIn to exclude phantom entries: nodes
  // inside a CLOSED <details> pass the native-tabbability check above
  // (shared.css keeps `.nav-drawer details a { display: block }`, so they
  // are painted and getClientRects() succeeds, and tabIndex on an <a href>
  // is 0 regardless of ancestor state) but browsers make closed-<details>
  // content genuinely inert to real Tab presses, so document.activeElement
  // can never land on one. That mismatch is harmless today only by markup
  // accident: the drawer's last child is a plain <a> CTA outside any
  // <details>, so cycle[cycle.length - 1] in trapTab happens to be reachable.
  // If a future edit made a <details> region the drawer's last child, the
  // true last reachable item would never satisfy `idx === cycle.length - 1`,
  // trapTab would stop intercepting Tab there, and focus would leak out of
  // the drawer, a narrower rerun of the exact bug this file already fixed
  // once (see the comment above focusablesIn). Must be an ancestor walk, not
  // a single closest('details') check, so a summary nested inside a closed
  // outer <details> is correctly excluded too. Keeps a details element's own
  // <summary> reachable, since that is the control that opens it.
  function isReachable(node, root) {
    var current = node;
    while (current && current !== root) {
      var parent = current.parentElement;
      if (!parent) break;
      if (parent.tagName === 'DETAILS' && !parent.open) {
        var firstSummary = null;
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === 'SUMMARY') { firstSummary = parent.children[i]; break; }
        }
        if (current !== firstSummary) return false;
      }
      current = parent;
    }
    return true;
  }
  function focusablesIn(el) {
    var result = [];
    el.querySelectorAll('*').forEach(function (node) {
      if (node.tabIndex >= 0 && !node.disabled && node.getClientRects().length && isReachable(node, el)) result.push(node);
    });
    return result;
  }
  function releaseFocus(drawer, hamburger) {
    if (drawer.contains(document.activeElement)) hamburger.focus();
  }
  function trapTab(e, drawer, hamburger) {
    if (e.key !== 'Tab' || hamburger.getAttribute('aria-expanded') !== 'true') return;
    var cycle = [hamburger].concat(focusablesIn(drawer));
    var idx = cycle.indexOf(document.activeElement);
    if (e.shiftKey) {
      if (idx <= 0) { e.preventDefault(); cycle[cycle.length - 1].focus(); }
    } else {
      if (idx === -1 || idx === cycle.length - 1) { e.preventDefault(); cycle[0].focus(); }
    }
  }

  // 2. Mobile nav drawer — family detected by element.
  function initDrawer() {
    var hamburger = document.querySelector('.nav-hamburger');
    if (!hamburger) return;

    var articleDrawer = document.getElementById('mobile-nav-drawer');
    if (articleDrawer) {
      var setNavOpen = function (open) {
        if (!open) releaseFocus(articleDrawer, hamburger);
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
      document.addEventListener('keydown', function (e) { trapTab(e, articleDrawer, hamburger); });
      articleDrawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNavOpen(false); }); });
      document.addEventListener('click', function (e) {
        if (hamburger.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) setNavOpen(false);
      });
      return;
    }

    var drawer = document.querySelector('.nav-drawer');
    if (!drawer) return;
    function openDrawer() { drawer.setAttribute('data-open', ''); hamburger.setAttribute('aria-expanded', 'true'); }
    function closeDrawer() {
      releaseFocus(drawer, hamburger);
      drawer.removeAttribute('data-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    hamburger.addEventListener('click', function () { drawer.hasAttribute('data-open') ? closeDrawer() : openDrawer(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') closeDrawer();
    });
    document.addEventListener('keydown', function (e) { trapTab(e, drawer, hamburger); });
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
