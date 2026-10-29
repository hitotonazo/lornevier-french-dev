(() => {
  'use strict';

  const figure = document.querySelector('[data-spring-course-image]');
  const image = figure?.querySelector('img');
  const dialog = document.querySelector('[data-spring-course-dialog]');
  const closeButton = dialog?.querySelector('[data-arg-dialog-close]');
  if (!figure || !image || !dialog) return;

  const abnormalSource = 'images/course-spring-abnormal.webp?v=20261028-2';
  const courseTitle = document.querySelector('#past-course-title');
  let activated = false;
  let waitingForTransition = false;

  const enableHotspot = () => {
    figure.classList.add('is-anomaly', 'arg-hotspot');
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-haspopup', 'dialog');
    figure.setAttribute('aria-controls', dialog.id);
    figure.setAttribute('aria-label', '春の特別コースの試作写真と厨房メモを確認する');
  };

  const showAbnormalImage = (immediate = false) => {
    if (figure.classList.contains('is-revealed')) return;
    if (immediate) {
      image.src = abnormalSource;
      image.alt = 'E-7と記された褐色の薬品瓶と、厨房で撮影された仔羊料理の試作写真';
      figure.classList.add('is-revealed');
      enableHotspot();
      return;
    }
    const abnormalImage = document.createElement('img');
    abnormalImage.src = abnormalSource;
    abnormalImage.alt = 'E-7と記された褐色の薬品瓶と、厨房で撮影された仔羊料理の試作写真';
    abnormalImage.className = 'past-course__abnormal-image';
    abnormalImage.width = 1536;
    abnormalImage.height = 1024;
    figure.append(abnormalImage);
    enableHotspot();
    window.LornevierGame?.markSpringCourseRevealed();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      figure.classList.add('is-revealed');
    }));
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
    if (activated || !courseTitle || window.LornevierGame?.getPhase() < 2) return;
    activated = true;
    if (window.LornevierGame?.getState().springCourseRevealed) {
      showAbnormalImage(true);
      return;
    }
    const preload = new Image();
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      if (preload.complete && preload.naturalWidth) showAbnormalImage();
      else preload.onload = showAbnormalImage;
    });
    observer.observe(courseTitle);
    preload.src = abnormalSource;
  };

  document.addEventListener('lornevier:phase-changed', activate);
  addEventListener('pageshow', activate);
  activate();
})();
