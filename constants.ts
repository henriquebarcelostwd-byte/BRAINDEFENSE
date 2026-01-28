
import { EnemyConfig, LevelConfig, TowerConfig } from './types';

// Images
export const IMAGES = {
  TOWER: 'https://i.postimg.cc/Rh8ry4hD/61921df45480a85b5118abdaee30da1e.png',
  DEFENDER: 'https://i.postimg.cc/d0HbFth1/images.png',
  SAPINI: 'https://i.postimg.cc/sfqnXSw9/4a19ad39-4670-4933-9715-bb624b35286a.png',
  LUCKY_BLOCK: 'https://i.postimg.cc/XqCXYwqm/Chat-GPT-Image-26-de-jan-de-2026-00-04-38.png',
  ENEMY_1: 'https://i.postimg.cc/Kcskpdx9/2025_10_29_5866430ee830f.png',
  ENEMY_2: 'https://i.postimg.cc/3JFR5VTK/Skura_Skura.png',
  ENEMY_3: 'https://i.postimg.cc/RF1rJrGK/images.png',
  // New Tree Images
  TREE_PHASE_1: 'https://i.postimg.cc/TPY0SPNF/images.png',
  TREE_PHASE_2: 'https://i.postimg.cc/k4pZJSt9/my-first-tree-drawing-vs-my-second-one-v0-b7e2232t3wle1.png',
  TREE_PHASE_3: 'https://i.postimg.cc/JnttcM2B/Chat-GPT-Image-26-de-jan-de-2026-08-37-24-removebg-preview.png',
  // New Defenders
  TRULIMERO: 'https://i.postimg.cc/66h7nbqn/4a19ad39-4670-4933-9715-bb624b35286a-1.png',
  TRIPPI_CAT: 'https://i.postimg.cc/Fsd4N12q/Trippi-Troppi.png',
  VACA_SATURNO: 'https://i.postimg.cc/k4xpn181/images-removebg-preview.png',
  WIFIRMINO: 'https://i.postimg.cc/prYRbS9J/Chat-GPT-Image-26-de-jan-de-2026-08-37-24.png',
  TOILETROT: 'https://i.postimg.cc/L6GH4M4x/Chat-GPT-Image-26-de-jan-de-2026-16-33-32-removebg-preview.png',
  CHOCOLATINI: 'https://i.postimg.cc/RFXWgV5z/e92ebb5cea5145f5aed72e3abca0325f-tplv-jj85edgx6n-image-origin-removebg-preview.png',
  // Evolution Images
  WIFIRMINO_ONLINE: 'https://i.postimg.cc/nckxvtTR/Chat-GPT-Image-26-de-jan-de-2026-14-01-06-removebg-preview.png',
  WIFIRMINO_TECNORAIZ: 'https://i.postimg.cc/RVQtKqkV/Chat-GPT-Image-26-de-jan-de-2026-14-08-15-removebg-preview.png',
  // SECRET
  LA_GRANDE: 'https://i.postimg.cc/rpQzgPcc/Carti-removebg-preview.png',
  // LEVEL 2 - SNOW
  SNOWFLAKE: 'https://i.postimg.cc/5NZzWNhS/snowflake-removebg-preview.png',
  TREE_SNOW: 'https://i.postimg.cc/BnB25fzX/images-removebg-preview.png',
  MR_BLACKFROST: 'https://i.postimg.cc/7YTV2cDg/Chat-GPT-Image-27-de-jan-de-2026-21-48-14-removebg-preview.png',
  KRAMPUS_COOKIE: 'https://i.postimg.cc/d1rC1MGL/Chat-GPT-Image-27-de-jan-de-2026-21-52-58-removebg-preview.png',
  PEPPERMINT_WRAITH: 'https://i.postimg.cc/4d0BVR04/Chat-GPT-Image-27-de-jan-de-2026-22-55-03-removebg-preview.png'
};

