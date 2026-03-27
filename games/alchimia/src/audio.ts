let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function resumeAudio(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15, detune: number = 0): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.05): void {
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
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playCombineWhoosh(): void {
  playNoise(0.3, 0.06);
  playTone(300, 0.2, 'sine', 0.08);
  playTone(500, 0.15, 'sine', 0.06);
}

export function playDiscoveryChime(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.5);
  });
}

export function playInvalidThud(): void {
  playTone(80, 0.15, 'square', 0.1);
  playNoise(0.1, 0.08);
}

export function playChapterFanfare(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const melody = [
    { freq: 523, time: 0 },
    { freq: 659, time: 0.15 },
    { freq: 784, time: 0.3 },
    { freq: 1047, time: 0.5 },
    { freq: 784, time: 0.65 },
    { freq: 1047, time: 0.8 },
    { freq: 1318, time: 1.0 },
  ];
  melody.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.12, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + time);
    osc.stop(now + time + 0.4);
  });
}

export function playPickup(): void {
  playTone(440, 0.08, 'sine', 0.06);
}

export function playDrop(): void {
  playTone(220, 0.08, 'sine', 0.04);
}

export function playClick(): void {
  playTone(660, 0.05, 'sine', 0.05);
}
