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
  };
}

interface UserProfile {
  name: string;
  email: string;
  profilePic?: string;
  favAvatar?: string;
}

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Existing state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // New state for player setup
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash" | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
  const [playerSetup, setPlayerSetup] = useState<PlayerSetup>({
    player1: { name: "", avatar: null, isReady: false },
    player2: { name: "", avatar: null, isReady: false }
  });
  const [isLoading, setIsLoading] = useState(false);

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

  // Existing socket setup
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

  // Player 2 name change handler
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

  // Game creation handlers
  const handleGameTypeSelect = (gameType: "pong" | "keyclash") => {
    setSelectedGameType(gameType);
    setShowPlayerSetup(true);
  };

  const handleStartLocalGame = () => {
    if (!selectedGameType || !playerSetup.player1.isReady || !playerSetup.player2.isReady) {
      alert("Please complete player setup first!");
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

  const handleBackToGameSelection = () => {
    setShowPlayerSetup(false);
    setSelectedGameType(null);
    setPlayerSetup(prev => ({
      ...prev,
      player2: { name: "", avatar: null, isReady: false }
    }));
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

  const isSetupComplete = playerSetup.player1.isReady && playerSetup.player2.isReady;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Quick Match</h1>
          <p className="text-gray-400">Set up your game and challenge opponents</p>
        </div>

        {!showPlayerSetup ? (
          /* Game Type Selection */
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Choose Game Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => handleGameTypeSelect("pong")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                <div className="text-6xl mb-4">🏓</div>
                <h3 className="text-2xl font-bold mb-2">Ping Pong</h3>
                <p className="text-blue-200">Classic 3D ping pong action</p>
              </button>

              <button
                onClick={() => handleGameTypeSelect("keyclash")}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                <div className="text-6xl mb-4">⌨️</div>
                <h3 className="text-2xl font-bold mb-2">Key Clash</h3>
                <p className="text-purple-200">Fast-paced keyboard battle</p>
              </button>
            </div>
          </div>
        ) : (
          /* Player Setup Card */
          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Player Setup</h2>
                    <p className="text-gray-300">
                      {selectedGameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"} - Local Game
                    </p>
                  </div>
                  <button
                    onClick={handleBackToGameSelection}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              {/* Player Setup Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Player 1 Card */}
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-blue-400 text-2xl mr-2">👤</span>
                      <h3 className="text-xl font-bold text-white">Player 1</h3>
                    </div>
                    <p className="text-blue-200 text-sm">Username: {playerSetup.player1.name}</p>
                  </div>

                  {/* Player 1 Avatar */}
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

                  {/* Avatar Selection */}
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

                  <div className="mt-4 text-center">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-default">
                      Choose Color
                    </button>
                    <div className="mt-2">
                      <select 
                        className="bg-blue-700 text-white px-3 py-1 rounded"
                        defaultValue="blue"
                      >
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Player 2 Card */}
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-purple-400 text-2xl mr-2">👥</span>
                      <h3 className="text-xl font-bold text-white">Player 2</h3>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter player 2 name..."
                      value={playerSetup.player2.name}
                      onChange={(e) => handlePlayer2NameChange(e.target.value)}
                      className="bg-purple-800 border border-purple-600 rounded-lg px-3 py-2 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                    />
                  </div>

                  {/* Player 2 Avatar */}
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

                  {/* Avatar Selection */}
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

                  <div className="mt-4 text-center">
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg cursor-default">
                      Choose Color
                    </button>
                    <div className="mt-2">
                      <select 
                        className="bg-purple-700 text-white px-3 py-1 rounded"
                        defaultValue="orange"
                        disabled={!playerSetup.player2.name.trim()}
                      >
                        <option value="orange">Orange</option>
                        <option value="yellow">Yellow</option>
                        <option value="pink">Pink</option>
                        <option value="cyan">Cyan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-700 p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleStartLocalGame}
                    disabled={!isSetupComplete || isLoading}
                    className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
                      isSetupComplete && !isLoading
                        ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Starting...' : 'Start Local Game'}
                  </button>
                  
                  <button
                    onClick={handleStartRemoteGame}
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
                      !isLoading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Starting...' : 'Start Remote Game'}
                  </button>
                </div>
                
                {!isSetupComplete && (
                  <p className="text-center text-yellow-400 text-sm mt-3">
                    Please complete player setup to start local game
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Lobby Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players in Lobby */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Players Online ({players.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.map(p => (
                <div key={p.socketId} className="bg-gray-700 px-3 py-2 rounded flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>{p.name}</span>
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