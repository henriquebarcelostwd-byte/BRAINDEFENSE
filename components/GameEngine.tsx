
import React, { useEffect, useRef, useState } from 'react';
import { TOWERS, ENEMIES, IMAGES, PATH_POINTS } from '../constants';
import { EnemyEntity, ProjectileEntity, TowerEntity, LevelConfig, LevelTheme, MultiplayerMatchState } from '../types';
import Button from './Button';
import { Heart, Radio, AlertTriangle } from 'lucide-react';

interface GameEngineProps {
  stageConfig: LevelConfig;
  stageNumber: number;
  totalStages: number;
  equippedCharacters: string[]; 
  onGameOver: (win: boolean) => void;
  onExit: () => void;
  multiplayerState?: MultiplayerMatchState; // New Complex Prop
}

interface BackgroundElement {
  x: number;
  y: number;
  size: number;
  type: 'TREE_SHORT' | 'TREE_TALL' | 'GRASS' | 'TREE_BURNT' | 'TREE_SNOW';
  variation: number;
}

interface Snowflake {
    x: number;
    y: number;
    size: number;
    speed: number;
    swing: number;
    swingSpeed: number;
}

// Simple Linear Congruential Generator for deterministic RNG
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a pseudo-random number between 0 and 1
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const FIXED_TREE_POSITIONS = [
  { x: 8, y: 35 },   // Left side
  { x: 8, y: 70 },   // Bottom left
  { x: 35, y: 45 },  // First pocket
  { x: 40, y: 10 },  // Top middle
  { x: 35, y: 92 },  // Bottom middle-left
  { x: 65, y: 10 },  // Top right-ish
  { x: 65, y: 55 },  // Middle pocket
  { x: 65, y: 92 },  // Bottom right
  { x: 92, y: 15 },  // Top right corner
  { x: 92, y: 55 }   // Right edge
];

