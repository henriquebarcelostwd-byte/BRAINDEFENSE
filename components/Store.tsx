
import React, { useState, useRef, useEffect } from 'react';
import { TOWERS, IMAGES } from '../constants';
import Button from './Button';
import { ArrowLeft, Unlock, Dice5, Ticket, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { TowerConfig } from '../types';

interface StoreProps {
  brainCoins: number;
  unlockedCharacters: string[];
  redeemedCodes: string[];
  onBuy: (id: string, cost: number) => void;
  onSpendCoins: (amount: number) => void;
  onUnlockCharacter: (id: string) => void;
  onRedeemCode: (code: string) => void;
  onBack: () => void;
}

const Store: React.FC<StoreProps> = ({ brainCoins, unlockedCharacters, redeemedCodes = [], onBuy, onSpendCoins, onUnlockCharacter, onRedeemCode, onBack }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<TowerConfig[]>([]);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [code, setCode] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard Scroll Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!scrollRef.current) return;
        if (e.key === 'ArrowDown') {
            scrollRef.current.scrollBy({ top: 100, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            scrollRef.current.scrollBy({ top: -100, behavior: 'smooth' });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const defender = TOWERS.BONECA_AMBALABU;
  const isDefenderOwned = unlockedCharacters.includes(defender.id);
  const canAffordDefender = brainCoins >= defender.storePrice;

  // Secret Item
  const laGrande = TOWERS.LA_GRANDE_COMBINACION;
  const isLaGrandeOwned = unlockedCharacters.includes(laGrande.id);
  const canAffordLaGrande = brainCoins >= laGrande.storePrice;
  
  // Chocolatini Special
  const chocolatini = TOWERS.CHOCOLATINI;
  const isChocolatiniOwned = unlockedCharacters.includes(chocolatini.id);
  const canAffordChocolatini = brainCoins >= chocolatini.storePrice;
  const isChocolatiniUnlocked = redeemedCodes.includes('CHOCOLATINI_STORE_ACCESS') || isChocolatiniOwned;

  const LUCKY_BLOCK_COST = 40;
  const canAffordLucky = brainCoins >= LUCKY_BLOCK_COST;

  const LUCKY_POOL = [
    { id: 'TRIPPI_CAT', weight: 40 },
    { id: 'WIFIRMINO', weight: 35 },
    { id: 'TRULIMERO', weight: 20 },
    { id: 'VACA_SATURNO', weight: 5 }
  ];

  const scroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const amount = direction === 'up' ? -300 : 300;
      scrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  const handleOpenLuckyBlock = () => {
    if (isSpinning) return;
    if (brainCoins < LUCKY_BLOCK_COST) return;
    
    onSpendCoins(LUCKY_BLOCK_COST);
    startRoulette();
  };

  const handleRedeem = () => {
    if (code.trim()) {
      onRedeemCode(code);
      setCode('');
    }
  };

  const startRoulette = () => {
    setRewardMessage(null);
    setIsSpinning(true);
    
    // 1. Determine Winner
    const rand = Math.random() * 100;
    let accumulated = 0;
    let winnerId = 'TRIPPI_CAT';
    
    for (const item of LUCKY_POOL) {
      accumulated += item.weight;
      if (rand <= accumulated) {
        winnerId = item.id;
        break;
      }
    }

    // 2. Generate Strip
    const TARGET_INDEX = 35; 
    
    const strip: TowerConfig[] = [];
    const poolKeys = LUCKY_POOL.map(p => p.id);
    
    for (let i = 0; i < TARGET_INDEX; i++) {
      let randomKey = poolKeys[Math.floor(Math.random() * poolKeys.length)];
      if (i === TARGET_INDEX - 1) {
          while (randomKey === winnerId) {
             randomKey = poolKeys[Math.floor(Math.random() * poolKeys.length)];
          }
      }
      strip.push(TOWERS[randomKey]);
    }
    
    strip.push(TOWERS[winnerId]);
    
    for (let i = 0; i < 5; i++) {
       let randomKey = poolKeys[Math.floor(Math.random() * poolKeys.length)];
       if (i === 0) {
          while (randomKey === winnerId) {
             randomKey = poolKeys[Math.floor(Math.random() * poolKeys.length)];
          }
       }
       strip.push(TOWERS[randomKey]);
    }

    setRouletteItems(strip);
    setShowRoulette(true);
    setWinnerIndex(2);

    setTimeout(() => {
       setWinnerIndex(TARGET_INDEX); 
    }, 100);

    setTimeout(() => {
       setRewardMessage(TOWERS[winnerId].name.toUpperCase());
       onUnlockCharacter(winnerId);
    }, 6500); 
  };

  const closeRoulette = () => {
    if (isSpinning && !rewardMessage) return; 
    setShowRoulette(false);
    setRewardMessage(null);
    setIsSpinning(false); 
  };

  const ITEM_WIDTH = 160;

  return (
    <div className="h-full w-full relative">
       {/* Manual Scroll Controls */}
      <div className="absolute bottom-20 right-4 z-40 flex flex-col gap-4 pointer-events-auto">
        <button 
          onClick={() => scroll('up')}
          className="bg-purple-600/80 p-3 rounded-full border-2 border-purple-400 shadow-lg active:scale-95 hover:bg-purple-500 backdrop-blur-sm"
        >
          <ChevronUp size={32} color="white" />
        </button>
        <button 
          onClick={() => scroll('down')}
          className="bg-purple-600/80 p-3 rounded-full border-2 border-purple-400 shadow-lg active:scale-95 hover:bg-purple-500 backdrop-blur-sm"
        >
          <ChevronDown size={32} color="white" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto bg-purple-900 bg-opacity-95 custom-scrollbar"
      >
        <div className="min-h-full flex flex-col p-4 md:p-8 pb-20">
          
          <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 z-20 pt-2 -mt-2 pb-2 bg-purple-900/90 backdrop-blur">
            <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-2xl px-3 md:px-6 shadow-lg">
              <ArrowLeft size={20} /> BACK
            </Button>
            <div className="bg-black/50 p-2 md:p-4 border-2 border-green-500 rounded-lg shadow-lg">
              <span className="text-yellow-400 font-chaotic text-xl md:text-3xl flex items-center gap-2">
                <span className="text-2xl">💰</span> {brainCoins}
              </span>
            </div>
          </div>

          <h2 className="text-5xl md:text-6xl font-spooky text-center text-green-400 mb-8 md:mb-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
            THE DARK MARKET
          </h2>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
            
            {/* Boneca Ambalabu */}
            <div className="bg-purple-800 border-4 border-green-600 p-4 md:p-6 rounded-xl w-full md:max-w-sm shadow-2xl transform hover:scale-[1.02] transition-transform flex flex-col">
              <div className="relative w-full h-40 md:h-48 bg-black/40 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-purple-500">
                <img 
                  src={defender.image} 
                  alt={defender.name}
                  className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                />
                {isDefenderOwned && (
                  <div className="absolute top-2 right-2 text-green-400">
                    <Unlock size={24} />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl md:text-2xl font-chaotic text-white mb-2">{defender.name}</h3>
              <p className="text-purple-200 text-xs md:text-sm mb-4 flex-1">
                Shoots a smaller version of herself. Classic defense.
              </p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-yellow-400 font-bold text-lg md:text-xl">
                  {defender.storePrice} BC
                </span>
                
                {isDefenderOwned ? (
                  <Button variant="locked" disabled className="text-sm md:text-2xl">
                    OWNED
                  </Button>
                ) : (
                  <Button 
                    variant={canAffordDefender ? 'primary' : 'locked'}
                    onClick={() => canAffordDefender && onBuy(defender.id, defender.storePrice)}
                    disabled={!canAffordDefender}
                    className="text-sm md:text-2xl"
                  >
                    BUY
                  </Button>
                )}
              </div>
            </div>

            {/* Chocolatini & Coffezini (Conditional) */}
            {isChocolatiniUnlocked && (
              <div className="bg-gradient-to-br from-pink-900 via-amber-900 to-pink-900 border-4 border-pink-500 p-4 md:p-6 rounded-xl w-full md:max-w-sm shadow-[0_0_20px_rgba(236,72,153,0.3)] transform hover:scale-[1.02] transition-transform relative overflow-hidden group flex flex-col">
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold px-4 py-1 z-20 font-chaotic text-sm md:text-lg transform rotate-6 translate-x-2 -translate-y-1 shadow-lg border-2 border-white animate-pulse">
                    SPECIAL DEAL!
                  </div>

                  <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  <div className="relative w-full h-40 md:h-48 bg-black/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-pink-400">
                    <img 
                      src={chocolatini.image} 
                      alt={chocolatini.name}
                      className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,100,100,0.5)]"
                    />
                    {isChocolatiniOwned && (
                      <div className="absolute top-2 left-2 text-green-400">
                        <Unlock size={24} />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-spooky text-pink-300 mb-2 truncate flex items-center gap-2">
                    {chocolatini.name} <Sparkles size={16} className="text-yellow-400"/>
                  </h3>
                  <p className="text-pink-100 text-xs md:text-sm mb-4 flex-1">
                    Sweet and deadly. The perfect duo for destruction.
                  </p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 line-through text-xs font-mono">400 BC</span>
                      <span className="text-yellow-400 font-bold text-xl md:text-2xl">
                        {chocolatini.storePrice} BC
                      </span>
                    </div>
                    
                    {isChocolatiniOwned ? (
                      <Button variant="locked" disabled className="text-sm md:text-2xl">
                        OWNED
                      </Button>
                    ) : (
                      <Button 
                        className="bg-pink-700 border-pink-900 hover:bg-pink-600 text-sm md:text-2xl"
                        onClick={() => canAffordChocolatini && onBuy(chocolatini.id, chocolatini.storePrice)}
                        disabled={!canAffordChocolatini}
                      >
                        BUY DEAL
                      </Button>
                    )}
                  </div>
              </div>
            )}

            {/* Emerald Lucky Block */}
            <div className="bg-gradient-to-br from-green-900 to-green-700 border-4 border-yellow-400 p-4 md:p-6 rounded-xl w-full md:max-w-sm shadow-2xl transform hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse"></div>
              
              <div className="relative w-full h-40 md:h-48 bg-black/40 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-green-300">
                <img 
                  src={IMAGES.LUCKY_BLOCK} 
                  alt="Emerald Lucky Block"
                  className="h-full object-contain drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]"
                />
              </div>
              
              <h3 className="text-xl md:text-2xl font-chaotic text-yellow-300 mb-2">EMERALD LUCKY BLOCK</h3>
              <p className="text-green-100 text-xs md:text-sm mb-4 flex-1">
                Contains exclusive defenders!
                <br/>
                <span className="text-yellow-200 text-xs">Trulimero, Trippi, Vaca Saturno...</span>
              </p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-yellow-400 font-bold text-lg md:text-xl">
                  {LUCKY_BLOCK_COST} BC
                </span>
                
                <Button 
                  className={`bg-yellow-600 border-yellow-800 hover:bg-yellow-500 text-white text-sm md:text-2xl`}
                  variant={canAffordLucky ? 'primary' : 'locked'}
                  onClick={handleOpenLuckyBlock}
                  disabled={!canAffordLucky || isSpinning}
                >
                  <div className="flex items-center gap-2">
                    <Dice5 size={20}/> {isSpinning ? '...' : 'OPEN'}
                  </div>
                </Button>
              </div>
            </div>

            {/* La Grande Combinacion Card */}
            <div className="bg-gradient-to-br from-red-900 via-black to-red-900 border-4 border-red-600 p-4 md:p-6 rounded-xl w-full md:max-w-sm shadow-[0_0_20px_rgba(255,0,0,0.5)] transform hover:scale-[1.02] transition-transform relative overflow-hidden group flex flex-col">
                <div className="absolute inset-0 bg-red-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                
                <div className="absolute top-0 right-0 bg-red-600 text-white font-bold px-4 py-1 z-20 font-chaotic text-lg md:text-xl transform rotate-12 translate-x-4 -translate-y-2 shadow-lg">
                  99.999% OFF!
                </div>

                <div className="relative w-full h-40 md:h-48 bg-black/60 rounded-lg mb-4 flex items-center justify-center overflow-hidden border-2 border-red-500">
                  <img 
                    src={laGrande.image} 
                    alt={laGrande.name}
                    className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]"
                  />
                  {isLaGrandeOwned && (
                    <div className="absolute top-2 left-2 text-green-400">
                      <Unlock size={24} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl md:text-2xl font-spooky text-red-500 mb-2 animate-pulse">{laGrande.name}</h3>
                <p className="text-red-200 text-xs md:text-sm mb-4 font-chaotic flex-1">
                  THE ULTIMATE BRAINROT. 1000 DMG.
                </p>
                
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                          <span className="text-gray-500 line-through text-xs font-mono">250,000,000 BC</span>
                          <span className="text-yellow-400 font-bold text-xl md:text-2xl animate-bounce">
                          {laGrande.storePrice} BC
                          </span>
                      </div>
                      
                      {isLaGrandeOwned ? (
                      <Button variant="locked" disabled className="text-sm md:text-2xl">
                          OWNED
                      </Button>
                      ) : (
                      <Button 
                          className="bg-red-700 border-red-900 hover:bg-red-600 text-sm md:text-2xl"
                          onClick={() => canAffordLaGrande && onBuy(laGrande.id, laGrande.storePrice)}
                          disabled={!canAffordLaGrande}
                      >
                          BUY NOW
                      </Button>
                      )}
                  </div>
                </div>
            </div>

          </div>

          {/* SECRET CODES SECTION */}
          <div className="flex justify-center w-full mb-12">
            <div className="bg-black/40 border-2 border-purple-500 rounded-xl p-4 md:p-6 w-full max-w-lg backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4 text-purple-300 font-chaotic text-xl md:text-2xl">
                <Ticket size={24} /> SECRET CODES
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ENTER CODE..."
                  className="flex-1 bg-black border border-purple-600 text-white font-mono px-4 py-2 rounded focus:outline-none focus:border-green-500 text-sm md:text-base"
                />
                <Button onClick={handleRedeem} className="py-2 text-sm md:text-lg">REDEEM</Button>
              </div>
            </div>
          </div>

          {/* ROULETTE MODAL */}
          {showRoulette && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300 animate-in fade-in zoom-in-95">
              <div className="relative w-full max-w-4xl bg-purple-900 border-4 border-yellow-500 rounded-xl p-4 md:p-8 shadow-2xl overflow-hidden flex flex-col items-center">
                  
                  <h2 className="text-3xl md:text-4xl font-spooky text-yellow-400 mb-4 md:mb-8 animate-pulse text-center">
                    {rewardMessage ? 'CONGRATULATIONS!' : 'SPINNING...'}
                  </h2>

                  {/* Roulette Window */}
                  <div className="relative w-full h-32 md:h-48 bg-black border-4 border-gray-700 rounded-lg overflow-hidden mb-4 md:mb-8 shadow-inner">
                    
                    {/* Visual Selection Frame */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 border-4 border-yellow-400 z-40 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.6)] pointer-events-none box-border">
                        <div className="absolute -top-4 md:-top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-2xl md:text-4xl">▼</div>
                        <div className="absolute -bottom-4 md:-bottom-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-2xl md:text-4xl">▲</div>
                    </div>

                    {/* Center Line Guide */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-500/30 z-20 transform -translate-x-1/2"></div>

                    {/* The Strip */}
                    <div 
                      className="flex h-full items-center absolute top-0 left-1/2 will-change-transform"
                      style={{
                        width: `${rouletteItems.length * ITEM_WIDTH}px`,
                        transform: `translateX(-${(winnerIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2)}px)`, 
                        transition: !rewardMessage && isSpinning ? 'transform 6s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                      }}
                    >
                        {rouletteItems.map((item, idx) => (
                          <div 
                            key={idx} 
                            style={{ width: `${ITEM_WIDTH}px` }}
                            className="flex-shrink-0 flex flex-col items-center justify-center p-2"
                          >
                            <div className={`
                              w-24 h-24 md:w-32 md:h-32 bg-gray-800 border-4 rounded-lg flex items-center justify-center p-2 relative
                              ${item.id === 'VACA_SATURNO' ? 'border-purple-400 bg-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 
                                item.id === 'TRULIMERO' ? 'border-blue-400 shadow-[0_0_10px_rgba(50,50,255,0.4)]' : 
                                item.id === 'WIFIRMINO' ? 'border-green-400' :
                                'border-gray-600'}
                              ${idx === winnerIndex && rewardMessage ? 'scale-110 shadow-[0_0_30px_rgba(255,255,255,0.8)] border-white ring-4 ring-green-500' : ''}
                            `}>
                              <img src={item.image} className="w-full h-full object-contain" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {rewardMessage ? (
                    <div className="text-center animate-bounce">
                        <p className="text-green-400 text-lg md:text-xl font-chaotic mb-2">YOU UNLOCKED:</p>
                        <p className="text-3xl md:text-5xl text-white font-spooky drop-shadow-md">{rewardMessage}</p>
                        <Button onClick={closeRoulette} className="mt-8 bg-green-600">COLLECT</Button>
                    </div>
                  ) : (
                    <div className="h-16 md:h-24 flex items-center justify-center text-white/50 font-mono">
                      GOOD LUCK...
                    </div>
                  )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store;
