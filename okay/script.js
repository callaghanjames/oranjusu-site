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

document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const dsp = el.getAttribute('data-dsp') || 'unknown';
    const url = el.href;
    const eventID = makeEventID();

    e.preventDefault();

    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: 'OKAY!',
        content_category: 'Music',
        dsp
      }, { eventID });

      fbq('trackCustom', 'DspClick', {
        track: 'OKAY!',
        dsp
      }, { eventID });
    }

    sendBackupPixel("Lead", PIXEL_ID, { dsp, content_name: "OKAY!" });

    // ✅ ADD THIS BLOCK
    fetch("https://oran-capi.callaghanjames.workers.dev/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Lead",
        event_id: eventID,
        dsp,
        event_source_url: location.href
        test_event_code: "TEST51288"
      })
    }).catch(() => {});
    // ✅ END ADD

    setTimeout(() => {
      window.open(url, "_blank", "noopener");
    }, 120);
  }, { passive: false });
});
