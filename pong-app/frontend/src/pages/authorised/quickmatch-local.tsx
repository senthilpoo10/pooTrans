// // frontend/src/pages/authorised/quickmatch_local.tsx
// import { useEffect, useState, useRef, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";
// import { getAvatars } from "../../utils/lobbyApi";
// import { AvatarSelector } from "../../components/shared/AvatarSelector";
// import { 
//   validatePlayerName, 
//   getStoredAvatarData, 
//   saveAvatarData, 
//   getNextAvatar,
//   cleanupGameStorage 
// } from "../../shared/utils";
// import { Avatar, AvatarData, GameType } from "../../shared/types";

// export default function QuickmatchLocalPage() {
//   const socketRef = useRef<Socket | null>(null);
//   const navigate = useNavigate();
//   const { user } = useAuth();
  
//   const [isInitialized, setIsInitialized] = useState(false);
//   const loggedInUsername = user?.username || "";
  
//   // Guest player state
//   const [guestName, setGuestName] = useState(() => {
//     const saved = localStorage.getItem("quickmatch_guestName");
//     return saved || "";
//   });

//   // Avatar state
//   const [userAvatar, setUserAvatar] = useState<AvatarData | null>(() => 
//     getStoredAvatarData("userAvatar")
//   );
  
//   const [guestAvatar, setGuestAvatar] = useState<AvatarData | null>(() => 
//     getStoredAvatarData("quickmatch_guestAvatar")
//   );

//   const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

//   // Guest name change handler
//   const handleGuestNameChange = useCallback((newName: string) => {
//     setGuestName(newName);
    
//     if (newName.trim()) {
//       localStorage.setItem("quickmatch_guestName", newName);
//     } else {
//       localStorage.removeItem("quickmatch_guestName");
//     }
//   }, []);

//   // Avatar change handlers
//   const handleUserAvatarChange = useCallback((newAvatar: AvatarData | null) => {
//     setUserAvatar(newAvatar);
//     saveAvatarData("userAvatar", newAvatar);
//   }, []);

//   const handleGuestAvatarChange = useCallback((newAvatar: AvatarData | null) => {
//     setGuestAvatar(newAvatar);
//     saveAvatarData("quickmatch_guestAvatar", newAvatar);
//   }, []);

//   // Initialize avatars and component
//   useEffect(() => {
//     if (isInitialized) return;
    
//     const loadAvatars = async () => {
//       try {
//         const avatars = await getAvatars();
//         setAvailableAvatars(avatars);
        
//         if (!userAvatar && avatars.length > 0) {
//           const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
//           handleUserAvatarChange(defaultAvatar);
//         }

//         setIsInitialized(true);
//       } catch (error) {
//         console.error("Failed to load avatars:", error);
//         setIsInitialized(true);
//       }
//     };
    
//     loadAvatars();
//   }, [isInitialized, userAvatar, handleUserAvatarChange]);

//   // Cleanup on mount
//   useEffect(() => {
//     cleanupGameStorage();
//   }, []);

//   // Socket setup for local games
//   useEffect(() => {
//     if (!isInitialized) return;
    
//     let name: string | null = null;
//     let playerId: string | null = null;

//     socketRef.current = io("/quickmatch", {
//       path: "/socket.io",
//       transports: ["websocket"],
//       secure: true
//     });

//     socketRef.current.on("connect", () => {
//       name = null;
//       playerId = null;
      
//       if (user) {
//         if (user.username) {
//           name = user.username;
//         }
//         if (user.id) {
//           playerId = String(user.id);
//         }
//       }
      
//       socketRef.current?.emit("name", name, playerId, (res: { error: string }) => {
//         if (res.error) {
//           alert(res.error);
//           navigate("/lobby");
//         }
//       });
//     });

//     socketRef.current.on("created_game", (gameId, game, mode) => {
//       joinGame(gameId, game, mode);
//     });

//     socketRef.current.on("joined_game", (gameId, game, mode) => {
//       console.log("joined_game event received:", { gameId, game, mode });
      
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//       const type = "1v1";
      
//       const navigationState = {
//         user: loggedInUsername,
//         guest: guestName.trim(),
//         userAvatar,
//         guestAvatar,
//         gameType: game,
//         mode: mode,
//         type: type,
//         fromQuickMatch: true,
//         isLocal: true,
//         gameId: gameId
//       };
      
