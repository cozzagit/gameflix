// ============================================================
// TinyEmpire — Color Palette
// ============================================================
//
// All game colors live here. Grouped by category so sub-renderers
// can import exactly what they need.
// ============================================================

export const COLORS = {
  terrain: {
    grass: ['#7AC050', '#58A030', '#408020', '#306818'] as readonly string[],
    dirt:  ['#D0B080', '#B09060', '#907040'] as readonly string[],
    water: ['#50A0D0', '#3080B8', '#1860A0', '#78C0E8'] as readonly string[],
    sand:  ['#E8D8A0', '#D0C080'] as readonly string[],
    stone: ['#A8A098', '#888078', '#686058'] as readonly string[],
  },

  buildings: {
    stone_age: { wall: '#B8A070', roof: '#C8B068', accent: '#A88858' },
    tool_age:  { wall: '#D8C8A8', roof: '#D8C078', accent: '#C09030' },
    bronze_age:{ wall: '#C0B8B0', roof: '#C87048', accent: '#707880' },
    iron_age:  { wall: '#C0B8B0', roof: '#A85830', accent: '#707880' },
    medieval:  { wall: '#D8D0C0', roof: '#485060', accent: '#D8B030' },
    imperial:  { wall: '#F0E8E0', roof: '#485060', accent: '#FFE060' },
  },

  resources: {
    food:  '#E8A020',
    wood:  '#A07040',
    stone: '#989898',
    gold:  '#FFD040',
  },

  ui: {
    panelBg:        '#3A2A1A',
    panelBorder:    '#C8A050',
    panelHighlight: '#E0C070',
    textPrimary:    '#F0E8D0',
    textSecondary:  '#C0B898',
    textGold:       '#FFD040',
    textRed:        '#E04040',
    textGreen:      '#60C040',
  },

  units: {
    skin:       '#D0A070',
    cloth:      '#E8E0D0',
    playerBlue: '#3070D0',
    enemyRed:   '#D03030',
  },
} as const;

// ---- Age palette lookup -------------------------------------------------

export type AgePaletteKey = keyof typeof COLORS.buildings;

const AGE_PALETTE_MAP: Record<string, AgePaletteKey> = {
  stone:    'stone_age',
  tool:     'tool_age',
  bronze:   'bronze_age',
  iron:     'iron_age',
  medieval: 'medieval',
  imperial: 'imperial',
};

export function getAgePalette(ageId: string): typeof COLORS.buildings[AgePaletteKey] {
  const key = (AGE_PALETTE_MAP[ageId] ?? 'stone_age') as AgePaletteKey;
  return COLORS.buildings[key];
}

// ---- Tile base color lookup --------------------------------------------

export function getTileBaseColor(
  tileType: string,
  col: number,
  row: number,
): string {
  // Deterministic shade selection seeded by position
  const seed = (col * 7 + row * 13) & 0xffff;

  switch (tileType) {
    case 'grass1': return COLORS.terrain.grass[0];
    case 'grass2': return COLORS.terrain.grass[1];
    case 'grass3': return COLORS.terrain.grass[2];
    case 'grass4': return COLORS.terrain.grass[3];
    case 'forest': {
      const idx = seed % COLORS.terrain.grass.length;
      return COLORS.terrain.grass[idx];
    }
    case 'dirt1': return COLORS.terrain.dirt[0];
    case 'dirt2': return COLORS.terrain.dirt[1];
    case 'water1': return COLORS.terrain.water[0];
    case 'water2': return COLORS.terrain.water[1];
    case 'sand1': return COLORS.terrain.sand[0];
    case 'stoneDeposit': {
      const idx = seed % COLORS.terrain.grass.length;
      return COLORS.terrain.grass[idx];
    }
    case 'goldDeposit': {
      const idx = seed % COLORS.terrain.grass.length;
      return COLORS.terrain.grass[idx];
    }
    case 'berryBush': {
      const idx = seed % COLORS.terrain.grass.length;
      return COLORS.terrain.grass[idx];
    }
    case 'deerHerd': {
      const idx = seed % COLORS.terrain.grass.length;
      return COLORS.terrain.grass[idx];
    }
    default:
      return COLORS.terrain.grass[0];
  }
}
