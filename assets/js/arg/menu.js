(() => {
  'use strict';

  const figure = document.querySelector('[data-spring-course-image]');
  const image = figure?.querySelector('img');
  const dialog = document.querySelector('[data-spring-course-dialog]');
  const closeButton = dialog?.querySelector('[data-arg-dialog-close]');
  if (!figure || !image || !dialog) return;

  const abnormalSource = 'images/course-spring-abnormal.webp';
  const timers = new Set();
  let activated = false;
  let waitingForTransition = false;

  const later = (callback, delay) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      callback();
    }, delay);
    timers.add(id);
  };

  const enableHotspot = () => {
    figure.classList.add('is-anomaly', 'arg-hotspot');
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-haspopup', 'dialog');
    figure.setAttribute('aria-controls', dialog.id);
    figure.setAttribute('aria-label', '春の特別コースの試作写真と厨房メモを確認する');
  };

  const showAbnormalImage = () => {
    figure.classList.add('is-switching');
    later(() => {
      image.src = abnormalSource;
      image.alt = 'E-7と記されたソース容器と、厨房で撮影された仔羊料理の試作写真';
      figure.classList.remove('is-switching');
      enableHotspot();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
  };

  const openDetails = () => {
    if (!figure.classList.contains('is-anomaly')) return;
    if (window.LornevierGame?.getPhase() !== 2) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (waitingForTransition) return;
    waitingForTransition = true;
    const showAfterTransition = (event) => {
      if (event.detail?.phase !== 2) return;
      document.removeEventListener('lornevier:transition-complete', showAfterTransition);
      waitingForTransition = false;
      if (!dialog.open) dialog.showModal();
    };
    document.addEventListener('lornevier:transition-complete', showAfterTransition);
    document.dispatchEvent(new CustomEvent('lornevier:anomaly-discovered', {
      detail: { phase: 2, nextPhase: 3, source: 'spring-course-image' }
    }));
  };

  figure.addEventListener('click', openDetails);
  figure.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails();
    }
  });
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => figure.focus({ preventScroll: true }));

  const activate = () => {
    if (activated || window.LornevierGame?.getPhase() < 2) return;
    activated = true;
    const preload = new Image();
    preload.onload = () => later(showAbnormalImage, 700);
    preload.src = abnormalSource;
  };

  document.addEventListener('lornevier:phase-changed', activate);
  addEventListener('pageshow', activate);
  activate();
  addEventListener('pagehide', () => timers.forEach((id) => clearTimeout(id)), { once: true });
})();
