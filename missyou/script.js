// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SHOPIFY_STORE = 'oran-jusu.myshopify.com';
const PRODUCT_IDS   = '10807763173718,10810877575510';
// ─────────────────────────────────────────────────────────────────────────────

// ─── DSP expand/collapse ─────────────────────────────────────────────────────
(function () {
  var toggle = document.getElementById('dsp-toggle');
  var extra  = document.getElementById('dsp-extra');
  if (!toggle || !extra) return;

  toggle.addEventListener('click', function () {
    var open = extra.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    extra.setAttribute('aria-hidden', String(!open));
    toggle.textContent = open ? 'See fewer services' : 'See all services';
  });
}());

// ─── Meta Pixel helpers ───────────────────────────────────────────────────────
function makeEventID() {
  return Date.now() + '-' + Math.random().toString(16).slice(2);
}

function sendBackupPixel(eventName, pixelId, params) {
  params = params || {};
  var entries = Object.keys(params).map(function (k) {
    return [k, String(params[k])];
  });
  var q = new URLSearchParams(Object.assign({
    id: pixelId,
    ev: eventName,
    dl: location.href,
    rl: document.referrer || '',
    noscript: '1',
    rand: String(Math.random())
  }, Object.fromEntries(entries)));

  var url = 'https://www.facebook.com/tr/?' + q.toString();
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    new Image().src = url;
  }
}

var PIXEL_ID = '1873199413558787';

initEmailModal({
  mailchimpUrl: 'https://icloud.us7.list-manage.com/subscribe/post?u=acc8234cf94f0de5b16b82418&amp;id=dc24663714&amp;f_id=00604de4f0',
  trackName: 'Miss You'
});

document.querySelectorAll('a[data-dsp]').forEach(function (el) {
  el.addEventListener('click', function () {
    var dsp = el.getAttribute('data-dsp') || 'unknown';
    var eventID = makeEventID();

    if (window.fbq) {
      fbq('track', 'Lead', { content_name: 'Miss You', content_category: 'Music', dsp: dsp }, { eventID: eventID });
      fbq('trackCustom', 'DspClick', { track: 'Miss You', dsp: dsp }, { eventID: eventID });
    }

    sendBackupPixel('Lead', PIXEL_ID, { dsp: dsp, content_name: 'Miss You' });

    fetch('/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'Lead', event_id: eventID, dsp: dsp, event_source_url: location.href })
    }).catch(function () {});

    showEmailModal();
  }, { passive: false });
});

// ─── Shopify merch ────────────────────────────────────────────────────────────
(function () {
  fetch('https://' + SHOPIFY_STORE + '/products.json?ids=' + PRODUCT_IDS)
    .then(function (r) { return r.json(); })
    .then(function (json) { return json.products || []; })
    .then(renderMerch)
    .catch(function (err) {
      console.warn('Merch fetch failed:', err);
    });

  function renderMerch(products) {
    // products.json doesn't guarantee order — sort to match PRODUCT_IDS order
    var ids = PRODUCT_IDS.split(',');
    products.sort(function (a, b) {
      return ids.indexOf(String(a.id)) - ids.indexOf(String(b.id));
    });

    products.forEach(function (product, i) {
      var card = document.querySelector('[data-merch="' + i + '"]');
      if (!card) return;

      // Link to product page
      card.href = 'https://' + SHOPIFY_STORE + '/products/' + product.handle;

      // Image
      var imgWrap = card.querySelector('.merch-img-wrap');
      if (imgWrap && product.images && product.images[0]) {
        var img = document.createElement('img');
        img.className = 'merch-img';
        img.src = product.images[0].src;
        img.alt = product.images[0].alt || product.title;
        imgWrap.innerHTML = '';
        imgWrap.appendChild(img);
      }

      // Name
      var nameEl = card.querySelector('.merch-name');
      if (nameEl) nameEl.textContent = product.title;

      // Price (store base currency — GBP)
      var priceEl = card.querySelector('.merch-price');
      if (priceEl && product.variants && product.variants[0]) {
        var amount = parseFloat(product.variants[0].price);
        try {
          priceEl.textContent = new Intl.NumberFormat(navigator.language || 'en-GB', {
            style: 'currency', currency: 'GBP', minimumFractionDigits: 2
          }).format(amount);
        } catch (e) {
          priceEl.textContent = '£' + amount.toFixed(2);
        }
      }

      card.classList.remove('merch-loading');
    });
  }
}());
