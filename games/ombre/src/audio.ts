// ─── Web Audio API Sound Engine ──────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0,
): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration: number, volume: number = 0.03): void {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playDiscoveryChime(): void {
  playTone(523, 0.3, 'sine', 0.12, 0);
  playTone(659, 0.3, 'sine', 0.12, 0.1);
  playTone(784, 0.4, 'sine', 0.15, 0.2);
  playTone(1047, 0.5, 'triangle', 0.1, 0.3);
}

export function playCaseSolved(): void {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, 0.4, 'sine', 0.12, i * 0.15);
    playTone(freq * 0.5, 0.4, 'triangle', 0.06, i * 0.15);
  });
}

export function playClick(): void {
  playTone(300, 0.08, 'square', 0.05);
}

export function playWrongClick(): void {
  playTone(150, 0.15, 'sawtooth', 0.04);
}

export function playMenuHover(): void {
  playTone(600, 0.06, 'sine', 0.04);
}

export function playLevelStart(): void {
  playNoise(1.5, 0.02);
  playTone(220, 0.8, 'sine', 0.06, 0.3);
  playTone(330, 0.8, 'sine', 0.06, 0.6);
}

export function playAmbientDrone(): void {
  const ctx = getCtx();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 55;
  osc2.type = 'sine';
  osc2.frequency.value = 82.5;
  gain.gain.value = 0.03;
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start();
  osc2.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
    }, 2000);
  }, 8000);
}

export function initAudio(): void {
  getCtx();
}
