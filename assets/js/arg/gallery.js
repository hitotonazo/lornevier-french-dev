(() => {
  'use strict';

  const region = document.querySelector('[data-gallery-anomaly-region]');
  const family = region?.querySelector('[data-gallery-family]');
  const couple = region?.querySelector('[data-gallery-couple]');
  const dialog = document.querySelector('[data-gallery-photo-dialog]');
  const dialogImage = dialog?.querySelector('[data-gallery-dialog-image]');
  const dialogTitle = dialog?.querySelector('[data-gallery-dialog-title]');
  const dialogDetails = dialog?.querySelector('[data-gallery-dialog-details]');
  const closeButton = dialog?.querySelector('[data-arg-dialog-close]');
  if (!region || !family || !couple || !dialog || !dialogImage || !dialogTitle || !dialogDetails) return;

  const items = {
    family: {
      figure: family,
      source: 'images/gallery-family-abnormal.webp?v=20261028-1',
      width: 1536,
      height: 1024,
      alt: '同じ家族4人の食事風景で、父親が肉を勢いよく頬張り、家族が困惑している様子',
      title: 'ご家族で囲む食卓',
      details: '<p><span>撮影日時</span>2026年3月14日・ディナー</p><p><span>掲載下書き</span>掲載用写真の差し替え確認中。ご同席の方より、当日のご様子についてお問い合わせあり。</p><blockquote>「前は家族で食べるのが楽しみだったんです」</blockquote>'
    },
    couple: {
      figure: couple,
      source: 'images/gallery-couple-abnormal.webp?v=20261028-1',
      width: 1672,
      height: 941,
      alt: '同じ夫婦の記念日の食事風景で、妻が身を乗り出して肉料理を食べ、夫が不安そうに見ている様子',
      title: 'お二人で過ごす記念日',
      details: '<p><span>撮影情報</span>2026年春・記念日ディナー</p><p><span>掲載確認</span>掲載写真の差し替え確認中。</p><blockquote>「次はあのソースの出るコースでお願いできませんか」</blockquote><p><span>シェフへの申し送り</span><strong>次回の特別提供、先日の記念日のお客様で調整中。</strong></p>'
    }
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Set();
  let activeTrigger = null;
  let activated = false;
  let waitingForTransition = false;
  let pendingDiscovery = false;

  const later = (callback, delay) => {
    const id = setTimeout(() => {
      timers.delete(id);
      callback();
    }, delay);
    timers.add(id);
  };

  const makeInteractive = (item, key) => {
    const figure = item.figure;
    figure.classList.add('is-anomaly', 'arg-hotspot');
    figure.dataset.galleryAnomaly = key;
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-haspopup', 'dialog');
    figure.setAttribute('aria-controls', dialog.id);
    figure.setAttribute('aria-label', `${item.title}の写真詳細を確認する`);
  };

  const swap = (item, key) => {
    const image = item.figure.querySelector('img');
    item.figure.classList.add('is-switching');
    later(() => {
      image.src = item.source;
      image.alt = item.alt;
      item.figure.classList.remove('is-switching');
      makeInteractive(item, key);
    }, reducedMotion ? 0 : 240);
  };

  const openDetails = (key) => {
    const item = items[key];
    if (!item?.figure.classList.contains('is-anomaly')) return;
    activeTrigger = item.figure;
    dialogImage.src = item.source;
    dialogImage.width = item.width;
    dialogImage.height = item.height;
    dialogImage.alt = item.alt;
    dialogTitle.textContent = item.title;
    dialogDetails.innerHTML = item.details;
    if (window.LornevierGame?.getPhase() === 3 && !waitingForTransition) pendingDiscovery = true;
    if (!dialog.open) dialog.showModal();
  };

  region.addEventListener('click', (event) => {
    const target = event.target.closest('[data-gallery-anomaly]');
    if (target && region.contains(target)) openDetails(target.dataset.galleryAnomaly);
  });
  region.addEventListener('keydown', (event) => {
    const target = event.target.closest('[data-gallery-anomaly]');
    if (target && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openDetails(target.dataset.galleryAnomaly);
    }
  });
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    activeTrigger?.focus({ preventScroll: true });
    if (!pendingDiscovery || waitingForTransition || window.LornevierGame?.getPhase() !== 3) return;
    pendingDiscovery = false;
    waitingForTransition = true;
    document.dispatchEvent(new CustomEvent('lornevier:anomaly-discovered', {
      detail: { phase: 3, nextPhase: 4, source: 'gallery-anomaly-region' }
    }));
  });

  const activate = () => {
    if (activated || window.LornevierGame?.getPhase() < 3) return;
    activated = true;
    Promise.all(Object.values(items).map((item) => new Promise((resolve, reject) => {
      const preload = new Image();
      preload.onload = resolve;
      preload.onerror = reject;
      preload.src = item.source;
    }))).then(() => {
      later(() => swap(items.family, 'family'), reducedMotion ? 0 : 600);
      later(() => swap(items.couple, 'couple'), reducedMotion ? 150 : 3000);
    }).catch(() => {});
  };

  document.addEventListener('lornevier:phase-changed', activate);
  addEventListener('pageshow', activate);
  activate();
  addEventListener('pagehide', () => timers.forEach((id) => clearTimeout(id)), { once: true });
})();
