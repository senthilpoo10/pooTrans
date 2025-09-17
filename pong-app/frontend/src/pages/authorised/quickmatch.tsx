// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";

// interface Player {
//   socketId: string;
//   name: string;
// }
// interface GameRoom {
//   id: string;
//   status: "waiting" | "in-progress" | "finished";  
//   players: { id: string, name: string }[];
// }

// export default function QuickmatchPage() {
//   const socketRef = useRef<Socket | null>(null);
//   const navigate = useNavigate();
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [pongGames, setPongGames] = useState<GameRoom[]>([]);
//   const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
//   const { user } = useAuth();
//   let name: string | null = null;
//   let playerId: string | null = null;

//   useEffect(() => {
//     socketRef.current = io("/quickmatch", {
//       path: "/socket.io",
//       transports: ["websocket"],
//       secure: true
//     });

//     socketRef.current.on("connect", () => {
//       if (user) {
//         name = user.name;
//         playerId = user.id;
//       }
//       socketRef.current?.emit("name", name, playerId, (res: { error: string }) => {
//         if (res.error) {
//           alert(res.error);
//           navigate("/lobby")
//         }
//       });
//     });

//     socketRef.current.on("lobby_update", (data) => {
//       setPlayers(data.players);
//       setPongGames(data.pongGames);
//       setKeyClashGames(data.keyClashGames)
//     });

//     socketRef.current.on("created_game", (gameId, game, mode) => {
//       joinGame(gameId, game, mode);
//     })

//     socketRef.current.on("joined_game", (gameId, game, mode) => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
// 	  const type = "1v1";
//       navigate(`/${game}/${mode}/${type}/${gameId}`, { state: { name: name } });
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [user]);

//   const createLocalPong = () => {
//     socketRef.current?.emit("create_game", "pong", "local");
//   };
//   const createRemotePong = () => {
//     socketRef.current?.emit("create_game", "pong", "remote");
//   };
//   const createLocalKeyClash = () => {
//     socketRef.current?.emit("create_game", "keyclash", "local");
//   };
//   const createRemoteKeyClash = () => {
//     socketRef.current?.emit("create_game", "keyclash", "remote");
//   };


//   const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
//     socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
//       if (res.error) alert(res.error);
//     });
//   };

//   return (
//     <div style={{ padding: "1rem" }}>
//       <h2>Players in Lobby ({players.length})</h2>
//       <ul>
//         {players.map(p => <li key={p.socketId}>{p.name}</li>)}
//       </ul>

//       <h2>Pong Games</h2>
//       <ul>
//         {pongGames.map(game => (
//           <li
//             key={game.id}
//             style={{
//               cursor: game.status === "waiting" ? "pointer" : "default",
//               padding: "0.5rem",
//               border: "1px solid #ccc",
//               margin: "0.5rem 0"
//             }}
//             onClick={() => {
//               if (game.status === "waiting") joinGame(game.id, "pong", "remote");
//             }}
//           >
//             <strong>Room-{game.id}</strong> — {game.players.length}/2 players  — {game.status}
//             <ul>
//               {game.players.map(p => <li key={p.id}>{p.name}</li>)}
//             </ul>
//           </li>
//         ))}
//         <ul>
//           <button onClick={createLocalPong}>Create New Local Pong Game</button>
//         </ul>
//         <ul>
//           <button onClick={createRemotePong}>Create New Remote Pong Game</button> 
//         </ul>
//       </ul>

