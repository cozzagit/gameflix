/**
 * Audio system using Web Audio API.
 * All sounds are procedurally generated — no external files.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let audioUnlocked = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

export function unlockAudio(): void {
  if (audioUnlocked) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  audioUnlocked = true;
}

/** Soft tap when selecting a hex tile */
export function playHexSelect(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.08);
}

/** Gentle chime when extending the selection path */
export function playHexTrace(stepIndex: number): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const baseFreq = 440 + stepIndex * 60;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.1);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.12);
}

/** Ascending golden chime when a word is found */
export function playWordFound(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.1;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(getMaster());

    osc.start(t);
    osc.stop(t + 0.5);

    // Harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.04, t + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc2.connect(gain2);
    gain2.connect(getMaster());
    osc2.start(t);
    osc2.stop(t + 0.3);
  });
}

/** Error buzz when wrong word is submitted */
export function playError(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.linearRampToValueAtTime(100, now + 0.15);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.2);
}

/** Grand fanfare when level is completed */
export function playLevelComplete(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Ascending arpeggio
  const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.08;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(getMaster());
    osc.start(t);
    osc.stop(t + 0.8);
  });

  // Shimmer
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.value = 1046.5;
  shimmerGain.gain.setValueAtTime(0, now + 0.5);
  shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.6);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(getMaster());
  shimmer.start(now + 0.5);
  shimmer.stop(now + 2.0);
}

/** Button click */
export function playButtonClick(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.08);
}