//       console.log("Navigating to local game with state:", navigationState);
      
//       navigate(`/${game}/${mode}/${type}/${gameId}`, {
//         state: navigationState
//       });
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [isInitialized, user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar]);

//   // Avatar selection
//   const chooseAvatar = useCallback((target: "user" | "guest") => {
//     const nextAvatar = getNextAvatar(
//       availableAvatars, 
//       target === "user" ? userAvatar : guestAvatar
//     );
    
//     if (nextAvatar) {
//       if (target === "user") {
//         handleUserAvatarChange(nextAvatar);
//       } else {
//         handleGuestAvatarChange(nextAvatar);
//       }
//     }
//   }, [availableAvatars, userAvatar, guestAvatar, handleUserAvatarChange, handleGuestAvatarChange]);

//   // Validation
//   const canStartGame = useCallback(() => {
//     const trimmedGuestName = guestName.trim();
//     const trimmedLoggedInUsername = loggedInUsername.trim();
    
//     return (
//       userAvatar && 
//       guestAvatar && 
//       trimmedGuestName.length > 0 && 
//       validatePlayerName(trimmedGuestName) &&
//       trimmedGuestName.toLowerCase() !== trimmedLoggedInUsername.toLowerCase()
//     );
//   }, [guestName, userAvatar, guestAvatar, loggedInUsername]);

//   // Start game
//   const startSpecificGame = useCallback((gameType: GameType) => {
//     if (!canStartGame()) {
//       const trimmedGuestName = guestName.trim();
      
//       if (!userAvatar) {
//         alert("Please select an avatar for Player 1");
//         return;
//       }
      
//       if (!trimmedGuestName) {
//         alert("Please enter a username for Player 2 (Guest)");
//         return;
//       }
      
//       if (!validatePlayerName(trimmedGuestName)) {
//         alert("Player 2 username can only contain letters, numbers, spaces, underscores, and hyphens (max 20 characters)");
//         return;
//       }
      
//       if (trimmedGuestName.toLowerCase() === loggedInUsername.toLowerCase()) {
//         alert("Player 2 username must be different from your username");
//         return;
//       }
      
//       if (!guestAvatar) {
//         alert("Please select an avatar for Player 2 (Guest)");
//         return;
//       }
      
//       return;
//     }

//     localStorage.setItem("gameType", gameType);
//     socketRef.current?.emit("create_game", gameType, "local");
//   }, [canStartGame, guestName, userAvatar, guestAvatar, loggedInUsername]);

//   const joinGame = (gameId: string, game: GameType, mode: "local") => {
//     socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
//       if (res.error) alert(res.error);
//     });
//   };

//   // Validation message
//   const getValidationMessage = useCallback(() => {
//     const trimmedGuestName = guestName.trim();
    
//     if (!userAvatar) return "Please select an avatar for Player 1";
//     if (!trimmedGuestName) return "Enter a username for Player 2 (Guest)";
//     if (!validatePlayerName(trimmedGuestName)) return "Player 2 username must be valid (letters, numbers, spaces, _, - only, max 20 chars)";
//     if (trimmedGuestName.toLowerCase() === loggedInUsername.toLowerCase()) return "Player 2 username must be different from yours";
//     if (!guestAvatar) return "Choose an avatar for Player 2 (Guest)";
//     return "✅ Ready to start! Choose your game above";
//   }, [guestName, userAvatar, guestAvatar, loggedInUsername]);

//   if (!isInitialized) {
//     return (
//       <div className="w-full min-h-screen text-white flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-lg">Loading game setup...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
//       {/* Back Button */}
//       <button
//         onClick={() => navigate("/lobby")}
//         className="absolute top-30 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
//       >
//         🔙 Back to Lobby
//       </button>

//       <h1 className="text-4xl font-bold text-center mb-6">
//         🏠 Local Quick Match Setup
//       </h1>

//       <div className="w-full max-w-4xl space-y-6">
//         {/* Player Setup Section */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
//           <h2 className="text-2xl font-bold mb-6 text-center">Setup Players & Avatars</h2>
          
