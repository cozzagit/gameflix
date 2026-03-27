/**
 * All 12 levels with procedurally-placed words on hex grids.
 *
 * Hex grid uses offset coordinates with pointy-top hexagons.
 * Odd rows are shifted right by half a hex width.
 *
 * Neighbor rules for offset coords (pointy-top, odd-row-right):
 *   Even row (r): neighbors at (r-1,c-1),(r-1,c),(r,c-1),(r,c+1),(r+1,c-1),(r+1,c)
 *   Odd row (r):  neighbors at (r-1,c),(r-1,c+1),(r,c-1),(r,c+1),(r+1,c),(r+1,c+1)
 *
 * Each word is placed via backtracking DFS to find a valid adjacent path.
 * Longer words are placed first to maximize success. Remaining cells are
 * filled with Italian-frequency random letters.
 */

import { LevelDef, HexCoord } from './types';

function buildLevel(
  id: number,
  rows: number,
  cols: number,
  words: string[],
): LevelDef {
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill('');
  }

  const wordPaths: { word: string; path: HexCoord[] }[] = [];

  function getNeighbors(r: number, c: number): [number, number][] {
    const isOdd = r % 2 !== 0;
    let nbrs: [number, number][];
    if (isOdd) {
      nbrs = [[r - 1, c], [r - 1, c + 1], [r, c - 1], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
    } else {
      nbrs = [[r - 1, c - 1], [r - 1, c], [r, c - 1], [r, c + 1], [r + 1, c - 1], [r + 1, c]];
    }
    return nbrs.filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols);
  }

  function placeWord(word: string): { word: string; path: HexCoord[] } | null {
    for (let sr = 0; sr < rows; sr++) {
      for (let sc = 0; sc < cols; sc++) {
        if (grid[sr][sc] !== '' && grid[sr][sc] !== word[0]) continue;

        const path: [number, number][] = [];
        const visited = new Set<string>();

        function dfs(r: number, c: number, idx: number): boolean {
          if (idx === word.length) return true;
          const key = `${r},${c}`;
          if (visited.has(key)) return false;
          if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
          if (grid[r][c] !== '' && grid[r][c] !== word[idx]) return false;

          visited.add(key);
          path.push([r, c]);

          if (idx === word.length - 1) return true;

          const nbrs = getNeighbors(r, c);
          // Deterministic shuffle for variety
          const seed = id * 1000 + idx * 100 + r * 10 + c;
          nbrs.sort((a, b) => {
            const ha = ((a[0] * 31 + a[1] + seed) * 2654435761) >>> 0;
            const hb = ((b[0] * 31 + b[1] + seed) * 2654435761) >>> 0;
            return ha - hb;
          });

          for (const [nr, nc] of nbrs) {
            if (dfs(nr, nc, idx + 1)) return true;
          }

          visited.delete(key);
          path.pop();
          return false;
        }

        if (dfs(sr, sc, 0)) {
          for (let i = 0; i < word.length; i++) {
            grid[path[i][0]][path[i][1]] = word[i];
          }
          return {
            word,
            path: path.map(([r, c]) => ({ row: r, col: c })),
          };
        }
      }
    }
    return null;
  }

  // Sort words longest-first to maximize placement success
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    const result = placeWord(word);
    if (result) {
      wordPaths.push(result);
    }
  }

  // Reorder to match original word order
  const orderedPaths = words
    .map(w => wordPaths.find(wp => wp.word === w))
    .filter((wp): wp is { word: string; path: HexCoord[] } => wp !== undefined);

  // Fill remaining cells with Italian-frequency letters
  const fillers = 'AAEEEIIIOOOULNRSTCDMGPBFVZ';
  let seed = id * 7919;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        grid[r][c] = fillers[seed % fillers.length];
      }
    }
  }

  return {
    id,
    gridRows: rows,
    gridCols: cols,
    words,
    grid,
    wordPaths: orderedPaths,
  };
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL DEFINITIONS
// Grid sizes chosen to ensure all words can be placed.
// ═══════════════════════════════════════════════════════════════════

export const LEVELS: LevelDef[] = [
  // Level 1:  3 words, short (2-4 letters)
  buildLevel(1, 3, 3, ['SOLE', 'ORO', 'RE']),
  // Level 2:  4 words (4 letters each) — increased to 4x4 for SERA placement
  buildLevel(2, 4, 4, ['LUNA', 'MARE', 'ARIA', 'SERA']),
  // Level 3:  4 words (4 letters each) — increased to 5x4
  buildLevel(3, 5, 4, ['CASA', 'VITA', 'ROSA', 'PACE']),
  // Level 4:  5 words (4-5 letters) — increased to 5x5
  buildLevel(4, 5, 5, ['FUOCO', 'TERRA', 'CIELO', 'MONDO', 'LUCE']),
  // Level 5:  5 words (5-6 letters)
  buildLevel(5, 6, 5, ['STELLA', 'MONTE', 'FIUME', 'BOSCO', 'VENTO']),
  // Level 6:  6 words (5-6 letters) — increased to 7x6
  buildLevel(6, 7, 6, ['MUSICA', 'POESIA', 'NATURA', 'GIORNO', 'ESTATE', 'CUORE']),
  // Level 7:  6 words (6-8 letters)
  buildLevel(7, 7, 6, ['VIAGGIO', 'SORRISO', 'SILENZIO', 'PAROLA', 'COLORE', 'SAPERE']),
  // Level 8:  7 words (7-8 letters) — increased to 9x7
  buildLevel(8, 9, 7, ['AMICIZIA', 'FANTASIA', 'CORAGGIO', 'SPERANZA', 'MISTERO', 'DESTINO', 'LIBERTA']),
  // Level 9:  7 words (7-9 letters)
  buildLevel(9, 9, 7, ['AVVENTURA', 'SCOPERTA', 'MELODIA', 'ARMONIA', 'BELLEZZA', 'ENERGIA', 'PENSIERO']),
  // Level 10: 8 words (7-11 letters) — increased to 10x8
  buildLevel(10, 10, 8, ['EQUILIBRIO', 'CONOSCENZA', 'MERAVIGLIA', 'ISPIRAZIONE', 'PASSIONE', 'INFINITO', 'SERENITA', 'CREATIVITA']),
  // Level 11: 8 words (7-10 letters)
  buildLevel(11, 10, 8, ['TRAMONTO', 'FARFALLA', 'RICORDO', 'GENTILEZZA', 'ORIZZONTE', 'SAPIENZA', 'PRIMAVERA', 'AVVENTURA']),
  // Level 12: 9 words (7-14 letters) — grand finale, big grid
  buildLevel(12, 11, 9, ['MAGNIFICENZA', 'SPLENDORE', 'COSTELLAZIONE', 'ARCOBALENO', 'INCANTESIMO', 'MERAVIGLIA', 'FANTASIA', 'ETERNITA', 'DESTINO']),
];
