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
import { startDuelGame } from "../../service";
import validator from "validator";

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

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Existing lobby state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // Player setup state (like friend's CustomazationPage)
  const [loggedInUsername, setLoggedInUsername] = useState("");
  
  // Initialize from localStorage (friend's approach)
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

  const [gameType, setGameType] = useState<string>(() => {
    const savedGameType = localStorage.getItem("gameType");
    return savedGameType ? savedGameType : "pong";
  });

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

  let name: string | null = null;
  let playerId: string | null = null;

  // Initialize user data (like friend's approach)
  useEffect(() => {
    const token = localStorage.getItem("ping-pong-jwt");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setLoggedInUsername(payload.username);
    }

    // Load avatars
    const loadAvatars = async () => {
      try {
        const avatars = await getAvatars();
        setAvailableAvatars(avatars);
        
        // Auto-select user avatar if not already selected
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

  // Clean up on component mount (like friend's approach)
  useEffect(() => {
    // Clean up old game data
    localStorage.removeItem("points1");
    localStorage.removeItem("points2");
    localStorage.removeItem("points3");
    localStorage.removeItem("tournamentGuests");
    localStorage.removeItem("guestCount");
  }, []);

  // Save guestName to localStorage (friend's approach)
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
    });

    // Navigation with complete state (friend's approach)
    socketRef.current.on("joined_game", (gameId, game, mode) => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      const type = "1v1";
      
      // Navigate with complete state like friend's approach
      navigate(`/${game}/${mode}/${type}/${gameId}`, {
        state: {
          user: loggedInUsername,
          guest: guestName,
          userAvatar,
          guestAvatar,
          gameType,
          fromQuickMatch: true
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar, gameType]);

  // Avatar selection (simplified)
  const chooseAvatar = (target: "user" | "guest") => {
    // For simplicity, cycle through available avatars
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

  // Start game handler (exactly like friend's approach)
  const startGameHandler = (selectedGameType: string, mode: "local" | "remote") => {
    // Validation (like friend's validation)
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

    // Set and save game type
    setGameType(selectedGameType);
    localStorage.setItem("gameType", selectedGameType);

    // Call database service FIRST (friend's approach)
    startDuelGame({
      user: loggedInUsername,
      userAvatar: userAvatar.name,
      guest: guestName,
      guestAvatar: guestAvatar.name,
      gameType: selectedGameType,
    })
    .then(() => {
      // Create game after saving to database
      if (selectedGameType === "pong") {
        socketRef.current?.emit("create_game", "pong", mode);
      } else {
        socketRef.current?.emit("create_game", "keyclash", mode);
      }
    })
    .catch((err) => alert(`Failed to start game: ${err.message}`));
  };

  const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

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
        {/* Player Setup Section (like friend's CustomazationPage) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Players & Avatars</h2>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Player 1 */}
            <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2">👤 Player 1</h3>
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

            {/* Player 2 (Guest) */}
            <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
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
            </div>
          </div>
        </div>

        {/* Game Selection (like friend's approach) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Game Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              className="bg-green-600 hover:bg-green-700 p-8 rounded-xl text-2xl font-bold shadow-xl"
              onClick={() => startGameHandler("pong", "local")}
            >
              🏓 Start Ping Pong
            </button>

            <button
              onClick={() => startGameHandler("keyclash", "local")}
              className="bg-purple-600 hover:bg-purple-700 p-8 rounded-xl text-2xl font-bold shadow-xl"
            >
              ⌨️ Start Key Clash
            </button>
          </div>
        </div>

        {/* Lobby Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Online */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Players Online ({players.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
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
            <h3 className="text-xl font-semibold mb-4">⌨️ Key Clash Games</h3>
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
      </div>
    </div>
  );
}
