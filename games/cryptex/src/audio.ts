/**
 * Audio system using Web Audio API.
 * All sounds are procedurally generated -- no external files.
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
  // Play a silent buffer to unlock
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  audioUnlocked = true;
}

/** Short metallic click for wheel snapping */
export function playWheelClick(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.setValueAtTime(2800, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 5;

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.06);
}

/** Subtle friction sound while dragging */
export function playWheelSlide(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const duration = 0.04;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.03 * (1 - i / bufferSize);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());

  src.start(now);
}

/** Ascending chime + mechanical unlocking for solve */
export function playSolve(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Mechanical unlock clunk
  const noise = ctx.createBufferSource();
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.15), ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
  }
  noise.buffer = noiseBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.2;
  const noiseFilt = ctx.createBiquadFilter();
  noiseFilt.type = 'lowpass';
  noiseFilt.frequency.value = 600;
  noise.connect(noiseFilt);
  noiseFilt.connect(noiseGain);
  noiseGain.connect(getMaster());
  noise.start(now);

  // Ascending chimes
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + 0.15 + i * 0.12;

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(getMaster());

    osc.start(t);
    osc.stop(t + 0.6);

    // Add harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.04, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(getMaster());
    osc2.start(t);
    osc2.stop(t + 0.4);
  });

  // Final shimmer
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.value = 1046.5;
  shimmerGain.gain.setValueAtTime(0, now + 0.6);
  shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.7);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(getMaster());
  shimmer.start(now + 0.6);
  shimmer.stop(now + 2.0);
}

/** Soft chime for hint reveal */
export function playHintReveal(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(getMaster());

  osc.start(now);
  osc.stop(now + 0.4);
}

/** Button click sound */
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
