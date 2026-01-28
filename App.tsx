
import React, { useState, useEffect, useRef } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Store from './components/Store';
import LevelSelect from './components/LevelSelect';
import GameEngine from './components/GameEngine';
import DailyRewards from './components/DailyRewards';
import Inventory from './components/Inventory';
import GameModes from './components/GameModes';
import EvolutionLab from './components/EvolutionLab';
import RewardSelector from './components/RewardSelector';
import Index from './components/Index';
import Updates from './components/Updates';
import Button from './components/Button';
import AccountSystem from './components/AccountSystem';
import FriendSystem from './components/FriendSystem';
import MultiplayerLobby from './components/MultiplayerLobby';
import { GameState, ScreenState, MultiplayerMatchState, LevelConfig } from './types';
import { TOWERS, STAGES, IMAGES } from './constants';
import { Save, Sparkles, ChevronDown, ChevronUp, Gift, Menu, Copy, Download, Upload, RefreshCw, X, ShieldCheck, Key, User, ArrowLeft, Megaphone, Zap, Users, Lock, Gamepad2, Check, Bell } from 'lucide-react';

// --- Simple Encryption Helpers ---
const simpleEncrypt = (text: string, key: string) => {
  if (!key) return btoa(text);
  const textChars = text.split('').map(c => c.charCodeAt(0));
  const keyChars = key.split('').map(c => c.charCodeAt(0));
  let encryptedHex = '';
  for (let i = 0; i < textChars.length; i++) {
    const textChar = textChars[i];
    const keyChar = keyChars[i % keyChars.length];
    const encrypted = (textChar + keyChar) % 65536; 
    encryptedHex += encrypted.toString(16).padStart(4, '0');
  }
  return encryptedHex;
};

const simpleDecrypt = (encryptedHex: string, key: string) => {
  if (!key) {
      try { return atob(encryptedHex); } catch(e) { return null; }
  }
  // Detect if it's legacy base64 (not hex)
  if (!/^[0-9a-fA-F]+$/.test(encryptedHex)) {
      try { return atob(encryptedHex); } catch(e) { return null; }
  }

  const keyChars = key.split('').map(c => c.charCodeAt(0));
  let decryptedString = '';
  try {
    for (let i = 0; i < encryptedHex.length; i += 4) {
        const chunk = encryptedHex.substr(i, 4);
        const encryptedChar = parseInt(chunk, 16);
        const keyChar = keyChars[(i / 4) % keyChars.length];
        let decryptedChar = encryptedChar - keyChar;
        if (decryptedChar < 0) decryptedChar += 65536;
        decryptedString += String.fromCharCode(decryptedChar);
    }
    return decryptedString;
  } catch (e) {
      return null;
  }
};

// --- Helper for Fresh State ---
const getDefaultState = (): GameState => ({
  brainCoins: 0,
  playerId: null, // No ID by default until Login or Guest
  unlockedCharacters: ['BONECA_AMBALABU'],
  equippedCharacters: ['BONECA_AMBALABU'], 
  completedLevels: [],
  firstTime: true,
  lastLoginDate: null,
  loginStreak: 1,
  hasClaimedDaily: false,
  hasGamePass: false,
  redeemedCodes: [],
  temporaryUnlocks: {},
  friends: [],
  friendRequests: [],
  nickname: '',
  profilePicture: ''
});

// Helper to sanitize/restore state structure and fill missing defaults
const restoreState = (parsed: any): GameState => {
    const defaults = getDefaultState();
    
    const unlocked = Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length > 0 
        ? parsed.unlockedCharacters 
        : ['BONECA_AMBALABU'];
    
    let equipped = Array.isArray(parsed.equippedCharacters) ? parsed.equippedCharacters : [];
    if (equipped.length > 5) equipped = equipped.slice(0, 5);
    if (equipped.length === 0) equipped = unlocked.slice(0, 5);
    
    // Ensure Player ID is safe (no spaces)
    let safePlayerId = parsed.playerId;
    if (safePlayerId) {
        safePlayerId = safePlayerId.replace(/[^A-Z0-9_]/g, '');
    }

    return {
      ...defaults,
      ...parsed, // Overwrite defaults with saved data
      playerId: safePlayerId || null,
      unlockedCharacters: unlocked,
      equippedCharacters: equipped,
      // Ensure arrays are arrays
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      redeemedCodes: Array.isArray(parsed.redeemedCodes) ? parsed.redeemedCodes : [],
      friends: Array.isArray(parsed.friends) ? parsed.friends : [],
      friendRequests: Array.isArray(parsed.friendRequests) ? parsed.friendRequests : [],
      temporaryUnlocks: parsed.temporaryUnlocks || {},
      nickname: parsed.nickname ?? '',
      profilePicture: parsed.profilePicture ?? ''
    };
};

const getInitialGameState = (): GameState => {
    // 1. PRIORITY: Try to load specific user data if auto-login is pending
    // This fixes the issue where generic save might be from Guest but we are logging in as User
    const lastUser = localStorage.getItem('braindefense_last_user');
    if (lastUser) {
        try {
            const users = JSON.parse(localStorage.getItem('braindefense_users') || '{}');
            if (users[lastUser] && users[lastUser].data) {
                console.log(`[AutoLogin] Loading data for ${lastUser}`);
                return restoreState(users[lastUser].data);
            }
        } catch(e) {
            console.error("Error loading user data", e);
        }
    }

    // 2. Fallback to generic save (Autosave)
    const saved = localStorage.getItem('braindefense_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return restoreState(parsed);
      } catch (e) {
        console.error("Save file corrupted, resetting");
      }
    }
    
    // 3. Default
    return getDefaultState();
};

const OWNER_USER = 'henriquetwd4';

