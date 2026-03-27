// ─── Audio Engine ─────────────────────────────────────────────────
// Web Audio API sound effects for Codice

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1, detune: number = 0): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch (_) {
    // Silently ignore audio errors
  }
}

function playNoise(duration: number, volume: number = 0.05): void {
  try {
    const c = getCtx();
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
  } catch (_) {
    // Silently ignore audio errors
  }
}

/** Typewriter key press — mechanical click */
export function playTypewriterKey(): void {
  playNoise(0.04, 0.12);
  playTone(800 + Math.random() * 400, 0.03, 'square', 0.06);
}

/** Typewriter carriage return */
export function playTypewriterReturn(): void {
  playNoise(0.08, 0.08);
  playTone(400, 0.05, 'square', 0.04);
  setTimeout(() => playTone(600, 0.03, 'square', 0.03), 50);
}

/** Correct letter match */
export function playLetterMatch(): void {
  playTone(880, 0.1, 'sine', 0.08);
}

/** Wrong letter */
export function playLetterWrong(): void {
  playTone(200, 0.15, 'sawtooth', 0.06);
}

/** Cipher wheel rotation click */
export function playWheelClick(): void {
  playNoise(0.02, 0.06);
  playTone(1200 + Math.random() * 200, 0.02, 'square', 0.04);
}

/** Decryption success fanfare */
export function playDecryptSuccess(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.1), i * 100);
  });
}

/** Error buzz */
export function playErrorBuzz(): void {
  playTone(100, 0.3, 'sawtooth', 0.08);
  playTone(110, 0.3, 'sawtooth', 0.06, 10);
}

/** Hint reveal */
export function playHintReveal(): void {
  playTone(440, 0.15, 'triangle', 0.08);
  setTimeout(() => playTone(550, 0.15, 'triangle', 0.08), 100);
}

/** Button click */
export function playButtonClick(): void {
  playTone(600, 0.06, 'square', 0.05);
  playNoise(0.02, 0.04);
}

/** Morse dot */
export function playMorseDot(): void {
  playTone(700, 0.08, 'sine', 0.1);
}

/** Morse dash */
export function playMorseDash(): void {
  playTone(700, 0.2, 'sine', 0.1);
}

/** Level start */
export function playLevelStart(): void {
  playTone(330, 0.2, 'triangle', 0.06);
  setTimeout(() => playTone(440, 0.2, 'triangle', 0.06), 150);
  setTimeout(() => playTone(550, 0.3, 'triangle', 0.08), 300);
}

/** Game complete */
export function playGameComplete(): void {
  const melody = [523, 659, 784, 1047, 784, 1047, 1318];
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.1), i * 150);
  });
}

/** Initialize audio context on user interaction */
export function initAudio(): void {
  getCtx();
}
