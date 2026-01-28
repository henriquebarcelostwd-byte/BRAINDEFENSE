
import React from 'react';
import { TOWERS } from '../constants';
import Button from './Button';
import { Clock, Lock } from 'lucide-react';

interface RewardSelectorProps {
  onSelect: (choiceId: string) => void;
}

const RewardSelector: React.FC<RewardSelectorProps> = ({ onSelect }) => {
  const toiletrot = TOWERS.TOILETROT;
  const chocolatini = TOWERS.CHOCOLATINI;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl flex flex-col items-center">
        <h2 className="text-6xl font-spooky text-yellow-400 mb-8 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] text-center">
          CHOOSE YOUR REWARD
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          
          {/* CHOICE 1: TOILETROT */}
          <div 
            onClick={() => onSelect('TOILETROT')}
            className="group relative bg-gray-900 border-4 border-gray-600 hover:border-green-500 rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center"
          >
             <div className="absolute -top-4 bg-green-600 text-white font-chaotic text-xl px-4 py-1 rounded border-2 border-white transform -rotate-2">
                NEW UNIT
             </div>
             <img src={toiletrot.image} alt={toiletrot.name} className="w-48 h-48 object-contain mb-6 drop-shadow-lg" />
             <h3 className="text-3xl font-chaotic text-green-300 mb-2">{toiletrot.name}</h3>
             <p className="text-gray-400 text-sm mb-4 text-center">
               A rare defender from the sewers. <br/>
               <span className="text-red-400 font-bold">DMG: {toiletrot.damage}</span>
             </p>
             <Button className="mt-auto w-full group-hover:bg-green-500">SELECT</Button>
          </div>

          {/* CHOICE 2: 200 COINS */}
          <div 
            onClick={() => onSelect('COINS')}
            className="group relative bg-gray-900 border-4 border-yellow-600 hover:border-yellow-400 rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] flex flex-col items-center"
          >
             <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform">💰</div>
             <h3 className="text-4xl font-chaotic text-yellow-400 mb-2">200 BRAINCOINS</h3>
             <p className="text-gray-400 text-sm mb-4 text-center">
               Instant wealth. Buy upgrades or other defenders immediately.
             </p>
             <Button variant="secondary" className="mt-auto w-full group-hover:bg-yellow-600 border-yellow-800">SELECT</Button>
          </div>

          {/* CHOICE 3: CHOCOLATINI UNLOCK */}
          <div 
            onClick={() => onSelect('CHOCOLATINI_UNLOCK')}
            className="group relative bg-gray-900 border-4 border-pink-900 hover:border-pink-500 rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] flex flex-col items-center overflow-hidden"
          >
             <div className="absolute inset-0 bg-pink-900/10 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity animate-pulse"></div>
             
             <div className="absolute -top-4 bg-pink-600 text-white font-chaotic text-xl px-4 py-1 rounded border-2 border-white transform rotate-2 flex items-center gap-2">
                <Lock size={16} /> STORE ACCESS
             </div>

             <img src={chocolatini.image} alt={chocolatini.name} className="w-48 h-48 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,100,100,0.6)]" />
             <h3 className="text-2xl font-spooky text-pink-400 mb-2 text-center leading-none tracking-wide">{chocolatini.name}</h3>
             <p className="text-pink-200 text-sm mb-4 text-center">
               Legendary Duo. <br/>
               Unlocks purchasing capability.
               <br/>
               <span className="text-white font-bold">DMG: {chocolatini.damage}</span>
             </p>
             <Button variant="secondary" className="mt-auto w-full group-hover:bg-pink-600 border-pink-800">UNLOCK IN STORE</Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RewardSelector;
