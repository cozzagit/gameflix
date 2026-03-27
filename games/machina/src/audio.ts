// ============================================================
// Machina — Audio Engine (Web Audio API synthesis)
// ============================================================

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initAudio(): void {
  // Pre-create context on user gesture
  ctx();
}

/** Short metallic clank */
export function playClank(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.12;

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (ac.sampleRate * 0.02));
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  bp.Q.value = 8;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(bp).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

/** Gear grinding */
export function playGearGrind(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.15;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.linearRampToValueAtTime(80, t + dur);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;

  osc.connect(lp).connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}

/** Lever click */
export function playLeverClick(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.06;

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (ac.sampleRate * 0.008));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(hp).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

/** Steam hiss */
export function playSteamHiss(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.6;

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (ac.sampleRate * 0.2));
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const src = ac.createBufferSource();
  src.buffer = buf;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.linearRampToValueAtTime(0, t + dur);

  src.connect(hp).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

/** Success chime — ascending harmonics */
export function playSuccess(): void {
  const ac = ctx();
  const t = ac.currentTime;

  const freqs = [523.25, 659.25, 783.99, 1046.50];
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const gain = ac.createGain();
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/** Fluid flow — low modulated rumble */
export function playFluidFlow(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.4;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 80;

  const lfo = ac.createOscillator();
  lfo.frequency.value = 6;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 20;
  lfo.connect(lfoGain).connect(osc.frequency);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.linearRampToValueAtTime(0.001, t + dur);

  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur);
  lfo.stop(t + dur);
}

/** Electrical buzz */
export function playElectricalBuzz(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.3;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 60;

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;

  const merger = ac.createGain();
  merger.gain.value = 0.08;

  const gain2 = ac.createGain();
  gain2.gain.value = 0.06;

  osc.connect(merger).connect(ac.destination);
  noise.connect(gain2).connect(ac.destination);

  merger.gain.setValueAtTime(0.08, t);
  merger.gain.exponentialRampToValueAtTime(0.001, t + dur);
  gain2.gain.setValueAtTime(0.06, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.start(t);
  noise.start(t);
  osc.stop(t + dur);
  noise.stop(t + dur);
}

/** Dial tick */
export function playDialTick(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.03;

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (ac.sampleRate * 0.005));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 5000;
  bp.Q.value = 5;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(bp).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

/** Heavy mechanical clunk for lock opening */
export function playHeavyClunk(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.25;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + dur);

  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (ac.sampleRate * 0.04));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.2, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;

  osc.connect(lp).connect(gain).connect(ac.destination);
  noise.connect(noiseGain).connect(ac.destination);
  osc.start(t);
  noise.start(t);
  osc.stop(t + dur);
  noise.stop(t + dur);
}

/** Pipe rotation click */
export function playPipeClick(): void {
  const ac = ctx();
  const t = ac.currentTime;
  const dur = 0.08;

  const osc = ac.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + dur);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}
