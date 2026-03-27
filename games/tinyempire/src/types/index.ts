// ============================================================
// TinyEmpire — Core Type Definitions
// ============================================================

export type AgeId = 'stone' | 'tool' | 'bronze' | 'iron' | 'medieval' | 'imperial' | 'renaissance' | 'industrial' | 'modern';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  gold: number;
}

export interface ResourceRates {
  food: number;
  wood: number;
  stone: number;
  gold: number;
}

export interface StorageCaps {
  food: number;
  wood: number;
  stone: number;
  gold: number;
}

export type BuildingType =
  | 'townCenter' | 'house' | 'farm' | 'lumberCamp' | 'miningCamp'
  | 'mill' | 'granary' | 'lumberYard' | 'stoneVault' | 'treasury'
  | 'market' | 'bank'
  | 'barracks' | 'archeryRange' | 'stable' | 'siegeWorkshop' | 'castle' | 'cannonFoundry' | 'arsenal' | 'factory'
  | 'watchTower' | 'stoneWall' | 'gate' | 'bombardTower'
  | 'blacksmith' | 'university' | 'temple' | 'monastery' | 'outpost'
  | 'wonder' | 'imperialPalace';

export type UnitType =
  | 'villager' | 'clubman' | 'axeman' | 'swordsman' | 'legion' | 'champion'
  | 'archer' | 'crossbowman' | 'longbowman' | 'skirmisher'
  | 'scout' | 'cavalry' | 'knight' | 'paladin'
  | 'priest'
  | 'batteringRam' | 'catapult' | 'trebuchet'
  | 'handCannoneer' | 'bombardCannon' | 'warElephant'
  | 'musketeer' | 'galleon' | 'rifleman' | 'steamCannon' | 'tank' | 'sniper';

export type ResourceType = keyof Resources;

export interface TileCoord {
  col: number;
  row: number;
}

export interface Building {
  id: number;
  type: BuildingType;
  tile: TileCoord;
  level: number;
  constructionProgress: number; // 0-1, 1 = complete
  hp: number;
  maxHp: number;
}

export interface Unit {
  id: number;
  type: UnitType;
  owner: 'player' | 'enemy';
  pos: Vec2; // world position (pixel)
  targetPos: Vec2 | null;
  hp: number;
  maxHp: number;
  state: 'idle' | 'moving' | 'working' | 'fighting';
  assignedTo: number | null; // building id or resource node
  carryType: ResourceType | null;
  carryAmount: number;
  animFrame: number;
  animTimer: number;
  facingRight: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export type TileType =
  | 'grass1' | 'grass2' | 'grass3' | 'grass4'
  | 'dirt1' | 'dirt2'
  | 'water1' | 'water2'
  | 'sand1'
  | 'forest'
  | 'stoneDeposit' | 'goldDeposit'
  | 'berryBush'
  | 'deerHerd';

export interface MapTile {
  type: TileType;
  revealed: boolean;
  resourceAmount: number; // for resource nodes
}

export interface GameMap {
  width: number;
  height: number;
  tiles: MapTile[][];
}

export interface DynastyUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: (level: number) => number;
}

export interface PrestigeState {
  dynastyPoints: number;
  totalDpEarned: number;
  runsCompleted: number;
  upgrades: Record<string, number>;
  relics: string[];
  achievements: string[];
}

export interface TrainingQueueItem {
  buildingId: number;
  unitType: UnitType;
  progress: number;    // 0-1
  totalTime: number;   // seconds to complete
}

export interface GameState {
  resources: Resources;
  storageCaps: StorageCaps;
  rates: ResourceRates;
  population: number;
  populationCap: number;
  currentAge: AgeId;
  ageIndex: number;
  buildings: Building[];
  units: Unit[];
  map: GameMap;
  prestige: PrestigeState;
  tickCount: number;
  totalPlayTime: number; // seconds
  lastSaveTime: number;
  lastOnlineTime: number;
  nextBuildingId: number;
  nextUnitId: number;
  selectedBuildingId: number | null;
  selectedUnitIds: number[];
  gameSpeed: number;
  paused: boolean;
  trainingQueue: TrainingQueueItem[];
  enemyState: {
    villageTile: TileCoord;
    unitSpawnTimer: number;
    raidTimer: number;
    raidCooldown: number;
    raidsLaunched: number;
  } | null;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

export interface InputState {
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  rightMouseDown: boolean;
  dragStartX: number;
  dragStartY: number;
  isDragging: boolean;
  keys: Set<string>;
}

export type GameEvent =
  | { type: 'buildingPlaced'; building: Building }
  | { type: 'buildingComplete'; building: Building }
  | { type: 'unitTrained'; unit: Unit }
  | { type: 'ageAdvanced'; age: AgeId }
  | { type: 'resourceCollected'; resource: ResourceType; amount: number }
  | { type: 'raidIncoming'; strength: number; timeUntil: number }
  | { type: 'raidDefeated' }
  | { type: 'achievementUnlocked'; id: string }
  | { type: 'notification'; message: string; color: string };
