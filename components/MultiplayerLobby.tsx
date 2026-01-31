
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { ArrowLeft, Users, Globe, Search, UserPlus, Loader2, Sword, CheckCircle, Lock, AlertTriangle, Cpu, Network, Wifi, ScanLine, XCircle, RefreshCw } from 'lucide-react';
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
  
  // New State for Rejection Handling
  const [waitingStatus, setWaitingStatus] = useState<'WAITING' | 'REJECTED'>('WAITING');

  const searchEventSource = useRef<EventSource | null>(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
      // If we are passed an initialMatchId (e.g. from an invite we sent), go straight to WAITING_FRIEND
      if (initialMatchId) {
          setView('WAITING_FRIEND');
          setWaitingStatus('WAITING');
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
      if (view === 'WAITING_FRIEND' && initialMatchId && waitingStatus === 'WAITING') {
          console.log(`Waiting for friend on match: ${initialMatchId}`);
          
          const handleMessageData = (data: any) => {
              let msg = data;
              // Robust Parsing
              if (typeof data === 'string') {
                  try { msg = JSON.parse(data); } catch(e) {}
              } else if (data.message) {
                  if (typeof data.message === 'string') {
                      try { msg = JSON.parse(data.message); } catch(e) { msg = data.message; }
                  } else {
                      msg = data.message;
                  }
              }

              if (msg && msg.type === 'MATCH_ACCEPT') {
                  console.log("Friend Accepted!", msg);
                  setGuestCompletedLevels(msg.completedLevels || []);
                  setView('HOST_LEVEL_SELECT');
                  return true; // Handled
              } else if (msg && msg.type === 'MATCH_REJECT') {
                  console.log("Friend Rejected!");
                  setWaitingStatus('REJECTED');
                  return true; // Handled
              }
              return false;
          };

          // 1. REAL-TIME LISTENER (SSE)
          const es = new EventSource(`https://ntfy.sh/${initialMatchId}/sse?since=10m&t=${Date.now()}`);
          es.onmessage = (event) => {
              try {
                  const data = JSON.parse(event.data);
                  if (handleMessageData(data)) {
                      es.close();
                  }
              } catch(e) {}
          };

          // 2. POLLING FALLBACK (Reliability)
          // Checks every 3 seconds in case SSE fails or misses the event
          const pollInterval = setInterval(async () => {
              try {
                  const res = await fetch(`https://ntfy.sh/${initialMatchId}/json?since=5m&poll=1`);
                  if (!res.ok) return;
                  const text = await res.text();
                  const lines = text.split('\n').filter(line => line.trim() !== '');
                  
                  for (const line of lines) {
                      try {
                          const data = JSON.parse(line);
                          if (handleMessageData(data)) {
                              es.close();
                              clearInterval(pollInterval);
                              break;
                          }
                      } catch(e) {}
                  }
              } catch(e) {
                  console.error("Poll failed", e);
              }
          }, 3000);

          return () => {
              es.close();
              clearInterval(pollInterval);
          };
      }
  }, [view, initialMatchId, waitingStatus]);

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
      
      // Validation: Does Host have it?
      const isLockedForHost = levelId === 2 && !completedLevels.includes(1);
      if (isLockedForHost) return;

      // Validation: Does Guest have it?
      // Level 2 requires completion of Level 1
      const isLockedForGuest = levelId === 2 && !guestCompletedLevels.includes(1);
      
      if (isLockedForGuest) {
          setHostLevelWarning("PARTNER INELIGIBLE: THEY MUST COMPLETE LEVEL 1 FIRST");
          return;
      }

      // Valid - Start Game
      const seed = Date.now();
      
      // Notify Client - TWICE for Reliability
      if (initialMatchId) {
          const sendStart = () => {
              fetch(`https://ntfy.sh/${initialMatchId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'HOST_START_CONFIRM',
                        seed: seed,
                        level: levelId
                    })
              }).catch(() => {});
          };
          
          sendStart();
          // Redundancy: Send again after 1s just in case
          setTimeout(sendStart, 1000);

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

  const forceCheckStatus = async () => {
      if (initialMatchId) {
          try {
              // Trigger a manual poll check essentially by re-fetching
              // The logic inside useEffect will handle it, but we can also do a direct check here
              const res = await fetch(`https://ntfy.sh/${initialMatchId}/json?since=10m`);
              const text = await res.text();
              const lines = text.split('\n');
              for (const line of lines) {
                  if (line.includes('MATCH_ACCEPT')) {
                      // Force view update if found
                      // Extract completed levels if possible, simplified here
                      const data = JSON.parse(line);
                      let msg = data.message;
                      if (typeof msg === 'string') try { msg = JSON.parse(msg); } catch(e){}
                      
                      setGuestCompletedLevels(msg.completedLevels || []);
                      setView('HOST_LEVEL_SELECT');
                      return;
                  }
              }
              alert("Still waiting... (No accept signal found)");
          } catch(e) {
              alert("Connection Error. Check internet.");
          }
      }
  };

  // --- SUB-COMPONENTS (FUTURISTIC STYLE) ---

  const renderLevelSelector = () => (
      <div className="flex flex-col items-center w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-4xl md:text-5xl font-mono text-cyan-400 mb-8 text-center tracking-tighter">SELECT OPERATION</h2>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {/* Level 1 */}
            <button 
                onClick={() => handleSelectLevel(1)}
                className="w-48 h-64 bg-black/40 border border-green-500/50 hover:border-green-400 rounded-lg flex flex-col items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                <div className="text-6xl font-chaotic text-green-500 mb-2 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">1</div>
                <div className="text-xl font-bold text-green-200 font-mono">THE FOREST</div>
                <div className="mt-4 flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                    <Wifi size={10} className="animate-pulse"/> SIGNAL STRONG
                </div>
            </button>

            {/* Level 2 */}
            <button 
                onClick={() => completedLevels.includes(1) && handleSelectLevel(2)}
                className={`
                    w-48 h-64 border rounded-lg flex flex-col items-center justify-center transition-all relative group overflow-hidden
                    ${completedLevels.includes(1) 
                        ? 'bg-black/40 border-cyan-500/50 hover:border-cyan-400 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] cursor-pointer' 
                        : 'bg-black/60 border-gray-700 opacity-60 cursor-not-allowed'}
                `}
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                {!completedLevels.includes(1) && <Lock size={48} className="text-gray-500 mb-2"/>}
                <div className="text-6xl font-chaotic text-cyan-500 mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">2</div>
                <div className="text-xl font-bold text-cyan-200 font-mono">DARK ICE</div>
                {completedLevels.includes(1) && (
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/30">
                        <Wifi size={10} className="animate-pulse"/> SIGNAL STRONG
                    </div>
                )}
            </button>
          </div>

          <Button variant="secondary" onClick={() => setView('HOME')} className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-sm">ABORT</Button>
      </div>
  );

  const renderHostLevelSelect = () => {
      const isLevel2LockedForHost = !completedLevels.includes(1);
      const isLevel2LockedForGuest = !guestCompletedLevels.includes(1);

      return (
        <div className="flex flex-col items-center w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-cyan-900/20 border border-cyan-500/50 px-8 py-4 rounded-full mb-8 flex items-center gap-3">
                <Users className="text-cyan-400" />
                <span className="text-cyan-200 font-mono tracking-widest text-lg">SQUAD LINK ESTABLISHED</span>
            </div>
            
            <p className="text-purple-300 font-mono text-sm mb-8 animate-pulse text-center">
                // WAITING FOR HOST COMMAND...<br/>
                // SELECT MISSION PROTOCOL
            </p>
            
            {hostLevelWarning && (
                <div className="bg-red-900/80 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-8 flex items-center gap-4 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.4)] max-w-md text-center">
                    <AlertTriangle size={32} className="flex-shrink-0" /> 
                    <span className="font-mono font-bold text-sm">{hostLevelWarning}</span>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-6 mb-8">
                {/* Level 1 */}
                <button 
                    onClick={() => handleHostStartLevel(1)}
                    className="w-48 h-64 bg-green-900/20 border border-green-500 hover:bg-green-900/40 rounded-xl flex flex-col items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,197,94,0.1)] group"
                >
                    <div className="text-6xl font-chaotic text-green-500 mb-2 group-hover:drop-shadow-[0_0_15px_rgba(34,197,94,1)] transition-all">1</div>
                    <div className="text-xl font-bold text-green-200 font-mono">THE FOREST</div>
                    <div className="text-xs bg-green-900/50 px-2 py-1 rounded mt-4 text-green-400 border border-green-500/30">
                        STATUS: READY
                    </div>
                </button>

                {/* Level 2 */}
                <button 
                    onClick={() => handleHostStartLevel(2)}
                    disabled={isLevel2LockedForHost}
                    className={`
                        w-48 h-64 border rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden
                        ${isLevel2LockedForHost 
                            ? 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed' 
                            : 'bg-cyan-900/20 border-cyan-500 hover:bg-cyan-900/40 hover:scale-105 cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.1)]'}
                    `}
                >
                    {isLevel2LockedForHost && <Lock size={48} className="text-gray-600 mb-2"/>}
                    <div className="text-6xl font-chaotic text-cyan-500 mb-2">2</div>
                    <div className="text-xl font-bold text-cyan-200 font-mono">DARK ICE</div>
                    
                    {/* Status Badge */}
                    {!isLevel2LockedForHost && (
                        <div className={`mt-4 text-xs px-2 py-1 rounded font-bold font-mono border flex items-center gap-2 ${isLevel2LockedForGuest ? 'bg-red-900/50 text-red-400 border-red-500' : 'bg-cyan-900/50 text-cyan-400 border-cyan-500'}`}>
                            {isLevel2LockedForGuest ? <><Lock size={10}/> LOCKED BY ALLY</> : 'STATUS: READY'}
                        </div>
                    )}
                </button>
            </div>

            <Button variant="secondary" onClick={() => setView('HOME')} className="text-sm bg-red-900/50 border-red-800 hover:bg-red-800">DISCONNECT SQUAD</Button>
        </div>
      );
  };

  const renderSearching = () => (
      <div className="bg-black/80 border border-cyan-500/50 rounded-2xl p-8 md:p-12 flex flex-col items-center shadow-[0_0_100px_rgba(6,182,212,0.1)] animate-in zoom-in w-full max-w-lg relative overflow-hidden backdrop-blur-xl">
        
        {/* Animated Scanline */}
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-[scan_2s_linear_infinite]"></div>

        <div className="relative mb-8">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
            <Network size={80} className="text-cyan-400 animate-pulse relative z-10" />
        </div>
        
        <h3 className="text-3xl font-mono text-white mb-2 text-center tracking-widest">SCANNING_NET.V4</h3>
        <p className="text-cyan-500 font-mono text-xl mb-6">{formatTime(searchTime)}</p>
        
        <div className="w-full bg-black/90 p-4 rounded border border-cyan-900 h-40 overflow-y-auto font-mono text-[10px] text-green-400 mb-6 space-y-1 shadow-inner custom-scrollbar">
            {log.map((line, i) => <div key={i} className="opacity-80">&gt; {line}</div>)}
            <div className="animate-pulse text-cyan-400">&gt; _</div>
        </div>

        <Button variant="danger" onClick={handleCancel} className="px-8 border-red-600 bg-red-900/20 hover:bg-red-900/50">ABORT SEARCH</Button>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#050510] relative overflow-hidden flex flex-col font-sans">
      
      {/* Background - Cyberpunk Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] perspective-1000 transform-gpu pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 md:p-6 border-b border-cyan-900/50 bg-black/40 backdrop-blur-md">
        <Button variant="secondary" onClick={onBack} className="flex items-center gap-2 text-xs md:text-sm bg-transparent border-gray-700 hover:bg-gray-800">
          <ArrowLeft size={16} /> DISCONNECT
        </Button>
        <div className="flex flex-col items-end">
            <div className="text-cyan-500 font-mono text-xs flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                NET.V4 ONLINE
            </div>
            <div className="text-gray-500 font-mono text-[10px]">{onlineCount.toLocaleString()} NODES ACTIVE</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
        
        {view === 'HOME' && (
            <div className="w-full max-w-5xl flex flex-col items-center">
                <div className="mb-12 text-center">
                    <h2 className="text-5xl md:text-8xl font-chaotic text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 mb-2 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                        MULTIPLAYER
                    </h2>
                    <div className="inline-flex items-center gap-2 bg-blue-900/20 border border-blue-500/30 px-4 py-1 rounded-full">
                        <Cpu size={14} className="text-blue-400"/>
                        <span className="text-blue-200 text-xs font-mono tracking-widest">SYSTEM READY // ID: {myPlayerId}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full px-4">
                    
                    {/* SEARCH MATCH OPTION */}
                    <button 
                        onClick={() => setView('LEVEL_SELECT')}
                        className="flex-1 bg-gradient-to-br from-gray-900 to-black border border-cyan-900 hover:border-cyan-400 rounded-xl p-8 flex flex-col items-center group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                    >
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="bg-cyan-900/20 p-6 rounded-full mb-6 border border-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Globe size={48} className="text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-mono text-white mb-2 group-hover:text-cyan-300 transition-colors">PUBLIC MATCH</h3>
                        <p className="text-gray-500 text-center text-sm font-mono group-hover:text-gray-400">
                            Scan network for random ally.
                        </p>
                    </button>

                    {/* PLAY WITH FRIEND OPTION */}
                    <button 
                        onClick={onInviteFriends}
                        className="flex-1 bg-gradient-to-br from-gray-900 to-black border border-purple-900 hover:border-purple-400 rounded-xl p-8 flex flex-col items-center group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="bg-purple-900/20 p-6 rounded-full mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Users size={48} className="text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-mono text-white mb-2 group-hover:text-purple-300 transition-colors">PRIVATE LOBBY</h3>
                        <p className="text-gray-500 text-center text-sm font-mono group-hover:text-gray-400">
                            Establish secure link with friend.
                        </p>
                    </button>

                </div>
            </div>
        )}

        {view === 'LEVEL_SELECT' && renderLevelSelector()}
        {view === 'SEARCHING' && renderSearching()}
        {view === 'HOST_LEVEL_SELECT' && renderHostLevelSelect()}
        {view === 'WAITING_FRIEND' && (
            <div className={`
                bg-black/80 border rounded-2xl p-12 max-w-md text-center animate-in zoom-in backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden transition-all duration-300
                ${waitingStatus === 'REJECTED' ? 'border-red-500/50' : 'border-purple-500/50'}
            `}>
                <div className={`absolute top-0 left-0 w-full h-1 ${waitingStatus === 'REJECTED' ? 'bg-red-500' : 'bg-purple-500/50 animate-pulse'}`}></div>
                
                {waitingStatus === 'WAITING' ? (
                    <>
                        <Loader2 size={64} className="text-purple-400 animate-spin mx-auto mb-6" />
                        <h3 className="text-2xl font-mono text-white mb-2">AWAITING HANDSHAKE...</h3>
                        <p className="text-gray-400 text-xs font-mono mb-8">Invitation Protocol Sent. Stand by.</p>
                        <button 
                            onClick={forceCheckStatus} 
                            className="text-[10px] text-purple-400 hover:text-white flex items-center justify-center gap-1 mx-auto mb-4 border border-purple-700 px-3 py-1 rounded hover:bg-purple-900"
                        >
                            <RefreshCw size={10} /> CHECK STATUS
                        </button>
                    </>
                ) : (
                    <>
                        <XCircle size={64} className="text-red-500 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-2xl font-mono text-white mb-2">CONNECTION REJECTED</h3>
                        <p className="text-red-400 text-xs font-mono mb-8">Target declined the neural link.</p>
                    </>
                )}

                <Button variant="secondary" onClick={() => { setView('HOME'); }} className="w-full bg-gray-800 border-gray-600 hover:bg-gray-700">
                    {waitingStatus === 'REJECTED' ? 'RETURN TO BASE' : 'CANCEL'}
                </Button>
            </div>
        )}

      </div>
    </div>
  );
};

export default MultiplayerLobby;
