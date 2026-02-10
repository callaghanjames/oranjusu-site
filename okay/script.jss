// Fire Pixel events when users click DSP buttons
document.querySelectorAll('a[data-dsp]').forEach((el) => {
  el.addEventListener('click', () => {
    const dsp = el.getAttribute('data-dsp');

    // Standard event: Lead is often used for "high intent" actions
    // Meta supports standard events like ViewContent/Lead etc.  [oai_citation:6â€¡Facebook](https://www.facebook.com/business/help/402791146561655?utm_source=chatgpt.com)
    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: 'OKAY!',
        content_category: 'Music',
        dsp
      });
    }

    // Show signup modal after a short delay (DSP opens in new tab)
    setTimeout(() => openModal(), 1800);
  });
});

const modal = document.getElementById('signupModal');
const closeBtn = document.getElementById('closeModal');

function openModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('show');
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('show');
}

closeBtn?.addEventListener('click', closeModal);

// Close modal if you click outside it
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