//           <div className="flex flex-col lg:flex-row gap-8 items-center">
//             {/* Player 1 */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👤 Player 1 (You)</h3>
//               <p className="mb-4 text-lg">
//                 Username: <strong>{loggedInUsername}</strong>
//               </p>

//               <AvatarSelector
//                 avatar={userAvatar}
//                 onChooseAvatar={() => chooseAvatar("user")}
//                 borderColor="border-blue-400"
//                 buttonColor="bg-blue-600"
//                 buttonHoverColor="bg-blue-700"
//               />
//             </div>

//             {/* VS Separator */}
//             <div className="text-4xl font-bold text-yellow-400">VS</div>

//             {/* Player 2 - Guest */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

//               <input
//                 type="text"
//                 placeholder="Enter guest username"
//                 value={guestName}
//                 onChange={(e) => handleGuestNameChange(e.target.value)}
//                 className="mb-4 px-4 py-2 rounded text-pink-400 bg-gray-600 font-bold w-full max-w-sm text-center"
//                 maxLength={20}
//               />

//               {/* Validation hints */}
//               <div className="text-xs text-gray-400 mb-4 text-center max-w-sm">
//                 {guestName.trim() && !validatePlayerName(guestName.trim()) && (
//                   <p className="text-red-400">
//                     ❌ Only letters, numbers, spaces, underscores, and hyphens allowed (max 20 chars)
//                   </p>
//                 )}
//                 {guestName.trim() && validatePlayerName(guestName.trim()) && guestName.trim().toLowerCase() === loggedInUsername.toLowerCase() && (
//                   <p className="text-red-400">
//                     ❌ Must be different from your username
//                   </p>
//                 )}
//                 {guestName.trim() && validatePlayerName(guestName.trim()) && guestName.trim().toLowerCase() !== loggedInUsername.toLowerCase() && (
//                   <p className="text-green-400">
//                     ✅ Valid username!
//                   </p>
//                 )}
//               </div>

//               <AvatarSelector
//                 avatar={guestAvatar}
//                 onChooseAvatar={() => chooseAvatar("guest")}
//                 borderColor="border-pink-400"
//                 buttonColor="bg-pink-600"
//                 buttonHoverColor="bg-pink-700"
//                 placeholder="Choose an avatar below"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Game Selection Buttons */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
//           <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <button
//               onClick={() => startSpecificGame("pong")}
//               disabled={!canStartGame()}
//               className={`p-6 rounded-xl text-xl font-bold shadow-lg transition-all ${
//                 !canStartGame()
//                   ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                   : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
//               }`}
//             >
//               🏓 Start Ping Pong
//               {guestName.trim() && (
//                 <div className="text-base font-normal mt-2">vs {guestName.trim()}</div>
//               )}
//             </button>

//             <button
//               onClick={() => startSpecificGame("keyclash")}
//               disabled={!canStartGame()}
//               className={`p-6 rounded-xl text-xl font-bold shadow-lg transition-all ${
//                 !canStartGame()
//                   ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                   : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
//               }`}
//             >
//               ⌨️ Start Key Clash
//               {guestName.trim() && (
//                 <div className="text-base font-normal mt-2">vs {guestName.trim()}</div>
//               )}
//             </button>
//           </div>

//           {/* Dynamic status message */}
//           <div className="text-center mt-4">
//             <p className={`text-sm ${canStartGame() ? 'text-green-400' : 'text-gray-400'}`}>
//               {getValidationMessage()}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// frontend/src/pages/authorised/quickmatch_local.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatars } from "../../utils/lobbyApi";
import { AvatarSelector } from "../../components/shared/AvatarSelector";
import { 
  validatePlayerName, 
  getStoredAvatarData, 
  saveAvatarData, 
  getNextAvatar,
  cleanupGameStorage 
} from "../../shared/utils";
import { Avatar, AvatarData, GameType } from "../../shared/types";

