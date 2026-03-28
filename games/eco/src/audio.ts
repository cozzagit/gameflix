let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientRunning = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

/** Deep sonar ping when player emits a pulse */
export function playSonarPing(): void {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.8);

  // Harmonic layer
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(360, now);
  osc2.frequency.exponentialRampToValueAtTime(120, now + 0.5);

  const gain2 = ac.createGain();
  gain2.gain.setValueAtTime(0.12, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc2.connect(gain2);
  gain2.connect(getMaster());
  osc2.start(now);
  osc2.stop(now + 0.5);
}

/** Echo return — softer, delayed */
export function playEchoReturn(delay: number = 0.1): void {
  const ac = getCtx();
  const now = ac.currentTime + delay;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.35);
}

/** Water echo — more reverberant feel */
export function playWaterEcho(delay: number = 0.1): void {
  const ac = getCtx();
  const now = ac.currentTime + delay;

  for (let i = 0; i < 3; i++) {
    const t = now + i * 0.08;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 - i * 60, t);
    osc.frequency.exponentialRampToValueAtTime(200 - i * 30, t + 0.25);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.06 - i * 0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(getMaster());
    osc.start(t);
    osc.stop(t + 0.35);
  }
}

/** Bright crystal chime */
export function playCrystalChime(): void {
  const ac = getCtx();
  const now = ac.currentTime;
  const freqs = [880, 1320, 1760];

  freqs.forEach((f, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.15, now + i * 0.06 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.6);

    osc.connect(gain);
    gain.connect(getMaster());
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.65);
  });
}

/** Low warning buzz near hazards */
export function playHazardBuzz(): void {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 80;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.45);
}

/** Level complete fanfare */
export function playLevelComplete(): void {
  const ac = getCtx();
  const now = ac.currentTime;
  const notes = [440, 554, 659, 880];

  notes.forEach((f, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

    osc.connect(gain);
    gain.connect(getMaster());
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.55);
  });
}

/** Game over / fail sound */
export function playFail(): void {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.75);
}

/** Start ambient cave drone */
export function startAmbient(): void {
  if (ambientRunning) return;
  const ac = getCtx();
  ambientRunning = true;

  ambientOsc = ac.createOscillator();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.value = 42;

  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;

  const lfoGain = ac.createGain();
  lfoGain.gain.value = 5;
  lfo.connect(lfoGain);
  lfoGain.connect(ambientOsc.frequency);

  ambientGain = ac.createGain();
  ambientGain.gain.value = 0.04;

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  ambientOsc.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(getMaster());

  ambientOsc.start();
  lfo.start();

  // Drip sounds at random intervals
  scheduleDrip();
}

function scheduleDrip(): void {
  if (!ambientRunning) return;
  const delay = 2000 + Math.random() * 6000;
  setTimeout(() => {
    if (!ambientRunning) return;
    playDrip();
    scheduleDrip();
  }, delay);
}

function playDrip(): void {
  const ac = getCtx();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200 + Math.random() * 600, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Stop ambient */
export function stopAmbient(): void {
  ambientRunning = false;
  if (ambientOsc) {
    try { ambientOsc.stop(); } catch (_) { /* already stopped */ }
    ambientOsc = null;
  }
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

/** Soft footstep */
export function playStep(): void {
  const ac = getCtx();
  const now = ac.currentTime;

  const bufferSize = ac.sampleRate * 0.04;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const gain = ac.createGain();
  gain.gain.value = 0.02;

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  source.start(now);
}
