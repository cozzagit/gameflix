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

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playPlace(): void {
  playTone(440, 0.1, 'sine', 0.1);
  playTone(660, 0.1, 'sine', 0.08);
}

export function playRotate(): void {
  playTone(520, 0.08, 'triangle', 0.1);
}

export function playRemove(): void {
  playTone(330, 0.12, 'sine', 0.08);
}

export function playActivate(): void {
  playTone(523, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 80);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.12), 160);
}

export function playLevelComplete(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.15), i * 120);
  });
}

export function playClick(): void {
  playTone(600, 0.05, 'sine', 0.08);
}

export function playError(): void {
  playTone(200, 0.2, 'square', 0.06);
}
