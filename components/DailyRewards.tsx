
import React, { useRef, useEffect } from 'react';
import Button from './Button';
import { IMAGES, TOWERS } from '../constants';
import { Calendar, Gift, Lock, ChevronUp, ChevronDown } from 'lucide-react';

interface DailyRewardsProps {
  streak: number; // 1 to 6
  onClaim: () => void;
  onClose: () => void;
  canClaim: boolean;
}

const DailyRewards: React.FC<DailyRewardsProps> = ({ streak, onClaim, onClose, canClaim }) => {
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
      const amount = direction === 'up' ? -200 : 200;
      scrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };
  
  const rewards = [
    { day: 1, reward: '10 COINS', icon: '💰' },
    { day: 2, reward: '15 COINS', icon: '💰' },
    { day: 3, reward: '20 COINS', icon: '💰' },
    { day: 4, reward: '25 COINS', icon: '💰' },
    { day: 5, reward: 'SAPINI', img: IMAGES.SAPINI, special: true },
    { day: 6, reward: '50 COINS + PASS', icon: '👑', special: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
       {/* Manual Scroll Controls */}
      <div className="absolute bottom-20 right-4 z-[60] flex flex-col gap-4 pointer-events-auto">
        <button 
          onClick={() => scroll('up')}
          className="bg-yellow-600/80 p-3 rounded-full border-2 border-yellow-400 shadow-lg active:scale-95 hover:bg-yellow-500 backdrop-blur-sm"
        >
          <ChevronUp size={32} color="white" />
        </button>
        <button 
          onClick={() => scroll('down')}
          className="bg-yellow-600/80 p-3 rounded-full border-2 border-yellow-400 shadow-lg active:scale-95 hover:bg-yellow-500 backdrop-blur-sm"
        >
          <ChevronDown size={32} color="white" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="bg-gradient-to-b from-purple-900 to-indigo-900 border-4 border-yellow-500 rounded-xl max-w-4xl w-full p-4 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <h2 className="text-4xl md:text-5xl font-spooky text-yellow-400 text-center mb-2 drop-shadow-md">
          DAILY REWARDS
        </h2>
        <p className="text-center text-purple-200 font-chaotic text-lg md:text-xl mb-6 md:mb-8">
          LOG IN EVERY DAY FOR BETTER REWARDS!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          {rewards.map((r) => {
            const isCompleted = streak > r.day;
            const isCurrent = streak === r.day;
            
            return (
              <div 
                key={r.day}
                className={`
                  relative border-4 rounded-lg p-2 md:p-4 flex flex-col items-center justify-center min-h-[120px] md:min-h-[140px]
                  ${isCurrent 
                    ? 'bg-green-800 border-yellow-400 scale-105 shadow-[0_0_20px_rgba(255,255,0,0.5)] z-10' 
                    : isCompleted 
                      ? 'bg-gray-800 border-gray-600 opacity-50' 
                      : 'bg-purple-800 border-purple-600'
                  }
                `}
              >
                <div className="absolute top-2 left-2 font-bold text-white/50 text-xs md:text-sm">DAY {r.day}</div>
                
                {r.img ? (
                  <img src={r.img} alt="Reward" className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2" />
                ) : (
                  <div className="text-3xl md:text-4xl mb-2">{r.icon}</div>
                )}
                
                <div className={`font-chaotic text-center leading-none text-sm md:text-base ${r.special ? 'text-yellow-300' : 'text-white'}`}>
                  {r.reward}
                </div>

                {isCompleted && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-green-500 font-bold transform -rotate-12 border-2 border-green-500 px-2 rounded text-xs md:text-base">CLAIMED</span>
                  </div>
                )}
                
                {!isCompleted && !isCurrent && (
                   <div className="absolute top-2 right-2 text-white/30"><Lock size={16} /></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          {canClaim ? (
            <Button onClick={onClaim} className="animate-pulse bg-yellow-500 border-yellow-700 text-black hover:bg-yellow-400">
              CLAIM REWARD
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              COME BACK TOMORROW
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRewards;
