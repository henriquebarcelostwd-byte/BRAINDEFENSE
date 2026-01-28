
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { ArrowLeft, Users, Globe, Search, UserPlus, Loader2, Sword, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { STAGES } from '../constants';

interface MultiplayerLobbyProps {
  myPlayerId: string;
  onBack: () => void;
  onInviteFriends: () => void;
  completedLevels: number[];
  onStartMatch: (levelId: number, matchId: string, role: 'HOST' | 'CLIENT', seed?: number) => void;
  initialMatchId?: string; // New prop for incoming invites or sent invites
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ myPlayerId, onBack, onInviteFriends, completedLevels, onStartMatch, initialMatchId }) => {
  const [view, setView] = useState<'HOME' | 'LEVEL_SELECT' | 'SEARCHING' | 'WAITING_FRIEND' | 'HOST_LEVEL_SELECT'>('HOME');
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState(14203); // Aesthetic only
  const [searchTime, setSearchTime] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [guestCompletedLevels, setGuestCompletedLevels] = useState<number[]>([]);
  const [hostLevelWarning, setHostLevelWarning] = useState<string | null>(null);

  const searchEventSource = useRef<EventSource | null>(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
      // If we are passed an initialMatchId (e.g. from an invite we sent), go straight to WAITING_FRIEND
      if (initialMatchId) {
          setView('WAITING_FRIEND');
      }
  }, [initialMatchId]);

  // Dynamic Online Count Simulation (Just for flavor)
  useEffect(() => {
    const interval = setInterval(() => {
        setOnlineCount(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- WAITING FOR FRIEND LOGIC (HOST SIDE) ---
  useEffect(() => {
      if (view === 'WAITING_FRIEND' && initialMatchId) {
          console.log(`Waiting for friend on match: ${initialMatchId}`);
          
          // FIX: Added 'since=10m' and cache buster 't' to prevent stale connection on mobile
          const es = new EventSource(`https://ntfy.sh/${initialMatchId}/sse?since=10m&t=${Date.now()}`);
          es.onmessage = (event) => {
              try {
                  const data = JSON.parse(event.data);
                  const msg = typeof data === 'string' ? JSON.parse(data) : data.message ? JSON.parse(data.message) : data;
                  
                  if (msg.type === 'MATCH_ACCEPT') {
                      // Friend accepted! 
                      // STORE GUEST PROGRESS
                      setGuestCompletedLevels(msg.completedLevels || []);
                      
                      // Transition to Host Level Select
                      setView('HOST_LEVEL_SELECT');
                      es.close();
                  }
              } catch(e) {}
          };
          return () => es.close();
      }
  }, [view, initialMatchId]);

  // --- REAL MATCHMAKING LOGIC (PUBLIC SEARCH) ---
  useEffect(() => {
      let interval: any;
      
      if (view === 'SEARCHING' && selectedLevelId) {
          isSearchingRef.current = true;
          const lobbyTopic = `bd_lobby_level_${selectedLevelId}_v4`; 
          
          setLog(prev => [...prev, `Connecting to signal: ${lobbyTopic}...`]);

          if (searchEventSource.current) searchEventSource.current.close();
          // FIX: Added cache buster 't'
          const es = new EventSource(`https://ntfy.sh/${lobbyTopic}/sse?since=10m&t=${Date.now()}`);
          
          es.onopen = () => {
             setLog(prev => [...prev, "Connected to Global Matchmaking."]);
             broadcastPresence(lobbyTopic);
          };

          es.onmessage = (event) => {
              if (!isSearchingRef.current) return;
              try {
                  const data = JSON.parse(event.data);
                  const msg = typeof data === 'string' ? JSON.parse(data) : data.message ? JSON.parse(data.message) : data;
                  
                  if (!msg || !msg.sender || msg.sender === myPlayerId) return;

                  if (msg.type === 'LFG') {
                      if (myPlayerId > msg.sender) {
                          setLog(prev => [...prev, `Found player ${msg.sender}. Initiating...`]);
                          const matchId = `bd_match_${myPlayerId}_${msg.sender}_${Date.now()}`;
                          const seed = Date.now();
                          
                          sendSignal(lobbyTopic, {
                              type: 'MATCH_OFFER',
                              target: msg.sender,
                              sender: myPlayerId,
                              matchId: matchId,
                              level: selectedLevelId,
                              seed: seed
                          });
                          cleanup();
                          onStartMatch(selectedLevelId, matchId, 'HOST', seed);
                      }
                  } else if (msg.type === 'MATCH_OFFER') {
                      if (msg.target === myPlayerId) {
                          setLog(prev => [...prev, `Match accepted from ${msg.sender}!`]);
                          cleanup();
                          onStartMatch(selectedLevelId, msg.matchId, 'CLIENT', msg.seed);
                      }
                  }

              } catch (e) {
                  // ignore
              }
          };

          searchEventSource.current = es;

          interval = setInterval(() => {
              broadcastPresence(lobbyTopic);
              setSearchTime(prev => prev + 1);
          }, 3000);
      }

      return () => cleanup(interval);
  }, [view, selectedLevelId, myPlayerId]);

  const broadcastPresence = (topic: string) => {
      sendSignal(topic, { type: 'LFG', sender: myPlayerId, level: selectedLevelId });
  };

  const sendSignal = (topic: string, payload: any) => {
      fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: JSON.stringify(payload)
      }).catch(err => console.error("Signal failed", err));
  };

  const cleanup = (interval?: any) => {
      isSearchingRef.current = false;
      if (searchEventSource.current) {
          searchEventSource.current.close();
          searchEventSource.current = null;
      }
      if (interval) clearInterval(interval);
  };

  const handleSelectLevel = (id: number) => {
      setSelectedLevelId(id);
      setLog([]);
      setView('SEARCHING');
      setSearchTime(0);
  };

  const handleHostStartLevel = (levelId: number) => {
      setHostLevelWarning(null);
      
      // Validation: Does Host have it? (Should be covered by UI lock, but safe check)
      const isLockedForHost = levelId === 2 && !completedLevels.includes(1);
      if (isLockedForHost) return;

      // Validation: Does Guest have it?
      const isLockedForGuest = levelId === 2 && !guestCompletedLevels.includes(1);
      
      if (isLockedForGuest) {
          setHostLevelWarning("FRIEND HAS NOT UNLOCKED LEVEL 2");
          return;
      }

      // Valid - Start Game
      const seed = Date.now();
      
      // Notify Client
      if (initialMatchId) {
          fetch(`https://ntfy.sh/${initialMatchId}`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'HOST_START_CONFIRM',
                    seed: seed,
                    level: levelId
                })
          });
          onStartMatch(levelId, initialMatchId, 'HOST', seed);
      }
  };

  const handleCancel = () => {
      cleanup();
      setView('LEVEL_SELECT');
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- SUB-COMPONENTS ---

  const renderLevelSelector = () => (
      <div className="flex flex-col items-center w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8">
          <h2 className="text-4xl md:text-5xl font-spooky text-cyan-400 mb-8 text-center">SELECT OPERATION</h2>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {/* Level 1 */}
            <button 
                onClick={() => handleSelectLevel(1)}
                className="w-48 h-64 bg-green-900 border-4 border-green-500 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-800"
            >
                <div className="text-6xl font-chaotic text-white mb-2">1</div>
                <div className="text-xl font-bold text-green-200">THE FOREST</div>
                <div className="text-xs bg-black/40 px-2 py-1 rounded mt-2 text-green-400">CO-OP READY</div>
            </button>

            {/* Level 2 */}
            <button 
                onClick={() => completedLevels.includes(1) && handleSelectLevel(2)}
                className={`
                    w-48 h-64 border-4 rounded-xl flex flex-col items-center justify-center transition-transform relative
                    ${completedLevels.includes(1) 
                        ? 'bg-cyan-900 border-cyan-500 hover:scale-105 hover:bg-cyan-800 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer' 
                        : 'bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed'}
                `}
            >
                {!completedLevels.includes(1) && <Lock size={48} className="text-gray-400 mb-2"/>}
                <div className="text-6xl font-chaotic text-white mb-2">2</div>
                <div className="text-xl font-bold text-cyan-200">DARK ICE</div>
                {completedLevels.includes(1) && <div className="text-xs bg-black/40 px-2 py-1 rounded mt-2 text-cyan-400">CO-OP READY</div>}
            </button>
          </div>

          <Button variant="secondary" onClick={() => setView('HOME')}>CANCEL</Button>
      </div>
  );

  const renderHostLevelSelect = () => {
      const isLevel2LockedForHost = !completedLevels.includes(1);
      // We check if 1 is in guestCompletedLevels to see if they unlocked 2
      // Actually, standard logic: to play level 2, must beat level 1.
      const isLevel2LockedForGuest = !guestCompletedLevels.includes(1);

      return (
        <div className="flex flex-col items-center w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8">
            <h2 className="text-4xl md:text-5xl font-spooky text-yellow-400 mb-2 text-center">PARTY ASSEMBLED</h2>
            <p className="text-purple-300 font-chaotic text-xl mb-8">SELECT MISSION FOR THE SQUAD</p>
            
            {hostLevelWarning && (
                <div className="bg-red-900/90 border-2 border-red-500 text-white px-6 py-3 rounded-lg mb-6 flex items-center gap-2 animate-bounce">
                    <AlertTriangle size={24} /> {hostLevelWarning}
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-6 mb-8">
                {/* Level 1 */}
                <button 
                    onClick={() => handleHostStartLevel(1)}
                    className="w-48 h-64 bg-green-900 border-4 border-green-500 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-800"
                >
                    <div className="text-6xl font-chaotic text-white mb-2">1</div>
                    <div className="text-xl font-bold text-green-200">THE FOREST</div>
                    <div className="text-xs bg-black/40 px-2 py-1 rounded mt-2 text-green-400">AVAILABLE</div>
                </button>

                {/* Level 2 */}
                <button 
                    onClick={() => handleHostStartLevel(2)}
                    disabled={isLevel2LockedForHost}
                    className={`
                        w-48 h-64 border-4 rounded-xl flex flex-col items-center justify-center transition-transform relative
                        ${isLevel2LockedForHost 
                            ? 'bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed' 
                            : 'bg-cyan-900 border-cyan-500 hover:scale-105 hover:bg-cyan-800 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer'}
                    `}
                >
                    {isLevel2LockedForHost && <Lock size={48} className="text-gray-400 mb-2"/>}
                    <div className="text-6xl font-chaotic text-white mb-2">2</div>
                    <div className="text-xl font-bold text-cyan-200">DARK ICE</div>
                    
                    {/* Status Badge */}
                    {!isLevel2LockedForHost && (
                        <div className={`text-xs px-2 py-1 rounded mt-2 font-bold flex items-center gap-1 ${isLevel2LockedForGuest ? 'bg-red-900 text-red-200' : 'bg-black/40 text-cyan-400'}`}>
                            {isLevel2LockedForGuest ? <><Lock size={10}/> GUEST LOCKED</> : 'AVAILABLE'}
                        </div>
                    )}
                </button>
            </div>

            <Button variant="secondary" onClick={() => setView('HOME')}>ABORT MISSION</Button>
        </div>
      );
  };

  const renderSearching = () => (
      <div className="bg-black/60 border-4 border-cyan-500 rounded-2xl p-8 md:p-12 flex flex-col items-center shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-in zoom-in w-full max-w-lg">
        <div className="relative">
            <Loader2 size={80} className="text-cyan-400 animate-spin mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Globe size={32} className="text-white animate-pulse" />
            </div>
        </div>
        
        <h3 className="text-3xl font-chaotic text-white mb-2 text-center">SCANNING FREQUENCIES...</h3>
        <p className="text-cyan-300 font-mono text-xl mb-4">{formatTime(searchTime)}</p>
        
        <div className="w-full bg-black/50 p-4 rounded-lg border border-gray-700 h-32 overflow-y-auto font-mono text-xs text-green-400 mb-6 space-y-1">
            {log.map((line, i) => <div key={i}>&gt; {line}</div>)}
            <div className="animate-pulse">&gt; _</div>
        </div>

        <Button variant="danger" onClick={handleCancel} className="px-8">CANCEL SEARCH</Button>
    </div>
  );

  return (
    <div className="h-full w-full bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Background - Darker, less overwhelming purple */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-purple-950 opacity-90 z-0"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 md:p-6 bg-black/40 backdrop-blur-md border-b border-indigo-500">
        <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-sm md:text-xl">
          <ArrowLeft size={20} /> EXIT LOBBY
        </Button>
        <div className="flex flex-col items-end">
            <div className="text-green-400 font-mono text-xs md:text-sm flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {onlineCount.toLocaleString()} PLAYERS ONLINE
            </div>
            <div className="text-white/30 text-[10px]">ID: {myPlayerId}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
        
        {view === 'HOME' && (
            <>
                <h2 className="text-5xl md:text-7xl font-spooky text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] text-center">
                    MULTIPLAYER ZONE
                </h2>
                <div className="flex items-center gap-2 bg-red-900/50 text-red-200 px-4 py-1 rounded mb-8 border border-red-500">
                    <AlertTriangle size={16}/> <span className="text-sm font-bold">REAL-TIME BETA</span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
                    
                    {/* SEARCH MATCH OPTION */}
                    <button 
                        onClick={() => setView('LEVEL_SELECT')}
                        className="flex-1 bg-indigo-900/50 border-4 border-indigo-500 hover:bg-indigo-800 hover:border-cyan-400 hover:scale-105 transition-all rounded-2xl p-8 flex flex-col items-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="bg-black/50 p-6 rounded-full mb-6 border-2 border-indigo-400 group-hover:border-cyan-400 transition-colors">
                            <Globe size={48} className="text-indigo-300 group-hover:text-cyan-300" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-chaotic text-white mb-2">SEARCH MATCH</h3>
                        <p className="text-indigo-200 text-center text-sm md:text-base">
                            Find a REAL player online.
                            <br/><span className="text-green-400 font-bold">LIVE CONNECTION</span>
                        </p>
                    </button>

                    {/* PLAY WITH FRIEND OPTION */}
                    <button 
                        onClick={onInviteFriends}
                        className="flex-1 bg-purple-900/50 border-4 border-purple-500 hover:bg-purple-800 hover:border-pink-400 hover:scale-105 transition-all rounded-2xl p-8 flex flex-col items-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="bg-black/50 p-6 rounded-full mb-6 border-2 border-purple-400 group-hover:border-pink-400 transition-colors">
                            <Users size={48} className="text-purple-300 group-hover:text-pink-300" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-chaotic text-white mb-2">INVITE FRIEND</h3>
                        <p className="text-purple-200 text-center text-sm md:text-base">
                            Use your Friend List.
                            <br/><span className="text-pink-300 font-bold">PRIVATE LOBBY</span>
                        </p>
                    </button>

                </div>
            </>
        )}

        {view === 'LEVEL_SELECT' && renderLevelSelector()}
        {view === 'SEARCHING' && renderSearching()}
        {view === 'HOST_LEVEL_SELECT' && renderHostLevelSelect()}
        {view === 'WAITING_FRIEND' && (
            <div className="bg-purple-900/50 border-4 border-purple-500 rounded-2xl p-8 max-w-md text-center animate-in zoom-in">
                <Loader2 size={48} className="text-purple-300 animate-spin mx-auto mb-4" />
                <h3 className="text-2xl font-chaotic text-white mb-4">WAITING FOR FRIEND...</h3>
                <p className="text-gray-300 text-sm mb-6">Invitation Sent. Waiting for acceptance...</p>
                <Button variant="secondary" onClick={() => { setView('HOME'); /* Need a way to cancel invite technically */ }}>CANCEL</Button>
            </div>
        )}

      </div>
    </div>
  );
};

export default MultiplayerLobby;