//       <h2>Key Clash Games</h2>
//       <ul>
//         {keyClashGames.map(game => (
//           <li
//             key={game.id}
//             style={{
//               cursor: game.status === "waiting" ? "pointer" : "default",
//               padding: "0.5rem",
//               border: "1px solid #ccc",
//               margin: "0.5rem 0"
//             }}
//             onClick={() => {
//               if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
//             }}
//           >
//             <strong>Room-{game.id}</strong> — {game.players.length}/2 players — {game.status}
//             <ul>
//               {game.players.map(p => <li key={p.id}>{p.name}</li>)}
//             </ul>
//           </li>
//         ))}      
//         <ul>
//         <button onClick={createLocalKeyClash}>Create New Local Key Clash Game</button>
//         </ul>
//         <ul>
//           <button onClick={createRemoteKeyClash}>Create New Remote Key Clash Game</button> 
//         </ul>                     
//       </ul>
//     </div>
//   );
// }




import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { getLobbyProfile, getAvatars } from "../../utils/lobbyApi";

interface Player {
  socketId: string;
  name: string;
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

interface PlayerSetup {
  player1: {
    name: string;
    avatar: Avatar | null;
    isReady: boolean;
  };
  player2: {
    name: string;
    avatar: Avatar | null;
    isReady: boolean;
    isOnlineUser?: boolean;
    userId?: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  profilePic?: string;
  favAvatar?: string;
}

interface GameInvite {
  from: string;
  fromUserId: string;
  gameType: "pong" | "keyclash";
  inviteId: string;
}

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Existing state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // New flow state
  const [currentStep, setCurrentStep] = useState<"mode" | "setup" | "gameType" | "ready" | "waitingForResponse">("mode");
  const [selectedMode, setSelectedMode] = useState<"local" | "remote" | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash" | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
  const [playerSetup, setPlayerSetup] = useState<PlayerSetup>({
    player1: { name: "", avatar: null, isReady: false },
    player2: { name: "", avatar: null, isReady: false }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<GameInvite[]>([]);
  const [sentInvite, setSentInvite] = useState<string | null>(null);

  let name: string | null = null;
  let playerId: string | null = null;

  // Load user profile and avatars on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [profile, avatars] = await Promise.all([
          getLobbyProfile(),
          getAvatars()
        ]);
        
        setUserProfile(profile);
        setAvailableAvatars(avatars);
        
        // Set player 1 data from current user
        const userAvatar = avatars.find((avatar: Avatar) => avatar.id === profile.favAvatar);
        setPlayerSetup(prev => ({
          ...prev,
          player1: {
            name: profile.name,
            avatar: userAvatar || null,
            isReady: true
          }
        }));
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  // Existing socket setup + invite system
  useEffect(() => {
    socketRef.current = io("/quickmatch", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true
    });

    socketRef.current.on("connect", () => {
      if (user) {
        name = user.name;
        playerId = user.id;
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

    // Game invite system
    socketRef.current.on("game_invite_received", (invite: GameInvite) => {
      setPendingInvites(prev => [...prev, invite]);
    });

    socketRef.current.on("game_invite_accepted", ({ gameId, gameType, mode }) => {
      setSentInvite(null);
      joinGame(gameId, gameType, mode);
    });

    socketRef.current.on("game_invite_declined", ({ from }) => {
      setSentInvite(null);
      alert(`${from} declined your game invitation`);
    });

    socketRef.current.on("created_game", (gameId, game, mode) => {
      joinGame(gameId, game, mode);
    })

    socketRef.current.on("joined_game", (gameId, game, mode) => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      const type = "1v1";
      navigate(`/${game}/${mode}/${type}/${gameId}`, { state: { name: name } });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Mode selection handlers
  const handleModeSelect = (mode: "local" | "remote") => {
    setSelectedMode(mode);
    setCurrentStep("setup");
    
    if (mode === "remote") {
      // For remote, player 2 will be selected from online users
      setPlayerSetup(prev => ({
        ...prev,
        player2: { name: "", avatar: null, isReady: false, isOnlineUser: true }
      }));
    }
  };

  // Avatar selection handlers
  const handleAvatarSelect = (playerId: 'player1' | 'player2', avatar: Avatar) => {
    setPlayerSetup(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        avatar
      }
    }));
  };

  // Player 2 name change handler (for local mode)
  const handlePlayer2NameChange = (name: string) => {
    setPlayerSetup(prev => ({
      ...prev,
      player2: {
        ...prev.player2,
        name,
        isReady: name.trim().length > 0
      }
    }));
  };

  // Online user selection handler (for remote mode)
  const handleOnlineUserSelect = (selectedPlayer: Player) => {
    const defaultAvatar = availableAvatars[0]; // Default avatar for online user
    setPlayerSetup(prev => ({
      ...prev,
      player2: {
        name: selectedPlayer.name,
        avatar: defaultAvatar,
        isReady: true,
        isOnlineUser: true,
        userId: selectedPlayer.socketId
      }
    }));
  };

  // Send game invite
  const handleSendInvite = (gameType: "pong" | "keyclash") => {
    if (!playerSetup.player2.userId) return;
    
    const inviteId = Math.random().toString(36).substring(7);
    socketRef.current?.emit("send_game_invite", {
      to: playerSetup.player2.userId,
      toName: playerSetup.player2.name,
      gameType,
      inviteId
    });
    
    setSentInvite(playerSetup.player2.name);
    setSelectedGameType(gameType);
    setCurrentStep("waitingForResponse");
  };

  // Accept/decline invite handlers
  const handleAcceptInvite = (invite: GameInvite) => {
    socketRef.current?.emit("accept_game_invite", invite);
    setPendingInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId));
  };