// Tower Configs
export const TOWERS: Record<string, TowerConfig> = {
  // --- BASE UNITS ---
  BONECA_AMBALABU: {
    id: 'BONECA_AMBALABU',
    name: 'Boneca Ambalabu',
    cost: 30, 
    storePrice: 50,
    attackSpeedMs: 500,
    range: 150,
    damage: 3, 
    image: IMAGES.DEFENDER,
    rarity: 'COMMON'
  },
  WIFIRMINO: {
    id: 'WIFIRMINO',
    name: 'WiFírmino',
    cost: 25,
    storePrice: 9999,
    attackSpeedMs: 1000,
    range: 120,
    damage: 5, 
    image: IMAGES.WIFIRMINO,
    rarity: 'COMMON'
  },
  SAPINI_CAIDERINI: {
    id: 'SAPINI_CAIDERINI',
    name: 'Sapini Caiderini',
    cost: 50,
    storePrice: 9999, // Exclusive
    attackSpeedMs: 400,
    range: 130,
    damage: 6, 
    image: IMAGES.SAPINI,
    rarity: 'RARE'
  },
  TRIPPI_CAT: {
    id: 'TRIPPI_CAT',
    name: 'Trippi Troppi',
    cost: 40,
    storePrice: 9999,
    attackSpeedMs: 800,
    range: 140,
    damage: 8, 
    image: IMAGES.TRIPPI_CAT,
    rarity: 'RARE'
  },
  TRULIMERO: {
    id: 'TRULIMERO',
    name: 'Trulimero Trulichina',
    cost: 75,
    storePrice: 9999,
    attackSpeedMs: 500,
    range: 160,
    damage: 15, 
    image: IMAGES.TRULIMERO,
    rarity: 'EPIC'
  },
  TOILETROT: {
    id: 'TOILETROT',
    name: 'Toiletrot',
    cost: 90,
    storePrice: 9999,
    attackSpeedMs: 400,
    range: 145,
    damage: 25, 
    image: IMAGES.TOILETROT,
    rarity: 'EPIC'
  },
  VACA_SATURNO: {
    id: 'VACA_SATURNO',
    name: 'La Vaca Saturno',
    cost: 100,
    storePrice: 9999,
    attackSpeedMs: 600,
    range: 180,
    damage: 18, 
    image: IMAGES.VACA_SATURNO,
    rarity: 'LEGENDARY'
  },
  CHOCOLATINI: {
    id: 'CHOCOLATINI',
    name: 'Chocolatini & Coffezini',
    cost: 250,
    storePrice: 500, // Updated Price
    attackSpeedMs: 300,
    range: 180,
    damage: 80, 
    image: IMAGES.CHOCOLATINI,
    rarity: 'MYTHICAL'
  },

  // --- SECRET ---
  LA_GRANDE_COMBINACION: {
    id: 'LA_GRANDE_COMBINACION',
    name: 'La Grande Combinacion',
    cost: 5000, 
    storePrice: 25000, 
    attackSpeedMs: 200, 
    range: 400,
    damage: 99999, // INSTANT KILL
    image: IMAGES.LA_GRANDE,
    rarity: 'GODLIKE'
  },

  // --- EVOLVED UNITS ---
  WIFIRMINO_ONLINE: {
    id: 'WIFIRMINO_ONLINE',
    name: '🌿📶 WiFírmino Online',
    cost: 75,
    storePrice: 9999,
    attackSpeedMs: 800,
    range: 150,
    damage: 15,
    image: IMAGES.WIFIRMINO_ONLINE,
    rarity: 'RARE'
  },
  WIFIRMINO_TECNORAIZ: {
    id: 'WIFIRMINO_TECNORAIZ',
    name: '🌳🔮📡 WiFírmino TecnoRaiz',
    cost: 250,
    storePrice: 9999,
    attackSpeedMs: 600,
    range: 220,
    damage: 45,
    image: IMAGES.WIFIRMINO_TECNORAIZ,
    rarity: 'LEGENDARY'
  },
};

export const DEFENDER_CONFIG = TOWERS.BONECA_AMBALABU; 

// Evolution Tree: Base ID -> { Target ID, Cost }
export const EVOLUTION_TREE: Record<string, { targetId: string; cost: number }> = {
  // Wifirmino Chain
  'WIFIRMINO': { targetId: 'WIFIRMINO_ONLINE', cost: 60 },
  'WIFIRMINO_ONLINE': { targetId: 'WIFIRMINO_TECNORAIZ', cost: 180 }
};

