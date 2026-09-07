/**
 * Web Audio API synthesized cyberpunk terminal sounds
 * Completely offline, zero asset downloads, memory-efficient
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playTerminalKeySound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export function playBeep(freq = 1200, duration = 0.08, type: OscillatorType = 'sine') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore
  }
}

export function playAlertSound() {
  if (!soundEnabled) return;
  try {
    playBeep(440, 0.1, 'sawtooth');
    setTimeout(() => playBeep(330, 0.15, 'sawtooth'), 100);
  } catch (e) {
    // Ignore
  }
}

export function playSuccessSound() {
  if (!soundEnabled) return;
  try {
    playBeep(880, 0.08, 'sine');
    setTimeout(() => playBeep(1320, 0.12, 'sine'), 70);
  } catch (e) {
    // Ignore
  }
}
