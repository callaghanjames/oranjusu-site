function makeEventID() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sendBackupPixel(eventName, pixelId, params = {}) {
  const q = new URLSearchParams({
    id: pixelId,
    ev: eventName,
    dl: location.href,
    rl: document.referrer || "",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    noscript: "1",
    rand: String(Math.random())
  });

  const url = `https://www.facebook.com/tr/?${q.toString()}`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    const img = new Image();
    img.src = url;
  }
}

const PIXEL_ID = "1873199413558787";

initEmailModal({ mailchimpUrl: 'https://icloud.us7.list-manage.com/subscribe/post?u=acc8234cf94f0de5b16b82418&amp;id=dc24663714&amp;f_id=00604de4f0', trackName: 'See You Again' });

document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const dsp = el.getAttribute('data-dsp') || 'unknown';
    const url = el.href;
    const eventID = makeEventID();

    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: 'See You Again',
        content_category: 'Music',
        dsp
      }, { eventID });

      fbq('trackCustom', 'DspClick', {
        track: 'See You Again',
        dsp
      }, { eventID });
    }

    sendBackupPixel("Lead", PIXEL_ID, { dsp, content_name: "See You Again" });

    // ✅ ADD THIS BLOCK
    fetch("/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Lead",
        event_id: eventID,
        dsp,
        event_source_url: location.href
        // test_event_code: "TEST51288"
      })
    }).catch(() => {});
    // ✅ END ADD

    showEmailModal();
  }, { passive: false });
});