export default function QuickmatchLocalPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const loggedInUsername = user?.username || "";
  
  // Check if user is currently in a game
  const [isInGame, setIsInGame] = useState(() => {
    const inGame = localStorage.getItem("userInGame");
    return inGame === "true";
  });
  
  // Guest player state
  const [guestName, setGuestName] = useState(() => {
    const saved = localStorage.getItem("quickmatch_guestName");
    return saved || "";
  });

  // Avatar state
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(() => 
    getStoredAvatarData("userAvatar")
  );
  
  const [guestAvatar, setGuestAvatar] = useState<AvatarData | null>(() => 
    getStoredAvatarData("quickmatch_guestAvatar")
  );

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

  // Guest name change handler
  const handleGuestNameChange = useCallback((newName: string) => {
    setGuestName(newName);
    
    if (newName.trim()) {
      localStorage.setItem("quickmatch_guestName", newName);
    } else {
      localStorage.removeItem("quickmatch_guestName");
    }
  }, []);

  // Avatar change handlers
  const handleUserAvatarChange = useCallback((newAvatar: AvatarData | null) => {
    setUserAvatar(newAvatar);
    saveAvatarData("userAvatar", newAvatar);
  }, []);

  const handleGuestAvatarChange = useCallback((newAvatar: AvatarData | null) => {
    setGuestAvatar(newAvatar);
    saveAvatarData("quickmatch_guestAvatar", newAvatar);
  }, []);

  // Initialize avatars and component
  useEffect(() => {
    if (isInitialized) return;
    
    const loadAvatars = async () => {
      try {
        const avatars = await getAvatars();
        setAvailableAvatars(avatars);
        
        if (!userAvatar && avatars.length > 0) {
          const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
          handleUserAvatarChange(defaultAvatar);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load avatars:", error);
        setIsInitialized(true);
      }
    };
    
    loadAvatars();
  }, [isInitialized, userAvatar, handleUserAvatarChange]);

  // Cleanup on mount and check game state
  useEffect(() => {
    cleanupGameStorage();
    
    // Check if user is currently in a game
    const userInGame = localStorage.getItem("userInGame");
    setIsInGame(userInGame === "true");
  }, []);

  // Socket setup for local games
  useEffect(() => {
    if (!isInitialized) return;
    
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
          navigate("/lobby");
        }
      });
    });

    socketRef.current.on("created_game", (gameId, game, mode) => {
      joinGame(gameId, game, mode);
    });

    socketRef.current.on("joined_game", (gameId, game, mode) => {
      console.log("joined_game event received:", { gameId, game, mode });
      
      // Mark user as in game
      localStorage.setItem("userInGame", "true");
      localStorage.setItem("currentGameId", gameId);
      
      socketRef.current?.disconnect();
      socketRef.current = null;
      const type = "1v1";
      
      const navigationState = {
        user: loggedInUsername,
        guest: guestName.trim(),
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
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isInitialized, user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar]);

  // Avatar selection
  const chooseAvatar = useCallback((target: "user" | "guest") => {
    const nextAvatar = getNextAvatar(
      availableAvatars, 
      target === "user" ? userAvatar : guestAvatar
    );
    
    if (nextAvatar) {
      if (target === "user") {
        handleUserAvatarChange(nextAvatar);
      } else {
        handleGuestAvatarChange(nextAvatar);
      }
    }
  }, [availableAvatars, userAvatar, guestAvatar, handleUserAvatarChange, handleGuestAvatarChange]);

  // Function to clear game state when game ends
  const clearGameState = useCallback(() => {
    localStorage.removeItem("userInGame");
    localStorage.removeItem("currentGameId");
    setIsInGame(false);
  }, []);

  // Function to check current game status
  const checkGameStatus = useCallback(() => {
    const userInGame = localStorage.getItem("userInGame");
    const currentGameId = localStorage.getItem("currentGameId");
    
    if (userInGame === "true" && currentGameId) {
      return { inGame: true, gameId: currentGameId };
    }
    return { inGame: false, gameId: null };
  }, []);

  // Validation
  const canStartGame = useCallback(() => {
    const trimmedGuestName = guestName.trim();
    const trimmedLoggedInUsername = loggedInUsername.trim();
    
    return (
      userAvatar && 
      guestAvatar && 
      trimmedGuestName.length > 0 && 
      validatePlayerName(trimmedGuestName) &&
      trimmedGuestName.toLowerCase() !== trimmedLoggedInUsername.toLowerCase()
    );
  }, [guestName, userAvatar, guestAvatar, loggedInUsername]);

  // Start game
  const startSpecificGame = useCallback((gameType: GameType) => {
    // Check if user is already in a game
    if (isInGame) {
      const currentGameId = localStorage.getItem("currentGameId");
      const confirm = window.confirm(
        `You are already in a game (${currentGameId}). Do you want to leave that game and start a new local game?`
      );
      if (!confirm) return;
      
      // Clear current game state
      localStorage.removeItem("userInGame");
      localStorage.removeItem("currentGameId");
      setIsInGame(false);
    }

    if (!canStartGame()) {
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
      
      return;
    }

    localStorage.setItem("gameType", gameType);
    socketRef.current?.emit("create_game", gameType, "local");
  }, [canStartGame, guestName, userAvatar, guestAvatar, loggedInUsername, isInGame]);

  const joinGame = (gameId: string, game: GameType, mode: "local") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

  // Validation message
  const getValidationMessage = useCallback(() => {
    if (isInGame) {
      const { gameId } = checkGameStatus();
      return `⚠️ Already in game (${gameId}). New games will end current game.`;
    }

    const trimmedGuestName = guestName.trim();
    
    if (!userAvatar) return "Please select an avatar for Player 1";
    if (!trimmedGuestName) return "Enter a username for Player 2 (Guest)";
    if (!validatePlayerName(trimmedGuestName)) return "Player 2 username must be valid (letters, numbers, spaces, _, - only, max 20 chars)";
    if (trimmedGuestName.toLowerCase() === loggedInUsername.toLowerCase()) return "Player 2 username must be different from yours";
    if (!guestAvatar) return "Choose an avatar for Player 2 (Guest)";
    return "✅ Ready to start! Choose your game above";
  }, [guestName, userAvatar, guestAvatar, loggedInUsername, isInGame, checkGameStatus]);

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
        className="absolute top-30 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
      >
        🔙 Back to Lobby
      </button>

      <h1 className="text-4xl font-bold text-center mb-6">
        🏠 Local Quick Match Setup
      </h1>

      <div className="w-full max-w-4xl space-y-6">
        {/* Player Setup Section */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Setup Players & Avatars</h2>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Player 1 */}
            <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2">👤 Player 1 (You)</h3>
              <p className="mb-4 text-lg">
                Username: <strong>{loggedInUsername}</strong>
              </p>

              <AvatarSelector
                avatar={userAvatar}
                onChooseAvatar={() => chooseAvatar("user")}
                borderColor="border-blue-400"
                buttonColor="bg-blue-600"
                buttonHoverColor="bg-blue-700"
              />
            </div>

            {/* VS Separator */}
            <div className="text-4xl font-bold text-yellow-400">VS</div>

            {/* Player 2 - Guest */}
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

              <AvatarSelector
                avatar={guestAvatar}
                onChooseAvatar={() => chooseAvatar("guest")}
                borderColor="border-pink-400"
                buttonColor="bg-pink-600"
                buttonHoverColor="bg-pink-700"
                placeholder="Choose an avatar below"
              />
            </div>
          </div>
        </div>

        {/* Game Selection Buttons */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game</h2>
          
          {/* Show warning if already in game */}
          {isInGame && (
            <div className="bg-red-900 border border-red-600 p-3 rounded-lg mb-4">
              <div className="text-center">
                <p className="text-red-200 font-medium">⚠️ You are already in a game!</p>
                <p className="text-red-300 text-sm mb-3">Starting a new local game will leave your current game.</p>
                <button
                  onClick={() => {
                    const confirm = window.confirm("Are you sure you want to leave your current game?");
                    if (confirm) {
                      clearGameState();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium"
                >
                  🚪 Leave Current Game
                </button>
              </div>
            </div>
          )}
          
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
              {guestName.trim() && (
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
              {guestName.trim() && (
                <div className="text-base font-normal mt-2">vs {guestName.trim()}</div>
              )}
            </button>
          </div>

          {/* Dynamic status message */}
          <div className="text-center mt-4">
            <p className={`text-sm ${
              isInGame 
                ? 'text-red-400' 
                : (canStartGame() ? 'text-green-400' : 'text-gray-400')
            }`}>
              {getValidationMessage()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}