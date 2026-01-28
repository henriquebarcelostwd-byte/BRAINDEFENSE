
import React, { useRef, useEffect } from 'react';
import Button from './Button';
import { Lock, ArrowLeft, Snowflake, ChevronUp, ChevronDown } from 'lucide-react';

interface LevelSelectProps {
  unlockedCharacters: string[];
  completedLevels: number[];
  onSelectLevel: (id: number) => void;
  onBack: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ unlockedCharacters, completedLevels, onSelectLevel, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const hasCharacter = unlockedCharacters.length > 0;
  const isLevel1Locked = !hasCharacter;
  const isLevel2Locked = !completedLevels.includes(1);

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
        className="h-full w-full overflow-y-auto bg-purple-900 bg-opacity-95 custom-scrollbar"
      >
        <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 pb-20">
          
          <h2 className="text-5xl md:text-7xl font-spooky text-green-400 drop-shadow-lg mb-8 text-center mt-4">
            SOLO MODE
          </h2>
          
          {!hasCharacter && (
            <div className="bg-red-900/80 border-2 border-red-500 p-4 rounded text-white font-bold animate-pulse mb-8 text-center max-w-md shadow-lg">
              WARNING: NO DEFENDERS RECRUITED. VISIT THE STORE FIRST!
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center w-full max-w-5xl mb-12">
            
            {/* LEVEL 1 CARD */}
            <div className="relative group">
              <button
                onClick={() => !isLevel1Locked && onSelectLevel(1)}
                disabled={isLevel1Locked}
                className={`
                  w-72 h-72 md:w-80 md:h-96 border-4 rounded-2xl flex flex-col items-center justify-center space-y-2 md:space-y-4 transition-all relative overflow-hidden
                  ${isLevel1Locked 
                    ? 'bg-gray-800 border-gray-600 opacity-70 cursor-not-allowed' 
                    : 'bg-green-800 border-green-500 hover:bg-green-700 hover:scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:shadow-green-500/30'
                  }
                `}
              >
                {/* Completion Star */}
                {completedLevels.includes(1) && (
                  <div className="absolute top-2 right-2 text-yellow-400 text-3xl md:text-4xl drop-shadow-md">★</div>
                )}

                <div className="text-7xl md:text-9xl font-chaotic text-white drop-shadow-lg">
                  1
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-200 uppercase tracking-widest text-center px-2 font-chaotic">
                  THE FOREST
                </div>
                <div className="text-sm md:text-base font-mono text-green-300 opacity-75 bg-black/30 px-3 py-1 rounded-full">
                  3 STAGES
                </div>
                {isLevel1Locked && <Lock size={64} className="text-gray-400 absolute opacity-50" />}
              </button>
            </div>

            {/* LEVEL 2 CARD: DARK ICE */}
            <div className="relative group">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 -left-12 w-12 h-2 bg-gray-600 -translate-y-1/2 -z-10 border-y border-gray-500"></div>
              
              <button
                onClick={() => !isLevel2Locked && onSelectLevel(2)}
                disabled={isLevel2Locked}
                className={`
                  w-72 h-72 md:w-80 md:h-96 border-4 rounded-2xl flex flex-col items-center justify-center space-y-2 md:space-y-4 transition-all relative overflow-hidden
                  ${isLevel2Locked 
                    ? 'bg-gray-900 border-gray-700 opacity-80 cursor-not-allowed' 
                    : 'bg-cyan-900 border-cyan-500 hover:bg-cyan-800 hover:scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:shadow-cyan-500/30'
                  }
                `}
              >
                {/* Completion Star */}
                {completedLevels.includes(2) && (
                  <div className="absolute top-2 right-2 text-yellow-400 text-3xl md:text-4xl drop-shadow-md">★</div>
                )}

                {isLevel2Locked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm p-4">
                    <Lock size={64} className="text-gray-400 mb-4" />
                    <span className="text-cyan-300 font-bold bg-black/50 px-3 py-1 rounded text-sm md:text-base border border-cyan-900">COMPLETE LEVEL 1</span>
                  </div>
                )}

                <div className="text-7xl md:text-9xl font-chaotic text-white drop-shadow-lg relative">
                  2
                  {!isLevel2Locked && <Snowflake size={32} className="absolute -top-2 -right-8 md:-top-4 md:-right-10 text-cyan-300 opacity-50 animate-spin-slow" />}
                </div>
                <div className={`text-2xl md:text-3xl font-bold uppercase tracking-widest text-center px-2 font-chaotic ${isLevel2Locked ? 'text-gray-500' : 'text-cyan-200'}`}>
                  DARK ICE
                </div>
                <div className={`text-sm md:text-base font-mono opacity-75 bg-black/30 px-3 py-1 rounded-full ${isLevel2Locked ? 'text-gray-600' : 'text-cyan-300'}`}>
                  3 STAGES
                </div>
              </button>
            </div>

          </div>

          <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-2xl px-6 md:px-8 py-3 md:py-4 shadow-xl">
            <ArrowLeft size={24} /> MAIN MENU
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
