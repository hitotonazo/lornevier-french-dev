(() => {
  'use strict';

  const init = ({ state, storagePrefix = 'siteAlteration', debugParam = 'debug', labels = {} } = {}) => {
    const debugKey = `${storagePrefix}Debug`;
    const panelKey = `${storagePrefix}DebugPanelVisible`;
    const text = { play: '演出を再生', hide: 'パネルを隠す', exit: 'デバッグ終了', current: '現在', phase: '状態', ...labels };
    let panel = null;
    const read = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };
    const write = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };
    const remove = (key) => { try { sessionStorage.removeItem(key); } catch {} };
    const params = new URLSearchParams(location.search);
    if (params.get(debugParam) === '1') { write(debugKey, 'true'); if (read(panelKey) === null) write(panelKey, 'true'); }
    const enabled = () => read(debugKey) === 'true';
    const editable = (target) => target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    const play = () => { if (enabled() && !window.SiteAlteration?.isPlaying()) window.SiteAlteration?.play(); };
    const setVisible = (visible) => { if (panel) panel.hidden = !visible; write(panelKey, String(visible)); };
    const create = () => {
      if (!enabled() || panel) return;
      panel = document.createElement('aside');
      panel.className = 'site-alteration-debug';
      panel.setAttribute('aria-label', 'デバッグパネル');
      const phases = state?.phases || [];
      const current = state?.getPhase?.() || '-';
      panel.innerHTML = `<div class="site-alteration-debug__heading">DEBUG <span data-debug-current>${current}</span></div><div class="site-alteration-debug__body"><p>${text.current}: <strong data-debug-current>${current}</strong></p>${phases.length ? `<div class="site-alteration-debug__phases" aria-label="${text.phase}変更">${phases.map((phase) => `<button type="button" data-debug-phase="${phase}">${phase}</button>`).join('')}</div>` : ''}<button type="button" data-debug-play>${text.play}</button><button type="button" data-debug-hide>${text.hide}</button><button type="button" data-debug-exit>${text.exit}</button></div>`;
      document.body.append(panel);
      setVisible(read(panelKey) !== 'false');
      panel.querySelectorAll('[data-debug-phase]').forEach((button) => button.addEventListener('click', () => state?.setPhase?.(button.dataset.debugPhase)));
      panel.querySelector('[data-debug-play]')?.addEventListener('click', play);
      panel.querySelector('[data-debug-hide]')?.addEventListener('click', () => setVisible(false));
      panel.querySelector('[data-debug-exit]')?.addEventListener('click', () => {
        remove(debugKey);
        remove(panelKey);
        params.delete(debugParam);
        const query = params.toString();
        history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
        panel.remove();
        panel = null;
      });
    };
    addEventListener('keydown', (event) => {
      if (!enabled() || editable(event.target)) return;
      if (event.altKey && event.shiftKey && event.code === 'KeyA') { event.preventDefault(); play(); }
      if (event.altKey && event.shiftKey && event.code === 'KeyD') { event.preventDefault(); if (!panel) create(); setVisible(panel?.hidden ?? true); }
    });
    document.addEventListener('DOMContentLoaded', create);
    return { isEnabled: enabled, show: () => { create(); setVisible(true); }, hide: () => setVisible(false), destroy: () => panel?.remove() };
  };
  window.SiteAlterationDebug = { init };
})();