const App: React.FC = () => {
  // --- Global State ---
  const [screen, setScreen] = useState<ScreenState>(ScreenState.LOADING);
  const [currentStageIndex, setCurrentStageIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showRewardSelector, setShowRewardSelector] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState<{ matchId: string; sender: string; level: number } | null>(null);
  
  // Account State - Synchronous Init to prevent Auth Screen flash
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
      const user = localStorage.getItem('braindefense_last_user');
      console.log(`[Init] Current User: ${user}`);
      return user;
  });

  const [ownerModeActive, setOwnerModeActive] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  
  // Multiplayer State
  const [multiplayerMatch, setMultiplayerMatch] = useState<MultiplayerMatchState>({
      isActive: false,
      matchId: '',
      role: 'HOST'
  });
  // Used when I am the host waiting for a friend
  const [activeInviteMatchId, setActiveInviteMatchId] = useState<string | undefined>(undefined);
  
  // Backup Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalMode, setSaveModalMode] = useState<'MENU' | 'EXPORT' | 'IMPORT'>('MENU');
  const [importCode, setImportCode] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const mailboxEventSource = useRef<EventSource | null>(null);
  const inviteMatchListenerRef = useRef<EventSource | null>(null);

  // --- Pull to Refresh Logic ---
  const [pullY, setPullY] = useState(0);
  const touchStartRef = useRef(0);
  const PULL_THRESHOLD = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only pull if at top
    if (mainContainerRef.current && mainContainerRef.current.scrollTop > 5) return;
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (mainContainerRef.current && mainContainerRef.current.scrollTop > 5) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0 && touchStartRef.current > 0) {
        const damped = Math.min(diff * 0.4, 250); 
        setPullY(damped); 
    }
  };

  const handleTouchEnd = () => {
    if (pullY > PULL_THRESHOLD) {
        setShowDailyRewards(true);
    }
    setPullY(0);
    touchStartRef.current = 0;
  };

  const [gameState, setGameState] = useState<GameState>(getInitialGameState);

  // --- SESSION RECOVERY EFFECT ---
  useEffect(() => {
    // Session Recovery (Check if user was in a game)
    // Delay slightly to ensure gameState is ready
    setTimeout(() => {
        const activeSession = localStorage.getItem('bd_active_session');
        if (activeSession) {
            try {
                const sessionData = JSON.parse(activeSession);
                console.log("Found active session, recovering...", sessionData);
                
                // Restore Game Config
                setCurrentStageIndex(sessionData.stageIndex);
                
                // Restore Multiplayer State if applicable
                if (sessionData.isMultiplayer) {
                    setMultiplayerMatch(sessionData.multiplayerState);
                } else {
                    setMultiplayerMatch({ isActive: false, matchId: '', role: 'HOST' });
                }
                
                setNotification("SESSION RESTORED!");
                setTimeout(() => setNotification(null), 2000);
                
                // Force Navigation to Game
                setScreen(ScreenState.GAME);
                
            } catch (e) {
                console.error("Failed to recover session", e);
                localStorage.removeItem('bd_active_session'); // Corrupt, clear it
            }
        }
    }, 500);

  }, []);

  // --- CENTRAL MAILBOX PROCESSING LOGIC ---
  const processMailboxPayload = (payload: any) => {
      if (!payload) return;

      // Deduplication Check (Simple)
      // For Friend Requests, we check if ID is already in requests or friends
      if (payload.type === 'FRIEND_REQUEST' && payload.sender) {
          const senderId = payload.sender;
          setGameState(prev => {
              if (prev.friends.includes(senderId) || prev.friendRequests.includes(senderId)) return prev;
              setNotification(`NEW FRIEND REQUEST: ${senderId}`);
              return {
                  ...prev,
                  friendRequests: [...prev.friendRequests, senderId]
              };
          });
      }

      // Handle Request Accepted
      if (payload.type === 'FRIEND_ACCEPTED' && payload.sender) {
            const senderId = payload.sender;
            setGameState(prev => {
              if (prev.friends.includes(senderId)) return prev;
              setNotification(`${senderId} ACCEPTED YOUR REQUEST!`);
              return {
                  ...prev,
                  friends: [...prev.friends, senderId]
              };
          });
      }

      // Handle Request Rejected
      if (payload.type === 'FRIEND_REJECTED' && payload.sender) {
          const senderId = payload.sender;
          setNotification(`${senderId} DECLINED YOUR REQUEST.`);
      }

      // Handle Game Invite
      if (payload.type === 'GAME_INVITE' && payload.matchId && payload.sender) {
          // Avoid spamming notifications for the same invite
          setIncomingInvite(prev => {
              if (prev && prev.matchId === payload.matchId) return prev;
              console.log("RECEIVED INVITE:", payload);
              return {
                  matchId: payload.matchId,
                  sender: payload.sender,
                  level: payload.level || 1
              };
          });
      }
  };

  // --- MANUAL POLL (FETCH MESSAGES) ---
  const checkMailboxOnce = async (silent = false) => {
      if (!gameState.playerId) return;
      const safeId = gameState.playerId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const topic = `bd_mailbox_v2_${safeId}`;
      
      try {
          // Fetch raw JSON lines from ntfy
          // using 'since=10m' to catch recent things.
          // using 'poll=1' to return immediately with whatever is there.
          const res = await fetch(`https://ntfy.sh/${topic}/json?since=1h&poll=1`);
          const text = await res.text();
          
          if (!text) {
              if (!silent) {
                  setNotification("NO NEW MESSAGES");
                  setTimeout(() => setNotification(null), 1000);
              }
              return;
          }

          // ntfy returns newline delimited JSON
          const lines = text.split('\n').filter(line => line.trim() !== '');
          let processedCount = 0;

          lines.forEach(line => {
              try {
                  const data = JSON.parse(line);
                  if (data.event === 'message') {
                      let payload = data.message;
                      if (typeof payload === 'string' && (payload.startsWith('{') || payload.startsWith('['))) {
                          try { payload = JSON.parse(payload); } catch(e) {}
                      }
                      
                      if (payload && typeof payload === 'object') {
                          processMailboxPayload(payload);
                          processedCount++;
                      }
                  }
              } catch(e) {
                  // ignore bad lines
              }
          });
          
          if (!silent) {
              if (processedCount > 0) {
                  setNotification("MAILBOX REFRESHED!");
              } else {
                  setNotification("NO NEW MESSAGES");
              }
              setTimeout(() => setNotification(null), 2000);
          }
          
      } catch(e) {
          if (!silent) console.error("Manual poll failed", e);
      }
  };

  // --- MAILBOX LISTENER (REAL-TIME SSE) ---
  const connectToMailbox = () => {
    if (!gameState.playerId) return;

    const safeId = gameState.playerId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const mailboxTopic = `bd_mailbox_v2_${safeId}`;
    
    if (mailboxEventSource.current) {
        mailboxEventSource.current.close();
    }

    console.log(`Listening to mailbox: ${mailboxTopic}`);
    // REMOVED 'since' parameter from SSE to prevent it from replaying old history and disconnecting.
    // We rely on 'checkMailboxOnce' to get history on mount/interval.
    const es = new EventSource(`https://ntfy.sh/${mailboxTopic}/sse`);

    es.onerror = (e) => {
        // Silent reconnect
        es.close();
    };

    es.onmessage = (event) => {
        if (!event.data) return;
        try {
            const data = JSON.parse(event.data);
            
            if (data.event === 'keepalive') return;

            let payload = data;
            if (typeof data === 'string') payload = JSON.parse(data);
            if (data.message) {
                if (typeof data.message === 'string' && (data.message.startsWith('{') || data.message.startsWith('['))) {
                    try { payload = JSON.parse(data.message); } catch(e) { payload = data.message; }
                } else {
                    payload = data.message;
                }
            }

            if (payload && typeof payload === 'object') {
                processMailboxPayload(payload);
            }

        } catch(e) {
            // Ignore parse errors
        }
    };

    mailboxEventSource.current = es;
  };

  // --- HYBRID CONNECTION EFFECT ---
  useEffect(() => {
    if (gameState.playerId) {
        // 1. Start SSE for Realtime
        connectToMailbox();
        
        // 2. Poll immediately for missed messages
        checkMailboxOnce(true);

        // 3. Set up polling interval (every 5s) as a safety net
        const interval = setInterval(() => {
            // Check connection health
            if (mailboxEventSource.current && mailboxEventSource.current.readyState === EventSource.CLOSED) {
                connectToMailbox(); // Reconnect SSE if dead
            }
            // Poll for messages in case SSE missed them
            checkMailboxOnce(true);
        }, 5000);

        return () => {
            if (mailboxEventSource.current) mailboxEventSource.current.close();
            clearInterval(interval);
        };
    }
  }, [gameState.playerId]);

  // --- ACCOUNT LOGIC ---
  const handleLogin = (username: string, data: GameState) => {
    setCurrentUser(username);
    
    // Restore and Sanitize State
    const finalState = restoreState(data);
    
    // Ensure Guest also gets an ID if not present. Sanitize Input!
    if (!finalState.playerId) {
        const safeUser = username.toUpperCase().replace(/[^A-Z0-9]/g, '');
        finalState.playerId = `${safeUser}_${Math.floor(Math.random() * 9000) + 1000}`;
    }

    setGameState(finalState);
    setOwnerModeActive(false); // Default to off
    
    // Notification for Login
    setNotification(`WELCOME, ${username.toUpperCase()}!`);
    setTimeout(() => setNotification(null), 3000);

    if (!username.startsWith('Guest')) {
      localStorage.setItem('braindefense_last_user', username);
    }

    // ALWAYS Go to Menu after manual login interaction.
    setScreen(ScreenState.MENU);
  };

  const handleUpdateGameState = (newState: GameState) => {
     setGameState(newState);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOwnerModeActive(false);
    localStorage.removeItem('braindefense_last_user');
    
    // Clear any active game sessions on logout
    localStorage.removeItem('bd_active_session');
    localStorage.removeItem('bd_game_snapshot');
    
    // Reset to default
    setGameState(getDefaultState());
    
    setNotification("LOGGED OUT");
    setTimeout(() => setNotification(null), 2000);

    // Return to mandatory Auth screen
    setScreen(ScreenState.AUTH);
  };

  // --- ADMIN POWERS & STATE OVERRIDE ---
  const isOwner = currentUser === OWNER_USER;

  // Use effective state to grant powers ONLY if owner toggle is active
  const effectiveGameState: GameState = (isOwner && ownerModeActive) ? {
    ...gameState,
    brainCoins: 999999999, // Infinite Coins in Menu
    unlockedCharacters: Object.keys(TOWERS), // Unlock ALL Characters
    completedLevels: [1, 2, 3, 4, 5], // Unlock All Levels
    hasGamePass: true,
  } : gameState;

  // --- FRIEND LOGIC ---
  const handleSendRequest = async (targetId: string): Promise<boolean> => {
      // Ensure target ID is safe for URL topic
      const safeTarget = targetId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      
      // Send message to target's mailbox
      const topic = `bd_mailbox_v2_${safeTarget}`;
      const payload = {
          type: 'FRIEND_REQUEST',
          sender: gameState.playerId // Already safe
      };

      try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return true;
      } catch (e) {
          console.error("Failed to send friend request", e);
          return false;
      }
  };

  const handleAcceptRequest = async (senderId: string) => {
      if (!gameState.playerId) return;
      // 1. Add to my friends
      setGameState(prev => ({
          ...prev,
          friends: [...prev.friends, senderId],
          friendRequests: prev.friendRequests.filter(id => id !== senderId)
      }));

      // 2. Notify sender that I accepted
      const safeSender = senderId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const topic = `bd_mailbox_v2_${safeSender}`;
      const payload = {
          type: 'FRIEND_ACCEPTED',
          sender: gameState.playerId
      };

      try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
      } catch (e) {
          console.error("Failed to accept request", e);
      }
  };

  const handleRejectRequest = async (senderId: string) => {
      // 1. Remove from my requests locally
      setGameState(prev => ({
          ...prev,
          friendRequests: prev.friendRequests.filter(id => id !== senderId)
      }));

      // 2. Notify sender that I REJECTED them (Critical Fix)
      if (!gameState.playerId) return;
      const safeSender = senderId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const topic = `bd_mailbox_v2_${safeSender}`;
      const payload = {
          type: 'FRIEND_REJECTED',
          sender: gameState.playerId
      };

      try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
      } catch (e) {
          console.error("Failed to send reject signal", e);
      }
  };

  const handleRemoveFriend = (id: string) => {
    setGameState(prev => ({
        ...prev,
        friends: prev.friends.filter(fid => fid !== id)
    }));
  };

  // --- GAME INVITE LOGIC ---
  const handleInviteToGame = async (friendId: string) => {
      if (!gameState.playerId) return;
      
      const matchId = `bd_match_${gameState.playerId}_${friendId}_${Date.now()}`;
      
      // 1. Send invite to friend's mailbox
      const safeFriend = friendId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const topic = `bd_mailbox_v2_${safeFriend}`;
      const payload = {
          type: 'GAME_INVITE',
          sender: gameState.playerId,
          matchId: matchId,
          level: 1 // Default to Level 1 for simplicity, or could pass selected
      };

      try {
          await fetch(`https://ntfy.sh/${topic}`, {
              method: 'POST',
              body: JSON.stringify(payload)
          });
          
          // 2. Transition Host to Lobby Waiting State
          setShowFriends(false); // Close modal
          setActiveInviteMatchId(matchId);
          setScreen(ScreenState.MULTIPLAYER_LOBBY);
          
      } catch (e) {
          console.error("Failed to send game invite", e);
          setNotification("FAILED TO SEND INVITE");
      }
  };

  const acceptIncomingInvite = async () => {
      if (!incomingInvite || !gameState.playerId) return;
      
      const payload = {
          type: 'MATCH_ACCEPT',
          sender: gameState.playerId,
          level: incomingInvite.level,
          completedLevels: effectiveGameState.completedLevels // SEND PROGRESS SO HOST KNOWS
      };
      
      try {
          await fetch(`https://ntfy.sh/${incomingInvite.matchId}`, {
              method: 'POST',
              body: JSON.stringify(payload)
          });
          
          setNotification("WAITING FOR HOST TO START...");
          setIncomingInvite(null); // Clear overlay
          
          // Listen for HOST_START_CONFIRM on the match channel
          if (inviteMatchListenerRef.current) inviteMatchListenerRef.current.close();
          const es = new EventSource(`https://ntfy.sh/${incomingInvite.matchId}/sse?since=10m&t=${Date.now()}`);
          
          es.onmessage = (event) => {
              try {
                  const data = JSON.parse(event.data);
                  const msg = typeof data === 'string' ? JSON.parse(data) : data.message ? JSON.parse(data.message) : data;
                  
                  if (msg.type === 'HOST_START_CONFIRM' && msg.seed) {
                      es.close();
                      startMultiplayerLevel(msg.level, incomingInvite.matchId, 'CLIENT', msg.seed);
                  }
              } catch(e) {}
          };
          inviteMatchListenerRef.current = es;

      } catch (e) {
          console.error("Failed to accept invite", e);
      }
  };

  // --- Persistence & Cleanup ---
  useEffect(() => {
    const now = Date.now();
    let hasChanges = false;
    const currentTemp = { ...gameState.temporaryUnlocks };
    const currentUnlocked = [...gameState.unlockedCharacters];
    const currentEquipped = [...gameState.equippedCharacters];

    Object.keys(currentTemp).forEach(charId => {
      if (now > currentTemp[charId]) {
         delete currentTemp[charId];
         const unlockIndex = currentUnlocked.indexOf(charId);
         if (unlockIndex > -1) {
            currentUnlocked.splice(unlockIndex, 1);
            const equipIndex = currentEquipped.indexOf(charId);
            if (equipIndex > -1) {
               currentEquipped.splice(equipIndex, 1);
            }
            hasChanges = true;
            setNotification(`${TOWERS[charId]?.name} TRIAL EXPIRED!`);
         }
      }
    });

    if (hasChanges) {
       setGameState(prev => ({
          ...prev,
          temporaryUnlocks: currentTemp,
          unlockedCharacters: currentUnlocked,
          equippedCharacters: currentEquipped
       }));
    } else {
       // Save to generic slot (Autosave)
       try {
           localStorage.setItem('braindefense_save', JSON.stringify(gameState));
       } catch (e) {
           console.error("Failed to autosave (likely full)", e);
       }
       
       // If logged in as REGISTERED user, update User Database
       // GUESTS do not save to 'braindefense_users', only 'braindefense_save'
       if (currentUser && currentUser !== OWNER_USER && !currentUser.startsWith('Guest')) {
         // CRITICAL FIX: Only save if we have a valid ID. 
         // This prevents saving the 'default state' (null ID) during the logout race condition.
         if (gameState.playerId) {
             try {
                 const storedUsers = localStorage.getItem('braindefense_users');
                 const users = storedUsers ? JSON.parse(storedUsers) : {};
                 // Ensure user record exists
                 if (!users[currentUser]) users[currentUser] = { data: gameState };
                 
                 users[currentUser].data = gameState;
                 localStorage.setItem('braindefense_users', JSON.stringify(users));
             } catch(e) {
                 console.error("Failed to sync user data", e);
                 if ((e as any).name === 'QuotaExceededError') {
                    setNotification("SAVE FAILED: STORAGE FULL! TRY A SMALLER IMAGE.");
                    setTimeout(() => setNotification(null), 5000);
                 }
             }
         }
       }
    }
  }, [gameState, currentUser]); 

  // --- Initial Logic ---
  const handleLoadingComplete = () => {
    setGameState(prev => ({
      ...prev,
      brainCoins: prev.firstTime ? 100 : prev.brainCoins
    }));

    if (gameState.firstTime) {
      setGameState(prev => ({ ...prev, firstTime: false }));
    }
    checkDailyLogin();
    
    // Check Auto Login from Synchronous State
    if (currentUser && !localStorage.getItem('bd_active_session')) {
        setScreen(ScreenState.MENU);
    } else if (!currentUser) {
        setScreen(ScreenState.AUTH);
    }
  };

  const checkDailyLogin = () => {
    const today = new Date().toDateString();
    
    setGameState(prev => {
      if (prev.lastLoginDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newStreak = prev.loginStreak;
        if (prev.lastLoginDate === yesterday.toDateString()) {
          newStreak += 1;
        } else if (prev.lastLoginDate && prev.lastLoginDate !== today) {
           if (prev.lastLoginDate) {
             newStreak = 1; 
           }
        }
        if (newStreak > 6) newStreak = 1; 

        return {
          ...prev,
          lastLoginDate: today,
          loginStreak: newStreak,
          hasClaimedDaily: false
        };
      }
      return prev;
    });

    setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('braindefense_save') || '{}');
        // Only show daily rewards if NOT recovering a session
        if (!stored.hasClaimedDaily && !localStorage.getItem('bd_active_session')) {
            setShowDailyRewards(true);
        }
    }, 100);
  };

  const claimDailyReward = () => {
    const streak = gameState.loginStreak;
    let coinsToAdd = 0;
    let newCharacter = null;
    let gamePass = false;

    switch(streak) {
      case 1: coinsToAdd = 10; break;
      case 2: coinsToAdd = 15; break;
      case 3: coinsToAdd = 20; break;
      case 4: coinsToAdd = 25; break;
      case 5: newCharacter = 'SAPINI_CAIDERINI'; break;
      case 6: coinsToAdd = 50; gamePass = true; break;
      default: coinsToAdd = 10;
    }

    setGameState(prev => ({
      ...prev,
      brainCoins: prev.brainCoins + coinsToAdd,
      unlockedCharacters: newCharacter && !prev.unlockedCharacters.includes(newCharacter) 
        ? [...prev.unlockedCharacters, newCharacter] 
        : prev.unlockedCharacters,
      hasGamePass: gamePass || prev.hasGamePass,
      hasClaimedDaily: true
    }));

    setNotification(`CLAIMED: ${coinsToAdd > 0 ? coinsToAdd + ' BC' : ''} ${newCharacter ? '+ SAPINI' : ''} ${gamePass ? '+ GAMEPASS' : ''}`);
    setTimeout(() => setNotification(null), 3000);
    setShowDailyRewards(false);
  };

  // --- Actions ---
  const handlePurchase = (id: string, cost: number) => {
    // Owner logic overrides cost check technically, but UI uses effectiveState
    if (effectiveGameState.brainCoins >= cost && !effectiveGameState.unlockedCharacters.includes(id)) {
      setGameState(prev => ({
        ...prev,
        brainCoins: prev.brainCoins - cost,
        unlockedCharacters: [...prev.unlockedCharacters, id]
      }));
      setNotification(`UNLOCKED: ${TOWERS[id]?.name}`);
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleSpendCoins = (amount: number) => {
    if (effectiveGameState.brainCoins >= amount) {
      setGameState(prev => ({
        ...prev,
        brainCoins: prev.brainCoins - amount
      }));
    }
  };

  const handleUnlockCharacter = (id: string) => {
    if (!effectiveGameState.unlockedCharacters.includes(id)) {
      setGameState(prev => ({
        ...prev,
        unlockedCharacters: [...prev.unlockedCharacters, id]
      }));
      setNotification(`LUCKY BLOCK: Unlocked ${TOWERS[id]?.name}!`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      setGameState(prev => ({
        ...prev,
        brainCoins: prev.brainCoins + 20 
      }));
      setNotification(`DUPLICATE! Refunding 20 BC.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRedeemCode = (code: string) => {
    const normalizedCode = code.toUpperCase().trim();
    if (gameState.redeemedCodes.includes(normalizedCode)) {
      setNotification("CODE ALREADY REDEEMED!");
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    if (normalizedCode === 'NEWGAME') {
      setShowRewardSelector(true);
    } else {
      setNotification("INVALID CODE!");
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleRewardSelection = (choice: string) => {
    const code = 'NEWGAME';
    let coins = 0;
    let unlockId: string | null = null;
    let unlockStoreAccessId: string | null = null;

    if (choice === 'TOILETROT') unlockId = 'TOILETROT';
    else if (choice === 'COINS') coins = 200;
    else if (choice === 'CHOCOLATINI_UNLOCK') unlockStoreAccessId = 'CHOCOLATINI_STORE_ACCESS';

    setGameState(prev => {
       const newUnlocked = [...prev.unlockedCharacters];
       const newRedeemed = [...prev.redeemedCodes, code];
       if (unlockId && !newUnlocked.includes(unlockId)) newUnlocked.push(unlockId);
       if (unlockStoreAccessId && !newRedeemed.includes(unlockStoreAccessId)) newRedeemed.push(unlockStoreAccessId);

       return {
         ...prev,
         brainCoins: prev.brainCoins + coins,
         unlockedCharacters: newUnlocked,
         redeemedCodes: newRedeemed
       };
    });

    setShowRewardSelector(false);
    setNotification("REWARD CLAIMED!");
    setTimeout(() => setNotification(null), 2000);
  };

  const handleEvolve = (baseId: string, targetId: string, cost: number) => {
    if (effectiveGameState.brainCoins < cost) return;
    setGameState(prev => {
      const newUnlocked = prev.unlockedCharacters.filter(id => id !== baseId);
      newUnlocked.push(targetId);
      const newEquipped = prev.equippedCharacters.map(id => id === baseId ? targetId : id);
      return {
        ...prev,
        brainCoins: prev.brainCoins - cost,
        unlockedCharacters: newUnlocked,
        equippedCharacters: newEquipped
      };
    });
    setNotification(`EVOLUTION SUCCESSFUL!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateLoadout = (newLoadout: string[]) => {
     setGameState(prev => ({ ...prev, equippedCharacters: newLoadout }));
  };

  const startLevel = (levelId: number) => {
    if (gameState.equippedCharacters.length === 0) {
      setNotification("EQUIP A DEFENDER IN INVENTORY!");
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    const startIndex = (levelId - 1) * 3;
    setCurrentStageIndex(startIndex);
    setMultiplayerMatch({ isActive: false, matchId: '', role: 'HOST', seed: Date.now() }); 
    
    // REGISTER ACTIVE SESSION (SINGLEPLAYER)
    localStorage.setItem('bd_active_session', JSON.stringify({
        stageIndex: startIndex,
        isMultiplayer: false,
        multiplayerState: null
    }));

    setScreen(ScreenState.GAME);
  };

  const startMultiplayerLevel = (levelId: number, matchId: string, role: 'HOST' | 'CLIENT', seed?: number) => {
    if (gameState.equippedCharacters.length === 0) {
        setNotification("EQUIP A DEFENDER FIRST!");
        return;
    }
    const startIndex = (levelId - 1) * 3;
    setCurrentStageIndex(startIndex);
    const mpState: MultiplayerMatchState = { isActive: true, matchId, role, seed };
    setMultiplayerMatch(mpState);
    
    // REGISTER ACTIVE SESSION (MULTIPLAYER)
    localStorage.setItem('bd_active_session', JSON.stringify({
        stageIndex: startIndex,
        isMultiplayer: true,
        multiplayerState: mpState
    }));

    setScreen(ScreenState.GAME);
  };

  const handleStageComplete = (win: boolean) => {
    // Clear Session Logic
    localStorage.removeItem('bd_active_session');
    localStorage.removeItem('bd_game_snapshot');

    if (win) {
      setGameState(prev => ({ ...prev, brainCoins: prev.brainCoins + 20 }));
      if (currentStageIndex === 2) {
         setGameState(prev => ({
            ...prev,
            completedLevels: prev.completedLevels.includes(1) ? prev.completedLevels : [...prev.completedLevels, 1]
         }));
      } else if (currentStageIndex === 5) {
         setGameState(prev => ({
            ...prev,
            completedLevels: prev.completedLevels.includes(2) ? prev.completedLevels : [...prev.completedLevels, 2]
         }));
      }
      setScreen(ScreenState.VICTORY);
    } else {
      setScreen(ScreenState.GAME_OVER);
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex !== null) {
      setCurrentStageIndex(currentStageIndex + 1);
      setScreen(ScreenState.GAME);
    }
  };

  const manualSave = () => {
    try {
      localStorage.setItem('braindefense_save', JSON.stringify(gameState));
      setNotification("GAME SAVED TO DEVICE!");
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      setNotification("SAVE FAILED!");
    }
  };

  const scrollMenu = (direction: 'up' | 'down') => {
    if (mainContainerRef.current) {
        const amount = direction === 'up' ? -300 : 300;
        mainContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  // --- Backup Handlers ---
  const handleGenerateCode = () => {
      if (!backupPassword.trim()) {
          setNotification("PASSWORD REQUIRED!");
          return;
      }
      const json = JSON.stringify(gameState);
      const encrypted = simpleEncrypt(json, backupPassword);
      setGeneratedCode(encrypted);
      setNotification("BACKUP GENERATED!");
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(generatedCode).then(() => {
          setNotification("COPIED TO CLIPBOARD!");
      });
  };

  const handleLoadCode = () => {
      if (!restorePassword.trim()) {
          setNotification("PASSWORD REQUIRED!");
          return;
      }
      const decrypted = simpleDecrypt(importCode.trim(), restorePassword);
      
      if (!decrypted) {
          setNotification("WRONG PASSWORD OR INVALID CODE!");
          return;
      }

      try {
          const data = JSON.parse(decrypted);
          if (data.brainCoins !== undefined && Array.isArray(data.unlockedCharacters)) {
              setGameState(data);
              localStorage.setItem('braindefense_save', JSON.stringify(data));
              setNotification("RESTORE SUCCESSFUL!");
              setShowSaveModal(false);
              setImportCode('');
              setRestorePassword('');
          } else {
              setNotification("CORRUPTED SAVE DATA!");
          }
      } catch (e) {
          setNotification("DECRYPTION FAILED!");
      }
  };

  // --- Render Helpers ---

  // CALCULATE CONFIG FOR GAME ENGINE
  let gameLevelConfig: LevelConfig | undefined = undefined;
  if (currentStageIndex !== null) {
      gameLevelConfig = STAGES[currentStageIndex];
      // INJECT INFINITE MONEY FOR OWNER
      if (isOwner && ownerModeActive && gameLevelConfig) {
          gameLevelConfig = {
              ...gameLevelConfig,
              startingMoney: 9999999 // Infinite Coins for Match
          };
      }
  }

  const renderSaveModal = () => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 border-4 border-blue-500 rounded-xl max-w-2xl w-full p-4 md:p-6 relative overflow-y-auto max-h-[90vh] custom-scrollbar">
                
                <button 
                  onClick={() => { setShowSaveModal(false); setSaveModalMode('MENU'); }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>

                <h2 className="text-3xl md:text-5xl font-spooky text-blue-400 text-center mb-2">SECURE BACKUP</h2>
                
                {/* MENU MODE */}
                {saveModalMode === 'MENU' && (
                    <div className="flex flex-col gap-4 mt-8">
                         <div className="bg-black/40 p-4 rounded border border-green-800 flex items-center justify-between">
                             <div>
                                 <h3 className="font-chaotic text-xl text-green-400 flex items-center gap-2"><Save size={18}/> LOCAL SAVE</h3>
                                 <p className="text-xs text-gray-500 font-mono">Saves to this device now.</p>
                             </div>
                             <Button onClick={manualSave} className="py-2 text-xs md:text-sm">
                                 FORCE SAVE
                             </Button>
                         </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <button 
                                onClick={() => setSaveModalMode('EXPORT')}
                                className="bg-blue-900/50 border-2 border-blue-500 p-6 rounded-xl hover:bg-blue-800 transition-colors flex flex-col items-center gap-2"
                            >
                                <Download size={48} className="text-blue-400" />
                                <span className="font-chaotic text-2xl text-blue-200">EXPORT</span>
                                <span className="text-xs text-blue-300 text-center">Create Backup Code</span>
                            </button>

                            <button 
                                onClick={() => setSaveModalMode('IMPORT')}
                                className="bg-yellow-900/50 border-2 border-yellow-500 p-6 rounded-xl hover:bg-yellow-800 transition-colors flex flex-col items-center gap-2"
                            >
                                <Upload size={48} className="text-yellow-400" />
                                <span className="font-chaotic text-2xl text-yellow-200">IMPORT</span>
                                <span className="text-xs text-yellow-300 text-center">Restore Data</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* EXPORT MODE */}
                {saveModalMode === 'EXPORT' && (
                    <div className="mt-4 animate-in slide-in-from-right">
                        <Button variant="secondary" onClick={() => setSaveModalMode('MENU')} className="mb-4 py-1 px-4 text-sm"><ArrowLeft size={16}/> BACK</Button>
                        
                        <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-4">
                            <h3 className="text-blue-300 font-chaotic text-xl mb-2 flex items-center gap-2">
                                <ShieldCheck size={20}/> PROTECT YOUR SAVE
                            </h3>
                            <p className="text-gray-400 text-xs mb-4">
                                Create a password. Your backup code will be encrypted. You cannot restore it without this password.
                            </p>
                            
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={backupPassword}
                                        onChange={(e) => setBackupPassword(e.target.value)}
                                        placeholder="CREATE PASSWORD"
                                        className="w-full bg-black border border-blue-600 text-white px-10 py-3 rounded focus:outline-none focus:border-white font-mono"
                                    />
                                </div>
                                <Button onClick={handleGenerateCode} className="py-2">GENERATE</Button>
                            </div>

                            {generatedCode && (
                                <div className="mt-4 space-y-2">
                                    <textarea 
                                        readOnly 
                                        value={generatedCode}
                                        className="w-full h-24 bg-gray-800 text-green-400 font-mono text-[10px] p-2 rounded border border-gray-700 focus:outline-none"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                    <Button onClick={handleCopyCode} variant="secondary" className="w-full text-base py-2 bg-blue-700 hover:bg-blue-600">
                                        <Copy size={18} className="inline mr-2"/> COPY TO CLIPBOARD
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* IMPORT MODE */}
                {saveModalMode === 'IMPORT' && (
                    <div className="mt-4 animate-in slide-in-from-right">
                        <Button variant="secondary" onClick={() => setSaveModalMode('MENU')} className="mb-4 py-1 px-4 text-sm"><ArrowLeft size={16}/> BACK</Button>

                        <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg mb-4">
                             <h3 className="text-yellow-300 font-chaotic text-xl mb-4 flex items-center gap-2">
                                <Upload size={20}/> RESTORE DATA
                            </h3>

                            <textarea 
                                value={importCode}
                                onChange={(e) => setImportCode(e.target.value)}
                                placeholder="PASTE BACKUP CODE HERE..."
                                className="w-full h-24 bg-gray-800 text-white font-mono text-[10px] p-2 rounded mb-4 border border-gray-700 focus:border-yellow-500 focus:outline-none"
                            />

                            <div className="relative mb-4">
                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={restorePassword}
                                    onChange={(e) => setRestorePassword(e.target.value)}
                                    placeholder="ENTER PASSWORD"
                                    className="w-full bg-black border border-yellow-600 text-white px-10 py-3 rounded focus:outline-none focus:border-white font-mono"
                                />
                            </div>

                            <Button variant="danger" onClick={handleLoadCode} className="w-full text-base py-3">
                                DECRYPT & RESTORE
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderMenu = () => (
    <div 
      ref={mainContainerRef}
      className="w-full h-full overflow-y-auto bg-gradient-to-b from-purple-900 to-black relative no-scrollbar"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
       {/* Ensure AccountSystem is visible in Menu */}
       <AccountSystem 
          key="menu-account"
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          currentGameState={gameState}
          onUpdateGameState={handleUpdateGameState}
       />

      {/* Scroll Arrows for Menu */}
      <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-4 pointer-events-auto">
        <button 
          onClick={() => scrollMenu('up')}
          className="bg-purple-600/80 p-3 rounded-full border-2 border-purple-400 shadow-lg active:scale-95 hover:bg-purple-500 backdrop-blur-sm"
        >
          <ChevronUp size={32} color="white" />
        </button>
        <button 
          onClick={() => scrollMenu('down')}
          className="bg-purple-600/80 p-3 rounded-full border-2 border-purple-400 shadow-lg active:scale-95 hover:bg-purple-500 backdrop-blur-sm"
        >
          <ChevronDown size={32} color="white" />
        </button>
      </div>

      {/* PULL INDICATOR OVERLAY */}
      <div 
        className="absolute top-0 left-0 w-full bg-gradient-to-b from-yellow-600 to-purple-900 z-50 overflow-hidden flex flex-col items-center justify-end shadow-xl border-b-4 border-yellow-400"
        style={{ 
          height: `${pullY}px`, 
          opacity: Math.min(pullY / PULL_THRESHOLD, 1),
          transition: pullY === 0 ? 'height 0.3s ease-out' : 'none'
        }}
      >
        <div className="mb-4 flex flex-col items-center">
            <Gift size={48} className={`text-white mb-2 ${pullY > PULL_THRESHOLD ? 'animate-bounce' : ''}`} />
            <span className="font-chaotic text-yellow-200 text-xl tracking-widest">
                {pullY > PULL_THRESHOLD ? "RELEASE FOR REWARDS!" : "PULL DOWN..."}
            </span>
        </div>
      </div>

      <div className="min-h-[100dvh] flex flex-col items-center justify-center py-10 px-4">
        
        <h1 className="text-6xl md:text-9xl font-spooky text-green-500 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] animate-bounce text-center mb-6">
            BRAINDEFENSE
        </h1>
        
        {effectiveGameState.hasGamePass && (
            <div className="text-yellow-400 font-chaotic text-lg md:text-xl bg-black/50 px-4 py-1 rounded border border-yellow-500 animate-pulse mb-8">
            👑 VIP GAMEPASS OWNER
            </div>
        )}

        {/* OWNER POWERS BUTTON (ONLY VISIBLE TO OWNER) */}
        {isOwner && (
            <div className="w-full max-w-sm md:max-w-md mb-8">
                <Button 
                    variant="danger" 
                    onClick={() => {
                        setOwnerModeActive(!ownerModeActive);
                        setNotification(ownerModeActive ? "POWERS DEACTIVATED" : "GOD MODE ACTIVATED");
                        setTimeout(() => setNotification(null), 2000);
                    }} 
                    className={`w-full py-4 text-xl border-4 ${ownerModeActive ? 'bg-red-700 border-yellow-400 shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-pulse' : 'bg-red-900 border-red-700 opacity-80'}`}
                >
                    <Zap size={24} className="inline mr-2" />
                    {ownerModeActive ? "POWERS: ACTIVE" : "OWNER'S POWERS"}
                </Button>
            </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-sm md:max-w-md">
            <Button onClick={() => setScreen(ScreenState.LEVEL_SELECT)} className="text-3xl py-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">PLAY</Button> 
            <Button variant="secondary" onClick={() => setScreen(ScreenState.EVOLUTION)}>EVOLUTION LAB</Button>
            <Button variant="secondary" onClick={() => setScreen(ScreenState.INVENTORY)}>INVENTORY</Button>
            <Button variant="secondary" onClick={() => setScreen(ScreenState.STORE)}>STORE</Button>
            
            {/* NEW FRIENDS BUTTON (LOCKED IF NO ID) */}
            <Button 
               variant={gameState.playerId ? "secondary" : "locked"} 
               onClick={() => {
                 if (!gameState.playerId) {
                    setNotification("LOGIN REQUIRED FOR FRIENDS!");
                    setTimeout(() => setNotification(null), 2000);
                    return;
                 }
                 setShowFriends(true);
               }} 
               className="flex items-center justify-center gap-2 relative"
            >
               {gameState.playerId ? <Users size={24} /> : <Lock size={24} />} 
               FRIENDS
               {gameState.playerId && gameState.friendRequests?.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs animate-bounce border-2 border-white">
                      {gameState.friendRequests.length}
                   </span>
               )}
            </Button>
            
            <Button variant="secondary" onClick={() => setScreen(ScreenState.GAME_MODES)}>GAME MODES</Button>
            
            {/* UPDATES BUTTON */}
            <Button variant="secondary" onClick={() => setScreen(ScreenState.UPDATES)} className="flex items-center justify-center gap-2">
                <Bell size={20} /> UPDATES
            </Button>

            <Button variant="secondary" onClick={() => setScreen(ScreenState.INDEX)}>INDEX</Button>
            <Button variant="secondary" onClick={() => setShowDailyRewards(true)}>DAILY REWARDS</Button>
        </div>

      </div>
      
      {/* VERSION DISPLAY (Fixed Bottom Right) */}
      <div className="fixed bottom-2 right-2 z-[100] text-white/40 font-mono text-[10px] pointer-events-none bg-black/50 px-2 rounded">
            v2.7.0 (John Pork)
      </div>
    </div>
  );

  const renderContent = () => {
    if (screen === ScreenState.LOADING) {
      return <LoadingScreen onComplete={handleLoadingComplete} assets={Object.values(IMAGES)} />;
    }
  
    if (screen === ScreenState.AUTH) {
       return (
         <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
             <AccountSystem 
               currentUser={currentUser} 
               onLogin={handleLogin} 
               onLogout={handleLogout}
               currentGameState={gameState}
               forceOpen={true}
             />
         </div>
       );
    }
  
    if (screen === ScreenState.STORE) {
      return (
        <Store 
          brainCoins={effectiveGameState.brainCoins}
          unlockedCharacters={effectiveGameState.unlockedCharacters}
          redeemedCodes={effectiveGameState.redeemedCodes}
          onBuy={handlePurchase}
          onSpendCoins={handleSpendCoins}
          onUnlockCharacter={handleUnlockCharacter}
          onRedeemCode={handleRedeemCode}
          onBack={() => setScreen(ScreenState.MENU)}
        />
      );
    }
  
    if (screen === ScreenState.INVENTORY) {
      return (
        <Inventory 
          unlockedCharacters={effectiveGameState.unlockedCharacters}
          equippedCharacters={effectiveGameState.equippedCharacters}
          onUpdateLoadout={handleUpdateLoadout}
          onBack={() => setScreen(ScreenState.MENU)}
        />
      );
    }
  
    if (screen === ScreenState.EVOLUTION) {
      return (
        <EvolutionLab 
          brainCoins={effectiveGameState.brainCoins}
          unlockedCharacters={effectiveGameState.unlockedCharacters}
          onEvolve={handleEvolve}
          onBack={() => setScreen(ScreenState.MENU)}
        />
      );
    }
  
    if (screen === ScreenState.LEVEL_SELECT) {
      return (
        <LevelSelect 
          unlockedCharacters={effectiveGameState.unlockedCharacters}
          completedLevels={effectiveGameState.completedLevels}
          onSelectLevel={startLevel}
          onBack={() => setScreen(ScreenState.MENU)}
        />
      );
    }
  
    if (screen === ScreenState.GAME_MODES) {
        return (
            <GameModes 
                onSelectTowerDefense={() => setScreen(ScreenState.LEVEL_SELECT)}
                onSelectMultiplayer={() => setScreen(ScreenState.MULTIPLAYER_LOBBY)}
                onBack={() => setScreen(ScreenState.MENU)}
            />
        );
    }
  
    if (screen === ScreenState.MULTIPLAYER_LOBBY) {
        return (
            <MultiplayerLobby 
                myPlayerId={gameState.playerId || ''}
                onBack={() => {
                    setScreen(ScreenState.MENU);
                    setMultiplayerMatch({ isActive: false, matchId: '', role: 'HOST' });
                    setActiveInviteMatchId(undefined);
                }}
                onInviteFriends={() => setShowFriends(true)}
                completedLevels={effectiveGameState.completedLevels}
                onStartMatch={startMultiplayerLevel}
                initialMatchId={activeInviteMatchId}
            />
        );
    }
    
    if (screen === ScreenState.INDEX) {
        return (
            <Index 
                unlockedCharacters={effectiveGameState.unlockedCharacters}
                onBack={() => setScreen(ScreenState.MENU)}
            />
        );
    }

    if (screen === ScreenState.UPDATES) {
        return (
            <Updates onBack={() => setScreen(ScreenState.MENU)} />
        );
    }
  
    if (screen === ScreenState.GAME) {
      if (!gameLevelConfig) return <div className="flex items-center justify-center h-full text-white">Error: Level Config Missing</div>;
      return (
        <GameEngine 
          stageConfig={gameLevelConfig}
          stageNumber={(currentStageIndex || 0) + 1}
          totalStages={STAGES.length}
          equippedCharacters={gameState.equippedCharacters}
          onGameOver={handleStageComplete}
          onExit={() => {
              // Clear Session
              localStorage.removeItem('bd_active_session');
              localStorage.removeItem('bd_game_snapshot');
              setMultiplayerMatch({ isActive: false, matchId: '', role: 'HOST' });
              setScreen(ScreenState.MENU);
          }}
          multiplayerState={multiplayerMatch}
        />
      );
    }
  
    if (screen === ScreenState.VICTORY) {
       return (
          <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center p-4">
               <h1 className="text-6xl text-yellow-400 font-spooky mb-4 animate-bounce">VICTORY!</h1>
               <p className="text-green-400 font-chaotic text-2xl mb-8">+20 BRAINCOINS</p>
               <div className="flex gap-4">
                   <Button onClick={() => setScreen(ScreenState.MENU)}>MENU</Button>
                   {currentStageIndex !== null && currentStageIndex < STAGES.length - 1 && (
                       <Button onClick={handleNextStage}>NEXT LEVEL</Button>
                   )}
               </div>
          </div>
       );
    }
  
    if (screen === ScreenState.GAME_OVER) {
      return (
          <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center p-4">
               <h1 className="text-6xl text-red-600 font-spooky mb-4">GAME OVER</h1>
               <p className="text-gray-400 font-chaotic text-xl mb-8">THE BRAINROT CONSUMED YOU...</p>
               <div className="flex gap-4">
                   <Button onClick={() => setScreen(ScreenState.MENU)}>MENU</Button>
                   <Button onClick={() => setScreen(ScreenState.GAME)}>RETRY</Button>
               </div>
          </div>
       );
    }

    // Default: MENU
    return renderMenu();
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
        {/* RENDER ACTIVE SCREEN */}
        {renderContent()}

        {/* GLOBAL OVERLAYS */}
        {notification && (
            <div className="fixed top-8 z-[200] animate-bounce w-full flex justify-center px-4 pointer-events-none">
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg border-2 border-green-400 font-chaotic text-xl md:text-2xl shadow-lg flex items-center gap-2 text-center">
                    <ShieldCheck size={24} className="flex-shrink-0" />
                    {notification}
                </div>
            </div>
        )}

        {/* GAME INVITE OVERLAY */}
        {incomingInvite && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-indigo-900 border-4 border-cyan-500 rounded-xl p-4 shadow-2xl animate-bounce">
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-cyan-400 font-chaotic text-xl">GAME INVITE!</h3>
                    <p className="text-white text-sm">FROM: {incomingInvite.sender}</p>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={acceptIncomingInvite} className="py-1 px-4 text-sm bg-green-600">ACCEPT</Button>
                        <Button variant="danger" onClick={() => setIncomingInvite(null)} className="py-1 px-4 text-sm">IGNORE</Button>
                    </div>
                </div>
            </div>
        )}

        {showDailyRewards && (
            <DailyRewards 
                streak={gameState.loginStreak} 
                canClaim={!gameState.hasClaimedDaily}
                onClaim={claimDailyReward}
                onClose={() => setShowDailyRewards(false)}
            />
        )}
        
        {showSaveModal && renderSaveModal()}
        
        {showRewardSelector && (
           <RewardSelector onSelect={handleRewardSelection} />
        )}

        {showFriends && gameState.playerId && (
           <FriendSystem 
              myPlayerId={gameState.playerId}
              friends={gameState.friends}
              friendRequests={gameState.friendRequests}
              onSendRequest={handleSendRequest}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onRemoveFriend={handleRemoveFriend}
              onInviteToGame={handleInviteToGame}
              onClose={() => setShowFriends(false)}
              onRefresh={checkMailboxOnce}
           />
        )}
    </div>
  );
};

export default App;
