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
import { getAvatars } from "../../utils/lobbyApi";
import { startDuelGame } from "../../service";
import validator from "validator";

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

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Existing lobby state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // Get username from auth context
  const loggedInUsername = user?.username || user?.name || "";
  
  // Game selection state
  const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash">("pong");
  const [selectedMode, setSelectedMode] = useState<"local" | "remote">("local");
  const [selectedOpponent, setSelectedOpponent] = useState<OnlineUser | null>(null);
  
  // Initialize from localStorage
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem("guestName") || "";
  });

  const [userAvatar, setUserAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("userAvatar");
    return saved ? JSON.parse(saved) : null;
  });

  const [guestAvatar, setGuestAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("guestAvatar");
    return saved ? JSON.parse(saved) : null;
  });

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

  let name: string | null = null;
  let playerId: string | null = null;

  // Initialize user data
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const avatars = await getAvatars();
        setAvailableAvatars(avatars);
        
        if (!userAvatar && avatars.length > 0) {
          const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
          setUserAvatar(defaultAvatar);
          localStorage.setItem("userAvatar", JSON.stringify(defaultAvatar));
        }
      } catch (error) {
        console.error("Failed to load avatars:", error);
      }
    };
    loadAvatars();
  }, []);

  // Clean up on component mount
  useEffect(() => {
    localStorage.removeItem("points1");
    localStorage.removeItem("points2");
    localStorage.removeItem("points3");
    localStorage.removeItem("tournamentGuests");
    localStorage.removeItem("guestCount");
  }, []);

  // Save guestName to localStorage
  useEffect(() => {
    if (guestName) {
      localStorage.setItem("guestName", guestName);
    }
  }, [guestName]);

  // Socket setup for lobby
  useEffect(() => {
    socketRef.current = io("/quickmatch", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true
    });

    socketRef.current.on("connect", () => {
      if (user) {
        name = user.name || user.username;
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
    });

    socketRef.current.on("joined_game", (gameId, game, mode) => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      const type = "1v1";
      
      navigate(`/${game}/${mode}/${type}/${gameId}`, {
        state: {
          user: loggedInUsername,
          guest: guestName,
          userAvatar,
          guestAvatar,
          gameType: selectedGameType,
          fromQuickMatch: true
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar, selectedGameType]);

  // Avatar selection
  const chooseAvatar = (target: "user" | "guest") => {
    const currentIndex = target === "user" 
      ? availableAvatars.findIndex(a => a.id === userAvatar?.name) 
      : availableAvatars.findIndex(a => a.id === guestAvatar?.name);
    
    const nextIndex = (currentIndex + 1) % availableAvatars.length;
    const selectedAvatar = availableAvatars[nextIndex];
    
    if (selectedAvatar) {
      const avatarData = { name: selectedAvatar.id, image: selectedAvatar.imageUrl };
      
      if (target === "user") {
        setUserAvatar(avatarData);
        localStorage.setItem("userAvatar", JSON.stringify(avatarData));
      } else {
        setGuestAvatar(avatarData);
        localStorage.setItem("guestAvatar", JSON.stringify(avatarData));
      }
    }
  };

  // Start game handler
  const startGameHandler = () => {
    // Validation
    if (selectedMode === "local") {
      if (!validator.isAlphanumeric(guestName)) {
        return alert("Guest must select a valid username");
      }
      if (!userAvatar || !guestAvatar) {
        return alert("All players must select an avatar");
      }
      if (!guestName) {
        return alert("Guest must select a username");
      }
      if (guestName === loggedInUsername) {
        return alert("Guest and username can't be the same");
      }
    } else {
      // For remote games
      if (!userAvatar) {
        return alert("You must select an avatar");
      }
      if (!selectedOpponent) {
        return alert("Please select an opponent to play with");
      }
    }

    localStorage.setItem("gameType", selectedGameType);

    if (selectedMode === "local") {
      startDuelGame({
        user: loggedInUsername,
        userAvatar: userAvatar.name,
        guest: guestName,
        guestAvatar: guestAvatar?.name || "",
        gameType: selectedGameType,
      })
      .then(() => {
        socketRef.current?.emit("create_game", selectedGameType, selectedMode);
      })
      .catch((err) => alert(`Failed to start game: ${err.message}`));
    } else {
      // For remote games, create game and invite opponent
      socketRef.current?.emit("create_game", selectedGameType, selectedMode);
      // TODO: Add invite logic here when backend supports it
    }
  };

  const sendPlayRequest = (opponent: OnlineUser) => {
    setSelectedOpponent(opponent);
    // TODO: Implement actual invitation system
    alert(`Play request sent to ${opponent.name}! (Feature coming soon)`);
  };

  const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

  // Filter out current user from players list
  const otherPlayers = players.filter(p => p.name !== loggedInUsername);

  return (
    <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
      <button
        onClick={() => navigate("/lobby")}
        className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
      >
        🔙 Back to Lobby
      </button>

      <h1 className="text-4xl font-bold text-center mb-6">
        🎮 Quick Match Setup
      </h1>

      <div className="w-full max-w-4xl">
        {/* Game Type Selection */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Choose Game Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedGameType("pong")}
              className={`p-6 rounded-xl text-xl font-bold shadow-xl transition-all ${
                selectedGameType === "pong" 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-600 hover:bg-gray-500 text-gray-300"
              }`}
            >
              🏓 Ping Pong
            </button>

            <button
              onClick={() => setSelectedGameType("keyclash")}
              className={`p-6 rounded-xl text-xl font-bold shadow-xl transition-all ${
                selectedGameType === "keyclash" 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-600 hover:bg-gray-500 text-gray-300"
              }`}
            >
              ⌨️ Key Clash
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Choose Game Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setSelectedMode("local");
                setSelectedOpponent(null);
              }}
              className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
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
              className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
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

        {/* Player Setup Section - Shows for both local and remote */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {selectedMode === "local" ? "Choose Players & Avatars" : "Choose Your Opponent"}
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Player 1 - Always the same */}
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

            {/* Player 2 - Different based on mode */}
            <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
              {selectedMode === "local" ? (
                // Local Mode: Guest Player Input
                <>
                  <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

                  <input
                    type="text"
                    placeholder="Enter guest username"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="mb-4 px-4 py-2 rounded text-pink-400 font-bold w-full max-w-sm text-center"
                  />

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
                    <p className="mb-4 italic text-gray-400">No avatar selected</p>
                  )}

                  <button
                    onClick={() => chooseAvatar("guest")}
                    className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Choose Avatar
                  </button>
                </>
              ) : (
                // Remote Mode: Online Players List
                <>
                  <h3 className="text-2xl font-bold mb-4">🌐 Choose Opponent</h3>
                  
                  {selectedOpponent ? (
                    // Show selected opponent
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
                        {selectedOpponent.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-lg mb-2">{selectedOpponent.name}</p>
                      <p className="text-green-400 text-sm mb-4">Selected Opponent</p>
                      <button
                        onClick={() => setSelectedOpponent(null)}
                        className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                      >
                        Change Opponent
                      </button>
                    </div>
                  ) : (
                    // Show online players list
                    <div className="w-full">
                      <p className="text-center text-gray-400 mb-4">
                        Online Players ({otherPlayers.length})
                      </p>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {otherPlayers.length > 0 ? (
                          otherPlayers.map(player => (
                            <div key={player.socketId} className="flex items-center justify-between bg-gray-600 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                                  {player.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold">{player.name}</p>
                                  <p className="text-xs text-green-400">• Online</p>
                                </div>
                              </div>
                              <button
                                onClick={() => sendPlayRequest(player)}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium"
                              >
                                Invite to Play
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400 py-8">
                            <p className="text-4xl mb-2">👻</p>
                            <p>No other players online</p>
                            <p className="text-sm mt-1">Share the game with friends!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <div className="text-center">
            <button
              onClick={startGameHandler}
              disabled={selectedMode === "remote" && !selectedOpponent}
              className={`p-6 rounded-xl text-2xl font-bold shadow-xl transition-all ${
                selectedMode === "remote" && !selectedOpponent
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              }`}
            >
              🚀 Start {selectedGameType === "pong" ? "Ping Pong" : "Key Clash"} 
              {selectedMode === "remote" && selectedOpponent && (
                <div className="text-lg font-normal">vs {selectedOpponent.name}</div>
              )}
            </button>
          </div>
        </div>

        {/* Existing Games - Only show for remote mode */}
        {selectedMode === "remote" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pong Games */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">🏓 Available Pong Games</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pongGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.status === "waiting") joinGame(game.id, "pong", "remote");
                    }}
                    className={`p-3 rounded border cursor-pointer ${
                      game.status === "waiting" 
                        ? "bg-green-900 border-green-600 hover:bg-green-800" 
                        : "bg-gray-700 border-gray-600"
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
              <h3 className="text-xl font-semibold mb-4">⌨️ Available Key Clash Games</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {keyClashGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
                    }}
                    className={`p-3 rounded border cursor-pointer ${
                      game.status === "waiting" 
                        ? "bg-purple-900 border-purple-600 hover:bg-purple-800" 
                        : "bg-gray-700 border-gray-600"
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
        )}
      </div>
    </div>
  );
}
