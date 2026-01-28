
import React, { useState } from 'react';
import { TOWERS, EVOLUTION_TREE } from '../constants';
import Button from './Button';
import { ArrowLeft, Dna, ArrowRight, FlaskConical } from 'lucide-react';

interface EvolutionLabProps {
  brainCoins: number;
  unlockedCharacters: string[];
  onEvolve: (baseId: string, targetId: string, cost: number) => void;
  onBack: () => void;
}

const EvolutionLab: React.FC<EvolutionLabProps> = ({ brainCoins, unlockedCharacters, onEvolve, onBack }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter only characters that HAVE an evolution and are OWNED
  const evolvableCharacters = unlockedCharacters.filter(id => EVOLUTION_TREE[id]);

  const selectedBase = selectedId ? TOWERS[selectedId] : null;
  const evolutionData = selectedId ? EVOLUTION_TREE[selectedId] : null;
  const selectedTarget = evolutionData ? TOWERS[evolutionData.targetId] : null;

  const canAfford = evolutionData ? brainCoins >= evolutionData.cost : false;

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-black pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 md:p-6 border-b border-green-900/50 bg-black/50 backdrop-blur-sm">
        <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-base px-4 py-2">
          <ArrowLeft size={20} /> BACK
        </Button>
        <div className="flex flex-col items-center">
           <h2 className="text-3xl md:text-5xl font-spooky text-green-500 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
             EVOLUTION LAB
           </h2>
        </div>
        <div className="bg-black/50 p-2 md:p-4 border-2 border-green-500 rounded-lg flex items-center gap-2">
          <span className="text-yellow-400 font-chaotic text-xl md:text-3xl">
            {brainCoins} BC
          </span>
        </div>
      </div>

      {/* Main Content - Flex Column on Mobile, Row on Desktop */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative z-10 p-4 md:p-8 gap-4 md:gap-8 pb-20 lg:pb-8">
        
        {/* LIST OF SPECIMENS */}
        <div className="w-full lg:w-1/3 bg-gray-900/80 border-2 border-green-800 rounded-xl flex flex-col overflow-hidden max-h-[30vh] lg:max-h-full">
          <div className="p-4 bg-green-900/30 border-b border-green-800 font-chaotic text-xl md:text-2xl text-green-400 flex items-center gap-2 sticky top-0 bg-gray-900 z-10">
            <FlaskConical /> SPECIMENS
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {evolvableCharacters.length === 0 ? (
               <div className="text-gray-500 text-center mt-4 font-mono">NO EVOLVABLE UNITS FOUND.</div>
            ) : (
               evolvableCharacters.map(id => {
                 const tower = TOWERS[id];
                 const isSelected = selectedId === id;
                 return (
                   <div 
                     key={id}
                     onClick={() => setSelectedId(id)}
                     className={`
                       flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all active:scale-95
                       ${isSelected ? 'bg-green-900/40 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/40 border-gray-700 hover:border-gray-500'}
                     `}
                   >
                      <img src={tower.image} className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                      <div>
                        <div className="font-chaotic text-lg md:text-xl text-white">{tower.name}</div>
                        <div className="text-[10px] md:text-xs text-gray-400 font-mono">READY FOR EVOLUTION</div>
                      </div>
                   </div>
                 );
               })
            )}
          </div>
        </div>

        {/* EVOLUTION STAGE */}
        <div className="flex-1 bg-black/60 border-2 border-green-600 rounded-xl relative flex flex-col items-center justify-center p-4 md:p-8 min-h-[500px] lg:min-h-0">
           
           {!selectedBase ? (
             <div className="text-green-700 font-mono text-center text-lg md:text-xl animate-pulse px-4">SELECT A SPECIMEN FROM THE LIST TO BEGIN SEQUENCE...</div>
           ) : (
             <>
               <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full mb-8 md:mb-12">
                  {/* BEFORE */}
                  <div className="flex flex-col items-center">
                     <div className="w-32 h-32 md:w-48 md:h-48 border-4 border-gray-600 rounded-full bg-gray-900 flex items-center justify-center mb-4 relative">
                        <img src={selectedBase.image} className="w-20 h-20 md:w-32 md:h-32 object-contain" />
                        <div className="absolute -bottom-4 bg-gray-700 px-3 md:px-4 py-1 rounded text-white text-xs md:text-base font-bold">BASE</div>
                     </div>
                     <div className="text-center space-y-1 text-sm md:text-base">
                        <div className="text-red-400 font-bold">DMG: {selectedBase.damage}</div>
                        <div className="text-blue-400 font-bold">RNG: {selectedBase.range}</div>
                     </div>
                  </div>

                  {/* ARROW */}
                  <div className="flex flex-col items-center text-green-500 animate-pulse transform rotate-90 md:rotate-0">
                     <div className="text-xs font-mono mb-2 hidden md:block">DNA SEQUENCE</div>
                     <ArrowRight size={32} className="md:w-12 md:h-12" />
                     <div className="text-xs font-mono mt-2 hidden md:block">REWRITING</div>
                  </div>

                  {/* AFTER */}
                  <div className="flex flex-col items-center">
                     <div className="w-40 h-40 md:w-56 md:h-56 border-4 border-green-400 rounded-full bg-green-900/20 flex items-center justify-center mb-4 relative shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                        <img 
                          src={selectedTarget?.image} 
                          className="w-24 h-24 md:w-40 md:h-40 object-contain" 
                          style={{ filter: selectedTarget?.filter }}
                        />
                        <div className="absolute -bottom-4 bg-green-600 px-3 md:px-4 py-1 rounded text-white text-xs md:text-base font-bold shadow-lg">PRIME</div>
                     </div>
                     <div className="text-center space-y-1 text-sm md:text-base">
                        <div className="text-red-300 font-bold flex items-center gap-1">
                           DMG: {selectedTarget?.damage} 
                           <span className="text-green-400 text-xs">(+{((selectedTarget?.damage || 0) - selectedBase.damage)})</span>
                        </div>
                        <div className="text-blue-300 font-bold flex items-center gap-1">
                           RNG: {selectedTarget?.range}
                           <span className="text-green-400 text-xs">(+{((selectedTarget?.range || 0) - selectedBase.range)})</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-black/80 p-4 md:p-6 rounded-xl border border-green-800 flex flex-col items-center gap-4 w-full max-w-md sticky bottom-0">
                  <div className="text-xl md:text-2xl font-chaotic text-green-300">
                    COST: <span className={canAfford ? 'text-yellow-400' : 'text-red-500'}>{evolutionData?.cost} BC</span>
                  </div>
                  
                  <Button 
                    variant={canAfford ? 'primary' : 'locked'}
                    disabled={!canAfford}
                    onClick={() => evolutionData && onEvolve(selectedId!, evolutionData.targetId, evolutionData.cost)}
                    className="w-full flex justify-center items-center gap-3 py-3 md:py-4 text-2xl md:text-3xl"
                  >
                    <Dna size={24} className="md:w-8 md:h-8" /> EVOLVE
                  </Button>
               </div>
             </>
           )}

        </div>
      </div>
    </div>
  );
};

export default EvolutionLab;
