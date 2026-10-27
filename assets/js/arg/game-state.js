(() => {
  'use strict';

  const STORAGE_KEY = 'lornevier:game:v1';
  const createDefaultState = () => ({
    version: 1,
    phase: 1,
    discovered: { phase1: false, phase2: false, phase3: false },
    visitedTruth: false,
    endingSeen: false
  });
  let memoryState = createDefaultState();
  let storageUsable = true;
  let transitioning = false;

  const cloneState = (state) => ({ ...state, discovered: { ...state.discovered } });

  const normalize = (value) => {
    if (!value || value.version !== 1) return createDefaultState();
    const phase = Number(value.phase);
    const validPhase = Number.isInteger(phase) && phase >= 1 && phase <= 4 ? phase : 1;
    const storedDiscoveries = value.discovered && typeof value.discovered === 'object' ? value.discovered : {};
    return {
      version: 1,
      phase: validPhase,
      discovered: {
        phase1: storedDiscoveries.phase1 === true || validPhase >= 2,
        phase2: storedDiscoveries.phase2 === true || validPhase >= 3,
        phase3: storedDiscoveries.phase3 === true || validPhase >= 4
      },
      visitedTruth: value.visitedTruth === true,
      endingSeen: value.endingSeen === true
    };
  };

  const read = () => {
    if (!storageUsable) return cloneState(memoryState);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      memoryState = stored ? normalize(JSON.parse(stored)) : createDefaultState();
    } catch {
      memoryState = createDefaultState();
      storageUsable = false;
    }
    return cloneState(memoryState);
  };

  const write = (next, { allowRegression = false } = {}) => {
    const current = read();
    const normalized = normalize(next);
    if (!allowRegression) normalized.phase = Math.max(current.phase, normalized.phase);
    memoryState = normalized;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch { storageUsable = false; }
    const result = cloneState(normalized);
    document.dispatchEvent(new CustomEvent('lornevier:phase-changed', { detail: result }));
    return result;
  };

  const reset = () => {
    memoryState = createDefaultState();
    try { localStorage.removeItem(STORAGE_KEY); } catch { storageUsable = false; }
    document.dispatchEvent(new CustomEvent('lornevier:phase-changed', { detail: cloneState(memoryState) }));
  };

  const debugSet = (label) => {
    if (label === 'RESET') {
      reset();
      return;
    }
    const current = read();
    if (label === 'TRUTH_READ') {
      write({ ...current, phase: 4, discovered: { phase1: true, phase2: true, phase3: true }, visitedTruth: true, endingSeen: false }, { allowRegression: true });
      return;
    }
    const match = /^PHASE([1-4])$/.exec(label);
    if (match) {
      const phase = Number(match[1]);
      write({
        ...current,
        phase,
        discovered: { phase1: phase >= 2, phase2: phase >= 3, phase3: phase >= 4 },
        visitedTruth: false,
        endingSeen: false
      }, { allowRegression: true });
    }
  };

  const stateLabel = () => {
    const state = read();
    return state.visitedTruth ? 'TRUTH_READ' : `PHASE${state.phase}`;
  };

  const game = {
    storageKey: STORAGE_KEY,
    getState: read,
    getPhase: () => read().phase,
    canAccessTruth: () => read().phase >= 4,
    markTruthVisited: () => write({ ...read(), visitedTruth: true }),
    markEndingSeen: () => write({ ...read(), phase: 4, visitedTruth: true, endingSeen: true }),
    reset,
    debugSet
  };
  window.LornevierGame = game;

  document.addEventListener('lornevier:anomaly-discovered', async (event) => {
    const phase = Number(event.detail?.phase);
    const nextPhase = Number(event.detail?.nextPhase);
    const discoveryKey = `phase${phase}`;
    const current = read();
    if (transitioning || window.SiteAlteration?.isPlaying?.() || current.phase !== phase || current.discovered[discoveryKey] || nextPhase !== phase + 1 || nextPhase > 4) {
      document.dispatchEvent(new CustomEvent('lornevier:transition-complete', {
        detail: { phase, nextPhase, advanced: current.phase >= nextPhase }
      }));
      return;
    }
    transitioning = true;
    write({
      ...current,
      phase: nextPhase,
      discovered: { ...current.discovered, [discoveryKey]: true }
    });
    try {
      if (window.SiteAlteration?.play) {
        await window.SiteAlteration.play({ message: 'サイトが改変されました。' });
      }
    } finally {
      transitioning = false;
      document.dispatchEvent(new CustomEvent('lornevier:transition-complete', {
        detail: { phase, nextPhase, advanced: read().phase >= nextPhase }
      }));
    }
  });

  document.addEventListener('lornevier:reset-requested', () => {
    reset();
    location.assign('index.html');
  });

  addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    const state = read();
    document.dispatchEvent(new CustomEvent('lornevier:phase-changed', { detail: state }));
    location.reload();
  });

  window.SiteAlterationDebug?.init({
    storagePrefix: 'lornevier',
    state: {
      phases: ['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'TRUTH_READ', 'RESET'],
      getPhase: stateLabel,
      setPhase: (label) => {
        debugSet(label);
        location.reload();
      }
    },
    labels: { phase: 'PHASE変更', current: '現在の状態' }
  });
})();
