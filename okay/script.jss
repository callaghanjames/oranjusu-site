document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', () => {
    const dsp = el.getAttribute('data-dsp');

    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: 'OKAY!',
        content_category: 'Music',
        dsp
      });
    }
  });
});
