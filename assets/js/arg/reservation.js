(() => {
  'use strict';

  const reference = document.querySelector('[data-preparation-reference]');
  const emptyMessage = document.querySelector('[data-reservation-empty]');
  if (!reference || !emptyMessage) return;

  const render = () => {
    const unlocked = window.LornevierGame?.getPhase() >= 4;
    reference.hidden = !unlocked;
    emptyMessage.hidden = unlocked;
  };

  document.addEventListener('lornevier:phase-changed', render);
  addEventListener('pageshow', render);
  render();
})();
