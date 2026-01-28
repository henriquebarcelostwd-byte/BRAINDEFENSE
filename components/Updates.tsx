
import React from 'react';
import Button from './Button';
import { ArrowLeft, Sparkles, Megaphone, Info, Download } from 'lucide-react';

interface UpdatesProps {
  onBack: () => void;
}

const Updates: React.FC<UpdatesProps> = ({ onBack }) => {
  return (
    <div className="h-full w-full bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none fixed"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <Button variant="secondary" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={20} /> BACK
        </Button>
        <h2 className="text-4xl md:text-6xl font-spooky text-green-400 drop-shadow-lg text-center">
          PATCH NOTES
        </h2>
        <div className="w-24 hidden md:block"></div> {/* Spacer */}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8 pb-20">
        
        {/* DOWNLOAD APK SECTION */}
        <div className="bg-blue-900/40 border-4 border-blue-500 rounded-xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-pulse backdrop-blur-sm text-center">
            <h3 className="text-2xl font-chaotic text-blue-300 mb-2 flex items-center justify-center gap-2">
                <Download className="text-yellow-400" /> PLAY ON MOBILE
            </h3>
            <p className="text-blue-100 font-mono text-sm mb-4">
                Download the official APK for the best performance and full-screen experience.
            </p>
            <Button 
                onClick={() => window.open('https://www.mediafire.com/file/aw7qpi2ysxcxreb/BRAINDEFENSE_NEW%2529.apk/file', '_blank')}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 border-blue-400 hover:bg-blue-500 shadow-lg"
            >
                DOWNLOAD v2.7.0 APK
            </Button>
        </div>

        {/* CURRENT UPDATE */}
        <div className="bg-gray-800/90 border-4 border-green-500 rounded-xl p-6 md:p-8 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-in slide-in-from-left backdrop-blur-sm">
           <h3 className="text-3xl font-chaotic text-green-300 mb-4 flex items-center gap-2">
             <Sparkles className="text-yellow-400" /> CURRENT VERSION (v2.7.0)
           </h3>
           <p className="text-gray-200 font-mono text-lg leading-relaxed mb-4 border-l-4 border-green-700 pl-4 py-2 bg-green-900/20">
             "Welcome to <span className="text-green-400 font-bold">BRAINDEFENSE</span>. In this update I put the <span className="text-blue-400 font-bold">friends chat system</span> and the new mode <span className="text-purple-400 font-bold">TOWER DEFENSE MULTIPLAYER</span>."
           </p>
           
           <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-black/40 p-3 rounded border border-gray-600 flex items-center gap-2 text-sm text-gray-300">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div> Fixed Guest Login freeze
              </div>
              <div className="bg-black/40 p-3 rounded border border-gray-600 flex items-center gap-2 text-sm text-gray-300">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div> Optimized Mobile Connection
              </div>
              <div className="bg-black/40 p-3 rounded border border-gray-600 flex items-center gap-2 text-sm text-gray-300">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div> Persistent Accounts
              </div>
           </div>
        </div>

        {/* NEXT UPDATE */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border-4 border-pink-500 rounded-xl p-6 md:p-8 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-in slide-in-from-right relative overflow-hidden group">
           {/* Scanline Effect */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
           
           <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold px-6 py-1 text-sm transform rotate-12 translate-x-6 -translate-y-1 shadow-lg z-10 font-chaotic tracking-widest border-2 border-white">
              SPOILER ALERT
           </div>
           
           <div className="relative z-10">
               <h3 className="text-3xl font-chaotic text-pink-300 mb-6 flex items-center gap-2">
                 <Megaphone className="text-white" /> NEXT UPDATE PREVIEW
               </h3>
               
               <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                     <p className="text-2xl font-chaotic text-white mb-2">
                       A NEW ENEMY WILL LAUNCH...
                     </p>
                     <p className="text-pink-400 text-5xl md:text-6xl font-spooky animate-pulse mb-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                       JOHN PORK
                     </p>
                     <div className="bg-black/50 p-4 rounded-lg border border-pink-500/50 text-pink-200 text-sm font-mono">
                        &gt; ENTITY DETECTED<br/>
                        &gt; ORIGIN: UNKNOWN<br/>
                        &gt; THREAT LEVEL: EXTREME
                     </div>
                  </div>
                  
                  <div className="w-56 h-56 md:w-72 md:h-72 bg-black rounded-xl border-4 border-pink-900 flex items-center justify-center overflow-hidden relative shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500">
                     <img 
                       src="https://i.postimg.cc/1XjhwVZy/john-pork-3d-print-file-v0-i6ehkovussmf1.png" 
                       alt="John Pork" 
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-pink-900/50 to-transparent mix-blend-overlay"></div>
                  </div>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Updates;
