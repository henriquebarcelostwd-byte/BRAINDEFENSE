
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { User, Lock, LogIn, UserPlus, X, ShieldCheck, LogOut, UserRound, Camera, Edit2, Trash2, CheckCircle, Save } from 'lucide-react';
import { GameState } from '../types';

interface AccountSystemProps {
  currentUser: string | null;
  onLogin: (username: string, data: GameState) => void;
  onLogout: () => void;
  currentGameState: GameState; // Passed to save initial data to new account
  onUpdateGameState?: (newState: GameState) => void;
  forceOpen?: boolean; // New prop for mandatory auth screen
}

const AccountSystem: React.FC<AccountSystemProps> = ({ currentUser, onLogin, onLogout, currentGameState, onUpdateGameState, forceOpen = false }) => {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [showProfile, setShowProfile] = useState(false);
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Editing State
  const [editNickname, setEditNickname] = useState('');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const OWNER_USER = 'henriquetwd4';

  useEffect(() => {
    if (forceOpen) {
        setIsOpen(true);
    }
  }, [forceOpen]);

  // FIX: Only initialize form when the modal OPENS. 
  // Do not include currentGameState in dependency array to prevent resetting while typing.
  useEffect(() => {
    if (showProfile && currentGameState) {
        setEditNickname(currentGameState.nickname || '');
        setProfilePreview(currentGameState.profilePicture || null);
    }
  }, [showProfile]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow letters and numbers. No spaces, no special chars.
      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
      setUsername(val);
  };

  const handleGuestLogin = () => {
    const rnd = Math.floor(Math.random() * 9000) + 1000;
    const guestId = `Guest_${rnd}`;
    
    const freshState: GameState = {
        brainCoins: 0,
        playerId: `GUEST_${rnd}`, 
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
    };

    onLogin(guestId, freshState);
    setIsOpen(false);
  };

  const handleAction = () => {
    setError(null);
    setSuccess(null);
    const trimmedUser = username.trim();
    
    if (!trimmedUser || !password) {
      setError("Please fill in all fields.");
      return;
    }

    let users: Record<string, any> = {};
    try {
        const storedUsers = localStorage.getItem('braindefense_users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    } catch (e) {
        console.error("User database corrupted, resetting...", e);
        users = {};
    }

    if (mode === 'REGISTER') {
      if (users[trimmedUser]) {
        setError("Username already in use!");
        return;
      }
      
      if (trimmedUser.toLowerCase() === OWNER_USER.toLowerCase()) {
         setError("Cannot register as Owner. Use Login.");
         return;
      }

      if (trimmedUser.toLowerCase().startsWith('guest')) {
          setError("Username cannot start with 'Guest'.");
          return;
      }

      // Ensure clean ID generation
      const cleanName = trimmedUser.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const uniqueId = `${cleanName}_${Math.floor(Math.random() * 9000) + 1000}`;

      const newUser = {
        password: password,
        data: { ...currentGameState, playerId: uniqueId }
      };
      
      users[trimmedUser] = newUser;
      
      try {
        localStorage.setItem('braindefense_users', JSON.stringify(users));
        setSuccess("Account Created! Logging in...");
        
        setTimeout(() => {
            onLogin(trimmedUser, newUser.data);
            setIsOpen(false);
        }, 1000);
      } catch (e) {
          setError("Failed to save account. Storage might be full.");
      }
    } 
    else if (mode === 'LOGIN') {
      if (trimmedUser === OWNER_USER) {
        if (password === 'GAMER08101923') {
           onLogin(trimmedUser, currentGameState);
           setIsOpen(false);
           return;
        } else {
           setError("Incorrect password.");
           return;
        }
      }

      const userRecord = users[trimmedUser];
      if (!userRecord) {
        setError("Account not found. Create one!");
        return;
      }
      if (userRecord.password !== password) {
        setError("Incorrect password.");
        return;
      }

      onLogin(trimmedUser, userRecord.data);
      setIsOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Max 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Resize image to max 128px to save LocalStorage space
        const maxSize = 128;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        // Use lower quality (0.6) to ensure it fits in localStorage
        setProfilePreview(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    if (!currentUser || !onUpdateGameState) return;
    
    // 1. Prepare new state
    const newState = {
        ...currentGameState,
        nickname: editNickname.trim(),
        profilePicture: profilePreview || '' 
    };
    
    // 2. Dispatch update to App.tsx (React State)
    onUpdateGameState(newState);
    
    // 3. FORCE SAVE TO LOCALSTORAGE (Persistence)
    // We do this explicitly here to give the user immediate feedback and assurance
    if (currentUser !== OWNER_USER && !currentUser.startsWith('Guest')) {
         try {
             const storedUsers = localStorage.getItem('braindefense_users');
             const users = storedUsers ? JSON.parse(storedUsers) : {};
             
             // Preserve existing password
             const existingPassword = users[currentUser]?.password || 'default';
             
             users[currentUser] = { 
                 password: existingPassword,
                 data: newState 
             };
             
             localStorage.setItem('braindefense_users', JSON.stringify(users));
             localStorage.setItem('braindefense_last_user', currentUser);
             
             alert("✅ ACCOUNT & PROFILE SAVED!");
         } catch (e) {
             console.error("Force save failed", e);
             alert("⚠️ SAVE FAILED! Image might be too big. Try a smaller one.");
             return; // Don't close modal if failed
         }
    } else {
         // Guest Save (Just generic slot)
         localStorage.setItem('braindefense_save', JSON.stringify(newState));
         alert("✅ GUEST DATA SAVED!");
    }

    setShowProfile(false);
  };

  const deleteAccount = () => {
    if (!currentUser || currentUser.startsWith('Guest')) {
        onLogout();
        setShowProfile(false);
        return;
    }

    if (confirm("ARE YOU SURE? This will permanently delete your account and all progress. This cannot be undone.")) {
        try {
            const storedUsers = localStorage.getItem('braindefense_users');
            if (storedUsers) {
                const users = JSON.parse(storedUsers);
                delete users[currentUser];
                localStorage.setItem('braindefense_users', JSON.stringify(users));
            }
        } catch(e) {}
        onLogout();
        setShowProfile(false);
    }
  };

  if (currentUser) {
    const isGuest = currentUser.startsWith('Guest_');
    const displayImage = currentGameState.profilePicture;
    const displayName = currentGameState.nickname || currentUser;

    return (
      <>
        {/* VIEW ACCOUNT BUTTON */}
        <div className="fixed top-4 right-4 z-[80] flex items-center gap-2">
            <button 
                onClick={() => setShowProfile(true)}
                className={`
                    border-2 rounded-full pr-4 pl-1 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md transition-transform hover:scale-105
                    ${currentUser === OWNER_USER ? 'bg-red-900/80 border-red-500' : isGuest ? 'bg-gray-800/80 border-gray-500' : 'bg-blue-900/80 border-blue-500'}
                `}
            >
                <div className="w-10 h-10 rounded-full bg-black/50 border-2 border-white/30 flex items-center justify-center overflow-hidden">
                    {displayImage ? (
                        <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        currentUser === OWNER_USER ? <ShieldCheck className="text-red-400" size={20} /> :
                        isGuest ? <UserRound className="text-gray-300" size={20} /> :
                        <User className="text-blue-300" size={20} />
                    )}
                </div>
                <div className="flex flex-col items-start">
                    <span className={`font-chaotic text-lg leading-none ${currentUser === OWNER_USER ? 'text-red-300' : 'text-blue-100'}`}>
                        {displayName}
                    </span>
                    <span className="text-[10px] text-white/50 uppercase">VIEW ACCOUNT</span>
                </div>
            </button>
        </div>

        {/* PROFILE MODAL */}
        {showProfile && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                <div className="bg-gray-900 border-4 border-purple-500 rounded-2xl w-full max-w-lg p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-y-auto max-h-[90vh]">
                    <button 
                        onClick={() => setShowProfile(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-4xl font-spooky text-center text-purple-400 mb-8 drop-shadow-md">
                        ACCOUNT MANAGEMENT
                    </h2>

                    <div className="flex flex-col items-center gap-6">
                        
                        {/* PROFILE PICTURE */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-purple-400 overflow-hidden bg-black/50 shadow-xl">
                                {profilePreview ? (
                                    <img src={profilePreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg hover:bg-blue-500 transition-colors"
                            >
                                <Camera size={20} color="white"/>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                            />
                        </div>

                        {/* INFO FIELDS */}
                        <div className="w-full space-y-4">
                            {/* ACCOUNT NAME (READ ONLY) */}
                            <div className="bg-black/30 p-3 rounded-lg border border-gray-700">
                                <label className="text-gray-500 text-xs font-mono uppercase">ACCOUNT NAME (LOGIN)</label>
                                <div className="text-gray-300 font-bold flex items-center gap-2">
                                    <Lock size={14} /> {currentUser}
                                </div>
                            </div>
                            
                            {/* PLAYER ID (READ ONLY) */}
                            <div className="bg-black/30 p-3 rounded-lg border border-gray-700">
                                <label className="text-gray-500 text-xs font-mono uppercase">PLAYER ID (SHARE THIS)</label>
                                <div className="text-blue-300 font-mono font-bold text-sm select-all">
                                     {currentGameState.playerId || 'Generating...'}
                                </div>
                            </div>

                            {/* NICKNAME (EDITABLE) */}
                            <div className="bg-black/30 p-3 rounded-lg border border-gray-700 focus-within:border-purple-500 transition-colors">
                                <label className="text-gray-500 text-xs font-mono uppercase">DISPLAY NICKNAME</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Edit2 size={16} className="text-purple-400" />
                                    <input 
                                        type="text" 
                                        value={editNickname}
                                        onChange={(e) => setEditNickname(e.target.value)}
                                        placeholder={currentUser}
                                        className="bg-transparent border-none text-white font-bold w-full focus:outline-none"
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-col w-full gap-3 mt-4">
                            <Button onClick={saveProfile} className="w-full py-3 bg-green-600 border-green-800 hover:bg-green-500 flex items-center justify-center">
                                <Save size={20} className="mr-2" /> SAVE ACCOUNT & PROFILE
                            </Button>
                            
                            <div className="h-px bg-gray-700 w-full my-2"></div>

                            <Button onClick={() => { onLogout(); setShowProfile(false); }} className="w-full py-2 bg-gray-700 border-gray-900 hover:bg-gray-600 text-sm">
                                <LogOut size={16} className="inline mr-2" /> LOG OUT
                            </Button>

                            <button 
                                onClick={deleteAccount}
                                className="w-full py-2 text-red-500 text-xs hover:text-red-400 hover:underline flex items-center justify-center gap-1 mt-2"
                            >
                                <Trash2 size={12} /> DELETE ACCOUNT FOREVER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </>
    );
  }

  // Only render the Login Trigger Button if NOT forced.
  // If forced, we render the modal directly.
  return (
    <>
      {!forceOpen && (
        <div className="absolute top-4 right-4 z-50">
            <button 
            onClick={() => { setIsOpen(true); setError(null); setSuccess(null); }}
            className="bg-gray-800/90 hover:bg-gray-700 border-2 border-gray-500 text-white px-4 py-2 rounded-lg font-chaotic text-lg shadow-lg flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105"
            >
            <User size={20} /> LOGIN / SIGN UP
            </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-gray-900 border-4 border-blue-600 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] relative">
            {!forceOpen && (
                <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                <X size={24} />
                </button>
            )}

            <h2 className="text-4xl font-spooky text-center text-blue-400 mb-6 drop-shadow-md">
              {mode === 'LOGIN' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
            </h2>

            <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-lg">
              <button 
                onClick={() => { setMode('LOGIN'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded font-bold transition-colors ${mode === 'LOGIN' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => { setMode('REGISTER'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded font-bold transition-colors ${mode === 'REGISTER' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                SIGN UP
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Username (Letters/Numbers)"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full bg-black border-2 border-gray-700 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 text-white outline-none font-mono"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border-2 border-gray-700 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 text-white outline-none font-mono"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded text-center animate-pulse">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/50 border border-green-500 text-green-200 text-sm p-3 rounded text-center">
                  {success}
                </div>
              )}

              <Button 
                onClick={handleAction}
                className={`w-full py-3 text-xl ${mode === 'LOGIN' ? 'bg-blue-700 border-blue-900 hover:bg-blue-600' : 'bg-green-700 border-green-900 hover:bg-green-600'}`}
              >
                {mode === 'LOGIN' ? <><LogIn size={20} className="inline mr-2"/> ENTER GAME</> : <><UserPlus size={20} className="inline mr-2"/> CREATE ACCOUNT</>}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
               <Button 
                variant="secondary"
                onClick={handleGuestLogin} 
                className="w-full py-2 text-base bg-gray-700 border-gray-500 hover:bg-gray-600"
               >
                 <UserRound size={18} className="inline mr-2"/> PLAY AS GUEST
               </Button>
            </div>
            
            <p className="text-center text-gray-500 text-xs mt-4 max-w-xs mx-auto leading-relaxed border-t border-gray-800 pt-4">
              {mode === 'REGISTER' 
                ? <span className="text-green-400">SAFE MODE: Account stays logged in after updates, restarts, or closing the app!</span> 
                : <span className="text-blue-400">Login to sync your data. You will remain logged in automatically next time.</span>}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSystem;
