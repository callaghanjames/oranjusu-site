/**
 * Oran Jusu — Email capture modal
 *
 * Usage (in each page's script.js):
 *   initEmailModal({ mailchimpUrl: 'https://xxx.list-manage.com/subscribe/post?u=XXX&id=YYY', trackName: 'OKAY!' });
 *   // Then replace the window.open call with:
 *   showEmailModal(url);
 *
 * Mailchimp setup required:
 *   - Merge field, tag SOURCE  (auto-filled: "Landing Page")
 *   - Merge field, tag TRACK   (auto-filled: track name passed to initEmailModal)
 *   - Merge field, tag COUNTRY (filled from country dropdown, optional)
 *
 * Shows once per browser session (sessionStorage key: oj_modal_shown).
 */
(function () {
  var _config = {};
  var _pendingUrl = null;

  var COUNTRIES = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua & Barbuda',
    'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
    'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
    'Bolivia','Bosnia & Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
    'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
    'Central African Republic','Chad','Chile','China','Colombia','Comoros',
    'Congo (DRC)','Congo (Republic)','Costa Rica','Croatia','Cuba','Cyprus',
    'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
    'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
    'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
    'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
    'Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan',
    'Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos',
    'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania',
    'Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta',
    'Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
    'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
    'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
    'North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
    'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
    'Poland','Portugal','Qatar','Romania','Russia','Rwanda',
    'Saint Kitts & Nevis','Saint Lucia','Saint Vincent & Grenadines',
    'Samoa','San Marino','Sao Tome & Principe','Saudi Arabia','Senegal',
    'Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
    'Solomon Islands','Somalia','South Africa','South Korea','South Sudan',
    'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
    'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
    'Trinidad & Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
    'Ukraine','United Arab Emirates','United Kingdom','United States',
    'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam',
    'Yemen','Zambia','Zimbabwe'
  ];

  function buildModal() {
    var overlay = document.createElement('div');
    overlay.id = 'oj-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'oj-modal-title');

    var countryOptions = '<option value="">Select country (optional)</option>';
    COUNTRIES.forEach(function (c) {
      countryOptions += '<option value="' + c + '">' + c + '</option>';
    });

    overlay.innerHTML =
      '<div id="oj-modal-card">' +
        '<h2 id="oj-modal-title">Stay in the loop</h2>' +
        '<p>Get updates on new music from Oran Jusu.</p>' +
        '<div class="oj-field">' +
          '<label for="oj-email">Email address</label>' +
          '<input type="email" id="oj-email" name="EMAIL" placeholder="you@example.com" autocomplete="email" />' +
        '</div>' +
        '<div class="oj-field">' +
          '<label for="oj-country">Country</label>' +
          '<select id="oj-country" name="COUNTRY">' + countryOptions + '</select>' +
        '</div>' +
        '<button id="oj-modal-submit" type="button">Subscribe</button>' +
        '<p id="oj-modal-feedback" aria-live="polite"></p>' +
        '<button id="oj-modal-skip" type="button">No thanks</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('oj-modal-submit').addEventListener('click', handleSubmit);
    document.getElementById('oj-modal-skip').addEventListener('click', handleSkip);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) handleSkip();
    });
  }

  function handleSubmit() {
    var email = (document.getElementById('oj-email').value || '').trim();
    var country = document.getElementById('oj-country').value;
    var feedback = document.getElementById('oj-modal-feedback');
    var btn = document.getElementById('oj-modal-submit');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = 'Please enter a valid email address.';
      feedback.className = 'oj-error';
      return;
    }

    btn.disabled = true;
    feedback.textContent = 'Subscribing...';
    feedback.className = '';

    submitToMailchimp(email, country, function (result) {
      var alreadyOn = result.msg && result.msg.indexOf('already subscribed') !== -1;
      if (result.result === 'success' || alreadyOn) {
        feedback.textContent = alreadyOn ? 'You\'re already on the list!' : 'You\'re subscribed!';
        feedback.className = '';
      } else {
        feedback.textContent = 'Something went wrong — please try again.';
        feedback.className = 'oj-error';
        btn.disabled = false;
        return;
      }
      markShown();
      setTimeout(closeModal, 1400);
    });
  }

  function handleSkip() {
    markShown();
    closeModal();
  }

  function submitToMailchimp(email, country, callback) {
    var cbName = '_ojMcCb' + Date.now();

    // Normalise URL: decode &amp; entities, switch to post-json endpoint
    var formUrl = (_config.mailchimpUrl || '').replace(/&amp;/g, '&');
    var jsonUrl = formUrl.replace(/\/post(\?|$)/, '/post-json$1')
      + '&EMAIL=' + encodeURIComponent(email)
      + '&SOURCE=' + encodeURIComponent('Landing Page')
      + '&TRACK=' + encodeURIComponent(_config.trackName || '')
      + (country ? '&COUNTRY=' + encodeURIComponent(country) : '')
      + '&c=' + cbName;

    var script = document.createElement('script');

    // Safety timeout — if Mailchimp doesn't respond in 6s, close the modal
    var timer = setTimeout(function () {
      cleanup();
      markShown();
      closeModal();
    }, 6000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function (data) {
      cleanup();
      callback(data);
    };

    script.onerror = function () {
      cleanup();
      callback({ result: 'error', msg: 'Network error' });
    };

    script.src = jsonUrl;
    document.head.appendChild(script);
  }

  function openUrl(url) {
    if (url) window.open(url, '_blank', 'noopener');
  }

  function markShown() {
    try { sessionStorage.setItem('oj_modal_shown', '1'); } catch (e) {}
  }

  function hasBeenShown() {
    try { return sessionStorage.getItem('oj_modal_shown') === '1'; } catch (e) { return false; }
  }

  function closeModal() {
    var overlay = document.getElementById('oj-modal-overlay');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  window.initEmailModal = function (config) {
    _config = config || {};
    buildModal();
  };

  window.showEmailModal = function () {
    // Show the modal (once per session). The streaming link opens via the
    // anchor tag's natural target="_blank" behaviour — no window.open needed.
    if (hasBeenShown()) return;

    // Reset form state
    var emailInput = document.getElementById('oj-email');
    var countrySelect = document.getElementById('oj-country');
    var feedback = document.getElementById('oj-modal-feedback');
    var btn = document.getElementById('oj-modal-submit');
    if (emailInput) emailInput.value = '';
    if (countrySelect) countrySelect.value = '';
    if (feedback) { feedback.textContent = ''; feedback.className = ''; }
    if (btn) btn.disabled = false;

    var overlay = document.getElementById('oj-modal-overlay');
    if (overlay) {
      overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (emailInput) emailInput.focus(); }, 50);
    }
  };
}());
