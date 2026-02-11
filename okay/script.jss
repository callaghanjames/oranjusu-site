function makeEventId() {
  // simple unique-ish event id for dedupe / debugging
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', () => {
    const dsp = el.getAttribute('data-dsp') || 'unknown';
    const eventID = makeEventId();

    // Standard event: good for optimisation
    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: 'OKAY!',
        content_category: 'Music',
        dsp
      }, { eventID });

      // Custom event: handy for reporting/debugging
      fbq('trackCustom', 'DspClick', {
        track: 'OKAY!',
        dsp
      }, { eventID });
    }
  });
});