// Enemy Configs
export const ENEMIES: Record<string, EnemyConfig> = {
  NOOBINI: {
    name: 'Noobini Pizzanini',
    image: IMAGES.ENEMY_1,
    damage: 5,
    hp: 25, 
    speed: 1.5,
    reward: 8,
  },
  FLURI: {
    name: 'Fluri Flura',
    image: IMAGES.ENEMY_2,
    damage: 8,
    hp: 50,
    speed: 1.5,
    reward: 12,
  },
  SVININO: {
    name: 'Svinino Bombondino',
    image: IMAGES.ENEMY_3,
    damage: 15,
    hp: 120,
    speed: 1.2,
    reward: 20,
  },
  // --- LEVEL 2 ENEMIES ---
  MR_BLACKFROST: {
    name: 'Mr. Blackfrost',
    image: IMAGES.MR_BLACKFROST,
    damage: 30,
    hp: 300,
    speed: 1.0,
    reward: 50,
  },
  KRAMPUS_COOKIE: {
    name: 'Krampus Cookie',
    image: IMAGES.KRAMPUS_COOKIE,
    damage: 15,
    hp: 100,
    speed: 1.8,
    reward: 25,
  },
  PEPPERMINT_WRAITH: {
    name: 'Peppermint Wraith',
    image: IMAGES.PEPPERMINT_WRAITH,
    damage: 40,
    hp: 220,
    speed: 1.6,
    reward: 45,
  }
};

// Path Coordinates (Percentages 0-100)
export const PATH_POINTS = [
  { x: 0, y: 15 },
  { x: 20, y: 15 },
  { x: 20, y: 75 },
  { x: 50, y: 75 },
  { x: 50, y: 25 },
  { x: 80, y: 25 },
  { x: 80, y: 85 },
  { x: 92, y: 85 }, // End point near tower
];

// All Stages (Level 1: 0-2, Level 2: 3-5)
export const STAGES: LevelConfig[] = [
  // --- LEVEL 1 ---
  {
    id: 1,
    theme: 'FOREST_1',
    startingMoney: 100,
    waves: [
      { enemyId: 'NOOBINI', count: 5, interval: 100 },
      { enemyId: 'FLURI', count: 5, interval: 150 },
    ],
  },
  {
    id: 2,
    theme: 'FOREST_2',
    startingMoney: 150,
    waves: [
      { enemyId: 'NOOBINI', count: 5, interval: 80 },
      { enemyId: 'FLURI', count: 5, interval: 120 },
      { enemyId: 'SVININO', count: 5, interval: 200 },
    ],
  },
  {
    id: 3,
    theme: 'FOREST_3',
    startingMoney: 200,
    waves: [
      { enemyId: 'NOOBINI', count: 5, interval: 60 },
      { enemyId: 'FLURI', count: 5, interval: 100 },
      { enemyId: 'SVININO', count: 5, interval: 150 },
    ],
  },
  // --- LEVEL 2 ---
  {
    id: 4,
    theme: 'SNOW',
    startingMoney: 250,
    waves: [
      { enemyId: 'MR_BLACKFROST', count: 10, interval: 150 },
      { enemyId: 'KRAMPUS_COOKIE', count: 10, interval: 120 },
      { enemyId: 'PEPPERMINT_WRAITH', count: 10, interval: 100 },
    ],
  },
  {
    id: 5,
    theme: 'SNOW',
    startingMoney: 300,
    waves: [
      { enemyId: 'KRAMPUS_COOKIE', count: 10, interval: 80 },
      { enemyId: 'MR_BLACKFROST', count: 8, interval: 150 },
    ],
  },
  {
    id: 6,
    theme: 'SNOW',
    startingMoney: 350,
    waves: [
      { enemyId: 'MR_BLACKFROST', count: 12, interval: 100 },
      { enemyId: 'KRAMPUS_COOKIE', count: 20, interval: 60 },
    ],
  },
];
