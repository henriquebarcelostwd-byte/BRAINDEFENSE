
import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Copy, UserPlus, X, Send, User, ChevronLeft, Mail, Check, Ban, Gamepad2, Loader2, RefreshCw } from 'lucide-react';

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
  const [view, setView] = useState<'LIST' | 'CHAT' | 'MAILBOX'>('LIST');
  const [inputFriendId, setInputFriendId] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Helper: Generate Unique Chat Topic for 2 Players ---
  const getChatTopic = (id1: string, id2: string) => {
    const sorted = [id1.toUpperCase(), id2.toUpperCase()].sort();
    return `bd_chat_v2_${sorted[0]}_${sorted[1]}`;
  };

  // --- Effect: Scroll to bottom of chat ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, view]);

  // --- Effect: Connect to Chat Stream when a friend is selected ---
  useEffect(() => {
    if (view === 'CHAT' && selectedFriend) {
      const topic = getChatTopic(myPlayerId, selectedFriend);
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log(`Connecting to chat topic: ${topic} with history`);
      const es = new EventSource(`https://ntfy.sh/${topic}/sse?since=1h&t=${Date.now()}`);
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          let payload = data;
          if (typeof data === 'string') {
             try { payload = JSON.parse(data); } catch(e) {}
          }
          if (data.message) {
             try { payload = JSON.parse(data.message); } catch(e) {}
          }

          if (payload && payload.text && payload.sender) {
             setChatHistory(prev => {
                if (prev.some(m => m.timestamp === payload.timestamp && m.sender === payload.sender)) return prev;
                const newHistory = [...prev, payload];
                return newHistory.sort((a, b) => a.timestamp - b.timestamp);
             });
          }
        } catch (e) {
           console.error("Chat parse error", e);
        }
      };

      eventSourceRef.current = es;

      return () => {
        es.close();
      };
    }
  }, [view, selectedFriend, myPlayerId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(myPlayerId);
    setNotification({ msg: "ID COPIED!", type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Force sanitize live: No spaces, Uppercase only, ALLOW UNDERSCORES
      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''); 
      setInputFriendId(val);
  };

  const handleSendRequestClick = async () => {
    const trimmed = inputFriendId;
    
    if (!trimmed) return;
    if (trimmed === myPlayerId) {
        setNotification({ msg: "CAN'T ADD YOURSELF!", type: 'error' });
        setTimeout(() => setNotification(null), 2000);
        return;
    }
    if (friends.includes(trimmed)) {
        setNotification({ msg: "ALREADY FRIENDS!", type: 'error' });
        setTimeout(() => setNotification(null), 2000);
        return;
    }
    
    setIsSending(true);
    
    try {
        const success = await onSendRequest(trimmed);
        if (success) {
            setNotification({ msg: "REQUEST SENT!", type: 'success' });
            setInputFriendId('');
        } else {
            setNotification({ msg: "FAILED TO SEND", type: 'error' });
        }
    } catch (e) {
        setNotification({ msg: "NETWORK ERROR", type: 'error' });
    } finally {
        setIsSending(false);
        setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleOpenChat = (friendId: string) => {
    setSelectedFriend(friendId);
    setChatHistory([]); 
    setView('CHAT');
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return;
    
    const topic = getChatTopic(myPlayerId, selectedFriend);
    const payload: ChatMessage = {
        sender: myPlayerId,
        text: messageInput.trim(),
        timestamp: Date.now()
    };

    try {
        // REVERTED: Removed headers to prevent CORS issues on mobile/vercel
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        setMessageInput('');
    } catch (e) {
        setNotification({ msg: "MSG FAILED", type: 'error' });
        setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleRefresh = () => {
     setIsSending(true);
     if (onRefresh) onRefresh();
     setTimeout(() => setIsSending(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="w-full max-w-md bg-gray-900 border-4 border-blue-500 rounded-2xl overflow-hidden flex flex-col h-[80vh] shadow-[0_0_50px_rgba(59,130,246,0.3)]">
        
        {/* Header */}
        <div className="bg-blue-900/50 p-4 border-b border-blue-500 flex justify-between items-center">
            {view === 'CHAT' ? (
                <button onClick={() => setView('LIST')} className="text-white hover:text-blue-300 flex items-center gap-1">
                    <ChevronLeft /> FRIENDS
                </button>
            ) : (
                <div className="flex gap-4">
                  <button onClick={() => setView('LIST')} className={`text-xl font-chaotic flex items-center gap-2 ${view === 'LIST' ? 'text-blue-300' : 'text-gray-500'}`}>
                      <Users size={20}/> LIST
                  </button>
                  <button onClick={() => setView('MAILBOX')} className={`text-xl font-chaotic flex items-center gap-2 relative ${view === 'MAILBOX' ? 'text-blue-300' : 'text-gray-500'}`}>
                      <Mail size={20}/> MAILBOX
                      {friendRequests.length > 0 && (
                        <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                          {friendRequests.length}
                        </span>
                      )}
                  </button>
                </div>
            )}
            
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        {/* Notification Overlay */}
        {notification && (
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold shadow-lg animate-bounce z-50 whitespace-nowrap border-2 ${notification.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                {notification.msg}
            </div>
        )}

        {/* --- LIST VIEW --- */}
        {view === 'LIST' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* My ID Card */}
                <div className="bg-black/40 border border-blue-500/50 rounded-xl p-4 flex flex-col gap-2">
                    <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">MY ID (SHARE THIS)</span>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black rounded p-2 font-mono text-blue-300 text-sm truncate select-all">
                            {myPlayerId}
                        </div>
                        <button onClick={handleCopyId} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded">
                            <Copy size={18} />
                        </button>
                    </div>
                </div>

                {/* Add Friend */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputFriendId}
                        onChange={handleInputChange}
                        placeholder="ENTER ID (NAME_1234)..."
                        className="flex-1 bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm uppercase"
                    />
                    <button 
                        onClick={handleSendRequestClick} 
                        disabled={isSending || !inputFriendId}
                        className={`px-4 rounded-lg flex items-center gap-1 transition-colors ${isSending ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    </button>
                </div>

                {/* Friends List */}
                <div className="flex-1">
                    <h3 className="text-gray-500 font-chaotic text-lg mb-2">FRIENDS LIST ({friends.length})</h3>
                    {friends.length === 0 ? (
                        <div className="text-center text-gray-600 py-8 italic">
                            No friends added yet.<br/>Share your ID to connect!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {friends.map(fid => (
                                <div key={fid} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between hover:bg-gray-750 group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-900 p-2 rounded-full">
                                            <User size={16} className="text-blue-300"/>
                                        </div>
                                        <span className="text-white font-mono text-sm truncate max-w-[100px]">{fid}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onInviteToGame(fid)}
                                            className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-lg text-xs flex items-center gap-1"
                                            title="Invite to Game"
                                        >
                                            <Gamepad2 size={16} /> PLAY
                                        </button>
                                        <button 
                                            onClick={() => handleOpenChat(fid)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-xs flex items-center gap-1"
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onRemoveFriend(fid)}
                                            className="text-red-500 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- MAILBOX VIEW --- */}
        {view === 'MAILBOX' && (
           <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-gray-500 font-chaotic text-lg">PENDING REQUESTS</h3>
                  <button onClick={handleRefresh} className="text-blue-400 hover:text-white p-1" title="Force Refresh">
                      <RefreshCw size={16} className={isSending ? 'animate-spin' : ''} />
                  </button>
              </div>
              
              {friendRequests.length === 0 ? (
                 <div className="text-center text-gray-600 py-12 flex flex-col items-center">
                    <Mail size={48} className="mb-2 opacity-20"/>
                    <p>No new requests.</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {friendRequests.map((reqId) => (
                       <div key={reqId} className="bg-gray-800 border border-gray-600 p-3 rounded-lg flex items-center justify-between animate-in slide-in-from-right">
                          <div className="flex items-center gap-3">
                             <div className="bg-yellow-600 p-2 rounded-full">
                                <UserPlus size={16} className="text-white"/>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-white font-mono text-sm">{reqId}</span>
                                <span className="text-gray-500 text-[10px]">Wants to be friends</span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => { onAcceptRequest(reqId); setNotification({msg: "ACCEPTED", type: 'success'}); }}
                                className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full"
                             >
                                <Check size={18} />
                             </button>
                             <button 
                                onClick={() => { onRejectRequest(reqId); setNotification({msg: "REJECTED", type: 'error'}); }}
                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
                             >
                                <Ban size={18} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

        {/* --- CHAT VIEW --- */}
        {view === 'CHAT' && selectedFriend && (
            <div className="flex-1 flex flex-col bg-black/20">
                <div className="bg-gray-800/50 p-2 text-center text-xs text-gray-400 font-mono">
                    Chatting with: <span className="text-white">{selectedFriend}</span>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-gray-600 text-sm mt-4">
                            Start the conversation...
                        </div>
                    )}
                    {chatHistory.map((msg, idx) => {
                        const isMe = msg.sender === myPlayerId;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[80%] p-3 rounded-xl text-sm
                                    ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-700 text-gray-200 rounded-tl-none'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
                    <input 
                        type="text" 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-black border border-gray-600 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 font-sans text-sm"
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FriendSystem;
