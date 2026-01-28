
import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Copy, UserPlus, X, Send, ChevronLeft, Mail, Check, Ban, Gamepad2, Loader2, RefreshCw, Search, Shield, Wifi } from 'lucide-react';

interface FriendSystemProps {
  myPlayerId: string;
  friends: string[];
  friendRequests: string[];
  onSendRequest: (targetId: string) => Promise<boolean>;
  onAcceptRequest: (targetId: string) => void;
  onRejectRequest: (targetId: string) => void;
  onRemoveFriend: (id: string) => void;
  onInviteToGame: (friendId: string) => void; 
  onClose: () => void;
  onRefresh?: () => void; 
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

const FriendSystem: React.FC<FriendSystemProps> = ({ 
  myPlayerId, 
  friends, 
  friendRequests, 
  onSendRequest, 
  onAcceptRequest, 
  onRejectRequest, 
  onRemoveFriend, 
  onInviteToGame,
  onClose,
  onRefresh
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS' | 'ADD'>('FRIENDS');
  const [chatMode, setChatMode] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  // Input States
  const [addIdInput, setAddIdInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // Data States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // --- Helpers ---
  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getChatTopic = (id1: string, id2: string) => {
    const sorted = [id1.toUpperCase(), id2.toUpperCase()].sort();
    return `bd_chat_v2_${sorted[0]}_${sorted[1]}`;
  };

  // --- Chat Logic ---
  useEffect(() => {
    if (chatMode && selectedFriend) {
      const topic = getChatTopic(myPlayerId, selectedFriend);
      if (eventSourceRef.current) eventSourceRef.current.close();

      const es = new EventSource(`https://ntfy.sh/${topic}/sse?since=1h&t=${Date.now()}`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          let payload = data.message ? (typeof data.message === 'string' ? JSON.parse(data.message) : data.message) : data;
          if (payload && payload.text && payload.sender) {
             setChatHistory(prev => {
                if (prev.some(m => m.timestamp === payload.timestamp && m.sender === payload.sender)) return prev;
                return [...prev, payload].sort((a, b) => a.timestamp - b.timestamp);
             });
          }
        } catch (e) {}
      };
      eventSourceRef.current = es;
      return () => es.close();
    }
  }, [chatMode, selectedFriend, myPlayerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatMode]);

  // --- Actions ---
  const handleCopyId = () => {
    navigator.clipboard.writeText(myPlayerId);
    showToast("ID COPIED TO CLIPBOARD", 'success');
  };

  const handleSendRequestAction = async () => {
    const target = addIdInput.trim().toUpperCase();
    if (!target) return;
    if (target === myPlayerId) { showToast("CANNOT ADD YOURSELF", 'error'); return; }
    if (friends.includes(target)) { showToast("ALREADY FRIENDS", 'info'); return; }

    setIsProcessing(true);
    try {
        const success = await onSendRequest(target);
        if (success) {
            showToast(`REQUEST SENT TO ${target}`, 'success');
            setAddIdInput('');
        } else {
            showToast("FAILED TO SEND REQUEST", 'error');
        }
    } catch {
        showToast("NETWORK ERROR", 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const topic = getChatTopic(myPlayerId, selectedFriend);
    const payload: ChatMessage = { sender: myPlayerId, text: chatInput.trim(), timestamp: Date.now() };
    
    // Optimistic UI Update
    setChatHistory(prev => [...prev, payload]);
    setChatInput('');

    try {
        await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', body: JSON.stringify(payload) });
    } catch {
        showToast("MSG FAILED TO SEND", 'error');
    }
  };

  // --- Render Components ---

  const renderNavButton = (tab: typeof activeTab, icon: React.ReactNode, label: string, badge?: number) => (
      <button 
        onClick={() => { setActiveTab(tab); setChatMode(false); }}
        className={`
           flex-1 flex flex-col items-center justify-center py-3 relative transition-all duration-300
           ${activeTab === tab ? 'text-cyan-400 bg-cyan-900/20 shadow-[0_-2px_10px_rgba(34,211,238,0.2)] border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
        `}
      >
          {icon}
          <span className="text-[10px] md:text-xs font-bold mt-1 tracking-widest">{label}</span>
          {badge ? (
              <span className="absolute top-2 right-2 md:top-2 md:right-8 w-5 h-5 bg-pink-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse shadow-lg border border-pink-400">
                  {badge}
              </span>
          ) : null}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      {/* Main Container - Holographic Glass Look */}
      <div className="w-full max-w-lg h-[85vh] bg-gray-900/80 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col relative overflow-hidden backdrop-blur-xl">
        
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

        {/* TOAST NOTIFICATION */}
        <div className={`
            absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 transition-all duration-300 transform
            ${toast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}
            ${toast?.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 
              toast?.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 
              'bg-blue-900/90 border-blue-500 text-blue-100'}
        `}>
             {toast?.type === 'success' && <Check size={18} />}
             {toast?.type === 'error' && <Ban size={18} />}
             {toast?.type === 'info' && <Wifi size={18} />}
             <span className="font-bold text-sm tracking-wide">{toast?.msg}</span>
        </div>

        {/* --- HEADER --- */}
        <div className="relative z-10 flex justify-between items-center p-4 bg-black/40 border-b border-white/10">
           {chatMode ? (
               <div className="flex items-center gap-3">
                   <button onClick={() => setChatMode(false)} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 text-cyan-400 transition-colors">
                       <ChevronLeft size={20} />
                   </button>
                   <div>
                       <div className="text-xs text-gray-500 font-mono">LINKED TO</div>
                       <div className="text-white font-bold tracking-wide">{selectedFriend}</div>
                   </div>
               </div>
           ) : (
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-cyan-900/30 border border-cyan-500/50 flex items-center justify-center relative">
                       <Shield className="text-cyan-400" size={20} />
                       {/* Connection Indicator */}
                       <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_5px_lime]"></div>
                   </div>
                   <div>
                       <div className="text-xs text-cyan-500 font-mono tracking-widest flex items-center gap-1">
                          SOCIAL UPLINK <span className="text-green-500 text-[9px] border border-green-500 px-1 rounded">ONLINE</span>
                       </div>
                       <div className="text-white font-chaotic text-xl leading-none">NETWORK</div>
                   </div>
               </div>
           )}
           
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-red-900/50 rounded-lg transition-colors">
               <X size={24} />
           </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* --- LIST VIEW --- */}
            {!chatMode && activeTab === 'FRIENDS' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* User ID Card */}
                    <div className="p-4">
                        <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                             <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
                             <span className="text-cyan-600 text-[10px] font-bold tracking-widest uppercase">YOUR NEURAL ID</span>
                             <div className="flex items-center gap-2 relative z-10">
                                 <code className="text-white font-mono text-lg flex-1 truncate">{myPlayerId}</code>
                                 <button onClick={handleCopyId} className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-md transition-all active:scale-95 shadow-lg">
                                     <Copy size={16} />
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Refresh Header */}
                    <div className="px-4 flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">CONNECTIONS ({friends.length})</span>
                        <button onClick={() => { if(onRefresh) onRefresh(); showToast("REFRESHING NETWORK...", 'info'); }} className="text-gray-500 hover:text-white transition-colors">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* Friend List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                        {friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                <Users size={48} className="mb-2 opacity-20" />
                                <p className="text-sm font-mono">NO CONNECTIONS ESTABLISHED</p>
                            </div>
                        ) : (
                            friends.map(fid => (
                                <div key={fid} className="bg-white/5 border border-white/5 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between group transition-all duration-300">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                                            {fid.charAt(0)}
                                        </div>
                                        <span className="text-gray-200 font-mono text-sm truncate">{fid}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => onInviteToGame(fid)}
                                          className="p-2 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                                          title="Invite to Game"
                                        >
                                            <Gamepad2 size={18} />
                                        </button>
                                        <button 
                                          onClick={() => { setSelectedFriend(fid); setChatMode(true); }}
                                          className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                          title="Chat"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button 
                                          onClick={() => { if(confirm('Remove friend?')) onRemoveFriend(fid); }}
                                          className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Ban size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* --- REQUESTS VIEW --- */}
            {!chatMode && activeTab === 'REQUESTS' && (
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-pink-900/20 border border-pink-500/30 px-4 py-1 rounded-full text-pink-300 text-xs font-bold tracking-widest">
                            INCOMING TRANSMISSIONS
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {friendRequests.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                <Mail size={48} className="mb-2 opacity-20" />
                                <p className="text-sm font-mono">MAILBOX EMPTY</p>
                             </div>
                        ) : (
                            friendRequests.map(reqId => (
                                <div key={reqId} className="bg-gray-800/80 border-l-4 border-pink-500 p-4 rounded-r-xl flex items-center justify-between shadow-lg">
                                    <div>
                                        <div className="text-pink-400 text-[10px] font-bold uppercase mb-1">REQUEST FROM</div>
                                        <div className="text-white font-mono">{reqId}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { onAcceptRequest(reqId); showToast("ACCEPTED", 'success'); }} className="bg-green-600 hover:bg-green-500 p-2 rounded-lg text-white shadow-lg transition-transform active:scale-95">
                                            <Check size={20} />
                                        </button>
                                        <button onClick={() => { onRejectRequest(reqId); showToast("DECLINED", 'info'); }} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white shadow-lg transition-transform active:scale-95">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* --- ADD FRIEND VIEW --- */}
            {!chatMode && activeTab === 'ADD' && (
                <div className="flex-1 flex flex-col p-6 items-center justify-center text-center">
                    <div className="w-20 h-20 bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse border-2 border-cyan-500/50">
                        <Search size={40} className="text-cyan-400" />
                    </div>
                    
                    <h3 className="text-2xl font-chaotic text-white mb-2">SEARCH DATABASE</h3>
                    <p className="text-gray-400 text-sm mb-8 max-w-xs">Enter a Player ID to send a connection request through the network.</p>

                    <div className="w-full max-w-sm relative mb-4">
                        <input 
                            type="text" 
                            value={addIdInput}
                            onChange={(e) => setAddIdInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                            placeholder="PLAYER_ID_0000"
                            className="w-full bg-black/50 border-2 border-gray-700 focus:border-cyan-500 rounded-xl py-4 pl-4 pr-12 text-white font-mono text-center tracking-wider outline-none transition-colors"
                        />
                    </div>

                    <button 
                        onClick={handleSendRequestAction}
                        disabled={isProcessing || !addIdInput}
                        className={`
                            w-full max-w-sm py-4 rounded-xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all
                            ${isProcessing || !addIdInput ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]'}
                        `}
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                        SEND REQUEST
                    </button>
                </div>
            )}

            {/* --- CHAT MODE --- */}
            {chatMode && selectedFriend && (
                <div className="flex-1 flex flex-col bg-black/20">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="text-center mt-8">
                                <div className="inline-block bg-gray-800/50 text-gray-500 text-xs px-3 py-1 rounded-full">
                                    Encrypted connection established.
                                </div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => {
                            const isMe = msg.sender === myPlayerId;
                            return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[75%] px-4 py-2 rounded-2xl text-sm relative
                                        ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}
                                    `}>
                                        {msg.text}
                                        <div className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={chatEndRef}></div>
                    </div>
                    
                    <div className="p-3 bg-gray-900 border-t border-white/10 flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Message..."
                            className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 text-white focus:outline-none focus:border-cyan-500 text-sm"
                        />
                        <button onClick={handleSendMessage} className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl transition-colors">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

        </div>

        {/* --- BOTTOM NAVIGATION (Hidden in Chat Mode) --- */}
        {!chatMode && (
            <div className="flex bg-black/60 backdrop-blur-md border-t border-white/5">
                {renderNavButton('FRIENDS', <Users size={20} />, "FRIENDS")}
                {renderNavButton('REQUESTS', <Mail size={20} />, "INBOX", friendRequests.length)}
                {renderNavButton('ADD', <UserPlus size={20} />, "SEARCH")}
            </div>
        )}

      </div>
    </div>
  );
};

export default FriendSystem;
