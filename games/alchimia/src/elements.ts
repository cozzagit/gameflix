import { ElementDef } from './types';

export const ELEMENTS: Record<string, ElementDef> = {
  // Base 4 (depth 0)
  terra:      { id: 'terra',      name: 'Terra',      category: 'base',     color: '#8B6914', glowColor: '#C49B2F', depth: 0 },
  acqua:      { id: 'acqua',      name: 'Acqua',      category: 'base',     color: '#2196F3', glowColor: '#64B5F6', depth: 0 },
  fuoco:      { id: 'fuoco',      name: 'Fuoco',      category: 'base',     color: '#FF5722', glowColor: '#FF8A65', depth: 0 },
  aria:       { id: 'aria',       name: 'Aria',        category: 'base',     color: '#B0BEC5', glowColor: '#ECEFF1', depth: 0 },

  // Depth 1 - direct base combos
  fango:      { id: 'fango',      name: 'Fango',      category: 'naturali', color: '#795548', glowColor: '#A1887F', depth: 1 },
  lava:       { id: 'lava',       name: 'Lava',       category: 'energia',  color: '#E65100', glowColor: '#FF6D00', depth: 1 },
  polvere:    { id: 'polvere',    name: 'Polvere',    category: 'materia',  color: '#BCAAA4', glowColor: '#D7CCC8', depth: 1 },
  vapore:     { id: 'vapore',     name: 'Vapore',     category: 'energia',  color: '#B3E5FC', glowColor: '#E1F5FE', depth: 1 },
  nuvola:     { id: 'nuvola',     name: 'Nuvola',     category: 'celesti',  color: '#CFD8DC', glowColor: '#ECEFF1', depth: 1 },
  energia:    { id: 'energia',    name: 'Energia',    category: 'energia',  color: '#FFD600', glowColor: '#FFFF00', depth: 1 },
  mare:       { id: 'mare',       name: 'Mare',       category: 'naturali', color: '#0D47A1', glowColor: '#1565C0', depth: 1 },
  sole:       { id: 'sole',       name: 'Sole',       category: 'celesti',  color: '#FFB300', glowColor: '#FFD54F', depth: 1 },
  vento:      { id: 'vento',      name: 'Vento',      category: 'celesti',  color: '#90CAF9', glowColor: '#BBDEFB', depth: 1 },

  // Depth 2
  pietra:     { id: 'pietra',     name: 'Pietra',     category: 'materia',  color: '#78909C', glowColor: '#B0BEC5', depth: 2 },
  pioggia:    { id: 'pioggia',    name: 'Pioggia',    category: 'celesti',  color: '#42A5F5', glowColor: '#90CAF9', depth: 2 },
  fulmine:    { id: 'fulmine',    name: 'Fulmine',    category: 'energia',  color: '#FFEA00', glowColor: '#FFFF8D', depth: 2 },
  mattone:    { id: 'mattone',    name: 'Mattone',    category: 'materia',  color: '#BF360C', glowColor: '#E64A19', depth: 2 },
  onda:       { id: 'onda',       name: 'Onda',       category: 'naturali', color: '#039BE5', glowColor: '#29B6F6', depth: 2 },
  deserto:    { id: 'deserto',    name: 'Deserto',    category: 'naturali', color: '#F9A825', glowColor: '#FDD835', depth: 2 },
  cenere:     { id: 'cenere',     name: 'Cenere',     category: 'materia',  color: '#9E9E9E', glowColor: '#BDBDBD', depth: 2 },
  nebbia:     { id: 'nebbia',     name: 'Nebbia',     category: 'celesti',  color: '#B0BEC5', glowColor: '#CFD8DC', depth: 2 },

  // Depth 3
  pianta:     { id: 'pianta',     name: 'Pianta',     category: 'naturali', color: '#4CAF50', glowColor: '#81C784', depth: 3 },
  sabbia:     { id: 'sabbia',     name: 'Sabbia',     category: 'materia',  color: '#FFE082', glowColor: '#FFF8E1', depth: 3 },
  metallo:    { id: 'metallo',    name: 'Metallo',    category: 'materia',  color: '#607D8B', glowColor: '#90A4AE', depth: 3 },
  arcobaleno: { id: 'arcobaleno', name: 'Arcobaleno', category: 'celesti',  color: '#E040FB', glowColor: '#EA80FC', depth: 3 },
  vita:       { id: 'vita',       name: 'Vita',       category: 'vita',     color: '#E91E63', glowColor: '#F48FB1', depth: 3 },
  freddo:     { id: 'freddo',     name: 'Freddo',     category: 'celesti',  color: '#80DEEA', glowColor: '#B2EBF2', depth: 3 },
  muro:       { id: 'muro',       name: 'Muro',       category: 'costruzioni', color: '#8D6E63', glowColor: '#A1887F', depth: 3 },
  tsunami:    { id: 'tsunami',    name: 'Tsunami',    category: 'naturali', color: '#01579B', glowColor: '#0277BD', depth: 3 },
  temporale:  { id: 'temporale',  name: 'Temporale',  category: 'celesti',  color: '#37474F', glowColor: '#546E7A', depth: 3 },

  // Depth 4
  albero:     { id: 'albero',     name: 'Albero',     category: 'naturali', color: '#2E7D32', glowColor: '#43A047', depth: 4 },
  fiore:      { id: 'fiore',      name: 'Fiore',      category: 'naturali', color: '#EC407A', glowColor: '#F48FB1', depth: 4 },
  vetro:      { id: 'vetro',      name: 'Vetro',      category: 'materia',  color: '#80CBC4', glowColor: '#B2DFDB', depth: 4 },
  arma:       { id: 'arma',       name: 'Arma',       category: 'materia',  color: '#455A64', glowColor: '#78909C', depth: 4 },
  ghiaccio:   { id: 'ghiaccio',   name: 'Ghiaccio',   category: 'celesti',  color: '#B3E5FC', glowColor: '#E1F5FE', depth: 4 },
  neve:       { id: 'neve',       name: 'Neve',       category: 'celesti',  color: '#FAFAFA', glowColor: '#FFFFFF', depth: 4 },
  casa:       { id: 'casa',       name: 'Casa',       category: 'costruzioni', color: '#A1887F', glowColor: '#BCAAA4', depth: 4 },
  animale:    { id: 'animale',    name: 'Animale',    category: 'vita',     color: '#FF8A65', glowColor: '#FFAB91', depth: 4 },
  giardino:   { id: 'giardino',   name: 'Giardino',   category: 'naturali', color: '#66BB6A', glowColor: '#A5D6A7', depth: 5 },
  luna:       { id: 'luna',       name: 'Luna',       category: 'celesti',  color: '#CFD8DC', glowColor: '#ECEFF1', depth: 4 },
  stella:     { id: 'stella',     name: 'Stella',     category: 'celesti',  color: '#FFF9C4', glowColor: '#FFFDE7', depth: 4 },
  eruzione:   { id: 'eruzione',   name: 'Eruzione',   category: 'energia',  color: '#DD2C00', glowColor: '#FF3D00', depth: 4 },
  cristallo:  { id: 'cristallo',  name: 'Cristallo',  category: 'materia',  color: '#CE93D8', glowColor: '#E1BEE7', depth: 4 },

  // Depth 5
  foresta:    { id: 'foresta',    name: 'Foresta',    category: 'naturali', color: '#1B5E20', glowColor: '#2E7D32', depth: 5 },
  uomo:       { id: 'uomo',       name: 'Uomo',       category: 'vita',     color: '#FFC107', glowColor: '#FFD54F', depth: 5 },
  palude:     { id: 'palude',     name: 'Palude',     category: 'naturali', color: '#558B2F', glowColor: '#7CB342', depth: 5 },
  argilla:    { id: 'argilla',    name: 'Argilla',    category: 'materia',  color: '#D84315', glowColor: '#F4511E', depth: 5 },
  gemma:      { id: 'gemma',      name: 'Gemma',      category: 'materia',  color: '#AB47BC', glowColor: '#CE93D8', depth: 5 },
  valanga:    { id: 'valanga',    name: 'Valanga',    category: 'celesti',  color: '#E0E0E0', glowColor: '#F5F5F5', depth: 5 },
  villaggio:  { id: 'villaggio',  name: 'Villaggio',  category: 'costruzioni', color: '#8D6E63', glowColor: '#A1887F', depth: 5 },

  // Depth 6
  civilta:    { id: 'civilta',    name: 'Civilt\u00e0',   category: 'vita',     color: '#FFB300', glowColor: '#FFD54F', depth: 6 },
  conoscenza: { id: 'conoscenza', name: 'Conoscenza', category: 'avanzati', color: '#7E57C2', glowColor: '#B39DDB', depth: 6 },
  musica:     { id: 'musica',     name: 'Musica',     category: 'avanzati', color: '#F06292', glowColor: '#F48FB1', depth: 6 },
  orologio:   { id: 'orologio',   name: 'Orologio',   category: 'avanzati', color: '#8D6E63', glowColor: '#A1887F', depth: 6 },

  // Depth 7
  filosofia:  { id: 'filosofia',  name: 'Filosofia',  category: 'avanzati', color: '#9C27B0', glowColor: '#CE93D8', depth: 7 },
  arte:       { id: 'arte',       name: 'Arte',       category: 'avanzati', color: '#E91E63', glowColor: '#F48FB1', depth: 7 },
  alchimia:   { id: 'alchimia',   name: 'Alchimia',   category: 'avanzati', color: '#FFD700', glowColor: '#FFF176', depth: 7 },
};

export const BASE_ELEMENTS = ['terra', 'acqua', 'fuoco', 'aria'];

export const CATEGORY_COLORS: Record<string, string> = {
  base:        '#B0BEC5',
  naturali:    '#4CAF50',
  energia:     '#FF5722',
  materia:     '#607D8B',
  vita:        '#E91E63',
  celesti:     '#7C4DFF',
  costruzioni: '#8D6E63',
  avanzati:    '#FFD700',
};

export function getElement(id: string): ElementDef {
  return ELEMENTS[id];
}

export function getAllElementIds(): string[] {
  return Object.keys(ELEMENTS);
}

export function getElementCount(): number {
  return Object.keys(ELEMENTS).length;
}
