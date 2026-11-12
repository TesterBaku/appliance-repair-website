/*
 * site.js — single source for the site's shared interaction JS.
 *
 * Replaces the per-page inline copies of widgets that used to be
 * duplicated (and had drifted) across ~91 pages, plus one newer shared widget:
 *   1. nav dropdowns  — canonicalized to the accessible variant (hover +
 *                       keyboard focus / Escape + aria-expanded sync).
 *   2. mobile nav drawer — two markup families, detected at runtime:
 *        • article family: <div class="nav-drawer" id="mobile-nav-drawer">
 *          (aria-hidden toggle + body scroll lock + focus return)
 *        • main family:    <div class="nav-drawer"> (data-open toggle)
 *   3. FAQ accordion  — single-open (opening one closes the others) + aria.
 *   4. capped job grid: "Show all N" button that reveals cards hidden on phones.
 *   5. capped review row: "Show N more reviews" button that reveals review cards
 *                       beyond the first two on phones.
 *   6. scrollable tables: a sideways-scrolling table wrapper gets a "Swipe sideways"
 *                       hint, keyboard focusability and a region label, only while it overflows.
 *   7. hub v2 review grids (.v2-reviews): three reviews on desktop and two on tablets and phones,
 *                       a reversible "Show N more reviews" button, and every quote held to five lines
 *                       with a "Read full review" toggle.
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
    var closers = [];
    document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      var menu = dd.querySelector('.nav-dropdown-menu');
      var toggle = dd.querySelector('.nav-dropdown-toggle');
      var arrow = dd.querySelector('.nav-dropdown-arrow');
      if (!menu || !toggle) return;
      var timer;

      function openMenu() {
        clearTimeout(timer);
        // The close delay below outlives a pointer move to a neighbouring toggle, so
        // close any other open menu now rather than letting two overlap. If that menu
        // holds keyboard focus, drop the focus first so it never sits on a hidden link.
        // (Not inside closeMenu: Escape closes then refocuses the toggle, and a blur
        // there would make that refocus reopen the menu.)
        closers.forEach(function (c) {
          if (c.dd === dd) return;
          if (c.dd.contains(document.activeElement)) document.activeElement.blur();
          c.close();
        });
        menu.style.display = 'block';
        toggle.setAttribute('aria-expanded', 'true');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
      function closeMenu() {
        menu.style.display = '';
        toggle.setAttribute('aria-expanded', 'false');
        if (arrow) arrow.style.transform = '';
      }
      // 300ms, not 120ms: the Service Areas mega-menu is centred under the nav bar, not
      // under its toggle, so a slow diagonal move to a far column spends longer outside
      // both boxes than 120ms allowed.
      function scheduleClose() {
        clearTimeout(timer);
        timer = setTimeout(closeMenu, 300);
      }
      closers.push({ dd: dd, close: closeMenu, toggle: toggle });

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
    });

    // Escape closes every dropdown, from anywhere: a menu opened by mouse (focus
    // outside any dropdown) or by keyboard (focus inside one, on the toggle or a
    // menu link). Single document-level listener, not per-toggle/per-menu ones:
    // those closed then called toggle.focus(), and refocusing the toggle fires
    // its own focus -> openMenu handler above, silently reopening the menu the
    // Escape press just closed.
    //
    // Order matters: find the dropdown (if any) containing the active element
    // and move focus to ITS toggle FIRST, before closing anything. Moving focus
    // first means that dropdown's own openMenu may fire (harmless: it's about
    // to be closed anyway), and it lands keyboard focus somewhere sane (the
    // toggle) rather than on a link inside a menu that's about to disappear.
    // Only then close every closers entry, unconditionally, so all menus end
    // hidden regardless of where focus started.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var entry = closers.filter(function (c) { return c.dd.contains(document.activeElement); })[0];
      if (entry && document.activeElement !== entry.toggle) entry.toggle.focus();
      closers.forEach(function (c) { c.close(); });
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
      // Older articles ship a static, always-open FAQ list (<div class="faq-q">, no collapsed
      // CSS). Only a real <button> is an accordion control; leave those lists untouched so
      // they carry no false aria-expanded and no dead click handler.
      if (!btn || btn.tagName !== 'BUTTON') return;
      // Sync aria-expanded to the item's actual open/closed state at init, not just on
      // click: a page can ship an item pre-opened via class="faq-item open" (e.g. a hub's
      // featured FAQ), and the button's aria-expanded must reflect that from the first
      // paint (WCAG 4.1.2), not only after a user toggles it.
      btn.setAttribute('aria-expanded', String(item.classList.contains('open')));
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (i) {
          i.classList.remove('open');
          var q = i.querySelector('.faq-q');
          if (q && q.tagName === 'BUTTON') q.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  // 4. Capped job grid: "Show all N <label>" button. shared.css hides cards 7+ on
  // phones and shows the button row only once the grid carries data-cap-ready, so
  // without JS the grid simply stays capped at six on phones.
  function initJobGridCap() {
    document.querySelectorAll('.job-grid-cap').forEach(function (grid) {
      var count = grid.children.length;
      if (count <= 6 || grid.hasAttribute('data-cap-ready')) return;
      var row = grid.nextElementSibling;
      if (!row || !row.classList.contains('job-grid-more-row')) return;
      var btn = row.querySelector('.job-grid-more');
      if (!btn) return;
      btn.textContent = 'Show all ' + count + ' ' + (grid.getAttribute('data-more-label') || 'repairs');
      grid.setAttribute('data-cap-ready', '');
      btn.addEventListener('click', function () {
        grid.setAttribute('data-expanded', '');
        // The button disappears, so hand focus to the first newly revealed card.
        var first = grid.children[6];
        first.setAttribute('tabindex', '-1');
        first.focus();
      });
    });
  }

  // 4b. Brand logo chips: on phones show the first five brand chips plus a "+N more brands" button as the
  // sixth grid cell. shared.css hides brand chips 6+ (and shows the button) only once the list carries
  // data-cap-ready (set here), so without JS every chip stays visible and the button stays hidden.
  // Lists of six or fewer brands are never capped. Desktop never caps.
  // Once expanded, the button stays at the end of the list as "Show fewer brands" and collapses it again.
  // A link that points into a .brand-chips block (the luxury pages' "brand row at the top of this page"
  // link targets #brand-chips-label) opens the full list, so it never lands on five chips and a button.
  function setBrandListExpanded(list, expanded) {
    var btn = list.querySelector('.brand-chips-more');
    if (!btn || !list.hasAttribute('data-cap-ready')) return;
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    btn.textContent = expanded ? 'Show fewer brands' : btn.getAttribute('data-more-text');
    if (expanded) list.setAttribute('data-expanded', '');
    else list.removeAttribute('data-expanded');
  }
  function expandBrandList(list) { setBrandListExpanded(list, true); }
  function expandBrandsForHash(hash) {
    var id = (hash || '').slice(1);
    // A malformed escape (e.g. "#%E0%A4%A") makes decodeURIComponent throw; this runs during init,
    // so a throw here would stop the scripts initialised after it. Fall back to the raw id.
    try { id = decodeURIComponent(id); } catch (e) { /* keep the raw id */ }
    var target = id && document.getElementById(id);
    var group = target && target.closest && target.closest('.brand-chips');
    var list = group && group.querySelector('.brand-chips-list');
    if (list) expandBrandList(list);
  }
  function initBrandCap() {
    var capped = false;
    document.querySelectorAll('.brand-chips-list').forEach(function (list) {
      var btn = list.querySelector('.brand-chips-more');
      if (!btn || list.hasAttribute('data-cap-ready')) return;
      var count = list.children.length - 1;
      if (count <= 6) return;
      capped = true;
      // Visible text is the whole accessible name (WCAG 2.5.3 label-in-name): no aria-label.
      btn.setAttribute('data-more-text', '+' + (count - 5) + ' more brands');
      btn.textContent = btn.getAttribute('data-more-text');
      list.setAttribute('data-cap-ready', '');
      btn.addEventListener('click', function () {
        if (list.hasAttribute('data-expanded')) {
          // Focus stays on the button, which moves back up to the sixth cell; keep it in view.
          setBrandListExpanded(list, false);
          if (btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest' });
          return;
        }
        expandBrandList(list);
        // The button moves to the end of the list, so hand focus to the first newly revealed brand chip (the sixth).
        var chip = list.children[5].querySelector('a');
        if (!chip) {
          chip = list.children[5].firstElementChild;
          chip.setAttribute('tabindex', '-1');
        }
        chip.focus();
      });
    });
    if (!capped || brandHashWired) return;
    brandHashWired = true;
    expandBrandsForHash(location.hash);
    window.addEventListener('hashchange', function () { expandBrandsForHash(location.hash); });
    // A click on a link to the hash already in the URL fires no hashchange, so catch the click too.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || a.pathname !== location.pathname || a.host !== location.host) return;
      expandBrandsForHash(a.hash);
    });
  }
  var brandHashWired = false;

  // 4c. Brand strip rows (desktop and tablet): the chips wrap as a flex row, and some widths leave one
  // chip alone on the last row (the 15 city-hub chips at about 950-1015px, the 8 luxury chips at about
  // 850-1000px). Only then, narrow the list to the smallest width that keeps the same number of rows,
  // which spreads the chips evenly (7+7+1 becomes 5+5+5). Phones use the 2-column grid and are left alone.
  function brandRowCount(items) {
    var tops = [];
    items.forEach(function (li) { if (tops.indexOf(li.offsetTop) === -1) tops.push(li.offsetTop); });
    return tops.length;
  }
  function balanceBrandRows(list) {
    list.style.maxWidth = '';
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
    var items = Array.prototype.filter.call(list.children, function (li) { return li.offsetParent !== null; });
    var n = items.length;
    if (n < 3) return;
    var lastTop = items[n - 1].offsetTop;
    // Nothing to fix on a single row, or when the last row already holds two or more chips.
    if (items[0].offsetTop === lastTop || items[n - 2].offsetTop === lastTop) return;
    var rows = brandRowCount(items);
    var lo = 0;
    items.forEach(function (li) { lo = Math.max(lo, li.offsetWidth); });
    lo -= 1;
    var hi = list.offsetWidth;
    while (hi - lo > 1) {
      var mid = Math.floor((lo + hi) / 2);
      list.style.maxWidth = mid + 'px';
      if (brandRowCount(items) > rows) lo = mid; else hi = mid;
    }
    list.style.maxWidth = hi + 'px';
  }
  function initBrandRows() {
    var lists = document.querySelectorAll('.brand-chips-list');
    if (!lists.length) return;
    var run = function () { lists.forEach(balanceBrandRows); };
    run();
    // Text chips (Maytag and others) change width when Inter loads.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    var lastWidth = window.innerWidth, frame = 0;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    });
  }

  // 5. Capped review row: shared.css hides cards 3+ on phones only once the grid carries
  // data-cap-ready (set here), so without JS every review stays visible. Only grids of 4+ cards
  // are capped by default: hiding a single card behind a button costs more than it saves, so 3 or fewer
  // show in full. A grid can opt in sooner with data-cap-from="N" (the minimum card count at which the
  // cap applies; absent or invalid means 4), for a 3-card page whose third review is very long.
  var capSeq = 0;
  function initReviewsCap() {
    document.querySelectorAll('.reviews-cap').forEach(function (grid) {
      var count = grid.children.length;
      var capFrom = parseInt(grid.getAttribute('data-cap-from'), 10);
      if (!(capFrom >= 3)) capFrom = 4;
      if (count < capFrom || grid.hasAttribute('data-cap-ready')) return;
      var row = grid.nextElementSibling;
      if (!row || !row.classList.contains('reviews-cap-more-row')) return;
      var btn = row.querySelector('.reviews-cap-more');
      if (!btn) return;
      var hidden = count - 2;
      btn.textContent = hidden === 1 ? 'Show 1 more review' : 'Show ' + hidden + ' more reviews';
      grid.setAttribute('data-cap-ready', '');
      // Disclosure semantics: the button controls the grid and reports whether it is expanded.
      if (!grid.id) grid.id = 'reviews-cap-' + (++capSeq);
      btn.setAttribute('aria-controls', grid.id);
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        grid.setAttribute('data-expanded', '');
        btn.setAttribute('aria-expanded', 'true');
        // The button disappears, so hand focus to the first newly revealed card.
        var first = grid.children[2];
        first.setAttribute('tabindex', '-1');
        first.focus();
      });
    });
  }

  // 6. Scrollable tables. Some tables scroll sideways inside their own overflow-x wrapper, which
  // hides the right-hand columns (often the price) with no cue. For every such wrapper that actually
  // overflows: label it, make it keyboard-scrollable, and show one hint above it. Re-evaluated on resize
  // so rotating a phone adds or removes the cue. Wrappers are found by computed style, so no page markup
  // is needed. The hint element is created once per wrapper and only toggled afterwards.
  function scrollWrapperOf(table) {
    for (var el = table.parentElement; el && el !== document.body; el = el.parentElement) {
      var ox = getComputedStyle(el).overflowX;
      if (ox === 'auto' || ox === 'scroll') return el;
    }
    return null;
  }
  function tableLabel(wrap, table) {
    var text = '';
    // Nearest preceding heading, looking at earlier siblings of the wrapper and then of each ancestor.
    for (var el = wrap; !text && el && el !== document.body; el = el.parentElement) {
      for (var prev = el.previousElementSibling; prev; prev = prev.previousElementSibling) {
        if (/^H[1-6]$/.test(prev.tagName) && prev.textContent.trim()) { text = prev.textContent.trim(); break; }
      }
    }
    if (!text) {
      var cap = table.querySelector('caption');
      text = cap ? cap.textContent.trim() : '';
    }
    text = (text || 'Scrollable table').replace(/\s+/g, ' ');
    if (text.length > 80) {
      text = text.slice(0, 80);
      var cut = text.lastIndexOf(' ');
      text = (cut > 20 ? text.slice(0, cut) : text).replace(/[\s,;:.-]+$/, '');
    }
    return text;
  }
  function initScrollableTables() {
    var wraps = [], seen = [];
    document.querySelectorAll('table').forEach(function (table) {
      var wrap = scrollWrapperOf(table);
      if (wrap && seen.indexOf(wrap) === -1) { seen.push(wrap); wraps.push({ el: wrap, table: table }); }
    });
    if (!wraps.length) return;
    // Self-contained styling: most articles load only this file, not shared.css. Injected once, only
    // when a wrapper exists. The "html p" prefix outranks article body-copy rules such as ".article-body p"; [hidden] is !important so a page's own display rule cannot defeat it.
    if (!document.getElementById('site-js-table-scroll')) {
      var style = document.createElement('style');
      style.id = 'site-js-table-scroll';
      style.textContent =
        'html p.table-scroll-hint{display:block;text-align:right;font-size:13px;line-height:1.4;color:#666;margin:16px 0 6px}' +
        'html p.table-scroll-hint:not([hidden]) + *{margin-top:6px !important}' +
        'html p.table-scroll-hint[hidden]{display:none !important}' +
        '.table-scrollable:focus-visible{outline:2px solid var(--brand,#e84c1e);outline-offset:2px}';
      document.head.appendChild(style);
    }
    var ADDED = 'data-table-scroll-attrs'; // names of the attributes this script added (never the page's own)
    function update() {
      wraps.forEach(function (w) {
        var wrap = w.el;
        var over = wrap.scrollWidth > wrap.clientWidth + 1;
        var hint = wrap.previousElementSibling;
        var hasHint = !!hint && hint.classList.contains('table-scroll-hint');
        if (over && !hasHint) {
          hint = document.createElement('p');
          hint.className = 'table-scroll-hint';
          hint.setAttribute('aria-hidden', 'true');
          hint.textContent = 'Swipe sideways to see the whole table →';
          wrap.parentNode.insertBefore(hint, wrap);
          hasHint = true;
        }
        wrap.classList.toggle('table-scrollable', over);
        if (hasHint) hint.hidden = !over;
        if (over) {
          if (wrap.hasAttribute(ADDED)) return;
          var added = [];
          if (!wrap.hasAttribute('tabindex')) { wrap.setAttribute('tabindex', '0'); added.push('tabindex'); }
          if (!wrap.hasAttribute('role')) { wrap.setAttribute('role', 'region'); added.push('role'); }
          if (!wrap.hasAttribute('aria-label') && !wrap.hasAttribute('aria-labelledby')) { wrap.setAttribute('aria-label', tableLabel(wrap, w.table)); added.push('aria-label'); }
          if (added.length) wrap.setAttribute(ADDED, added.join(' '));
        } else if (wrap.hasAttribute(ADDED)) {
          wrap.getAttribute(ADDED).split(' ').forEach(function (name) { wrap.removeAttribute(name); });
          wrap.removeAttribute(ADDED);
        }
      });
    }
    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(update, 150); });
    // Measure again once fonts and images settle; their metrics change table width.
    window.addEventListener('load', update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    update();
  }

  // 7. Hub v2 review grids. Each .v2-reviews grid shows 3 cards on desktop and 2 at (max-width: 960px);
  // the rest sit behind a reversible "Show N more reviews" button found in the same section. Every
  // quote is held to five lines (class is-clamped, added here, so with JS off every review and full quote
  // is visible) with a "Read full review" toggle that only appears when a quote is actually cut.
  // Measured again whenever the grid resizes and after fonts load, since Inter changes line breaks.
  function initV2Reviews() {
    document.querySelectorAll('.v2-reviews').forEach(function (grid) {
      if (grid.hasAttribute('data-v2-ready') || !grid.children.length) return;
      grid.setAttribute('data-v2-ready', '');
      var cards = Array.prototype.slice.call(grid.children);
      var section = grid.closest('section') || grid.parentNode;
      var more = section.querySelector('.v2-reviews-more');
      var narrow = window.matchMedia('(max-width: 960px)');
      var expanded = false;

      function measure() {
        cards.forEach(function (card) {
          var q = card.querySelector('blockquote'), b = card.querySelector('.v2-review-more');
          if (!q || !b || card.hidden) return;
          if (card.classList.contains('is-open')) { b.hidden = false; return; }
          card.classList.add('is-clamped');
          var cut = q.scrollHeight > q.clientHeight + 2;
          b.hidden = !cut;
          if (!cut) card.classList.remove('is-clamped');
        });
      }
      function apply() {
        var cap = narrow.matches ? 2 : 3;
        var extra = cards.length - cap;
        cards.forEach(function (card, i) { card.hidden = !expanded && i >= cap; });
        if (more) {
          more.hidden = extra <= 0;
          more.textContent = expanded ? 'Show fewer reviews' : 'Show ' + extra + ' more review' + (extra === 1 ? '' : 's');
          more.setAttribute('aria-expanded', String(expanded));
        }
        measure();
      }
      cards.forEach(function (card) {
        var b = card.querySelector('.v2-review-more');
        if (!b) return;
        b.addEventListener('click', function () {
          var open = card.classList.toggle('is-open');
          card.classList.toggle('is-clamped', !open);
          b.textContent = open ? 'Show less' : 'Read full review';
          b.setAttribute('aria-expanded', String(open));
        });
      });
      if (more) more.addEventListener('click', function () {
        expanded = !expanded;
        apply();
        if (!expanded) grid.scrollIntoView({ block: 'nearest' });
      });
      if (narrow.addEventListener) narrow.addEventListener('change', apply);
      if (window.ResizeObserver) new ResizeObserver(measure).observe(grid);
      else window.addEventListener('resize', measure);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      apply();
    });
  }

  initDropdowns();
  initDrawer();
  initFaq();
  initJobGridCap();
  initBrandCap();
  initBrandRows();
  initReviewsCap();
  initScrollableTables();
  initV2Reviews();
})();
