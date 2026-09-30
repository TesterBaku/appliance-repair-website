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

  // Nav-dropdown keyboard behaviour (open/close, Escape, aria-expanded) is
  // single-sourced in site.js initDropdowns(): see AGENTS.md "Shared chrome
  // (partials)". Do not reintroduce it here; it previously duplicated and
  // conflicted with site.js's own Escape/Enter handling (P6 nav-keyboard fix).
}());