  const handleDeclineInvite = (invite: GameInvite) => {
    socketRef.current?.emit("decline_game_invite", invite);
    setPendingInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId));
  };

  // Step progression handlers
  const handlePlayerSetupComplete = () => {
    if (selectedMode === "local" && isPlayerSetupComplete) {
      setCurrentStep("gameType");
    } else if (selectedMode === "remote" && playerSetup.player2.isReady) {
      setCurrentStep("gameType");
    }
  };

  const handleGameTypeSelect = (gameType: "pong" | "keyclash") => {
    setSelectedGameType(gameType);
    
    if (selectedMode === "local") {
      setCurrentStep("ready");
    } else {
      // For remote, send invite immediately
      handleSendInvite(gameType);
    }
  };

  const handleBackToMode = () => {
    setCurrentStep("mode");
    setSelectedMode(null);
    setPlayerSetup(prev => ({
      player1: prev.player1, // Keep player 1
      player2: { name: "", avatar: null, isReady: false } // Reset player 2
    }));
  };

  const handleBackToSetup = () => {
    setCurrentStep("setup");
    setSelectedGameType(null);
    setSentInvite(null);
  };

  const handleBackToGameType = () => {
    setCurrentStep("gameType");
  };

  // Game creation handlers
  const handleStartLocalGame = () => {
    if (!selectedGameType || !isPlayerSetupComplete) {
      alert("Please complete setup first!");
      return;
    }

    setIsLoading(true);
    
    if (selectedGameType === "pong") {
      createLocalPong();
    } else {
      createLocalKeyClash();
    }
  };

  const handleStartRemoteGame = () => {
    if (!selectedGameType) {
      alert("Please select a game type first!");
      return;
    }

    setIsLoading(true);

    if (selectedGameType === "pong") {
      createRemotePong();
    } else {
      createRemoteKeyClash();
    }
  };

  // Existing game creation functions
  const createLocalPong = () => {
    socketRef.current?.emit("create_game", "pong", "local");
  };
  
  const createRemotePong = () => {
    socketRef.current?.emit("create_game", "pong", "remote");
  };
  
  const createLocalKeyClash = () => {
    socketRef.current?.emit("create_game", "keyclash", "local");
  };
  
  const createRemoteKeyClash = () => {
    socketRef.current?.emit("create_game", "keyclash", "remote");
  };

  const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

  const isPlayerSetupComplete = playerSetup.player1.isReady && playerSetup.player2.isReady;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Quick Match</h1>
          <p className="text-gray-400">Set up your game and challenge opponents</p>
        </div>

        {/* Pending Invites Notification */}
        {pendingInvites.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">🎮 Game Invites ({pendingInvites.length})</h3>
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.inviteId} className="bg-blue-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invite.from} wants to play {invite.gameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Mode Selection */}
        {currentStep === "mode" && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Choose Game Mode</h2>
                  <p className="text-gray-300">Play locally with a friend or challenge someone online</p>
                  <div className="text-sm text-gray-300 mt-2">Step 1 of 4</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <button
                  onClick={() => handleModeSelect("local")}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-2xl font-bold mb-2">Local Game</h3>
                  <p className="text-green-200">Play with a friend on the same device</p>
                  <div className="mt-4 text-sm text-green-100">
                    • Two players, one device<br/>
                    • Shared keyboard controls<br/>
                    • Instant start
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect("remote")}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-6xl mb-4">🌐</div>
                  <h3 className="text-2xl font-bold mb-2">Online Game</h3>
                  <p className="text-blue-200">Challenge someone online</p>
                  <div className="mt-4 text-sm text-blue-100">
                    • Invite online players<br/>
                    • Separate devices<br/>
                    • Real-time multiplayer
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Player Setup */}
        {currentStep === "setup" && selectedMode && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Player Setup</h2>
                    <p className="text-gray-300">
                      {selectedMode === "local" ? "Configure local players" : "Select an online opponent"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-300">Step 2 of 4</div>
                    <button
                      onClick={handleBackToMode}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      ← Back to Mode
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Player 1 Card - Always current user */}
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-blue-400 text-2xl mr-2">👤</span>
                      <h3 className="text-xl font-bold text-white">You (Player 1)</h3>
                    </div>
                    <p className="text-blue-200 text-sm">Username: {playerSetup.player1.name}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-blue-400 overflow-hidden bg-white">
                      {playerSetup.player1.avatar ? (
                        <img
                          src={playerSetup.player1.avatar.imageUrl}
                          alt={playerSetup.player1.avatar.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <p className="text-blue-300 font-medium">
                      {playerSetup.player1.avatar?.name || "No Avatar Selected"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Choose Avatar:
                    </label>
                    <select
                      value={playerSetup.player1.avatar?.id || ""}
                      onChange={(e) => {
                        const avatar = availableAvatars.find(a => a.id === e.target.value);
                        if (avatar) handleAvatarSelect('player1', avatar);
                      }}
                      className="w-full bg-blue-800 border border-blue-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select Avatar...</option>
                      {availableAvatars.map((avatar) => (
                        <option key={avatar.id} value={avatar.id}>
                          {avatar.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Player 2 Card - Local or Online */}
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-purple-400 text-2xl mr-2">
                        {selectedMode === "local" ? "👥" : "🌐"}
                      </span>
                      <h3 className="text-xl font-bold text-white">
                        {selectedMode === "local" ? "Player 2" : "Online Opponent"}
                      </h3>
                    </div>

                    {selectedMode === "local" ? (
                      <input
                        type="text"
                        placeholder="Enter player 2 name..."
                        value={playerSetup.player2.name}
                        onChange={(e) => handlePlayer2NameChange(e.target.value)}
                        className="bg-purple-800 border border-purple-600 rounded-lg px-3 py-2 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                      />
                    ) : (
                      <div>
                        {playerSetup.player2.isReady ? (
                          <div className="bg-purple-800 border border-purple-600 rounded-lg px-3 py-2">
                            <p className="text-white">Selected: {playerSetup.player2.name}</p>
                            <button
                              onClick={() => setPlayerSetup(prev => ({ ...prev, player2: { name: "", avatar: null, isReady: false, isOnlineUser: true } }))}
                              className="text-purple-300 text-sm hover:text-purple-100 mt-1"
                            >
                              Change selection
                            </button>
                          </div>
                        ) : (
                          <p className="text-purple-200 text-sm">Select an online player below</p>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedMode === "local" && (
                    <>
                      <div className="text-center mb-4">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-purple-400 overflow-hidden bg-white">
                          {playerSetup.player2.avatar ? (
                            <img
                              src={playerSetup.player2.avatar.imageUrl}
                              alt={playerSetup.player2.avatar.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                              <span className="text-2xl">👤</span>
                            </div>
                          )}
                        </div>
                        <p className="text-purple-300 font-medium">
                          {playerSetup.player2.avatar?.name || "No Avatar Selected"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                          Choose Avatar:
                        </label>
                        <select
                          value={playerSetup.player2.avatar?.id || ""}
                          onChange={(e) => {
                            const avatar = availableAvatars.find(a => a.id === e.target.value);
                            if (avatar) handleAvatarSelect('player2', avatar);
                          }}
                          className="w-full bg-purple-800 border border-purple-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                          disabled={!playerSetup.player2.name.trim()}
                        >
                          <option value="">Select Avatar...</option>
                          {availableAvatars.map((avatar) => (
                            <option key={avatar.id} value={avatar.id}>
                              {avatar.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {selectedMode === "remote" && !playerSetup.player2.isReady && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Online Players:
                      </label>
                      {players.filter(p => p.socketId !== user?.id).map(player => (
                        <button
                          key={player.socketId}
                          onClick={() => handleOnlineUserSelect(player)}
                          className="w-full bg-purple-800 hover:bg-purple-700 border border-purple-600 rounded-lg px-3 py-2 text-left transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                            <span className="text-white">{player.name}</span>
                          </div>
                        </button>
                      ))}
                      {players.filter(p => p.socketId !== user?.id).length === 0 && (
                        <p className="text-purple-300 text-sm text-center py-4">
                          No other players online right now
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <div className="bg-gray-700 p-6">
                <div className="flex justify-center">
                  <button
                    onClick={handlePlayerSetupComplete}
                    disabled={selectedMode === "local" ? !isPlayerSetupComplete : !playerSetup.player2.isReady}
                    className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
                      (selectedMode === "local" ? isPlayerSetupComplete : playerSetup.player2.isReady)
                        ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continue to Game Selection →
                  </button>
                </div>
                
                {selectedMode === "local" && !isPlayerSetupComplete && (
                  <p className="text-center text-yellow-400 text-sm mt-3">
                    Please complete player setup to continue
                  </p>
                )}
                {selectedMode === "remote" && !playerSetup.player2.isReady && (
                  <p className="text-center text-yellow-400 text-sm mt-3">
                    Please select an online opponent to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Game Type Selection */}
        {currentStep === "gameType" && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Choose Game Type</h2>
                    <p className="text-gray-300">
                      {selectedMode === "local" 
                        ? `${playerSetup.player1.name} vs ${playerSetup.player2.name}` 
                        : `You vs ${playerSetup.player2.name} (online)`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-300">Step 3 of 4</div>
                    <button
                      onClick={handleBackToSetup}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      ← Back to Setup
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <button
                  onClick={() => handleGameTypeSelect("pong")}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-6xl mb-4">🏓</div>
                  <h3 className="text-2xl font-bold mb-2">Ping Pong</h3>
                  <p className="text-blue-200">Classic 3D ping pong action</p>
                  {selectedMode === "remote" && (
                    <p className="text-blue-100 text-sm mt-2">
                      Will send invite to {playerSetup.player2.name}
                    </p>
                  )}
                </button>

                <button
                  onClick={() => handleGameTypeSelect("keyclash")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-6xl mb-4">⌨️</div>
                  <h3 className="text-2xl font-bold mb-2">Key Clash</h3>
                  <p className="text-purple-200">Fast-paced keyboard battle</p>
                  {selectedMode === "remote" && (
                    <p className="text-purple-100 text-sm mt-2">
                      Will send invite to {playerSetup.player2.name}
                    </p>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4a: Ready to Start (Local) */}
        {currentStep === "ready" && selectedMode === "local" && selectedGameType && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Ready to Start!</h2>
                    <p className="text-gray-300">
                      {selectedGameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"} - Local Game
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-300">Step 4 of 4</div>
                    <button
                      onClick={handleBackToGameType}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      ← Back to Game Type
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4 text-center">Game Preview</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400 mx-auto mb-2">
                        {playerSetup.player1.avatar ? (
                          <img src={playerSetup.player1.avatar.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-500 flex items-center justify-center">👤</div>
                        )}
                      </div>
                      <p className="font-bold text-blue-400">{playerSetup.player1.name}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {selectedGameType === "pong" ? "🏓" : "⌨️"}
                      </div>
                      <p className="text-gray-300">VS</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400 mx-auto mb-2">
                        {playerSetup.player2.avatar ? (
                          <img src={playerSetup.player2.avatar.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-500 flex items-center justify-center">👤</div>
                        )}
                      </div>
                      <p className="font-bold text-purple-400">{playerSetup.player2.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleStartLocalGame}
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
                      !isLoading
                        ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Starting...' : 'Start Local Game 🚀'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4b: Waiting for Response (Remote) */}
        {currentStep === "waitingForResponse" && selectedMode === "remote" && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Invitation Sent!</h2>
                    <p className="text-gray-300">Waiting for {sentInvite} to respond...</p>
                  </div>
                  <button
                    onClick={handleBackToGameType}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    ← Cancel Invite
                  </button>
                </div>
              </div>

              <div className="p-6 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-bold mb-2">Invitation Pending</h3>
                <p className="text-gray-400 mb-6">
                  We've sent a {selectedGameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"} invite to {sentInvite}.
                  <br />
                  They will receive a notification and can accept or decline.
                </p>
                
                <div className="bg-gray-700 rounded-lg p-4 inline-block">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Waiting for response...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Lobby Information - Always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players in Lobby */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Players Online ({players.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.map(p => (
                <div key={p.socketId} className="bg-gray-700 px-3 py-2 rounded flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>{p.name}</span>
                  {p.socketId === user?.id && <span className="ml-2 text-blue-400 text-xs">(You)</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Pong Games */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">🏓 Pong Games</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pongGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    if (game.status === "waiting") joinGame(game.id, "pong", "remote");
                  }}
                  className={`p-3 rounded border ${
                    game.status === "waiting" 
                      ? "bg-green-900 border-green-600 cursor-pointer hover:bg-green-800" 
                      : "bg-gray-700 border-gray-600 cursor-default"
                  }`}
                >
                  <div className="text-sm font-medium">Room-{game.id}</div>
                  <div className="text-xs text-gray-400">
                    {game.players.length}/2 players • {game.status}
                  </div>
                  {game.players.length > 0 && (
                    <div className="text-xs mt-1">
                      {game.players.map(p => p.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}
              {pongGames.length === 0 && (
                <p className="text-gray-400 text-sm">No active games</p>
              )}
            </div>
          </div>

          {/* Key Clash Games */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">⌨️ Key Clash Games</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {keyClashGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
                  }}
                  className={`p-3 rounded border ${
                    game.status === "waiting" 
                      ? "bg-purple-900 border-purple-600 cursor-pointer hover:bg-purple-800" 
                      : "bg-gray-700 border-gray-600 cursor-default"
                  }`}
                >
                  <div className="text-sm font-medium">Room-{game.id}</div>
                  <div className="text-xs text-gray-400">
                    {game.players.length}/2 players • {game.status}
                  </div>
                  {game.players.length > 0 && (
                    <div className="text-xs mt-1">
                      {game.players.map(p => p.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}
              {keyClashGames.length === 0 && (
                <p className="text-gray-400 text-sm">No active games</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
