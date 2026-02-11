function makeEventID() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sendBackupPixel(eventName, pixelId, params = {}) {
  // Fallback that’s hard to drop: a simple GET to Facebook’s pixel endpoint
  const q = new URLSearchParams({
    id: pixelId,
    ev: eventName,
    dl: location.href,
    rl: document.referrer || "",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
    noscript: "1",
    rand: String(Math.random())
  });

  const url = `https://www.facebook.com/tr/?${q.toString()}`;

  // Best effort: sendBeacon, then image as fallback
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    const img = new Image();
    img.src = url;
  }
}

// Put your Pixel ID here once, so backup works:
const PIXEL_ID = "1873199413558787";

document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const dsp = el.getAttribute('data-dsp') || 'unknown';
    const url = el.href;
    const eventID = makeEventID();

    // Stop the browser doing its default click immediately
    e.preventDefault();

    // Fire Meta events (browser pixel)
    if (window.fbq) {
      // NOTE: Meta expects "eventID" (capital D) in the options object
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

    // Backup request that should appear as Lead even if JS unloads fast
    sendBackupPixel("Lead", PIXEL_ID, { dsp, content_name: "OKAY!" });

    // Now open the service in a new tab after a tiny delay
    setTimeout(() => {
      window.open(url, "_blank", "noopener");
    }, 120);
  }, { passive: false });
});
