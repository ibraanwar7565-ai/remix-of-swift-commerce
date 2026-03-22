// Notification sound utility using Web Audio API — no external files needed

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a short alert chime using oscillators.
 * type: 'delivery' = two-tone chime for rider assignments
 * type: 'order'    = three-tone alert for new admin orders
 */
export function playNotificationSound(type: 'delivery' | 'order' = 'delivery') {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);

    if (type === 'delivery') {
      // Two-tone rising chime: C5 → E5
      const notes = [523.25, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        osc.connect(gain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.15);
      });
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);
    } else {
      // Three-tone urgent alert: G4 → B4 → D5
      const notes = [392, 493.88, 587.33];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        osc.connect(gain);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.12);
      });
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
    }
  } catch (e) {
    // Audio not supported — fail silently
    console.warn('Audio playback failed:', e);
  }
}
