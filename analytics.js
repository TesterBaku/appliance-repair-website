(function () {
  // Click event tracking — phone calls, booking CTAs, reviews, pricing guide
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var text = link.textContent.trim();

    if (href.startsWith('tel:')) {
      gtag('event', 'phone_click', {
        link_text: text,
        page_location: window.location.href
      });
    }

    // Booking intent is signalled by link text, not destination: the homepage
    // hero "Book a Repair" points at an in-page #contact anchor, and a future
    // booking route must not silently fall out of tracking. The word-boundary
    // pattern excludes "Facebook", and dropping the weak "repair" alternative
    // excludes every "Refrigerator Repair" service link.
    if (/\b(book|schedule|quote|estimate|request)\b/i.test(text)) {
      gtag('event', 'book_repair_click', {
        link_text: text,
        page_location: window.location.href
      });
    }

    if (href.indexOf('google.com/maps') !== -1) {
      gtag('event', 'google_reviews_click', {
        link_text: text,
        page_location: window.location.href
      });
    }

    if (href.indexOf('appliance-repair-cost-orange-county') !== -1) {
      gtag('event', 'pricing_guide_visit', {
        link_text: text,
        page_location: window.location.href
      });
    }
  });

  // Contact form submission tracking — readyState guard handles script-at-body-end case
  function attachFormTracking() {
    var form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        gtag('event', 'contact_form_submit', {
          page_location: window.location.href
        });
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachFormTracking);
  } else {
    attachFormTracking();
  }

  // Seen / interacted diagnostics (2026-10-31). ChatGPT ad clicks arrive as GA4
  // sessions with page_view and nothing else, which cannot tell a page that loaded
  // unseen (app prefetch, preview, a sheet closed at once) from a person who looked
  // and left. lp_seen_2s fires once the page has been visible for 2 continuous
  // seconds, never while prerendering; lp_interact fires on the first touch, click,
  // wheel or key press. The `scroll` event is deliberately not used: scroll
  // restoration and #anchor jumps fire it with nobody there. Both fire at most once
  // per page load, site-wide, so organic sessions give the baseline for paid ones.
  var seenTimer = null;
  var seenSent = false;
  function checkSeen() {
    if (seenSent) return;
    if (document.visibilityState === 'visible' && !document.prerendering) {
      if (!seenTimer) {
        seenTimer = setTimeout(function () {
          seenSent = true;
          gtag('event', 'lp_seen_2s', { page_location: window.location.href });
        }, 2000);
      }
    } else if (seenTimer) {
      clearTimeout(seenTimer);
      seenTimer = null;
    }
  }
  document.addEventListener('visibilitychange', checkSeen);
  document.addEventListener('prerenderingchange', checkSeen);
  checkSeen();

  var interactTypes = ['touchstart', 'pointerdown', 'wheel', 'keydown'];
  function onFirstInteract(event) {
    interactTypes.forEach(function (type) {
      window.removeEventListener(type, onFirstInteract, { capture: true, passive: true });
    });
    gtag('event', 'lp_interact', {
      interaction_type: event.type,
      page_location: window.location.href
    });
  }
  interactTypes.forEach(function (type) {
    window.addEventListener(type, onFirstInteract, { capture: true, passive: true });
  });

  // Nav-dropdown keyboard behaviour (open/close, Escape, aria-expanded) is
  // single-sourced in site.js initDropdowns(): see AGENTS.md "Shared chrome
  // (partials)". Do not reintroduce it here; it previously duplicated and
  // conflicted with site.js's own Escape/Enter handling (P6 nav-keyboard fix).
}());
