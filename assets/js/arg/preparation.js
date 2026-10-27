(() => {
  'use strict';

  const game = window.LornevierGame;
  const ending = document.querySelector('[data-truth-ending]');
  const shareButton = document.querySelector('[data-x-share]');

  const guardTruth = () => {
    if (!game?.canAccessTruth()) {
      document.documentElement.classList.add('is-truth-pending');
      location.replace('index.html');
      return false;
    }
    document.documentElement.classList.remove('is-truth-pending');
    if (!game.getState().visitedTruth) game.markTruthVisited();
    return true;
  };

  if (!guardTruth() || !shareButton || !ending) return;

  const sourceUrl = 'https://x.com/ARG_ObserverX';
  const shareText = `あの料理、もう「おいしそう」とは思えない。

#おかしなサイト

${sourceUrl}`;

  shareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const markEnding = () => {
    if (!game.getState().endingSeen) game.markEndingSeen();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      markEnding();
      observer.disconnect();
    }, { threshold: .25 });
    observer.observe(ending);
  } else {
    shareButton.addEventListener('focus', markEnding, { once: true });
    shareButton.addEventListener('click', markEnding, { once: true });
  }

  document.addEventListener('lornevier:phase-changed', guardTruth);
  addEventListener('pageshow', guardTruth);
})();
