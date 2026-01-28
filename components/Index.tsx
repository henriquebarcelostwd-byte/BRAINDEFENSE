
import React, { useState, useRef, useEffect } from 'react';
import { TOWERS, ENEMIES } from '../constants';
import Button from './Button';
import { ArrowLeft, Shield, Sword, Star } from 'lucide-react';
import { Rarity } from '../types';

interface IndexProps {
  unlockedCharacters: string[];
  onBack: () => void;
}

const Index: React.FC<IndexProps> = ({ unlockedCharacters, onBack }) => {
  const [tab, setTab] = useState<'DEFENDERS' | 'ENEMIES'>('DEFENDERS');
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

  const getRarityColor = (rarity: Rarity) => {
    switch(rarity) {
      case 'COMMON': return 'bg-gray-600 border-gray-400 text-white';
      case 'RARE': return 'bg-blue-600 border-blue-400 text-white';
      case 'EPIC': return 'bg-purple-600 border-purple-400 text-white';
      case 'LEGENDARY': return 'bg-yellow-600 border-yellow-400 text-black';
      case 'MYTHICAL': return 'bg-pink-600 border-pink-400 text-white';
      case 'GODLIKE': return 'bg-red-700 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.8)]';
      default: return 'bg-gray-600 border-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-4 md:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-2xl px-3 md:px-6">
                <ArrowLeft size={20} /> BACK
            </Button>
            <h2 className="text-3xl md:text-5xl font-spooky text-blue-400 drop-shadow-lg">GAME INDEX</h2>
            <div className="w-16 md:w-32"></div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 md:gap-4 mb-6 md:mb-8 flex-shrink-0">
            <button
                onClick={() => setTab('DEFENDERS')}
                className={`px-4 md:px-8 py-2 rounded-t-xl font-chaotic text-lg md:text-2xl border-t-4 border-x-4 transition-all ${tab === 'DEFENDERS' ? 'bg-blue-800 border-blue-500 text-white translate-y-2' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2"><Shield size={20} /> DEFENDERS ({unlockedCharacters.length})</div>
            </button>
            <button
                onClick={() => setTab('ENEMIES')}
                className={`px-4 md:px-8 py-2 rounded-t-xl font-chaotic text-lg md:text-2xl border-t-4 border-x-4 transition-all ${tab === 'ENEMIES' ? 'bg-red-800 border-red-500 text-white translate-y-2' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2"><Sword size={20} /> ENEMIES</div>
            </button>
        </div>

        {/* Content Area */}
        <div 
          ref={scrollRef}
          className="flex-1 bg-gray-900/80 border-4 border-blue-500 rounded-xl p-4 md:p-6 overflow-y-auto shadow-2xl custom-scrollbar"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
                {tab === 'DEFENDERS' ? (
                    Object.values(TOWERS)
                        .filter(tower => unlockedCharacters.includes(tower.id))
                        .map(tower => (
                        <div key={tower.id} className="relative bg-slate-800 border-2 border-blue-400 rounded-lg p-3 md:p-4 flex gap-4 items-center shadow-lg hover:scale-105 transition-transform">
                            
                            {/* Rarity Badge */}
                            <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border-2 shadow-md ${getRarityColor(tower.rarity)} flex items-center gap-1 z-10`}>
                               {tower.rarity === 'GODLIKE' || tower.rarity === 'LEGENDARY' ? <Star size={12} fill="currentColor" /> : null}
                               {tower.rarity}
                            </div>

                            <div className="w-20 h-20 md:w-24 md:h-24 bg-black/50 rounded-md border border-gray-600 flex items-center justify-center p-2 relative flex-shrink-0">
                                <img src={tower.image} className="w-full h-full object-contain" style={{ filter: tower.filter }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg md:text-xl font-chaotic text-yellow-400 leading-tight truncate">{tower.name}</h3>
                                <div className="text-xs md:text-sm font-mono text-gray-300 space-y-1 mt-2">
                                    <div className="flex justify-between"><span>DAMAGE:</span> <span className="text-red-400 font-bold">{tower.damage}</span></div>
                                    <div className="flex justify-between"><span>RANGE:</span> <span className="text-green-400 font-bold">{tower.range}</span></div>
                                    <div className="flex justify-between"><span>SPEED:</span> <span className="text-blue-400 font-bold">{tower.attackSpeedMs}ms</span></div>
                                    <div className="flex justify-between"><span>COST:</span> <span className="text-yellow-400 font-bold">{tower.cost}</span></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    Object.values(ENEMIES).map((enemy, idx) => (
                        <div key={idx} className="bg-slate-800 border-2 border-red-400 rounded-lg p-3 md:p-4 flex gap-4 items-center shadow-lg hover:scale-105 transition-transform">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-black/50 rounded-md border border-gray-600 flex items-center justify-center p-2 flex-shrink-0">
                                <img src={enemy.image} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg md:text-xl font-chaotic text-red-400 leading-tight truncate">{enemy.name}</h3>
                                <div className="text-xs md:text-sm font-mono text-gray-300 space-y-1 mt-2">
                                    <div className="flex justify-between"><span>HP:</span> <span className="text-green-400 font-bold">{enemy.hp}</span></div>
                                    <div className="flex justify-between"><span>SPEED:</span> <span className="text-blue-400 font-bold">{enemy.speed}</span></div>
                                    <div className="flex justify-between"><span>DMG:</span> <span className="text-red-400 font-bold">{enemy.damage}</span></div>
                                    <div className="flex justify-between"><span>REWARD:</span> <span className="text-yellow-400 font-bold">{enemy.reward}</span></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {tab === 'DEFENDERS' && Object.values(TOWERS).filter(tower => unlockedCharacters.includes(tower.id)).length === 0 && (
                   <div className="col-span-full text-center text-gray-500 font-mono py-10">
                     NO DEFENDERS DISCOVERED YET.
                   </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Index;