const GameEngine: React.FC<GameEngineProps> = ({ stageConfig, stageNumber, totalStages, equippedCharacters, onGameOver, onExit, multiplayerState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgElements = useRef<BackgroundElement[]>([]);
  const snowflakes = useRef<Snowflake[]>([]);
  const spriteCache = useRef<{ [key: string]: HTMLImageElement }>({});
  
  // Voting State
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [waitingForVote, setWaitingForVote] = useState(false);

  // RNG Reference
  const rngRef = useRef<SeededRNG>(new SeededRNG(Date.now()));

  // Use Ref for dimensions to access in loop without triggering re-renders/resets
  const dimensionsRef = useRef({ w: 800, h: 600 });

  // Multiplayer Refs
  const mpEventSource = useRef<EventSource | null>(null);
  const isMultiplayer = multiplayerState?.isActive;
  const isHost = !isMultiplayer || multiplayerState?.role === 'HOST';

  const getSprite = (src: string): HTMLImageElement => {
    if (!spriteCache.current[src]) {
      const img = new Image();
      img.src = src;
      spriteCache.current[src] = img;
    }
    return spriteCache.current[src];
  };

  const gameState = useRef({
    coins: stageConfig.startingMoney || 0,
    lives: 100,
    waveIndex: 0,
    enemies: [] as EnemyEntity[],
    towers: [] as TowerEntity[],
    projectiles: [] as ProjectileEntity[],
    frame: 0,
    isPlaying: false,
    spawnTimer: 0,
    enemiesSpawnedInWave: 0,
    isWaveActive: false,
    gameOver: false,
  });

  const [uiState, setUiState] = useState({
    coins: gameState.current.coins,
    lives: 100,
    wave: 1,
    isPlacing: false,
    selectedTowerId: equippedCharacters[0] || 'BONECA_AMBALABU' 
  });

  const [, setDimensions] = useState({ w: 800, h: 600 });

  // --- INIT RNG ---
  useEffect(() => {
     if (multiplayerState?.seed) {
         console.log("Initializing Game with Seed:", multiplayerState.seed);
         rngRef.current = new SeededRNG(multiplayerState.seed);
     } else {
         rngRef.current = new SeededRNG(Date.now());
     }
  }, [multiplayerState?.seed]);

  // --- MULTIPLAYER CONNECTION & VOTING LOGIC ---
  useEffect(() => {
      if (isMultiplayer && multiplayerState?.matchId) {
          console.log("Connecting to Game Channel:", multiplayerState.matchId);
          if (mpEventSource.current) mpEventSource.current.close();

          // FIX: Added cache buster 't' to ensure fresh connection
          const es = new EventSource(`https://ntfy.sh/${multiplayerState.matchId}/sse?t=${Date.now()}`);
          
          es.onopen = () => {
              // ON REJOIN: Request State Sync from Peer
              // If I am joining late or refreshed, I need the current game state
              fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
                  method: 'POST',
                  body: JSON.stringify({
                      type: 'SYNC_REQUEST',
                      role: multiplayerState.role
                  })
              }).catch(() => {});
          };

          es.onmessage = (event) => {
              try {
                  const data = JSON.parse(event.data);
                  const msg = typeof data === 'string' ? JSON.parse(data) : data.message ? JSON.parse(data.message) : data;
                  
                  // Ignore my own messages
                  if (msg.role === multiplayerState.role) return;

                  // --- PLACEMENT SYNC ---
                  if (msg.type === 'TOWER_PLACED') {
                      const { nx, ny, id, configId } = msg;
                      const { w, h } = dimensionsRef.current;
                      
                      let finalX = 0;
                      let finalY = 0;

                      if (nx !== undefined && ny !== undefined) {
                          // ABSOLUTE POSITIONING (No Mirroring)
                          // If Host sent 0.2 (Left), Client receives 0.2 and draws on Left.
                          // If Client sent 0.8 (Right), Host receives 0.8 and draws on Right.
                          finalX = nx * w; 
                          finalY = ny * h;       
                      }
                      
                      gameState.current.towers.push({
                          id: `ally-${id}`,
                          configId: configId,
                          x: finalX,
                          y: finalY,
                          lastShotTime: 0,
                          range: TOWERS[configId].range,
                          damage: TOWERS[configId].damage
                      });
                  }

                  // --- SYNC REQUESTS ---
                  // If peer asks for sync, send my entire state
                  if (msg.type === 'SYNC_REQUEST') {
                      console.log("Peer requested sync. Sending state...");
                      fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
                          method: 'POST',
                          body: JSON.stringify({
                              type: 'SYNC_DATA',
                              role: multiplayerState.role,
                              state: gameState.current
                          })
                      });
                  }

                  // --- SYNC DATA RECEIVED ---
                  // Overwrite local state with received state (Catch up)
                  if (msg.type === 'SYNC_DATA' && msg.state) {
                      console.log("Received Sync Data. Updating...");
                      const remoteState = msg.state;
                      
                      // Merge critical state
                      gameState.current.enemies = remoteState.enemies || [];
                      gameState.current.towers = remoteState.towers || [];
                      gameState.current.coins = remoteState.coins;
                      gameState.current.lives = remoteState.lives;
                      gameState.current.waveIndex = remoteState.waveIndex;
                      gameState.current.isWaveActive = remoteState.isWaveActive;
                      gameState.current.enemiesSpawnedInWave = remoteState.enemiesSpawnedInWave;
                      // Don't overwrite frame completely to avoid jitter, but maybe necessary
                      // gameState.current.frame = remoteState.frame; 

                      setUiState(prev => ({
                          ...prev,
                          coins: remoteState.coins,
                          lives: remoteState.lives,
                          wave: remoteState.waveIndex + 1
                      }));
                  }

                  // --- CLIENT SYNC WAVE START ---
                  if (!isHost && msg.type === 'START_WAVE') {
                      startNextWaveLogic();
                  }

                  // --- VOTING LOGIC ---
                  if (msg.type === 'VOTE_SURRENDER_REQUEST') {
                      setShowVoteModal(true);
                  }

                  if (msg.type === 'VOTE_SURRENDER_ACCEPT') {
                      onExit();
                  }
                  
                  if (msg.type === 'VOTE_SURRENDER_DENY') {
                      setWaitingForVote(false);
                      alert("Opponent refused to surrender!");
                  }

              } catch(e) {}
          };
          mpEventSource.current = es;
      }
      return () => {
          if (mpEventSource.current) mpEventSource.current.close();
      }
  }, [isMultiplayer, multiplayerState]);

  useEffect(() => {
    getSprite(IMAGES.TREE_PHASE_1);
    getSprite(IMAGES.TREE_PHASE_2);
    getSprite(IMAGES.TREE_PHASE_3);
    getSprite(IMAGES.TREE_SNOW);
    getSprite(IMAGES.SNOWFLAKE);
    getSprite(IMAGES.TOWER);
    getSprite(IMAGES.DEFENDER);
  }, []);

  const generateBackground = (theme: LevelTheme, w: number, h: number) => {
    const elements: BackgroundElement[] = [];

    FIXED_TREE_POSITIONS.forEach((pos, index) => {
      let type: BackgroundElement['type'] = 'TREE_SHORT';
      if (theme === 'FOREST_1') {
        type = 'TREE_SHORT';
      } else if (theme === 'FOREST_2') {
        type = index % 3 === 0 ? 'TREE_TALL' : (index % 3 === 1 ? 'TREE_SHORT' : 'GRASS');
        if (type === 'GRASS') type = 'TREE_SHORT'; 
      } else if (theme === 'FOREST_3') {
        type = 'TREE_BURNT';
      } else if (theme === 'SNOW') {
        type = 'TREE_SNOW';
      }

      elements.push({
        x: (pos.x / 100) * w,
        y: (pos.y / 100) * h,
        size: 0.8 + (index % 5) * 0.1,
        type,
        variation: (index * 0.13) % 1,
      });
    });

    if (theme !== 'SNOW') {
        const GRASS_POSITIONS = [
          {x: 5, y: 90}, {x: 15, y: 5}, {x: 55, y: 95}, {x: 85, y: 5}
        ];

        GRASS_POSITIONS.forEach((pos, i) => {
           elements.push({
            x: (pos.x / 100) * w,
            y: (pos.y / 100) * h,
            size: 0.6,
            type: 'GRASS',
            variation: i * 0.2
           });
        });
    }

    bgElements.current = elements.sort((a,b) => a.y - b.y);

    if (theme === 'SNOW') {
        const flakes: Snowflake[] = [];
        for (let i = 0; i < 60; i++) {
            flakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 20 + Math.random() * 25,
                speed: 1 + Math.random() * 3,
                swing: Math.random() * 3,
                swingSpeed: 0.02 + Math.random() * 0.05
            });
        }
        snowflakes.current = flakes;
    } else {
        snowflakes.current = [];
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const oldW = dimensionsRef.current.w;
        const oldH = dimensionsRef.current.h;

        if (oldW > 0 && oldH > 0 && (oldW !== clientWidth || oldH !== clientHeight)) {
            const scaleX = clientWidth / oldW;
            const scaleY = clientHeight / oldH;

            gameState.current.enemies.forEach(e => {
                e.x *= scaleX;
                e.y *= scaleY;
            });
            gameState.current.towers.forEach(t => {
                t.x *= scaleX;
                t.y *= scaleY;
            });
            gameState.current.projectiles.forEach(p => {
                p.x *= scaleX;
                p.y *= scaleY;
            });
        }

        dimensionsRef.current = { w: clientWidth, h: clientHeight };
        setDimensions({ w: clientWidth, h: clientHeight });

        if (canvasRef.current) {
          canvasRef.current.width = clientWidth;
          canvasRef.current.height = clientHeight;
        }
        generateBackground(stageConfig.theme, clientWidth, clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [stageConfig.theme]);

  const getPointOnPath = (index: number) => {
    const p = PATH_POINTS[index];
    const { w, h } = dimensionsRef.current;
    return { x: (p.x / 100) * w, y: (p.y / 100) * h };
  };

  const startNextWaveLogic = () => {
      if (gameState.current.waveIndex < stageConfig.waves.length) {
          gameState.current.isWaveActive = true;
          gameState.current.enemiesSpawnedInWave = 0;
          gameState.current.spawnTimer = 0;
          gameState.current.isPlaying = true;
      }
  };

  const attemptStartNextWave = () => {
    // If Multiplayer and NOT Host, we wait for signal.
    if (isMultiplayer && !isHost) return;

    // If Host or Singleplayer, start immediately and signal.
    startNextWaveLogic();

    if (isMultiplayer && isHost && multiplayerState) {
        fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'START_WAVE',
                role: 'HOST',
                waveIndex: gameState.current.waveIndex
            })
        }).catch(console.error);
    }
  };

  useEffect(() => {
    // Check for existing snapshot first
    const snapshot = localStorage.getItem('bd_game_snapshot');
    if (snapshot) {
        try {
            const data = JSON.parse(snapshot);
            console.log("Restoring Game Snapshot...", data);
            gameState.current = {
                ...data,
                // Ensure entities are valid if classes changed (simple object spread is usually fine here)
            };
            setUiState({
                coins: data.coins,
                lives: data.lives,
                wave: data.waveIndex + 1,
                isPlacing: false,
                selectedTowerId: equippedCharacters[0]
            });
        } catch(e) {
            console.error("Snapshot Corrupted");
        }
    } else {
        // Init Fresh
        gameState.current = {
            coins: stageConfig.startingMoney || 0,
            lives: 100,
            waveIndex: 0,
            enemies: [] as EnemyEntity[],
            towers: [] as TowerEntity[],
            projectiles: [] as ProjectileEntity[],
            frame: 0,
            isPlaying: false,
            spawnTimer: 0,
            enemiesSpawnedInWave: 0,
            isWaveActive: false,
            gameOver: false,
        };
        
        setUiState(prev => ({
            ...prev,
            coins: stageConfig.startingMoney,
            lives: 100,
            wave: 1,
            isPlacing: false,
            selectedTowerId: equippedCharacters[0]
        }));
    }

    if (containerRef.current) {
         const { clientWidth, clientHeight } = containerRef.current;
         dimensionsRef.current = { w: clientWidth, h: clientHeight };
    }

    let animationFrameId: number;

    // --- DRAW FUNCTION DEFINED BEFORE LOOP ---
    const draw = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const { w, h } = dimensionsRef.current;
  
        // Clear
        ctx.clearRect(0, 0, w, h);
  
        // Draw Background
        if (stageConfig.theme === 'SNOW') {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#020617'); // Very dark blue
            grad.addColorStop(1, '#1e1b4b'); // Dark indigo/ice
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        } else if (stageConfig.theme === 'FOREST_3') {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#2b0a0a');
            grad.addColorStop(1, '#450a0a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        } else {
            // RESTORED: Forest Green Background
            ctx.fillStyle = stageConfig.theme === 'FOREST_2' ? '#064e3b' : '#14532d';
            ctx.fillRect(0, 0, w, h);
            
            // Draw Grass Detail
            ctx.fillStyle = '#166534'; // Slightly lighter green for grass tufts
            bgElements.current.filter(e => e.type === 'GRASS').forEach(e => {
               ctx.beginPath();
               ctx.arc(e.x, e.y, e.size * 5, 0, Math.PI * 2);
               ctx.fill();
            });
        }
  
        // Draw Path
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 40;
        ctx.strokeStyle = stageConfig.theme === 'SNOW' ? '#334155' : (stageConfig.theme === 'FOREST_3' ? '#7f1d1d' : '#92400e'); 
        ctx.beginPath();
        PATH_POINTS.forEach((p, i) => {
          const point = getPointOnPath(i);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Inner Path
        ctx.lineWidth = 20;
        ctx.strokeStyle = stageConfig.theme === 'SNOW' ? '#bae6fd' : (stageConfig.theme === 'FOREST_3' ? '#991b1b' : '#b45309'); 
        ctx.beginPath();
        PATH_POINTS.forEach((p, i) => {
          const point = getPointOnPath(i);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Final Tower Area
        const endPoint = getPointOnPath(PATH_POINTS.length - 1);
        const towerImg = getSprite(IMAGES.TOWER);
        if (towerImg && towerImg.complete) {
            ctx.drawImage(towerImg, endPoint.x - 40, endPoint.y - 60, 80, 80);
        }

        // Lives Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(endPoint.x - 30, endPoint.y - 70, 60, 8);
        ctx.fillStyle = 'green';
        ctx.fillRect(endPoint.x - 30, endPoint.y - 70, 60 * (gameState.current.lives / 100), 8);
  
        // Draw Trees
        bgElements.current.forEach(el => {
           if (el.type === 'GRASS') return;
  
           let img = null;
           if (el.type === 'TREE_SHORT') img = getSprite(IMAGES.TREE_PHASE_1);
           else if (el.type === 'TREE_TALL') img = getSprite(IMAGES.TREE_PHASE_2);
           else if (el.type === 'TREE_BURNT') img = getSprite(IMAGES.TREE_PHASE_3);
           else if (el.type === 'TREE_SNOW') img = getSprite(IMAGES.TREE_SNOW);
           
           if (img && img.complete) {
              const size = el.size * 80;
              ctx.drawImage(img, el.x - size/2, el.y - size, size, size);
           }
        });

        // Multiplayer Divider
        if (isMultiplayer) {
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w / 2, h);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([15, 15]);
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.save();
            ctx.font = '24px Bangers';
            ctx.textAlign = 'center';
            // HOST IS ALWAYS LEFT (YOUR ZONE if Host, ALLY ZONE if Client)
            // CLIENT IS ALWAYS RIGHT (ALLY ZONE if Host, YOUR ZONE if Client)
            
            // Left Side Label
            ctx.fillStyle = isHost ? 'rgba(100, 255, 100, 0.6)' : 'rgba(100, 200, 255, 0.6)';
            ctx.fillText(isHost ? "YOUR ZONE" : "ALLY ZONE", w / 4, 40);
            
            // Right Side Label
            ctx.fillStyle = isHost ? 'rgba(100, 200, 255, 0.6)' : 'rgba(100, 255, 100, 0.6)';
            ctx.fillText(isHost ? "ALLY ZONE" : "YOUR ZONE", (w * 3) / 4, 40);
            
            ctx.restore();
        }
  
        // Draw Towers
        gameState.current.towers.forEach(tower => {
           const config = TOWERS[tower.configId];
           if (!config) return;
           const img = getSprite(config.image);
           
           const size = 60;
           ctx.save();
           
           if (tower.id.startsWith('ally-')) {
              ctx.globalAlpha = 0.6;
              ctx.filter = 'grayscale(100%) brightness(150%)';
           } else if (config.filter) {
              ctx.filter = config.filter;
           }
           
           if (img && img.complete) {
               ctx.drawImage(img, tower.x - size/2, tower.y - size/2, size, size);
           } else {
               // Fallback if image not loaded
               ctx.fillStyle = 'purple';
               ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
           }
           ctx.restore();
        });
  
        // Draw Enemies
        gameState.current.enemies.forEach(enemy => {
           const config = ENEMIES[enemy.configId];
           if (!config) return;
           const img = getSprite(config.image);
           const size = 50;
  
           ctx.save();
           // Flip if moving left
           if (enemy.pathIndex < PATH_POINTS.length - 1) {
               const next = getPointOnPath(enemy.pathIndex + 1);
               if (next.x < enemy.x) {
                   ctx.scale(-1, 1);
                   ctx.translate(-2 * enemy.x, 0);
               }
           }
           
           if (img && img.complete) {
               ctx.drawImage(img, enemy.x - size/2, enemy.y - size/2, size, size);
           } else {
               ctx.fillStyle = 'red';
               ctx.beginPath();
               ctx.arc(enemy.x, enemy.y, 20, 0, Math.PI*2);
               ctx.fill();
           }
           ctx.restore();
  
           // HP Bar
           const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
           ctx.fillStyle = 'rgba(0,0,0,0.5)';
           ctx.fillRect(enemy.x - 20, enemy.y - 35, 40, 6);
           ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
           ctx.fillRect(enemy.x - 19, enemy.y - 34, 38 * hpPct, 4);
        });
  
        // Draw Projectiles
        gameState.current.projectiles.forEach(p => {
           if (p.image) {
               const img = getSprite(p.image);
               ctx.save();
               if (p.filter) ctx.filter = p.filter;
               
               const target = gameState.current.enemies.find(e => e.id === p.targetId);
               if (target) {
                   const angle = Math.atan2(target.y - p.y, target.x - p.x);
                   ctx.translate(p.x, p.y);
                   ctx.rotate(angle);
                   if (img && img.complete) ctx.drawImage(img, -10, -10, 20, 20);
               } else {
                   if (img && img.complete) ctx.drawImage(img, p.x - 10, p.y - 10, 20, 20);
               }
               ctx.restore();
           } else {
               ctx.beginPath();
               ctx.fillStyle = '#facc15';
               ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
               ctx.fill();
           }
        });
  
        // Draw Snow (IMAGE BASED)
        if (stageConfig.theme === 'SNOW') {
            const flakeImg = getSprite(IMAGES.SNOWFLAKE);
            if (flakeImg && flakeImg.complete) {
                snowflakes.current.forEach(f => {
                    ctx.globalAlpha = 0.7;
                    ctx.drawImage(flakeImg, f.x, f.y, f.size, f.size);
                });
                ctx.globalAlpha = 1;
            } else {
                // Fallback circle if image fails loading
                ctx.fillStyle = 'white';
                snowflakes.current.forEach(f => {
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.arc(f.x, f.y, f.size/4, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            }
        }
    };

    const loop = () => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      state.frame++;

      // --- AUTO-SAVE SNAPSHOT (Every 60 frames / 1s) ---
      if (state.frame % 60 === 0) {
          localStorage.setItem('bd_game_snapshot', JSON.stringify(state));
      }

      if (state.isWaveActive) {
        const currentWaveConfig = stageConfig.waves[state.waveIndex];
        if (currentWaveConfig) {
          if (state.enemiesSpawnedInWave < currentWaveConfig.count) {
            state.spawnTimer++;
            if (state.spawnTimer >= currentWaveConfig.interval) {
              const enemyConfig = ENEMIES[currentWaveConfig.enemyId];
              const startPos = getPointOnPath(0);
              
              // Use Seeded RNG for Enemy ID to ensure consistency if logic uses it (though logic is local)
              // But mainly this ensures spawning happens deterministically relative to start time
              const rnd = rngRef.current.next(); 
              
              state.enemies.push({
                id: `e-${state.waveIndex}-${state.enemiesSpawnedInWave}-${rnd}`, 
                configId: currentWaveConfig.enemyId,
                x: startPos.x,
                y: startPos.y,
                pathIndex: 0,
                distanceTraveled: 0,
                hp: enemyConfig.hp,
                maxHp: enemyConfig.hp,
                frozen: false,
              });
              state.enemiesSpawnedInWave++;
              state.spawnTimer = 0;
            }
          } else if (state.enemies.length === 0) {
            state.isWaveActive = false;
            state.waveIndex++;
            setUiState(prev => ({ ...prev, wave: state.waveIndex + 1 }));
            
            if (state.waveIndex >= stageConfig.waves.length) {
              state.gameOver = true;
              onGameOver(true);
            } else {
               setTimeout(attemptStartNextWave, 2000);
            }
          }
        }
      }

      state.enemies.forEach(enemy => {
        const config = ENEMIES[enemy.configId];
        const nextPoint = getPointOnPath(enemy.pathIndex + 1);
        
        if (!nextPoint) return; 

        const moveDist = config.speed;
        const vX = nextPoint.x - enemy.x;
        const vY = nextPoint.y - enemy.y;
        const distToTarget = Math.sqrt(vX*vX + vY*vY);

        if (distToTarget <= moveDist) {
          enemy.x = nextPoint.x;
          enemy.y = nextPoint.y;
          enemy.pathIndex++;
          
          if (enemy.pathIndex >= PATH_POINTS.length - 1) {
             enemy.hp = 0; 
             state.lives -= config.damage;
             setUiState(prev => ({ ...prev, lives: Math.max(0, state.lives) }));
             if (state.lives <= 0) {
               state.gameOver = true;
               onGameOver(false);
             }
          }
        } else {
          enemy.x += (vX / distToTarget) * moveDist;
          enemy.y += (vY / distToTarget) * moveDist;
        }
      });

      state.enemies = state.enemies.filter(e => e.hp > 0);

      const now = Date.now();
      state.towers.forEach(tower => {
        const towerConfig = TOWERS[tower.configId];
        if (!towerConfig) return;

        if (now - tower.lastShotTime >= towerConfig.attackSpeedMs) {
          const target = state.enemies.find(e => {
             const dx = e.x - tower.x;
             const dy = e.y - tower.y;
             return Math.sqrt(dx*dx + dy*dy) <= towerConfig.range;
          });

          if (target) {
            tower.lastShotTime = now;
            // Use local randomness for projectiles as it doesn't affect game state heavily
            // Or use seeded if critical.
            state.projectiles.push({
              id: `p-${now}-${Math.random()}`,
              x: tower.x,
              y: tower.y,
              targetId: target.id,
              speed: 5,
              damage: towerConfig.damage,
              image: towerConfig.image,
              filter: towerConfig.filter 
            });
          }
        }
      });

      state.projectiles.forEach(proj => {
        const target = state.enemies.find(e => e.id === proj.targetId);
        if (!target) {
          proj.damage = 0; 
          return;
        }

        const dx = target.x - proj.x;
        const dy = target.y - proj.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist <= proj.speed) {
          target.hp -= proj.damage;
          proj.damage = 0;
          
          if (target.hp <= 0) {
            const reward = ENEMIES[target.configId].reward;
            state.coins += reward;
            setUiState(prev => ({ ...prev, coins: state.coins }));
          }
        } else {
          proj.x += (dx / dist) * proj.speed;
          proj.y += (dy / dist) * proj.speed;
        }
      });

      state.projectiles = state.projectiles.filter(p => p.damage > 0);

      if (stageConfig.theme === 'SNOW') {
          const { w, h } = dimensionsRef.current;
          snowflakes.current.forEach(flake => {
              flake.y += flake.speed;
              flake.x += Math.sin(gameState.current.frame * flake.swingSpeed) * flake.swing;

              if (flake.y > h) {
                  flake.y = -20;
                  flake.x = Math.random() * w;
              }
          });
      }

      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    // Only start attempting waves if NOT recovering (if recovering, waveIndex is likely > 0)
    // If we recovered a session, allow the snapshot data to drive logic
    if (!localStorage.getItem('bd_game_snapshot')) {
        setTimeout(attemptStartNextWave, 1000);
    } else {
        // If recovered, just ensure playing state is active
        gameState.current.isPlaying = true;
    }

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [stageConfig, isHost]); // Added isHost dependency

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!uiState.isPlacing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Multiplayer Restriction: 
    // Host = Left Side (0 to w/2)
    // Client = Right Side (w/2 to w)
    if (isMultiplayer) {
        const isLeft = x < w / 2;
        if (isHost && !isLeft) {
            alert("HOST DEFENDS THE LEFT SIDE!");
            return;
        }
        if (!isHost && isLeft) {
            alert("CLIENT DEFENDS THE RIGHT SIDE!");
            return;
        }
    }

    const selectedTowerConfig = TOWERS[uiState.selectedTowerId];
    if (!selectedTowerConfig) return;

    if (gameState.current.coins < selectedTowerConfig.cost) return;

    let safe = true;
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
       const p1 = getPointOnPath(i);
       const p2 = getPointOnPath(i+1);
       const A = x - p1.x;
       const B = y - p1.y;
       const C = p2.x - p1.x;
       const D = p2.y - p1.y;
       const dot = A * C + B * D;
       const len_sq = C * C + D * D;
       let param = -1;
       if (len_sq !== 0) param = dot / len_sq;
       let xx, yy;
       if (param < 0) { xx = p1.x; yy = p1.y; }
       else if (param > 1) { xx = p2.x; yy = p2.y; }
       else { xx = p1.x + param * C; yy = p1.y + param * D; }
       const dx = x - xx;
       const dy = y - yy;
       if (Math.sqrt(dx * dx + dy * dy) < 40) { safe = false; break; }
    }

    if (safe) {
       for (const t of gameState.current.towers) {
          const dx = x - t.x;
          const dy = y - t.y;
          if (Math.sqrt(dx*dx + dy*dy) < 50) { safe = false; break; }
       }
    }

    if (safe) {
      gameState.current.coins -= selectedTowerConfig.cost;
      const towerId = `t-${Date.now()}`;
      
      gameState.current.towers.push({
        id: towerId,
        configId: selectedTowerConfig.id,
        x, y,
        lastShotTime: 0,
        range: selectedTowerConfig.range,
        damage: selectedTowerConfig.damage,
      });

      // --- SEND TO ALLY (NORMALIZED ABSOLUTE COORDINATES) ---
      if (isMultiplayer && multiplayerState) {
          fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
              method: 'POST',
              body: JSON.stringify({
                  type: 'TOWER_PLACED',
                  role: multiplayerState.role,
                  nx: x / w, // Absolute Normalized X (0 to 1)
                  ny: y / h, // Absolute Normalized Y (0 to 1)
                  id: towerId,
                  configId: selectedTowerConfig.id
              })
          }).catch(console.error);
      }

      setUiState(prev => ({ 
        ...prev, 
        coins: gameState.current.coins,
        isPlacing: false 
      }));
    }
  };

  const togglePlacement = () => {
    const cost = TOWERS[uiState.selectedTowerId]?.cost || 999;
    if (gameState.current.coins >= cost) {
      setUiState(prev => ({ ...prev, isPlacing: !prev.isPlacing }));
    }
  };

  const selectTower = (id: string) => {
    setUiState(prev => ({ ...prev, selectedTowerId: id, isPlacing: false }));
  }

  // --- EXIT & VOTE HANDLING ---
  const handleExitClick = () => {
      if (isMultiplayer && multiplayerState) {
          // Trigger Vote
          if (waitingForVote) return;
          setWaitingForVote(true);
          
          fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
              method: 'POST',
              body: JSON.stringify({
                  type: 'VOTE_SURRENDER_REQUEST',
                  role: multiplayerState.role
              })
          });
          
      } else {
          // Single Player - Just Exit
          onExit();
      }
  };

  const handleVoteResponse = (agree: boolean) => {
      if (!multiplayerState) return;
      
      const type = agree ? 'VOTE_SURRENDER_ACCEPT' : 'VOTE_SURRENDER_DENY';
      fetch(`https://ntfy.sh/${multiplayerState.matchId}`, {
          method: 'POST',
          body: JSON.stringify({
              type: type,
              role: multiplayerState.role
          })
      });

      setShowVoteModal(false);
      
      if (agree) {
          onExit();
      }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none touch-none" ref={containerRef}>
      
      {/* VOTE MODAL */}
      {showVoteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in zoom-in-95">
              <div className="bg-red-900 border-4 border-yellow-400 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                  <AlertTriangle size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-3xl font-chaotic text-white mb-4">SURRENDER VOTE</h2>
                  <p className="text-lg text-yellow-200 mb-8 font-bold">
                      YOUR ALLY WANTS TO LEAVE THE MATCH.<br/>
                      DO YOU AGREE?
                  </p>
                  <div className="flex gap-4">
                      <Button variant="danger" onClick={() => handleVoteResponse(true)} className="flex-1">
                          YES, LEAVE
                      </Button>
                      <Button variant="primary" onClick={() => handleVoteResponse(false)} className="flex-1">
                          NO, STAY
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* WAITING OVERLAY */}
      {waitingForVote && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 text-yellow-400 px-6 py-2 rounded-full border border-yellow-500 animate-pulse z-50">
              WAITING FOR ALLY TO AGREE...
          </div>
      )}

      {/* HUD - Flex Wrapped for Narrow Screens */}
      <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex flex-wrap justify-between items-start pointer-events-none z-10 gap-2">
        <div className="flex gap-2 md:gap-4">
           <div className="bg-black/70 p-2 md:p-3 rounded-lg border-2 border-yellow-500 text-yellow-400 font-chaotic text-lg md:text-2xl flex items-center gap-1 md:gap-2 shadow-lg">
              <span>COINS:</span>
              <span>{uiState.coins}</span>
           </div>
           <div className="bg-black/70 p-2 md:p-3 rounded-lg border-2 border-red-500 text-red-500 font-chaotic text-lg md:text-2xl flex items-center gap-1 md:gap-2 shadow-lg">
              <Heart fill="red" className="w-4 h-4 md:w-6 md:h-6" />
              <span>{Math.floor(uiState.lives)}</span>
           </div>
        </div>
        
        <div className="flex flex-col items-end md:items-center gap-1 md:gap-2">
          {isMultiplayer && (
             <div className="bg-cyan-900/80 px-2 md:px-4 py-1 rounded-lg border-2 border-cyan-500 text-cyan-300 font-chaotic text-sm md:text-xl shadow-lg animate-pulse flex items-center gap-2">
                <Radio className="animate-ping" size={12}/> LIVE CO-OP
             </div>
          )}
          <div className="bg-black/70 px-2 md:px-4 py-1 md:py-2 rounded-lg border-2 border-blue-500 text-blue-300 font-chaotic text-base md:text-xl shadow-lg">
             STAGE {stageNumber}/{totalStages}
          </div>
          <div className="bg-black/70 px-2 md:px-3 py-1 rounded-lg border-2 border-purple-500 text-purple-300 font-chaotic text-sm md:text-lg shadow-lg">
             WAVE {uiState.wave}
          </div>
        </div>

        {/* Desktop Only ABANDON (Inside HUD for layout) */}
        <div className="pointer-events-auto hidden md:block">
          <Button variant="danger" onClick={handleExitClick} className="text-xs md:text-sm py-1 px-3 md:px-6 shadow-lg">ABANDON</Button>
        </div>
      </div>
      
      {/* Mobile Only ABANDON (Fixed position to ensure visibility) */}
      <div className="fixed top-24 right-4 z-[100] pointer-events-auto md:hidden">
          <Button variant="danger" onClick={handleExitClick} className="text-xs py-2 px-4 shadow-lg border-2 border-red-800 bg-red-600">ABANDON</Button>
      </div>

      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`w-full h-full block touch-none ${uiState.isPlacing ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {uiState.isPlacing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white font-bold bg-black/50 p-2 rounded text-sm md:text-base animate-pulse border border-white">
           TAP TO PLACE
        </div>
      )}

      {/* Tower Selection & Controls - Horizontal Scrollable for small screens */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center z-10">
         <div className="flex gap-2 md:gap-4 overflow-x-auto max-w-[95vw] px-4 pb-2 scroll-smooth items-center">
            {equippedCharacters.map(charId => {
                const tower = TOWERS[charId];
                if (!tower) return null;
                const isSelected = uiState.selectedTowerId === charId;
                const canAfford = uiState.coins >= tower.cost;

                return (
                <div 
                    key={charId}
                    onClick={() => {
                        if (isSelected) togglePlacement();
                        else selectTower(charId);
                    }}
                    className={`
                    relative group cursor-pointer flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-purple-900 border-4 rounded-xl flex items-center justify-center transition-all shadow-xl
                    ${isSelected ? 'border-yellow-400 scale-105 -translate-y-2' : 'border-gray-600 opacity-90'}
                    ${isSelected && uiState.isPlacing ? 'ring-2 md:ring-4 ring-green-400 animate-pulse' : ''}
                    ${!canAfford ? 'opacity-60 grayscale' : ''}
                    `}
                >
                    <img 
                    src={tower.image} 
                    alt={tower.name} 
                    className="w-10 h-10 md:w-14 md:h-14 object-contain"
                    style={{ filter: tower.filter }} 
                    />
                    <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-yellow-500 text-black font-bold rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center border-2 border-white text-[10px] md:text-xs z-10 shadow-md">
                    {tower.cost}
                    </div>
                </div>
                )
            })}
         </div>
      </div>
    </div>
  );
};

export default GameEngine;
