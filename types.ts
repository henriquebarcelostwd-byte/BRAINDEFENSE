
export enum ScreenState {
  LOADING = 'LOADING',
  AUTH = 'AUTH',
  MENU = 'MENU',
  STORE = 'STORE',
  INVENTORY = 'INVENTORY',
  EVOLUTION = 'EVOLUTION',
  CREDITS = 'CREDITS',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME',
  VICTORY = 'VICTORY',
  GAME_OVER = 'GAME_OVER',
  GAME_MODES = 'GAME_MODES',
  MULTIPLAYER_LOBBY = 'MULTIPLAYER_LOBBY',
  INDEX = 'INDEX',
  UPDATES = 'UPDATES'
}

export interface MultiplayerMatchState {
  isActive: boolean;
  matchId: string;
  role: 'HOST' | 'CLIENT';
  opponentId?: string;
  seed?: number; // For deterministic RNG
}

export interface EnemyConfig {
  name: string;
  image: string;
  damage: number;
  hp: number;
  speed: number; // units per tick
  reward: number;
}

export interface WaveConfig {
  enemyId: string;
  count: number;
  interval: number; // frames between spawns
}

export type LevelTheme = 'FOREST_1' | 'FOREST_2' | 'FOREST_3' | 'SNOW';

export interface LevelConfig {
  id: number;
  theme: LevelTheme;
  waves: WaveConfig[];
  startingMoney: number;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  brainCoins: number;
  playerId: string | null; // Null if not logged in/guest
  unlockedCharacters: string[];
  equippedCharacters: string[]; // Max 5
  completedLevels: number[];
  firstTime: boolean;
  // Daily Rewards
  lastLoginDate: string | null; // ISO string YYYY-MM-DD
  loginStreak: number;
  hasClaimedDaily: boolean;
  hasGamePass: boolean;
  redeemedCodes: string[];
  // Key: CharacterID, Value: Expiry Timestamp (ms)
  temporaryUnlocks: Record<string, number>;
  friends: string[]; // List of added Player IDs
  friendRequests: string[]; // List of IDs who sent a request
  chats: Record<string, ChatMessage[]>; // Persistent Chat History
  // Profile
  nickname?: string;
  profilePicture?: string; // Base64 string
}

export interface EnemyEntity {
  id: string;
  configId: string;
  x: number;
  y: number;
  pathIndex: number;
  distanceTraveled: number; // For sorting/progress
  hp: number;
  maxHp: number;
  frozen: boolean;
}

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHICAL' | 'GODLIKE';

export interface TowerConfig {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  attackSpeedMs: number;
  image: string;
  storePrice: number; // 999 if not in store
  filter?: string; // CSS filter string for canvas (e.g., "hue-rotate(90deg)")
  rarity: Rarity;
}

export interface TowerEntity {
  id: string;
  configId: string;
  x: number;
  y: number;
  lastShotTime: number;
  range: number;
  damage: number;
}

export interface ProjectileEntity {
  id: string;
  x: number;
  y: number;
  targetId: string;
  speed: number;
  damage: number;
  image?: string;
  filter?: string;
}
