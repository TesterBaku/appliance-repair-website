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

    if (/book|schedule|repair/i.test(text) && href.endsWith('contact.html')) {
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

  // Keyboard accessibility for nav dropdowns
  // analytics.js loads at body-end so DOM is ready; no DOMContentLoaded guard needed.
  function initNavKeyboard() {
    // Stamp aria-expanded on every toggle so screen readers see the closed state on load
    document.querySelectorAll('.nav-dropdown-toggle').forEach(function (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-haspopup', 'true');
    });

    // Single delegated keydown listener covers all dropdowns on the page
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;

      // Escape: close every open dropdown
      if (e.key === 'Escape') {
        document.querySelectorAll('.nav-dropdown-toggle').forEach(function (toggle) {
          var dd = toggle.closest('.nav-dropdown');
          var menu = dd && dd.querySelector('.nav-dropdown-menu');
          if (menu) menu.style.display = '';
          toggle.setAttribute('aria-expanded', 'false');
          var arrow = toggle.querySelector('.nav-dropdown-arrow');
          if (arrow) arrow.style.transform = '';
        });
        return;
      }

      // Enter / Space: toggle the focused dropdown
      var toggle = document.activeElement;
      if (!toggle || !toggle.classList.contains('nav-dropdown-toggle')) return;
      e.preventDefault();

      var dd = toggle.closest('.nav-dropdown');
      if (!dd) return;
      var menu = dd.querySelector('.nav-dropdown-menu');
      if (!menu) return;

      var isOpen = menu.style.display === 'block';
      menu.style.display = isOpen ? '' : 'block';
      toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      var arrow = toggle.querySelector('.nav-dropdown-arrow');
      if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavKeyboard);
  } else {
    initNavKeyboard();
  }
}());
