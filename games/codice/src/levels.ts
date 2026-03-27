// ─── Level Definitions ────────────────────────────────────────────

import { LevelDef } from './types';
import {
  caesarEncrypt,
  reverseEncrypt,
  a1z26Encrypt,
  keywordEncrypt,
  morseEncrypt,
  atbashEncrypt,
  vigenereEncrypt,
} from './ciphers';

// Verify all encryptions at module load time
function verify(encrypted: string, expected: string, label: string): string {
  if (encrypted !== expected) {
    console.warn(`[Codice] Cipher mismatch for ${label}: got "${encrypted}", expected "${expected}"`);
  }
  return encrypted;
}

// Level 1: Caesar ROT3
const l1enc = caesarEncrypt('AMORE', 3);
verify(l1enc, 'DPRUH', 'L1');

// Level 2: Reversed text
const l2enc = reverseEncrypt('ITALIA');
verify(l2enc, 'AILATI', 'L2');

// Level 3: A1Z26
const l3enc = a1z26Encrypt('SOLE');
verify(l3enc, '19-15-12-5', 'L3');

// Level 4: Caesar ROT7
const l4enc = caesarEncrypt('CIELO', 7);
verify(l4enc, 'JPLSV', 'L4');

// Level 5: Keyword cipher with key ROMA
const l5enc = keywordEncrypt('LIBERTA', 'ROMA');
// Answer: LIBERTA, keyword ROMA → substitution alphabet: ROMABCDEFGHIJKLNPQSTUVWXYZ
const l5answer = 'LIBERTA';

// Level 6: Morse code
const l6enc = morseEncrypt('SOLE');

// Level 7: Atbash
const l7enc = atbashEncrypt('PACE');
verify(l7enc, 'KZXV', 'L7');

// Level 8: Vigenere with key LUX
const l8answer = 'VERITA';
const l8enc = vigenereEncrypt(l8answer, 'LUX');

// Level 9: Multi-step (Caesar ROT5, then reversed)
const l9answer = 'SEGRETO';
const l9step1 = caesarEncrypt(l9answer, 5);
const l9enc = reverseEncrypt(l9step1);

// Level 10: Combined (Atbash, then Vigenere with key SPY, then Caesar ROT2)
const l10answer = 'VITTORIA';
const l10step1 = atbashEncrypt(l10answer);
const l10step2 = vigenereEncrypt(l10step1, 'SPY');
const l10enc = caesarEncrypt(l10step2, 2);

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Caesar Semplice',
    subtitle: 'Cifrario di Cesare — ROT3',
    cipherType: 'caesar',
    encrypted: l1enc,
    answer: 'AMORE',
    hint: 'Ogni lettera e spostata di 3 posizioni in avanti',
    toolDescription: 'Ruota la ruota del cifrario per trovare lo spostamento giusto',
    cipherParam: 3,
  },
  {
    id: 2,
    title: 'Specchio',
    subtitle: 'Testo Invertito',
    cipherType: 'reverse',
    encrypted: l2enc,
    answer: 'ITALIA',
    hint: 'Leggi il testo al contrario, come in uno specchio',
    toolDescription: 'Il messaggio e scritto al contrario',
    cipherParam: 0,
  },
  {
    id: 3,
    title: 'Numeri',
    subtitle: 'Cifrario A1Z26',
    cipherType: 'a1z26',
    encrypted: l3enc,
    answer: 'SOLE',
    hint: 'Ogni numero corrisponde a una lettera: A=1, B=2, ... Z=26',
    toolDescription: 'Converti ogni numero nella lettera corrispondente',
    cipherParam: 0,
  },
  {
    id: 4,
    title: 'Caesar Avanzato',
    subtitle: 'Cifrario di Cesare — ROT7',
    cipherType: 'caesar',
    encrypted: l4enc,
    answer: 'CIELO',
    hint: 'Lo spostamento e maggiore di quello del livello 1',
    toolDescription: 'Ruota la ruota per trovare lo spostamento di 7 posizioni',
    cipherParam: 7,
  },
  {
    id: 5,
    title: 'Parola Chiave',
    subtitle: 'Cifrario a Sostituzione — Chiave: ROMA',
    cipherType: 'keyword',
    encrypted: l5enc,
    answer: l5answer,
    hint: 'La chiave ROMA riordina l\'alfabeto: R,O,M,A,B,C,D...',
    toolDescription: 'Usa la tabella di sostituzione con parola chiave ROMA',
    cipherParam: 'ROMA',
  },
  {
    id: 6,
    title: 'Morse',
    subtitle: 'Codice Morse',
    cipherType: 'morse',
    encrypted: l6enc,
    answer: 'SOLE',
    hint: 'Punti e linee: ogni gruppo di simboli e una lettera',
    toolDescription: 'Decodifica il codice Morse usando la tabella di riferimento',
    cipherParam: 0,
  },
  {
    id: 7,
    title: 'Atbash',
    subtitle: 'Cifrario Atbash — Alfabeto Inverso',
    cipherType: 'atbash',
    encrypted: l7enc,
    answer: 'PACE',
    hint: 'A diventa Z, B diventa Y, C diventa X...',
    toolDescription: 'Ogni lettera viene sostituita con il suo speculare nell\'alfabeto',
    cipherParam: 0,
  },
  {
    id: 8,
    title: 'Vigenere',
    subtitle: 'Cifrario di Vigenere — Chiave: LUX',
    cipherType: 'vigenere',
    encrypted: l8enc,
    answer: l8answer,
    hint: 'Usa la griglia di Vigenere con la chiave LUX, ripetuta ciclicamente',
    toolDescription: 'Incrocia riga (chiave) e colonna (testo cifrato) nella griglia',
    cipherParam: 'LUX',
  },
  {
    id: 9,
    title: 'Polialfabetico',
    subtitle: 'Cifratura Multipla — Due passaggi',
    cipherType: 'multi',
    encrypted: l9enc,
    answer: l9answer,
    hint: 'Prima inverti il testo, poi applica Cesare con spostamento 5',
    toolDescription: 'Decifra in due passaggi: prima inverti, poi Cesare ROT-5',
    cipherParam: 0,
    steps: [
      {
        cipherType: 'reverse',
        encrypted: l9enc,
        answer: l9step1,
        param: 0,
        description: 'Passo 1: Inverti il testo',
      },
      {
        cipherType: 'caesar',
        encrypted: l9step1,
        answer: l9answer,
        param: 5,
        description: 'Passo 2: Cesare ROT-5 (sposta indietro di 5)',
      },
    ],
  },
  {
    id: 10,
    title: 'Il Messaggio Finale',
    subtitle: 'Cifratura Combinata — Tre passaggi',
    cipherType: 'multi',
    encrypted: l10enc,
    answer: l10answer,
    hint: 'Tre strati: prima Cesare ROT-2, poi Vigenere (SPY) inverso, poi Atbash',
    toolDescription: 'Decifra in tre passaggi usando tutti gli strumenti appresi',
    cipherParam: 0,
    steps: [
      {
        cipherType: 'caesar',
        encrypted: l10enc,
        answer: l10step2,
        param: 2,
        description: 'Passo 1: Cesare ROT-2 (sposta indietro di 2)',
      },
      {
        cipherType: 'vigenere',
        encrypted: l10step2,
        answer: l10step1,
        param: 'SPY',
        description: 'Passo 2: Vigenere inverso con chiave SPY',
      },
      {
        cipherType: 'atbash',
        encrypted: l10step1,
        answer: l10answer,
        param: 0,
        description: 'Passo 3: Atbash (alfabeto inverso)',
      },
    ],
  },
];
