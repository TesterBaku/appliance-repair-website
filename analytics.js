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

    if (/book|schedule|repair/i.test(text) && href.indexOf('contact') !== -1) {
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

  // Contact form submission tracking
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        gtag('event', 'contact_form_submit', {
          page_location: window.location.href
        });
      });
    }
  });
}());
