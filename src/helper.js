export function fmt(s) {
  if (s === undefined || s === null || s === '' || isNaN(s)) return '—';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function loadAudioDuration(url) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return; }
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null), { once: true });
    audio.addEventListener('error', () => resolve(null), { once: true });
    audio.src = url;
  });
}

export function makeLocalId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const EMOJIS = ['♪', '🎸', '🥁', '🎹', '🎺', '🎻', '🎤', '🔊'];