
import React, { useRef, useEffect } from 'react';
import Button from './Button';
import { ArrowLeft, Lock, Shield, Map, ChevronUp, ChevronDown, Users, Globe } from 'lucide-react';

interface GameModesProps {
  onSelectTowerDefense: () => void;
  onSelectMultiplayer: () => void;
  onBack: () => void;
}

const GameModes: React.FC<GameModesProps> = ({ onSelectTowerDefense, onSelectMultiplayer, onBack }) => {
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
          className="bg-gray-700/80 p-3 rounded-full border-2 border-gray-400 shadow-lg active:scale-95 hover:bg-gray-600 backdrop-blur-sm"
        >
          <ChevronUp size={32} color="white" />
        </button>
        <button 
          onClick={() => scroll('down')}
          className="bg-gray-700/80 p-3 rounded-full border-2 border-gray-400 shadow-lg active:scale-95 hover:bg-gray-600 backdrop-blur-sm"
        >
          <ChevronDown size={32} color="white" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-950 to-black relative custom-scrollbar"
      >
        
        {/* Background decoration - Fixed so it doesn't scroll away */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] fixed"></div>

        <div className="min-h-full flex flex-col items-center p-4 md:p-8 relative z-10 pb-20">
          
          {/* Responsive Header */}
          <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-4 relative">
            <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 self-start md:self-auto z-20">
              <ArrowLeft size={24} /> MAIN MENU
            </Button>
            
            <h2 className="text-5xl md:text-7xl font-spooky text-green-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wider text-center md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-auto pointer-events-none">
              GAME MODES
            </h2>
            
            <div className="w-40 hidden md:block"></div> {/* Spacer */}
          </div>

          <div className="flex flex-wrap gap-8 md:gap-12 items-center justify-center w-full max-w-7xl flex-1">
            
            {/* TOWER DEFENSE CARD (CLASSIC) */}
            <div 
              onClick={onSelectTowerDefense}
              className="group relative w-full max-w-md lg:w-[400px] bg-gray-800 border-4 border-green-600 rounded-2xl overflow-hidden cursor-pointer shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
              
              <div className="aspect-video w-full bg-black overflow-hidden relative border-b-4 border-green-700">
                <img 
                  src="https://i.postimg.cc/j2Tx3fqC/Chat-GPT-Image-26-de-jan-de-2026-09-22-35.png" 
                  alt="Tower Defense" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-green-600 text-white font-bold px-3 py-1 rounded border-2 border-white shadow-lg flex items-center gap-2 z-20">
                  <Shield size={16} /> CLASSIC
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col items-center text-center bg-gradient-to-b from-gray-900 to-black flex-1">
                <h3 className="text-3xl md:text-4xl font-chaotic text-green-400 mb-4 group-hover:text-green-300 transition-colors">
                  TOWER DEFENSE
                </h3>
                <p className="text-gray-400 font-sans text-sm md:text-base mb-8 px-2 leading-relaxed">
                  Defend against waves of chaotic enemies! Build your squad, manage resources, and protect the tower.
                </p>
                <Button className="mt-auto w-full group-hover:bg-green-500 transition-colors py-4 text-xl">
                  PLAY NOW
                </Button>
              </div>
            </div>

            {/* MULTIPLAYER CARD (LOCKED) */}
            <div
              className="relative w-full max-w-md lg:w-[400px] bg-gray-900 border-4 border-gray-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center pointer-events-none">
                 <div className="bg-yellow-600 text-black font-chaotic text-3xl px-6 py-2 rounded-lg border-4 border-yellow-400 transform -rotate-12 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    MAINTENANCE
                 </div>
              </div>

              <div className="aspect-video w-full bg-black overflow-hidden relative border-b-4 border-gray-700 grayscale opacity-50">
                <img
                  src="https://i.postimg.cc/8zKnj7qM/Chat-GPT-Image-28-de-jan-de-2026-07-14-19.png"
                  alt="Multiplayer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8 flex flex-col items-center text-center bg-black flex-1">
                <h3 className="text-3xl md:text-4xl font-chaotic text-gray-500 mb-4">
                  MULTIPLAYER TD
                </h3>
                <p className="text-gray-600 font-sans text-sm md:text-base mb-8 px-2 leading-relaxed">
                  Online services are currently down for upgrades. Please check back later.
                </p>
                <Button variant="locked" className="mt-auto w-full py-4 text-xl">
                  UNAVAILABLE
                </Button>
              </div>
            </div>

            {/* STRATEGY MODE CARD (LOCKED) */}
            <div className="relative w-full max-w-md lg:w-[400px] bg-gray-900 border-4 border-gray-700 rounded-2xl overflow-hidden shadow-2xl grayscale opacity-80 flex flex-col">
              
              <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center p-4 text-center">
                <Lock size={64} className="text-gray-400 mb-4" />
                <div className="bg-red-900/80 text-red-200 border-2 border-red-500 px-6 py-2 rounded-lg text-xl md:text-2xl font-chaotic animate-pulse mb-2">
                  COMING SOON
                </div>
              </div>

              <div className="aspect-video w-full bg-black overflow-hidden relative border-b-4 border-gray-700">
                <img 
                  src="https://i.postimg.cc/yNS7Vjks/Chat-GPT-Image-26-de-jan-de-2026-09-32-04.png" 
                  alt="Strategy Mode" 
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute top-4 right-4 bg-gray-700 text-gray-300 font-bold px-3 py-1 rounded border-2 border-gray-500 shadow-lg flex items-center gap-2">
                  <Map size={16} /> STRATEGY
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col items-center text-center bg-black flex-1">
                <h3 className="text-3xl md:text-4xl font-chaotic text-gray-500 mb-4">
                  STRATEGY MODE
                </h3>
                <p className="text-gray-600 font-sans text-sm md:text-base mb-8 px-2 leading-relaxed">
                  Command armies in turn-based tactical warfare. Conquer territories and defeat rival factions.
                </p>
                <Button variant="locked" className="mt-auto w-full py-4 text-xl">
                  LOCKED
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModes;
