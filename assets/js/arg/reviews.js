(() => {
  'use strict';

  const card = document.querySelector('[data-review-mt]');
  const date = card?.querySelector('[data-review-date]');
  const text = card?.querySelector('[data-review-text]');
  const dialog = document.querySelector('[data-review-history-dialog]');
  const closeButton = dialog?.querySelector('[data-arg-dialog-close]');
  if (!card || !date || !text || !dialog) return;

  const entries = [
    ['2026-03-14', '2026.03.14', '人生で最も素晴らしい食事でした。また必ず伺います。'],
    ['2026-04-02', '2026.04.02', '最近、何を食べても物足りません。あの味が忘れられません。'],
    ['2026-04-27', '2026.04.27', '妻と旅行に行きました。何も楽しくありませんでした。あの料理が食べたいです。'],
    ['2026-05-19', '2026.05.19', 'お願いします。もう一度食べさせてください。お金なら用意します。']
  ];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = reducedMotion ? 6500 : 4800;
  let entryIndex = 0;
  let intervalId = 0;
  let transitionId = 0;
  let waitingForTransition = false;
  const noise = document.createElement('span');
  noise.className = 'review-glitch';
  noise.setAttribute('aria-hidden', 'true');
  text.after(noise);

  const render = (entry) => {
    date.dateTime = entry[0];
    date.textContent = entry[1];
    text.textContent = entry[2];
  };

  const advance = () => {
    if (document.hidden || dialog.open) return;
    entryIndex = (entryIndex + 1) % entries.length;
    if (reducedMotion) {
      render(entries[entryIndex]);
      return;
    }
    noise.textContent = text.textContent;
    noise.style.top = `${text.offsetTop}px`;
    noise.style.left = `${text.offsetLeft}px`;
    noise.style.width = `${text.offsetWidth}px`;
    card.classList.add('is-updating');
    transitionId = window.setTimeout(() => {
      render(entries[entryIndex]);
      noise.textContent = text.textContent;
      transitionId = window.setTimeout(() => {
        card.classList.remove('is-updating');
        noise.textContent = '';
      }, 250);
    }, 300);
  };

  const start = () => {
    if (!intervalId) intervalId = window.setInterval(advance, interval);
  };

  const stop = () => {
    window.clearInterval(intervalId);
    window.clearTimeout(transitionId);
    card.classList.remove('is-updating');
    noise.textContent = '';
    intervalId = 0;
  };

  const openHistory = () => {
    if (window.LornevierGame?.getPhase() !== 1) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (waitingForTransition) return;
    waitingForTransition = true;
    const showAfterTransition = (event) => {
      if (event.detail?.phase !== 1) return;
      document.removeEventListener('lornevier:transition-complete', showAfterTransition);
      waitingForTransition = false;
      if (!dialog.open) dialog.showModal();
    };
    document.addEventListener('lornevier:transition-complete', showAfterTransition);
    document.dispatchEvent(new CustomEvent('lornevier:anomaly-discovered', {
      detail: { phase: 1, nextPhase: 2, source: 'reviews-mt' }
    }));
  };

  card.addEventListener('click', openHistory);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openHistory();
    }
  });
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => card.focus({ preventScroll: true }));
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  addEventListener('pagehide', stop, { once: true });
  start();
})();
