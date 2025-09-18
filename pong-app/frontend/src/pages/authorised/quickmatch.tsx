import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatars } from "../../utils/lobbyApi";

interface Player {
  socketId: string;
  name: string;
}

interface OnlineUser {
  socketId: string;
  name: string;
  status?: string;
}

interface GameRoom {
  id: string;
  status: "waiting" | "in-progress" | "finished";  
  players: { id: string, name: string }[];
}

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
}

interface Invitation {
  id: string;
  from: { socketId: string; name: string };
  gameType: "pong" | "keyclash";
  message: string;
  timestamp?: number;
}

interface SentInvitation {
  id: string;
  to: { socketId: string; name: string };
  gameType: "pong" | "keyclash";
  timestamp?: number;
}

// Use the same validation regex as backend
const validatePlayerName = (name: string): boolean => {
  if (!name || name.length === 0 || name.length > 20) {
    return false;
  }
  
  const validNameRegex = /^[A-Za-z0-9 _-]+$/;
  return validNameRegex.test(name.trim());
};

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // FIXED: Track initialization state to prevent unwanted resets
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Existing lobby state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // Invitation state
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");
  
  // Get username from auth context
  const loggedInUsername = user?.username || "";
  
  // Game selection state
  const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash">("pong");
  const [selectedMode, setSelectedMode] = useState<"local" | "remote">("local");
  const [selectedOpponent, setSelectedOpponent] = useState<OnlineUser | null>(null);
  
  // FIXED: Initialize guest data with proper persistence strategy
  const [guestName, setGuestName] = useState(() => {
    // Try to load from localStorage first, but only for non-initial load
    const saved = localStorage.getItem("quickmatch_guestName");
    console.log("=== INITIALIZING guestName ===");
    console.log("Saved from localStorage:", saved);
    return saved || "";
  });

  const [guestAvatar, setGuestAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("quickmatch_guestAvatar");
    console.log("=== INITIALIZING guestAvatar ===");
    console.log("Saved from localStorage:", saved);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse guestAvatar from localStorage:", e);
        return null;
      }
    }
    return null;
  });

  // User avatar - can persist from localStorage
  const [userAvatar, setUserAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("userAvatar");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Opponent avatar for remote mode
  const [opponentAvatar, setOpponentAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("opponentAvatar");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
  const [invitationTimers, setInvitationTimers] = useState<Record<string, number>>({});

  // FIXED: Memoize callbacks to prevent unnecessary re-renders
  const handleGuestNameChange = useCallback((newName: string) => {
    setGuestName(newName);
    
    // Save to localStorage immediately
    if (newName.trim()) {
      localStorage.setItem("quickmatch_guestName", newName);
    } else {
      localStorage.removeItem("quickmatch_guestName");
    }
  }, []);

  const handleGuestAvatarChange = useCallback((newAvatar: { name: string; image: string } | null) => {
    setGuestAvatar(newAvatar);
    
    // Save to localStorage immediately
    if (newAvatar) {
      localStorage.setItem("quickmatch_guestAvatar", JSON.stringify(newAvatar));
    } else {
      localStorage.removeItem("quickmatch_guestAvatar");
    }
  }, []);

  // Initialize user data
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
    console.log("=== INITIALIZING COMPONENT ===");
    
    const loadAvatars = async () => {
      try {
        const avatars = await getAvatars();
        setAvailableAvatars(avatars);
        
        if (!userAvatar && avatars.length > 0) {
          const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
          setUserAvatar(defaultAvatar);
          localStorage.setItem("userAvatar", JSON.stringify(defaultAvatar));
        }

        if (!opponentAvatar && avatars.length > 1) {
          const defaultOpponentAvatar = { name: avatars[1].id, image: avatars[1].imageUrl };
          setOpponentAvatar(defaultOpponentAvatar);
          localStorage.setItem("opponentAvatar", JSON.stringify(defaultOpponentAvatar));
        }

        setIsInitialized(true);
        console.log("=== COMPONENT INITIALIZED ===");
      } catch (error) {
        console.error("Failed to load avatars:", error);
        setIsInitialized(true); // Still mark as initialized to prevent loops
      }
    };
    loadAvatars();
  }, [isInitialized, userAvatar, opponentAvatar]);

  // FIXED: One-time cleanup on mount only
  useEffect(() => {
    console.log("=== COMPONENT MOUNTING - CLEANUP ===");
    // Only clean up non-guest related data
    localStorage.removeItem("points1");
    localStorage.removeItem("points2");
    localStorage.removeItem("points3");
    localStorage.removeItem("tournamentGuests");
    localStorage.removeItem("guestCount");
    // DON'T clear guest data here - let it persist
    console.log("=== CLEANUP COMPLETE ===");
  }, []); // Empty dependency array - runs only once

  // REMOVED: The problematic useEffect that was clearing guest data
  // This was causing the state to reset every time selectedMode changed

  // Debug state changes
  useEffect(() => {
    console.log("=== STATE CHANGE DEBUG ===");
    console.log("selectedMode:", selectedMode);
    console.log("guestName:", `"${guestName}"`);
    console.log("guestAvatar:", guestAvatar);
    console.log("isInitialized:", isInitialized);
    console.log("========================");
  }, [selectedMode, guestName, guestAvatar, isInitialized]);

  // Countdown timer for invitations with proper expiration handling
  useEffect(() => {
    const interval = setInterval(() => {
      setInvitationTimers(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(invitationId => {
          if (updated[invitationId] > 0) {
            updated[invitationId] -= 1;
            if (updated[invitationId] % 10 === 0) {
              console.log(`Invitation ${invitationId} timer: ${updated[invitationId]}s remaining`);
            }
          } else if (updated[invitationId] === 0) {
            console.log(`Invitation ${invitationId} expired!`);
            
            const sentInvitation = sentInvitations.find(inv => inv.id === invitationId);
            const receivedInvitation = receivedInvitations.find(inv => inv.id === invitationId);
            
            if (sentInvitation) {
              setSentInvitations(current => current.filter(inv => inv.id !== invitationId));
              setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
              setShowInvitationModal(true);
              setTimeout(() => setShowInvitationModal(false), 3000);
            }
            
            if (receivedInvitation) {
              setReceivedInvitations(current => current.filter(inv => inv.id !== invitationId));
              setInvitationMessage("⏰ Game invitation expired");
              setShowInvitationModal(true);
              setTimeout(() => setShowInvitationModal(false), 3000);
            }
            
            delete updated[invitationId];
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sentInvitations, receivedInvitations]);

  // Socket setup for lobby and invitations
  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization
    
    let name: string | null = null;
    let playerId: string | null = null;

    socketRef.current = io("/quickmatch", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true
    });

    socketRef.current.on("connect", () => {
      name = null;
      playerId = null;
      
      if (user) {
        if (user.username) {
          name = user.username;
        }
        if (user.id) {
          playerId = String(user.id);
        }
      }
      
      socketRef.current?.emit("name", name, playerId, (res: { error: string }) => {
        if (res.error) {
          alert(res.error);
          navigate("/lobby")
        }
      });
    });

    socketRef.current.on("lobby_update", (data) => {
      setPlayers(data.players);
      setPongGames(data.pongGames);
      setKeyClashGames(data.keyClashGames)
    });

    socketRef.current.on("created_game", (gameId, game, mode) => {
      joinGame(gameId, game, mode);
    });

    socketRef.current.on("joined_game", (gameId, game, mode) => {
      console.log("joined_game event received:", { gameId, game, mode, selectedMode });
      
      if (selectedMode === "local") {
        console.log("Handling local game join");
        socketRef.current?.disconnect();
        socketRef.current = null;
        const type = "1v1";
        
        const navigationState = {
          user: loggedInUsername,
          guest: guestName.trim(), // Make sure to trim
          userAvatar,
          guestAvatar,
          gameType: game,
          mode: mode,
          type: type,
          fromQuickMatch: true,
          isLocal: true,
          gameId: gameId
        };
        
        console.log("Navigating to local game with state:", navigationState);
        
        navigate(`/${game}/${mode}/${type}/${gameId}`, {
          state: navigationState
        });
      } else {
        console.log("Ignoring joined_game for remote mode - waiting for game_setup_complete");
      }
    });

    // ... rest of socket event handlers remain the same ...

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isInitialized, user, navigate, selectedMode, loggedInUsername, guestName, userAvatar, guestAvatar]);

  // Avatar selection - Enhanced to support opponent avatar
  const chooseAvatar = useCallback((target: "user" | "guest" | "opponent") => {
    console.log("=== CHOOSING AVATAR ===");
    console.log("Target:", target);
    
    let currentIndex = -1;
    
    if (target === "user") {
      currentIndex = availableAvatars.findIndex(a => a.id === userAvatar?.name);
    } else if (target === "guest") {
      currentIndex = availableAvatars.findIndex(a => a.id === guestAvatar?.name);
    } else if (target === "opponent") {
      currentIndex = availableAvatars.findIndex(a => a.id === opponentAvatar?.name);
    }
    
    const nextIndex = (currentIndex + 1) % availableAvatars.length;
    const selectedAvatar = availableAvatars[nextIndex];
    
    if (selectedAvatar) {
      const avatarData = { name: selectedAvatar.id, image: selectedAvatar.imageUrl };
      
      if (target === "user") {
        setUserAvatar(avatarData);
        localStorage.setItem("userAvatar", JSON.stringify(avatarData));
      } else if (target === "guest") {
        console.log("Setting guest avatar:", avatarData);
        handleGuestAvatarChange(avatarData);
      } else if (target === "opponent") {
        setOpponentAvatar(avatarData);
        localStorage.setItem("opponentAvatar", JSON.stringify(avatarData));
      }
    }
  }, [availableAvatars, userAvatar, guestAvatar, opponentAvatar, handleGuestAvatarChange]);

  // FIXED: Improved validation function
  const canStartGame = useCallback(() => {
    if (selectedMode === "local") {
      const trimmedGuestName = guestName.trim();
      const trimmedLoggedInUsername = loggedInUsername.trim();
      
      const result = (
        userAvatar && 
        guestAvatar && 
        trimmedGuestName.length > 0 && 
        validatePlayerName(trimmedGuestName) &&
        trimmedGuestName.toLowerCase() !== trimmedLoggedInUsername.toLowerCase()
      );
      
      // ENHANCED: Better debugging information
      console.log("=== canStartGame (local) DEBUG ===");
      console.log("userAvatar:", !!userAvatar, userAvatar?.name);
      console.log("guestAvatar:", !!guestAvatar, guestAvatar?.name);
      console.log("guestName (raw):", `"${guestName}"`);
      console.log("guestName (trimmed):", `"${trimmedGuestName}"`);
      console.log("guestName length:", trimmedGuestName.length);
      console.log("validatePlayerName result:", validatePlayerName(trimmedGuestName));
      console.log("loggedInUsername (trimmed):", `"${trimmedLoggedInUsername}"`);
      console.log("Names are different:", trimmedGuestName.toLowerCase() !== trimmedLoggedInUsername.toLowerCase());
      console.log("Final result:", result);
      console.log("=== END DEBUG ===");
      
      return result;
    } else {
      const result = userAvatar && opponentAvatar && selectedOpponent;
      console.log("canStartGame (remote):", {
        userAvatar: !!userAvatar,
        opponentAvatar: !!opponentAvatar,
        selectedOpponent: !!selectedOpponent,
        result
      });
      return result;
    }
  }, [selectedMode, guestName, userAvatar, guestAvatar, loggedInUsername, opponentAvatar, selectedOpponent]);

  // FIXED: Better error messages and debugging
  const startSpecificGame = useCallback((gameType: "pong" | "keyclash") => {
    console.log("=== START SPECIFIC GAME CALLED ===");
    console.log("Called with gameType:", gameType);
    
    const currentCanStart = canStartGame();
    console.log("Current canStartGame result:", currentCanStart);
    
    if (!currentCanStart) {
      console.log("Game cannot start - validation failed");
      
      if (selectedMode === "local") {
        console.log("Checking local mode validation issues...");
        
        // Provide specific error messages
        const trimmedGuestName = guestName.trim();
        
        if (!userAvatar) {
          alert("Please select an avatar for Player 1");
          return;
        }
        
        if (!trimmedGuestName) {
          alert("Please enter a username for Player 2 (Guest)");
          return;
        }
        
        if (!validatePlayerName(trimmedGuestName)) {
          alert("Player 2 username can only contain letters, numbers, spaces, underscores, and hyphens (max 20 characters)");
          return;
        }
        
        if (trimmedGuestName.toLowerCase() === loggedInUsername.toLowerCase()) {
          alert("Player 2 username must be different from your username");
          return;
        }
        
        if (!guestAvatar) {
          alert("Please select an avatar for Player 2 (Guest)");
          return;
        }
        
        // If we get here, something unexpected happened
        alert("Unable to start game. Please check all player details and try again.");
      } else {
        console.log("Showing remote mode alert");
        alert("Please select an opponent and ensure both players have avatars");
      }
      
      console.log("=== START SPECIFIC GAME END (FAILED) ===");
      return;
    }

    console.log("Game can start - proceeding");
    setSelectedGameType(gameType);
    localStorage.setItem("gameType", gameType);

    if (selectedMode === "local") {
      console.log("Starting local game");
      socketRef.current?.emit("create_game", gameType, selectedMode);
    } else {
      if (selectedOpponent) {
        console.log("Sending invitation for remote game to:", selectedOpponent.name);
        sendPlayRequestForGame(selectedOpponent, gameType);
      } else {
        console.log("No opponent selected for remote game");
        alert("Please select an opponent first");
      }
    }
    console.log("=== START SPECIFIC GAME END (SUCCESS) ===");
  }, [canStartGame, selectedMode, guestName, userAvatar, guestAvatar, loggedInUsername, selectedOpponent]);

  const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

  // Filter out current user from players list
  const otherPlayers = players.filter(p => p.name !== loggedInUsername);

  // Helper function to get validation status message
  const getValidationMessage = useCallback(() => {
    if (selectedMode === "local") {
      const trimmedGuestName = guestName.trim();
      
      if (!userAvatar) return "Please select an avatar for Player 1";
      if (!trimmedGuestName) return "Enter a username for Player 2 (Guest)";
      if (!validatePlayerName(trimmedGuestName)) return "Player 2 username must be valid (letters, numbers, spaces, _, - only, max 20 chars)";
      if (trimmedGuestName.toLowerCase() === loggedInUsername.toLowerCase()) return "Player 2 username must be different from yours";
      if (!guestAvatar) return "Choose an avatar for Player 2 (Guest)";
      return "✅ Ready to start! Choose your game above";
    } else {
      if (!userAvatar) return "Please select your avatar";
      if (!selectedOpponent) return "Please select an opponent from the online players list";
      if (!opponentAvatar) return "Please choose an avatar for your opponent";
      return "✅ Ready to start! Choose your game above";
    }
  }, [selectedMode, guestName, userAvatar, guestAvatar, loggedInUsername, selectedOpponent, opponentAvatar]);

  if (!isInitialized) {
    return (
      <div className="w-full min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading game setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
      {/* Back Button */}
      <button
        onClick={() => navigate("/lobby")}
        className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
      >
        🔙 Back to Lobby
      </button>

      <h1 className="text-4xl font-bold text-center mb-6">
        🎮 Quick Match Setup
      </h1>

      <div className="w-full max-w-7xl flex gap-6">
        {/* Left Column - Main Content */}
        <div className={`${selectedMode === "remote" ? "w-2/3" : "w-full"} space-y-6`}>
          {/* 1. Game Mode Selection */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">1️⃣ Choose Game Mode</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedMode("local");
                  setSelectedOpponent(null);
                }}
                className={`p-3 rounded-xl font-semibold shadow-lg transition-all ${
                  selectedMode === "local" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                }`}
              >
                🏠 Local (Same Computer)<br/>
                <span className="text-sm font-normal">Play with a friend on same device</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMode("remote");
                  setSelectedOpponent(null);
                }}
                className={`p-3 rounded-xl font-semibold shadow-lg transition-all ${
                  selectedMode === "remote" 
                    ? "bg-orange-600 text-white" 
                    : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                }`}
              >
                🌐 Remote (Online)<br/>
                <span className="text-sm font-normal">Play with others online</span>
              </button>
            </div>
          </div>

          {/* 2. Player Setup Section */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">
              2️⃣ Setup Players & Avatars
            </h2>
            
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Player 1 */}
              <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-2">👤 Player 1 (You)</h3>
                <p className="mb-4 text-lg">
                  Username: <strong>{loggedInUsername}</strong>
                </p>

                {userAvatar ? (
                  <>
                    <img
                      src={userAvatar.image}
                      alt={userAvatar.name}
                      className="w-32 h-32 rounded-full border-4 border-blue-400 mb-2 object-cover"
                    />
                    <p className="capitalize mb-4">{userAvatar.name}</p>
                  </>
                ) : (
                  <p className="mb-4 italic text-gray-400">No avatar selected</p>
                )}

                <button
                  onClick={() => chooseAvatar("user")}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Choose Avatar
                </button>
              </div>

              {/* VS Separator */}
              <div className="text-4xl font-bold text-yellow-400">VS</div>

              {/* Player 2 */}
              <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

                <input
                  type="text"
                  placeholder="Enter guest username"
                  value={guestName}
                  onChange={(e) => handleGuestNameChange(e.target.value)}
                  className="mb-4 px-4 py-2 rounded text-pink-400 bg-gray-600 font-bold w-full max-w-sm text-center"
                  maxLength={20}
                />

                {/* Validation hints */}
                <div className="text-xs text-gray-400 mb-4 text-center max-w-sm">
                  {guestName.trim() && !validatePlayerName(guestName.trim()) && (
                    <p className="text-red-400">
                      ❌ Only letters, numbers, spaces, underscores, and hyphens allowed (max 20 chars)
                    </p>
                  )}
                  {guestName.trim() && validatePlayerName(guestName.trim()) && guestName.trim().toLowerCase() === loggedInUsername.toLowerCase() && (
                    <p className="text-red-400">
                      ❌ Must be different from your username
                    </p>
                  )}
                  {guestName.trim() && validatePlayerName(guestName.trim()) && guestName.trim().toLowerCase() !== loggedInUsername.toLowerCase() && (
                    <p className="text-green-400">
                      ✅ Valid username!
                    </p>
                  )}
                </div>

                {guestAvatar ? (
                  <>
                    <img
                      src={guestAvatar.image}
                      alt={guestAvatar.name}
                      className="w-32 h-32 rounded-full border-4 border-pink-400 mb-2 object-cover"
                    />
                    <p className="capitalize mb-4">{guestAvatar.name}</p>
                  </>
                ) : (
                  <div className="text-center mb-4">
                    <div className="w-32 h-32 bg-gray-600 border-4 border-dashed border-gray-500 rounded-full flex items-center justify-center text-gray-400 text-4xl mb-2">
                      ?
                    </div>
                    <p className="italic text-gray-400">Choose an avatar below</p>
                  </div>
                )}

                <button
                  onClick={() => chooseAvatar("guest")}
                  className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
                >
                  {guestAvatar ? "Change Avatar" : "Choose Avatar"}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Game Selection Buttons */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">3️⃣ Choose Your Game</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => startSpecificGame("pong")}
                disabled={!canStartGame()}
                className={`p-6 rounded-xl text-xl font-bold shadow-lg transition-all ${
                  !canStartGame()
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                }`}
              >
                🏓 Start Ping Pong
                {selectedMode === "local" && guestName.trim() && (
                  <div className="text-base font-normal mt-2">vs {guestName.trim()}</div>
                )}
              </button>

              <button
                onClick={() => startSpecificGame("keyclash")}
                disabled={!canStartGame()}
                className={`p-6 rounded-xl text-xl font-bold shadow-lg transition-all ${
                  !canStartGame()
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                }`}
              >
                ⌨️ Start Key Clash
                {selectedMode === "local" && guestName.trim() && (
                  <div className="text-base font-normal mt-2">vs {guestName.trim()}</div>
                )}
              </button>
            </div>

            {/* Dynamic status messages */}
            <div className="text-center mt-4">
              <p className={`text-sm ${canStartGame() ? 'text-green-400' : 'text-gray-400'}`}>
                {getValidationMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
