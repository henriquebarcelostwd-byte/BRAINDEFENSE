
import React, { useRef, useEffect } from 'react';
import { TOWERS } from '../constants';
import Button from './Button';
import { ArrowLeft, Shield, XCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface InventoryProps {
  unlockedCharacters: string[];
  equippedCharacters: string[];
  onUpdateLoadout: (newLoadout: string[]) => void;
  onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ unlockedCharacters, equippedCharacters, onUpdateLoadout, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleEquip = (id: string) => {
    if (equippedCharacters.includes(id)) return; // Already equipped
    if (equippedCharacters.length >= 5) return; // Full (Max 5)
    onUpdateLoadout([...equippedCharacters, id]);
  };

  const handleUnequip = (id: string) => {
    onUpdateLoadout(equippedCharacters.filter(charId => charId !== id));
  };

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

  const scroll = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const amount = direction === 'up' ? -300 : 300;
      scrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

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
        className="h-full w-full overflow-y-auto bg-gradient-to-br from-gray-900 to-purple-900 custom-scrollbar"
      >
        <div className="min-h-full flex flex-col p-4 md:p-8 pb-20">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 z-20 bg-gradient-to-b from-gray-900/90 to-transparent pb-4 pt-2 -mt-2">
            <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-2xl px-3 md:px-6 shadow-lg">
              <ArrowLeft size={20} /> SAVE & BACK
            </Button>
            <h2 className="hidden md:block text-3xl md:text-5xl font-spooky text-green-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center px-2">
              BATTLE LOADOUT
            </h2>
            <div className="w-8 md:w-32"></div> {/* Spacer */}
          </div>

          {/* Mobile Header Title */}
          <h2 className="md:hidden text-4xl font-spooky text-green-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center mb-6">
              BATTLE LOADOUT
          </h2>

          {/* ACTIVE LOADOUT AREA */}
          <div className="flex flex-col items-center mb-8 md:mb-12">
            <div className="text-yellow-400 font-chaotic text-xl md:text-2xl mb-4 tracking-widest bg-black/30 px-4 py-1 rounded-full border border-yellow-500/30">
              SELECTED SQUAD ({equippedCharacters.length}/5)
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 p-4 md:p-6 bg-black/40 rounded-xl border-4 border-yellow-600 shadow-2xl w-full max-w-5xl backdrop-blur-sm">
              {Array.from({ length: 5 }).map((_, idx) => {
                const charId = equippedCharacters[idx];
                const tower = charId ? TOWERS[charId] : null;

                return (
                  <div 
                    key={idx}
                    className={`
                      relative w-16 h-16 md:w-28 md:h-28 rounded-lg flex items-center justify-center border-4 transition-all
                      ${tower 
                        ? 'bg-purple-800 border-green-500 cursor-pointer hover:bg-red-900/50 hover:border-red-500 group shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                        : 'bg-black/60 border-gray-700 border-dashed'}
                    `}
                    onClick={() => tower && handleUnequip(charId!)}
                  >
                    {tower ? (
                      <>
                        <img src={tower.image} alt={tower.name} className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-md" />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <XCircle className="text-red-500 bg-black rounded-full w-4 h-4 md:w-6 md:h-6" />
                        </div>
                        <div className="absolute bottom-0 w-full bg-black/80 text-white text-[8px] md:text-[10px] text-center font-mono py-1 truncate px-1 rounded-b-[2px]">
                          {tower.name}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-600 font-chaotic text-sm md:text-xl">EMPTY</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLLECTION AREA */}
          <div className="bg-black/30 rounded-xl p-4 md:p-6 border-2 border-purple-500 shadow-xl backdrop-blur-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-purple-400" />
              <h3 className="text-2xl md:text-3xl font-chaotic text-purple-300">YOUR COLLECTION</h3>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-6">
              {unlockedCharacters.map((id) => {
                const tower = TOWERS[id];
                if (!tower) return null;
                const isEquipped = equippedCharacters.includes(id);

                return (
                  <div 
                    key={id}
                    onClick={() => !isEquipped && handleEquip(id)}
                    className={`
                      relative aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-between transition-all group
                      ${isEquipped 
                        ? 'bg-gray-800 border-gray-600 opacity-50 cursor-default grayscale' 
                        : 'bg-purple-900 border-purple-400 cursor-pointer hover:scale-105 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.5)]'}
                    `}
                  >
                    {isEquipped && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center font-chaotic text-green-400 text-lg md:text-2xl rotate-12 drop-shadow-md">
                        EQUIPPED
                      </div>
                    )}
                    
                    <div className="w-full h-2/3 flex items-center justify-center">
                      <img src={tower.image} alt={tower.name} className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <div className="text-center w-full bg-black/40 rounded px-1 py-1">
                      <div className="text-[9px] md:text-xs text-yellow-500 font-bold truncate leading-tight">{tower.name}</div>
                      <div className="text-[8px] md:text-[10px] text-gray-300">DMG: {tower.damage}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
