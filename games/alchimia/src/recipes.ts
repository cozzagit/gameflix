import { Recipe } from './types';

export const RECIPES: Recipe[] = [
  // Depth 1 - Base combinations
  { a: 'terra',   b: 'acqua',   result: 'fango' },
  { a: 'terra',   b: 'fuoco',   result: 'lava' },
  { a: 'terra',   b: 'aria',    result: 'polvere' },
  { a: 'acqua',   b: 'fuoco',   result: 'vapore' },
  { a: 'acqua',   b: 'aria',    result: 'nuvola' },
  { a: 'fuoco',   b: 'aria',    result: 'energia' },
  { a: 'acqua',   b: 'acqua',   result: 'mare' },
  { a: 'fuoco',   b: 'fuoco',   result: 'sole' },
  { a: 'aria',    b: 'aria',    result: 'vento' },

  // Depth 2
  { a: 'lava',    b: 'acqua',   result: 'pietra' },
  { a: 'nuvola',  b: 'acqua',   result: 'pioggia' },
  { a: 'nuvola',  b: 'fuoco',   result: 'fulmine' },
  { a: 'fango',   b: 'fuoco',   result: 'mattone' },
  { a: 'vento',   b: 'acqua',   result: 'onda' },
  { a: 'sole',    b: 'terra',   result: 'deserto' },
  { a: 'vapore',  b: 'aria',    result: 'nebbia' },
  { a: 'pioggia', b: 'fulmine', result: 'temporale' },

  // Depth 3
  { a: 'pioggia', b: 'terra',   result: 'pianta' },
  { a: 'pietra',  b: 'aria',    result: 'sabbia' },
  { a: 'pietra',  b: 'fuoco',   result: 'metallo' },
  { a: 'sole',    b: 'acqua',   result: 'arcobaleno' },
  { a: 'pioggia', b: 'sole',    result: 'arcobaleno' },
  { a: 'energia', b: 'acqua',   result: 'vita' },
  { a: 'vento',   b: 'nuvola',  result: 'freddo' },
  { a: 'mattone', b: 'mattone', result: 'muro' },
  { a: 'onda',    b: 'onda',    result: 'tsunami' },
  { a: 'pianta',  b: 'fuoco',   result: 'cenere' },
  { a: 'deserto', b: 'vento',   result: 'sabbia' },

  // Depth 4
  { a: 'pianta',  b: 'terra',   result: 'albero' },
  { a: 'pianta',  b: 'acqua',   result: 'fiore' },
  { a: 'sabbia',  b: 'fuoco',   result: 'vetro' },
  { a: 'metallo', b: 'fuoco',   result: 'arma' },
  { a: 'acqua',   b: 'freddo',  result: 'ghiaccio' },
  { a: 'nuvola',  b: 'freddo',  result: 'neve' },
  { a: 'pioggia', b: 'freddo',  result: 'neve' },
  { a: 'muro',    b: 'muro',    result: 'casa' },
  { a: 'vita',    b: 'terra',   result: 'animale' },
  { a: 'fiore',   b: 'pianta',  result: 'giardino' },
  { a: 'sole',    b: 'nuvola',  result: 'luna' },
  { a: 'sole',    b: 'energia', result: 'stella' },
  { a: 'sole',    b: 'aria',    result: 'stella' },
  { a: 'lava',    b: 'energia', result: 'eruzione' },
  { a: 'ghiaccio',b: 'pietra',  result: 'cristallo' },
  { a: 'pietra',  b: 'energia', result: 'cristallo' },

  // Depth 5
  { a: 'albero',  b: 'albero',  result: 'foresta' },
  { a: 'vita',    b: 'animale', result: 'uomo' },
  { a: 'argilla', b: 'vita',      result: 'uomo' },
  { a: 'fango',   b: 'pianta',  result: 'palude' },
  { a: 'fango',   b: 'sabbia',  result: 'argilla' },
  { a: 'cristallo',b: 'fuoco',  result: 'gemma' },
  { a: 'neve',    b: 'neve',    result: 'valanga' },
  { a: 'casa',    b: 'casa',    result: 'villaggio' },

  // Depth 6
  { a: 'uomo',    b: 'casa',      result: 'civilta' },
  { a: 'uomo',    b: 'villaggio', result: 'civilta' },
  { a: 'civilta', b: 'stella',    result: 'conoscenza' },
  { a: 'civilta', b: 'vetro',     result: 'conoscenza' },
  { a: 'vento',   b: 'metallo',   result: 'musica' },
  { a: 'aria',    b: 'arma',      result: 'musica' },
  { a: 'metallo', b: 'sole',      result: 'orologio' },
  { a: 'metallo', b: 'energia',   result: 'orologio' },

  // Depth 7
  { a: 'conoscenza', b: 'civilta',  result: 'filosofia' },
  { a: 'conoscenza', b: 'uomo',     result: 'filosofia' },
  { a: 'fiore',      b: 'civilta',  result: 'arte' },
  { a: 'arcobaleno', b: 'civilta',  result: 'arte' },
  { a: 'filosofia',  b: 'fuoco',    result: 'alchimia' },
  { a: 'conoscenza', b: 'energia',  result: 'alchimia' },
];

// Build lookup for fast recipe matching
const recipeMap = new Map<string, string>();

function recipeKey(a: string, b: string): string {
  return a < b ? `${a}+${b}` : `${b}+${a}`;
}

for (const r of RECIPES) {
  const key = recipeKey(r.a, r.b);
  // First recipe wins for duplicate keys
  if (!recipeMap.has(key)) {
    recipeMap.set(key, r.result);
  }
}

export function findRecipe(a: string, b: string): string | null {
  const key = recipeKey(a, b);
  return recipeMap.get(key) ?? null;
}

export function getRecipeCount(): number {
  return RECIPES.length;
}
