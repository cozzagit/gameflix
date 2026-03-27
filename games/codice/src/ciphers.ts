// ─── Cipher Engine ────────────────────────────────────────────────
// All cipher encode/decode functions for Codice

import { ALPHABET } from './types';

/** Caesar cipher: shift each letter by `shift` positions */
export function caesarEncrypt(text: string, shift: number): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      return ALPHABET[(idx + shift + 26) % 26];
    })
    .join('');
}

export function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}

/** Reverse text */
export function reverseEncrypt(text: string): string {
  return text.toUpperCase().split('').reverse().join('');
}

export function reverseDecrypt(text: string): string {
  return reverseEncrypt(text);
}

/** A1Z26: A=1, B=2, ... Z=26 */
export function a1z26Encrypt(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      return String(idx + 1);
    })
    .join('-');
}

export function a1z26Decrypt(encoded: string): string {
  return encoded
    .split('-')
    .map((num) => {
      const n = parseInt(num.trim(), 10);
      if (isNaN(n) || n < 1 || n > 26) return '?';
      return ALPHABET[n - 1];
    })
    .join('');
}

/** Atbash: A↔Z, B↔Y, etc. */
export function atbashEncrypt(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      return ALPHABET[25 - idx];
    })
    .join('');
}

export function atbashDecrypt(text: string): string {
  return atbashEncrypt(text); // Atbash is its own inverse
}

/** Morse code maps */
const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const MORSE_REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(MORSE_MAP)) {
  MORSE_REVERSE[v] = k;
}

export function morseEncrypt(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      if (ch === ' ') return '/';
      return MORSE_MAP[ch] || ch;
    })
    .join(' ');
}

export function morseDecrypt(encoded: string): string {
  return encoded
    .split(' ')
    .map((code) => {
      if (code === '/' || code === '') return ' ';
      return MORSE_REVERSE[code] || '?';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keyword cipher: build substitution alphabet using a keyword */
export function buildKeywordAlphabet(keyword: string): string {
  const key = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  const seen = new Set<string>();
  let result = '';
  for (const ch of key) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result += ch;
    }
  }
  for (const ch of ALPHABET) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result += ch;
    }
  }
  return result;
}

export function keywordEncrypt(text: string, keyword: string): string {
  const sub = buildKeywordAlphabet(keyword);
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      return sub[idx];
    })
    .join('');
}

export function keywordDecrypt(text: string, keyword: string): string {
  const sub = buildKeywordAlphabet(keyword);
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = sub.indexOf(ch);
      if (idx === -1) return ch;
      return ALPHABET[idx];
    })
    .join('');
}

/** Vigenere cipher */
export function vigenereEncrypt(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  let ki = 0;
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      const shift = ALPHABET.indexOf(k[ki % k.length]);
      ki++;
      return ALPHABET[(idx + shift) % 26];
    })
    .join('');
}

export function vigenereDecrypt(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  let ki = 0;
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch);
      if (idx === -1) return ch;
      const shift = ALPHABET.indexOf(k[ki % k.length]);
      ki++;
      return ALPHABET[(idx - shift + 26) % 26];
    })
    .join('');
}

/** Get Morse code map for display */
export function getMorseMap(): Record<string, string> {
  return { ...MORSE_MAP };
}

/** Frequency analysis: count letter occurrences in text */
export function frequencyAnalysis(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of ALPHABET) counts[ch] = 0;
  for (const ch of text.toUpperCase()) {
    if (ALPHABET.includes(ch)) counts[ch]++;
  }
  return counts;
}
