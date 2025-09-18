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



// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";
// import { getLobbyProfile, getAvatars } from "../../utils/lobbyApi";
// import { startDuelGame } from "../../service";
// import validator from "validator";

// interface Player {
//   socketId: string;
//   name: string;
// }

// interface GameRoom {
//   id: string;
//   status: "waiting" | "in-progress" | "finished";  
//   players: { id: string, name: string }[];
// }

// interface Avatar {
//   id: string;
//   name: string;
//   imageUrl: string;
// }

// export default function QuickmatchPage() {
//   const socketRef = useRef<Socket | null>(null);
//   const navigate = useNavigate();
//   const { user } = useAuth();
  
//   // Existing lobby state
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [pongGames, setPongGames] = useState<GameRoom[]>([]);
//   const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
//   // Player setup state (like friend's CustomazationPage)
//   const [loggedInUsername, setLoggedInUsername] = useState("");
  
//   // Initialize from localStorage (friend's approach)
//   const [guestName, setGuestName] = useState(() => {
//     return localStorage.getItem("guestName") || "";
//   });

//   const [userAvatar, setUserAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("userAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [guestAvatar, setGuestAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("guestAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [gameType, setGameType] = useState<string>(() => {
//     const savedGameType = localStorage.getItem("gameType");
//     return savedGameType ? savedGameType : "pong";
//   });

//   const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

//   let name: string | null = null;
//   let playerId: string | null = null;

//   // Initialize user data (like friend's approach)
//   useEffect(() => {
//     const token = localStorage.getItem("ping-pong-jwt");
//     if (token) {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       setLoggedInUsername(payload.username);
//     }

//     // Load avatars
//     const loadAvatars = async () => {
//       try {
//         const avatars = await getAvatars();
//         setAvailableAvatars(avatars);
        
//         // Auto-select user avatar if not already selected
//         if (!userAvatar && avatars.length > 0) {
//           const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
//           setUserAvatar(defaultAvatar);
//           localStorage.setItem("userAvatar", JSON.stringify(defaultAvatar));
//         }
//       } catch (error) {
//         console.error("Failed to load avatars:", error);
//       }
//     };
//     loadAvatars();
//   }, []);

//   // Clean up on component mount (like friend's approach)
//   useEffect(() => {
//     // Clean up old game data
//     localStorage.removeItem("points1");
//     localStorage.removeItem("points2");
//     localStorage.removeItem("points3");
//     localStorage.removeItem("tournamentGuests");
//     localStorage.removeItem("guestCount");
//   }, []);

//   // Save guestName to localStorage (friend's approach)
//   useEffect(() => {
//     if (guestName) {
//       localStorage.setItem("guestName", guestName);
//     }
//   }, [guestName]);

//   // Socket setup for lobby
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
//     });

//     // Navigation with complete state (friend's approach)
//     socketRef.current.on("joined_game", (gameId, game, mode) => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//       const type = "1v1";
      
//       // Navigate with complete state like friend's approach
//       navigate(`/${game}/${mode}/${type}/${gameId}`, {
//         state: {
//           user: loggedInUsername,
//           guest: guestName,
//           userAvatar,
//           guestAvatar,
//           gameType,
//           fromQuickMatch: true
//         }
//       });
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar, gameType]);

//   // Avatar selection (simplified)
//   const chooseAvatar = (target: "user" | "guest") => {
//     // For simplicity, cycle through available avatars
//     const currentIndex = target === "user" 
//       ? availableAvatars.findIndex(a => a.id === userAvatar?.name) 
//       : availableAvatars.findIndex(a => a.id === guestAvatar?.name);
    
//     const nextIndex = (currentIndex + 1) % availableAvatars.length;
//     const selectedAvatar = availableAvatars[nextIndex];
    
//     if (selectedAvatar) {
//       const avatarData = { name: selectedAvatar.id, image: selectedAvatar.imageUrl };
      
//       if (target === "user") {
//         setUserAvatar(avatarData);
//         localStorage.setItem("userAvatar", JSON.stringify(avatarData));
//       } else {
//         setGuestAvatar(avatarData);
//         localStorage.setItem("guestAvatar", JSON.stringify(avatarData));
//       }
//     }
//   };

//   // Start game handler (exactly like friend's approach)
//   const startGameHandler = (selectedGameType: string, mode: "local" | "remote") => {
//     // Validation (like friend's validation)
//     if (!validator.isAlphanumeric(guestName)) {
//       return alert("Guest must select a valid username");
//     }

//     if (!userAvatar || !guestAvatar) {
//       return alert("All players must select an avatar");
//     }

//     if (!guestName) {
//       return alert("Guest must select a username");
//     }

//     if (guestName === loggedInUsername) {
//       return alert("Guest and username can't be the same");
//     }

//     // Set and save game type
//     setGameType(selectedGameType);
//     localStorage.setItem("gameType", selectedGameType);

//     // Call database service FIRST (friend's approach)
//     startDuelGame({
//       user: loggedInUsername,
//       userAvatar: userAvatar.name,
//       guest: guestName,
//       guestAvatar: guestAvatar.name,
//       gameType: selectedGameType,
//     })
//     .then(() => {
//       // Create game after saving to database
//       if (selectedGameType === "pong") {
//         socketRef.current?.emit("create_game", "pong", mode);
//       } else {
//         socketRef.current?.emit("create_game", "keyclash", mode);
//       }
//     })
//     .catch((err) => alert(`Failed to start game: ${err.message}`));
//   };

//   const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
//     socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
//       if (res.error) alert(res.error);
//     });
//   };

//   return (
//     <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
//       <button
//         onClick={() => navigate("/lobby")}
//         className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
//       >
//         🔙 Back to Lobby
//       </button>

//       <h1 className="text-4xl font-bold text-center mb-6">
//         🎮 Quick Match Setup
//       </h1>

//       <div className="w-full max-w-4xl">
//         {/* Player Setup Section (like friend's CustomazationPage) */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <h2 className="text-2xl font-bold mb-6 text-center">Choose Players & Avatars</h2>
          
//           <div className="flex flex-col lg:flex-row gap-8 items-center">
//             {/* Player 1 */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👤 Player 1</h3>
//               <p className="mb-4 text-lg">
//                 Username: <strong>{loggedInUsername}</strong>
//               </p>

//               {userAvatar ? (
//                 <>
//                   <img
//                     src={userAvatar.image}
//                     alt={userAvatar.name}
//                     className="w-32 h-32 rounded-full border-4 border-blue-400 mb-2 object-cover"
//                   />
//                   <p className="capitalize mb-4">{userAvatar.name}</p>
//                 </>
//               ) : (
//                 <p className="mb-4 italic text-gray-400">No avatar selected</p>
//               )}

//               <button
//                 onClick={() => chooseAvatar("user")}
//                 className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
//               >
//                 Choose Avatar
//               </button>
//             </div>

//             {/* VS Separator */}
//             <div className="text-4xl font-bold text-yellow-400">VS</div>

//             {/* Player 2 (Guest) */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

//               <input
//                 type="text"
//                 placeholder="Enter guest username"
//                 value={guestName}
//                 onChange={(e) => setGuestName(e.target.value)}
//                 className="mb-4 px-4 py-2 rounded text-pink-400 font-bold w-full max-w-sm text-center"
//               />

//               {guestAvatar ? (
//                 <>
//                   <img
//                     src={guestAvatar.image}
//                     alt={guestAvatar.name}
//                     className="w-32 h-32 rounded-full border-4 border-pink-400 mb-2 object-cover"
//                   />
//                   <p className="capitalize mb-4">{guestAvatar.name}</p>
//                 </>
//               ) : (
//                 <p className="mb-4 italic text-gray-400">No avatar selected</p>
//               )}

//               <button
//                 onClick={() => chooseAvatar("guest")}
//                 className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
//               >
//                 Choose Avatar
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Game Selection (like friend's approach) */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <h2 className="text-2xl font-bold mb-6 text-center">Choose Game Type</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <button
//               className="bg-green-600 hover:bg-green-700 p-8 rounded-xl text-2xl font-bold shadow-xl"
//               onClick={() => startGameHandler("pong", "local")}
//             >
//               🏓 Start Ping Pong
//             </button>

//             <button
//               onClick={() => startGameHandler("keyclash", "local")}
//               className="bg-purple-600 hover:bg-purple-700 p-8 rounded-xl text-2xl font-bold shadow-xl"
//             >
//               ⌨️ Start Key Clash
//             </button>
//           </div>
//         </div>

//         {/* Lobby Information */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Players Online */}
//           <div className="bg-gray-800 rounded-xl p-6">
//             <h3 className="text-xl font-semibold mb-4">Players Online ({players.length})</h3>
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {players.map(p => (
//                 <div key={p.socketId} className="bg-gray-700 px-3 py-2 rounded flex items-center">
//                   <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
//                   <span>{p.name}</span>
//                   {p.socketId === user?.id && <span className="ml-2 text-blue-400 text-xs">(You)</span>}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pong Games */}
//           <div className="bg-gray-800 rounded-xl p-6">
//             <h3 className="text-xl font-semibold mb-4">🏓 Pong Games</h3>
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {pongGames.map(game => (
//                 <div
//                   key={game.id}
//                   onClick={() => {
//                     if (game.status === "waiting") joinGame(game.id, "pong", "remote");
//                   }}
//                   className={`p-3 rounded border cursor-pointer ${
//                     game.status === "waiting" 
//                       ? "bg-green-900 border-green-600 hover:bg-green-800" 
//                       : "bg-gray-700 border-gray-600"
//                   }`}
//                 >
//                   <div className="text-sm font-medium">Room-{game.id}</div>
//                   <div className="text-xs text-gray-400">
//                     {game.players.length}/2 players • {game.status}
//                   </div>
//                   {game.players.length > 0 && (
//                     <div className="text-xs mt-1">
//                       {game.players.map(p => p.name).join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               {pongGames.length === 0 && (
//                 <p className="text-gray-400 text-sm">No active games</p>
//               )}
//             </div>
//           </div>

//           {/* Key Clash Games */}
//           <div className="bg-gray-800 rounded-xl p-6">
//             <h3 className="text-xl font-semibold mb-4">⌨️ Key Clash Games</h3>
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {keyClashGames.map(game => (
//                 <div
//                   key={game.id}
//                   onClick={() => {
//                     if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
//                   }}
//                   className={`p-3 rounded border cursor-pointer ${
//                     game.status === "waiting" 
//                       ? "bg-purple-900 border-purple-600 hover:bg-purple-800" 
//                       : "bg-gray-700 border-gray-600"
//                   }`}
//                 >
//                   <div className="text-sm font-medium">Room-{game.id}</div>
//                   <div className="text-xs text-gray-400">
//                     {game.players.length}/2 players • {game.status}
//                   </div>
//                   {game.players.length > 0 && (
//                     <div className="text-xs mt-1">
//                       {game.players.map(p => p.name).join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               {keyClashGames.length === 0 && (
//                 <p className="text-gray-400 text-sm">No active games</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";
// import { getAvatars } from "../../utils/lobbyApi";
// import { startDuelGame } from "../../service";
// import validator from "validator";

// interface Player {
//   socketId: string;
//   name: string;
// }

// interface OnlineUser {
//   socketId: string;
//   name: string;
//   status?: string;
// }

// interface GameRoom {
//   id: string;
//   status: "waiting" | "in-progress" | "finished";  
//   players: { id: string, name: string }[];
// }

// interface Avatar {
//   id: string;
//   name: string;
//   imageUrl: string;
// }

// // New interfaces for invitations
// interface GameInvitation {
//   invitationId: string;
//   from: string;
//   gameType: "pong" | "keyclash";
//   gameId: string;
// }

// interface SentInvitation {
//   invitationId: string;
//   to: string;
//   gameType: "pong" | "keyclash";
//   status: "pending" | "accepted" | "declined" | "expired";
// }

// export default function QuickmatchPage() {
//   const socketRef = useRef<Socket | null>(null);
//   const navigate = useNavigate();
//   const { user } = useAuth();
  
//   // Existing lobby state
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [pongGames, setPongGames] = useState<GameRoom[]>([]);
//   const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
//   // New invitation states
//   const [incomingInvitations, setIncomingInvitations] = useState<GameInvitation[]>([]);
//   const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
//   const [showInvitations, setShowInvitations] = useState(false);
  
//   // Get username from auth context
//   const loggedInUsername = user?.username || user?.name || "";
  
//   // Game selection state
//   const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash">("pong");
//   const [selectedMode, setSelectedMode] = useState<"local" | "remote">("local");
//   const [selectedOpponent, setSelectedOpponent] = useState<OnlineUser | null>(null);
  
//   // Initialize from localStorage
//   const [guestName, setGuestName] = useState(() => {
//     return localStorage.getItem("guestName") || "";
//   });

//   const [userAvatar, setUserAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("userAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [guestAvatar, setGuestAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("guestAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
//   const [message, setMessage] = useState("");

//   let name: string | null = null;
//   let playerId: string | null = null;

//   // Initialize user data
//   useEffect(() => {
//     const loadAvatars = async () => {
//       try {
//         const avatars = await getAvatars();
//         setAvailableAvatars(avatars);
        
//         if (!userAvatar && avatars.length > 0) {
//           const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
//           setUserAvatar(defaultAvatar);
//           localStorage.setItem("userAvatar", JSON.stringify(defaultAvatar));
//         }
//       } catch (error) {
//         console.error("Failed to load avatars:", error);
//       }
//     };
//     loadAvatars();
//   }, []);

//   // Clean up on component mount
//   useEffect(() => {
//     localStorage.removeItem("points1");
//     localStorage.removeItem("points2");
//     localStorage.removeItem("points3");
//     localStorage.removeItem("tournamentGuests");
//     localStorage.removeItem("guestCount");
//   }, []);

//   // Save guestName to localStorage
//   useEffect(() => {
//     if (guestName) {
//       localStorage.setItem("guestName", guestName);
//     }
//   }, [guestName]);

//   // Clear messages after 5 seconds
//   useEffect(() => {
//     if (message) {
//       const timer = setTimeout(() => setMessage(""), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [message]);

//   // Socket setup for lobby
//   useEffect(() => {
//     socketRef.current = io("/quickmatch", {
//       path: "/socket.io",
//       transports: ["websocket"],
//       secure: true
//     });

//     socketRef.current.on("connect", () => {
//       if (user) {
//         name = user.name || user.username;
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
//     });

//     socketRef.current.on("joined_game", (gameId, game, mode) => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//       const type = "1v1";
      
//       navigate(`/${game}/${mode}/${type}/${gameId}`, {
//         state: {
//           user: loggedInUsername,
//           guest: guestName,
//           userAvatar,
//           guestAvatar,
//           gameType: selectedGameType,
//           fromQuickMatch: true
//         }
//       });
//     });

//     // NEW: Invitation event handlers
//     socketRef.current.on("invitation_received", (invitation: GameInvitation) => {
//       setIncomingInvitations(prev => [...prev, invitation]);
//       setMessage(`🎮 Game invitation received from ${invitation.from}!`);
//       setShowInvitations(true);
//     });

//     socketRef.current.on("invitation_accepted", ({ by, gameId, gameType }) => {
//       setMessage(`✅ ${by} accepted your invitation!`);
//       setSentInvitations(prev => 
//         prev.map(inv => 
//           inv.invitationId === gameId ? { ...inv, status: "accepted" } : inv
//         )
//       );
//     });

//     socketRef.current.on("invitation_declined", ({ invitationId, by }) => {
//       setMessage(`❌ ${by} declined your invitation.`);
//       setSentInvitations(prev => 
//         prev.map(inv => 
//           inv.invitationId === invitationId ? { ...inv, status: "declined" } : inv
//         )
//       );
//     });

//     socketRef.current.on("invitation_expired", ({ invitationId, reason }) => {
//       if (reason === "timeout") {
//         setMessage("⏰ Invitation expired (30 seconds timeout)");
//       }
//       setSentInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
//       setIncomingInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
//     });

//     socketRef.current.on("invitation_cancelled", ({ invitationId, by, reason }) => {
//       if (reason === "player_disconnected") {
//         setMessage("⚠️ Invitation cancelled (player disconnected)");
//       } else {
//         setMessage(`🚫 ${by} cancelled the invitation.`);
//       }
//       setIncomingInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar, selectedGameType]);

//   // Avatar selection
//   const chooseAvatar = (target: "user" | "guest") => {
//     const currentIndex = target === "user" 
//       ? availableAvatars.findIndex(a => a.id === userAvatar?.name) 
//       : availableAvatars.findIndex(a => a.id === guestAvatar?.name);
    
//     const nextIndex = (currentIndex + 1) % availableAvatars.length;
//     const selectedAvatar = availableAvatars[nextIndex];
    
//     if (selectedAvatar) {
//       const avatarData = { name: selectedAvatar.id, image: selectedAvatar.imageUrl };
      
//       if (target === "user") {
//         setUserAvatar(avatarData);
//         localStorage.setItem("userAvatar", JSON.stringify(avatarData));
//       } else {
//         setGuestAvatar(avatarData);
//         localStorage.setItem("guestAvatar", JSON.stringify(avatarData));
//       }
//     }
//   };

//   // Start game handler
//   const startGameHandler = () => {
//     // Validation
//     if (selectedMode === "local") {
//       if (!validator.isAlphanumeric(guestName)) {
//         return alert("Guest must select a valid username");
//       }
//       if (!userAvatar || !guestAvatar) {
//         return alert("All players must select an avatar");
//       }
//       if (!guestName) {
//         return alert("Guest must select a username");
//       }
//       if (guestName === loggedInUsername) {
//         return alert("Guest and username can't be the same");
//       }
//     } else {
//       // For remote games
//       if (!userAvatar) {
//         return alert("You must select an avatar");
//       }
//       if (!selectedOpponent) {
//         return alert("Please select an opponent to play with");
//       }
//     }

//     localStorage.setItem("gameType", selectedGameType);

//     if (selectedMode === "local") {
//       startDuelGame({
//         user: loggedInUsername,
//         userAvatar: userAvatar.name,
//         guest: guestName,
//         guestAvatar: guestAvatar?.name || "",
//         gameType: selectedGameType,
//       })
//       .then(() => {
//         socketRef.current?.emit("create_game", selectedGameType, selectedMode);
//       })
//       .catch((err) => alert(`Failed to start game: ${err.message}`));
//     } else {
//       // For remote games, create game and invite opponent
//       socketRef.current?.emit("create_game", selectedGameType, selectedMode);
//     }
//   };

//   // NEW: Send invitation to player
//   const sendPlayRequest = (opponent: OnlineUser) => {
//     if (!socketRef.current) return;
    
//     socketRef.current.emit("send_invitation", opponent.socketId, selectedGameType, (response: any) => {
//       if (response.error) {
//         setMessage(`❌ ${response.error}`);
//       } else {
//         setMessage(`📤 Invitation sent to ${opponent.name}!`);
//         setSentInvitations(prev => [...prev, {
//           invitationId: response.invitationId,
//           to: opponent.name,
//           gameType: selectedGameType,
//           status: "pending"
//         }]);
//         setSelectedOpponent(opponent);
//       }
//     });
//   };

//   // NEW: Respond to invitation
//   const respondToInvitation = (invitationId: string, response: "accept" | "decline") => {
//     if (!socketRef.current) return;
    
//     socketRef.current.emit("respond_invitation", invitationId, response, (result: any) => {
//       if (result.error) {
//         setMessage(`❌ ${result.error}`);
//       } else {
//         setIncomingInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
//         if (response === "accept") {
//           setMessage("🎮 Joining game...");
//         } else {
//           setMessage("📝 Invitation declined.");
//         }
//       }
//     });
//   };

//   // NEW: Cancel sent invitation
//   const cancelInvitation = (invitationId: string) => {
//     if (!socketRef.current) return;
    
//     socketRef.current.emit("cancel_invitation", invitationId, (result: any) => {
//       if (result.error) {
//         setMessage(`❌ ${result.error}`);
//       } else {
//         setSentInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
//         setMessage("🚫 Invitation cancelled.");
//         setSelectedOpponent(null);
//       }
//     });
//   };

//   const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
//     socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
//       if (res.error) alert(res.error);
//     });
//   };

//   // Filter out current user from players list
//   const otherPlayers = players.filter(p => p.name !== loggedInUsername);

//   const totalInvitations = incomingInvitations.length + sentInvitations.filter(inv => inv.status === "pending").length;

//   return (
//     <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
//       <button
//         onClick={() => navigate("/lobby")}
//         className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
//       >
//         🔙 Back to Lobby
//       </button>

//       {/* NEW: Invitations toggle button */}
//       {totalInvitations > 0 && (
//         <button
//           onClick={() => setShowInvitations(!showInvitations)}
//           className="absolute top-6 right-6 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold shadow-md relative"
//         >
//           🎮 Invitations
//           {totalInvitations > 0 && (
//             <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
//               {totalInvitations}
//             </span>
//           )}
//         </button>
//       )}

//       <h1 className="text-4xl font-bold text-center mb-6">
//         🎮 Quick Match Setup
//       </h1>

//       {/* Message Display */}
//       {message && (
//         <div className="w-full max-w-4xl mb-4 p-3 bg-blue-900 border border-blue-600 text-blue-100 rounded-lg text-center">
//           {message}
//           <button 
//             onClick={() => setMessage("")} 
//             className="ml-2 text-blue-300 hover:text-blue-100 font-bold"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       {/* NEW: Invitations Panel */}
//       {showInvitations && (
//         <div className="w-full max-w-4xl mb-6 bg-gray-800 rounded-xl p-6 shadow-lg">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-2xl font-bold">🎮 Game Invitations</h2>
//             <button
//               onClick={() => setShowInvitations(false)}
//               className="text-gray-400 hover:text-white text-xl"
//             >
//               ×
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Incoming Invitations */}
//             <div>
//               <h3 className="text-lg font-semibold mb-3 text-green-300">📥 Incoming ({incomingInvitations.length})</h3>
//               <div className="space-y-2 max-h-60 overflow-y-auto">
//                 {incomingInvitations.length > 0 ? (
//                   incomingInvitations.map(invitation => (
//                     <div key={invitation.invitationId} className="bg-gray-700 p-4 rounded-lg">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="font-medium">{invitation.from}</p>
//                           <p className="text-sm text-gray-400">
//                             {invitation.gameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"}
//                           </p>
//                         </div>
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => respondToInvitation(invitation.invitationId, "accept")}
//                             className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
//                           >
//                             ✅ Accept
//                           </button>
//                           <button
//                             onClick={() => respondToInvitation(invitation.invitationId, "decline")}
//                             className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
//                           >
//                             ❌ Decline
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400 text-sm">No incoming invitations</p>
//                 )}
//               </div>
//             </div>

//             {/* Sent Invitations */}
//             <div>
//               <h3 className="text-lg font-semibold mb-3 text-yellow-300">📤 Sent ({sentInvitations.length})</h3>
//               <div className="space-y-2 max-h-60 overflow-y-auto">
//                 {sentInvitations.length > 0 ? (
//                   sentInvitations.map(invitation => (
//                     <div key={invitation.invitationId} className="bg-gray-700 p-4 rounded-lg">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="font-medium">{invitation.to}</p>
//                           <p className="text-sm text-gray-400">
//                             {invitation.gameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"}
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <span className={`px-2 py-1 rounded text-xs ${
//                             invitation.status === "pending" ? "bg-yellow-600" :
//                             invitation.status === "accepted" ? "bg-green-600" :
//                             invitation.status === "declined" ? "bg-red-600" :
//                             "bg-gray-600"
//                           }`}>
//                             {invitation.status === "pending" ? "⏳ Pending" :
//                              invitation.status === "accepted" ? "✅ Accepted" :
//                              invitation.status === "declined" ? "❌ Declined" :
//                              "⏰ Expired"}
//                           </span>
//                           {invitation.status === "pending" && (
//                             <button
//                               onClick={() => cancelInvitation(invitation.invitationId)}
//                               className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
//                             >
//                               🚫 Cancel
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400 text-sm">No sent invitations</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="w-full max-w-4xl">
//         {/* Game Type Selection */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
//           <h2 className="text-2xl font-bold mb-4 text-center">Choose Game Type</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <button
//               onClick={() => setSelectedGameType("pong")}
//               className={`p-6 rounded-xl text-xl font-bold shadow-xl transition-all ${
//                 selectedGameType === "pong" 
//                   ? "bg-green-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               🏓 Ping Pong
//             </button>

//             <button
//               onClick={() => setSelectedGameType("keyclash")}
//               className={`p-6 rounded-xl text-xl font-bold shadow-xl transition-all ${
//                 selectedGameType === "keyclash" 
//                   ? "bg-purple-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               ⌨️ Key Clash
//             </button>
//           </div>
//         </div>

//         {/* Mode Selection */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
//           <h2 className="text-2xl font-bold mb-4 text-center">Choose Game Mode</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <button
//               onClick={() => {
//                 setSelectedMode("local");
//                 setSelectedOpponent(null);
//               }}
//               className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
//                 selectedMode === "local" 
//                   ? "bg-blue-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               🏠 Local (Same Computer)<br/>
//               <span className="text-sm font-normal">Play with a friend on same device</span>
//             </button>

//             <button
//               onClick={() => {
//                 setSelectedMode("remote");
//                 setSelectedOpponent(null);
//               }}
//               className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
//                 selectedMode === "remote" 
//                   ? "bg-orange-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               🌐 Remote (Online)<br/>
//               <span className="text-sm font-normal">Play with others online</span>
//             </button>
//           </div>
//         </div>

//         {/* Player Setup Section - Shows for both local and remote */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <h2 className="text-2xl font-bold mb-6 text-center">
//             {selectedMode === "local" ? "Choose Players & Avatars" : "Choose Your Opponent"}
//           </h2>
          
//           <div className="flex flex-col lg:flex-row gap-8 items-center">
//             {/* Player 1 - Always the same */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👤 Player 1 (You)</h3>
//               <p className="mb-4 text-lg">
//                 Username: <strong>{loggedInUsername}</strong>
//               </p>

//               {userAvatar ? (
//                 <>
//                   <img
//                     src={userAvatar.image}
//                     alt={userAvatar.name}
//                     className="w-32 h-32 rounded-full border-4 border-blue-400 mb-2 object-cover"
//                   />
//                   <p className="capitalize mb-4">{userAvatar.name}</p>
//                 </>
//               ) : (
//                 <p className="mb-4 italic text-gray-400">No avatar selected</p>
//               )}

//               <button
//                 onClick={() => chooseAvatar("user")}
//                 className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
//               >
//                 Choose Avatar
//               </button>
//             </div>

//             {/* VS Separator */}
//             <div className="text-4xl font-bold text-yellow-400">VS</div>

//             {/* Player 2 - Different based on mode */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               {selectedMode === "local" ? (
//                 // Local Mode: Guest Player Input
//                 <>
//                   <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

//                   <input
//                     type="text"
//                     placeholder="Enter guest username"
//                     value={guestName}
//                     onChange={(e) => setGuestName(e.target.value)}
//                     className="mb-4 px-4 py-2 rounded text-pink-400 font-bold w-full max-w-sm text-center"
//                   />

//                   {guestAvatar ? (
//                     <>
//                       <img
//                         src={guestAvatar.image}
//                         alt={guestAvatar.name}
//                         className="w-32 h-32 rounded-full border-4 border-pink-400 mb-2 object-cover"
//                       />
//                       <p className="capitalize mb-4">{guestAvatar.name}</p>
//                     </>
//                   ) : (
//                     <p className="mb-4 italic text-gray-400">No avatar selected</p>
//                   )}

//                   <button
//                     onClick={() => chooseAvatar("guest")}
//                     className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
//                   >
//                     Choose Avatar
//                   </button>
//                 </>
//               ) : (
//                 // Remote Mode: Online Players List
//                 <>
//                   <h3 className="text-2xl font-bold mb-4">🌐 Choose Opponent</h3>
                  
//                   {selectedOpponent ? (
//                     // Show selected opponent
//                     <div className="text-center">
//                       <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
//                         {selectedOpponent.name.charAt(0).toUpperCase()}
//                       </div>
//                       <p className="font-bold text-lg mb-2">{selectedOpponent.name}</p>
//                       <p className="text-green-400 text-sm mb-4">Selected Opponent</p>
//                       <button
//                         onClick={() => setSelectedOpponent(null)}
//                         className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
//                       >
//                         Change Opponent
//                       </button>
//                     </div>
//                   ) : (
//                     // Show online players list
//                     <div className="w-full">
//                       <p className="text-center text-gray-400 mb-4">
//                         Online Players ({otherPlayers.length})
//                       </p>
                      
//                       <div className="max-h-60 overflow-y-auto space-y-2">
//                         {otherPlayers.length > 0 ? (
//                           otherPlayers.map(player => (
//                             <div key={player.socketId} className="flex items-center justify-between bg-gray-600 p-3 rounded-lg">
//                               <div className="flex items-center gap-3">
//                                 <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
//                                   {player.name.charAt(0).toUpperCase()}
//                                 </div>
//                                 <div>
//                                   <p className="font-semibold">{player.name}</p>
//                                   <p className="text-xs text-green-400">• Online</p>
//                                 </div>
//                               </div>
//                               <button
//                                 onClick={() => sendPlayRequest(player)}
//                                 className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium"
//                               >
//                                 🎮 Invite to Play
//                               </button>
//                             </div>
//                           ))
//                         ) : (
//                           <div className="text-center text-gray-400 py-8">
//                             <p className="text-4xl mb-2">👻</p>
//                             <p>No other players online</p>
//                             <p className="text-sm mt-1">Share the game with friends!</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Start Game Button */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <div className="text-center">
//             <button
//               onClick={startGameHandler}
//               disabled={selectedMode === "remote" && !selectedOpponent}
//               className={`p-6 rounded-xl text-2xl font-bold shadow-xl transition-all ${
//                 selectedMode === "remote" && !selectedOpponent
//                   ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                   : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
//               }`}
//             >
//               🚀 Start {selectedGameType === "pong" ? "Ping Pong" : "Key Clash"} 
//               {selectedMode === "remote" && selectedOpponent && (
//                 <div className="text-lg font-normal">vs {selectedOpponent.name}</div>
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Existing Games - Only show for remote mode */}
//         {selectedMode === "remote" && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Pong Games */}
//             <div className="bg-gray-800 rounded-xl p-6">
//               <h3 className="text-xl font-semibold mb-4">🏓 Available Pong Games</h3>
//               <div className="space-y-2 max-h-40 overflow-y-auto">
//                 {pongGames.map(game => (
//                   <div
//                     key={game.id}
//                     onClick={() => {
//                       if (game.status === "waiting") joinGame(game.id, "pong", "remote");
//                     }}
//                     className={`p-3 rounded border cursor-pointer ${
//                       game.status === "waiting" 
//                         ? "bg-green-900 border-green-600 hover:bg-green-800" 
//                         : "bg-gray-700 border-gray-600"
//                     }`}
//                   >
//                     <div className="text-sm font-medium">Room-{game.id}</div>
//                     <div className="text-xs text-gray-400">
//                       {game.players.length}/2 players • {game.status}
//                     </div>
//                     {game.players.length > 0 && (
//                       <div className="text-xs mt-1">
//                         {game.players.map(p => p.name).join(", ")}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//                 {pongGames.length === 0 && (
//                   <p className="text-gray-400 text-sm">No active games</p>
//                 )}
//               </div>
//             </div>

//             {/* Key Clash Games */}
//             <div className="bg-gray-800 rounded-xl p-6">
//               <h3 className="text-xl font-semibold mb-4">⌨️ Available Key Clash Games</h3>
//               <div className="space-y-2 max-h-40 overflow-y-auto">
//                 {keyClashGames.map(game => (
//                   <div
//                     key={game.id}
//                     onClick={() => {
//                       if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
//                     }}
//                     className={`p-3 rounded border cursor-pointer ${
//                       game.status === "waiting" 
//                         ? "bg-purple-900 border-purple-600 hover:bg-purple-800" 
//                         : "bg-gray-700 border-gray-600"
//                     }`}
//                   >
//                     <div className="text-sm font-medium">Room-{game.id}</div>
//                     <div className="text-xs text-gray-400">
//                       {game.players.length}/2 players • {game.status}
//                     </div>
//                     {game.players.length > 0 && (
//                       <div className="text-xs mt-1">
//                         {game.players.map(p => p.name).join(", ")}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//                 {keyClashGames.length === 0 && (
//                   <p className="text-gray-400 text-sm">No active games</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useAuth } from "../../contexts/AuthContext";
// import { getAvatars } from "../../utils/lobbyApi";
// import { startDuelGame } from "../../service";
// import validator from "validator";

// interface Player {
//   socketId: string;
//   name: string;
// }

// interface OnlineUser {
//   socketId: string;
//   name: string;
//   status?: string;
// }

// interface GameRoom {
//   id: string;
//   status: "waiting" | "in-progress" | "finished";  
//   players: { id: string, name: string }[];
// }

// interface Avatar {
//   id: string;
//   name: string;
//   imageUrl: string;
// }

// interface Invitation {
//   id: string;
//   from: { socketId: string; name: string };
//   gameType: "pong" | "keyclash";
//   message: string;
//   timestamp?: number;
// }

// interface SentInvitation {
//   id: string;
//   to: { socketId: string; name: string };
//   gameType: "pong" | "keyclash";
//   timestamp?: number; // Add timestamp for countdown
// }

// export default function QuickmatchPage() {
//   const socketRef = useRef<Socket | null>(null);
//   const navigate = useNavigate();
//   const { user } = useAuth();
  
//   // Existing lobby state
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [pongGames, setPongGames] = useState<GameRoom[]>([]);
//   const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
//   // Invitation state
//   const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
//   const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
//   const [showInvitationModal, setShowInvitationModal] = useState(false);
//   const [invitationMessage, setInvitationMessage] = useState("");
  
//   // Get username from auth context
//   const loggedInUsername = user?.username || "";
  
//   // Game selection state
//   const [selectedGameType, setSelectedGameType] = useState<"pong" | "keyclash">("pong");
//   const [selectedMode, setSelectedMode] = useState<"local" | "remote">("local");
//   const [selectedOpponent, setSelectedOpponent] = useState<OnlineUser | null>(null);
  
//   // Initialize from localStorage
//   const [guestName, setGuestName] = useState(() => {
//     return localStorage.getItem("guestName") || "";
//   });

//   const [userAvatar, setUserAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("userAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [guestAvatar, setGuestAvatar] = useState<{
//     name: string;
//     image: string;
//   } | null>(() => {
//     const saved = localStorage.getItem("guestAvatar");
//     return saved ? JSON.parse(saved) : null;
//   });

//   const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
//   const [invitationTimers, setInvitationTimers] = useState<Record<string, number>>({});

//   // Initialize user data
//   useEffect(() => {
//     const loadAvatars = async () => {
//       try {
//         const avatars = await getAvatars();
//         setAvailableAvatars(avatars);
        
//         if (!userAvatar && avatars.length > 0) {
//           const defaultAvatar = { name: avatars[0].id, image: avatars[0].imageUrl };
//           setUserAvatar(defaultAvatar);
//           localStorage.setItem("userAvatar", JSON.stringify(defaultAvatar));
//         }
//       } catch (error) {
//         console.error("Failed to load avatars:", error);
//       }
//     };
//     loadAvatars();
//   }, []);

//   // Clean up on component mount
//   useEffect(() => {
//     localStorage.removeItem("points1");
//     localStorage.removeItem("points2");
//     localStorage.removeItem("points3");
//     localStorage.removeItem("tournamentGuests");
//     localStorage.removeItem("guestCount");
//   }, []);

//   // Save guestName to localStorage
//   useEffect(() => {
//     if (guestName) {
//       localStorage.setItem("guestName", guestName);
//     }
//   }, [guestName]);

//   // Countdown timer for invitations with proper expiration handling
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setInvitationTimers(prev => {
//         const updated = { ...prev };
//         let hasExpired = false;
        
//         Object.keys(updated).forEach(invitationId => {
//           if (updated[invitationId] > 0) {
//             updated[invitationId] -= 1;
//             // Debug log every 10 seconds
//             if (updated[invitationId] % 10 === 0) {
//               console.log(`Invitation ${invitationId} timer: ${updated[invitationId]}s remaining`);
//             }
//           } else if (updated[invitationId] === 0) {
//             // Timer just reached 0 - handle expiration
//             hasExpired = true;
//             console.log(`Invitation ${invitationId} expired!`);
            
//             // Check if this is a sent or received invitation
//             const sentInvitation = sentInvitations.find(inv => inv.id === invitationId);
//             const receivedInvitation = receivedInvitations.find(inv => inv.id === invitationId);
            
//             if (sentInvitation) {
//               // Remove sent invitation and show notification
//               setSentInvitations(current => current.filter(inv => inv.id !== invitationId));
//               setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
//               setShowInvitationModal(true);
//               setTimeout(() => setShowInvitationModal(false), 3000);
//             }
            
//             if (receivedInvitation) {
//               // Remove received invitation and show notification  
//               setReceivedInvitations(current => current.filter(inv => inv.id !== invitationId));
//               setInvitationMessage("⏰ Game invitation expired");
//               setShowInvitationModal(true);
//               setTimeout(() => setShowInvitationModal(false), 3000);
//             }
            
//             delete updated[invitationId];
//           }
//         });
        
//         return updated;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [sentInvitations, receivedInvitations]);

//   // Debug logging for invitation states
//   useEffect(() => {
//     console.log("Sent invitations updated:", sentInvitations);
//   }, [sentInvitations]);

//   useEffect(() => {
//     console.log("Invitation timers updated:", invitationTimers);
//   }, [invitationTimers]);

//   // Socket setup for lobby and invitations
//   useEffect(() => {
//     // Declare variables inside the effect
//     let name: string | null = null;
//     let playerId: string | null = null;

//     socketRef.current = io("/quickmatch", {
//       path: "/socket.io",
//       transports: ["websocket"],
//       secure: true
//     });

//     socketRef.current.on("connect", () => {
//       // Initialize as null
//       name = null;
//       playerId = null;
      
//       if (user) {
//         // Use username since that's what's in the schema
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
//     });

//     // For local games only - remote games now use game_setup_complete flow
//     socketRef.current.on("joined_game", (gameId, game, mode) => {
//       // Only handle this for local games
//       if (selectedMode === "local") {
//         socketRef.current?.disconnect();
//         socketRef.current = null;
//         const type = "1v1";
        
//         navigate(`/${game}/${mode}/${type}/${gameId}`, {
//           state: {
//             user: loggedInUsername,
//             guest: guestName,
//             userAvatar,
//             guestAvatar,
//             gameType: selectedGameType,
//             fromQuickMatch: true
//           }
//         });
//       }
//       // Remote games are handled by game_setup_complete
//     });

//     // FIXED: Better handling of invitation_sent event
//     socketRef.current.on("invitation_sent", (data: {
//       id: string;
//       to: { socketId: string; name: string };
//       gameType: "pong" | "keyclash";
//     }) => {
//       console.log("Received invitation_sent:", data); // Debug log
      
//       setSentInvitations(prev => {
//         // Find and remove temporary invitation for the same recipient
//         const tempInvitation = prev.find(inv => 
//           inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-')
//         );
        
//         const filtered = prev.filter(inv => 
//           !(inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-'))
//         );
        
//         // Add the real invitation with timestamp
//         return [...filtered, {
//           id: data.id,
//           to: data.to,
//           gameType: data.gameType,
//           timestamp: Date.now()
//         }];
//       });

//       // Transfer timer from temp invitation to real invitation
//       setInvitationTimers(prev => {
//         const updated = { ...prev };
        
//         // Find the most recent temp invitation timer (there should typically only be one)
//         const tempIds = Object.keys(updated).filter(id => id.startsWith('temp-'));
//         const tempTimer = tempIds.length > 0 ? updated[tempIds[tempIds.length - 1]] : 120;
        
//         console.log(`Transferring timer from temp invitation (${tempTimer}s) to ${data.id}`);
        
//         // Remove all temp timers and add real timer
//         tempIds.forEach(tempId => delete updated[tempId]);
//         updated[data.id] = tempTimer;
        
//         return updated;
//       });
//     });

//     // Invitation event handlers
//     socketRef.current.on("invitation_received", (invitation: Invitation) => {
//       console.log("Received invitation_received:", invitation); // Debug log
//       setReceivedInvitations(prev => [...prev, invitation]);
      
//       // Start countdown timer for received invitation (2 minutes = 120 seconds)
//       setInvitationTimers(prev => {
//         console.log(`Starting timer for received invitation ${invitation.id}: 120 seconds`);
//         return {
//           ...prev,
//           [invitation.id]: 120
//         };
//       });
      
//       // Show a brief notification but don't keep the modal open
//       setInvitationMessage(`${invitation.from.name} invited you to play ${invitation.gameType}!`);
//       setShowInvitationModal(true);
      
//       // Auto-hide after 3 seconds
//       setTimeout(() => {
//         setShowInvitationModal(false);
//       }, 3000);
//     });

//     // Handle complete game setup (replaces invitation_accepted)
//     socketRef.current.on("game_setup_complete", (gameData: {
//       gameId: string;
//       gameType: string;
//       mode: string;
//       type: string;
//       yourRole: "sender" | "receiver";
//       yourSide: "left" | "right";
//       senderData: { name: string; socketId: string };
//       receiverData: { name: string; socketId: string };
//     }) => {
//       console.log("Game setup complete:", gameData);
      
//       // Clear invitations and timers
//       setReceivedInvitations([]);
//       setSentInvitations([]);
//       setInvitationTimers({});
      
//       // Prepare navigation state that matches what game components expect
//       let navigationState;
      
//       if (gameData.yourRole === "sender") {
//         // Sender: they are the user, opponent is guest
//         navigationState = {
//           user: gameData.senderData.name,
//           guest: gameData.receiverData.name,
//           userAvatar: userAvatar || { name: "default", image: "/avatars/av1.jpeg" },
//           guestAvatar: { name: "default", image: "/avatars/av2.jpeg" },
//           gameType: gameData.gameType,
//           mode: gameData.mode,
//           fromRemoteInvitation: true,
//           isRemote: true,
//           yourSide: gameData.yourSide
//         };
//       } else {
//         // Receiver: they are the user, sender is guest  
//         navigationState = {
//           user: gameData.receiverData.name,
//           guest: gameData.senderData.name,
//           userAvatar: { name: "default", image: "/avatars/av1.jpeg" },
//           guestAvatar: { name: "default", image: "/avatars/av2.jpeg" },
//           gameType: gameData.gameType,
//           mode: gameData.mode,
//           fromRemoteInvitation: true,
//           isRemote: true,
//           yourSide: gameData.yourSide
//         };
//       }
      
//       setInvitationMessage("Game starting...");
//       setShowInvitationModal(true);
      
//       // Navigate immediately with the complete state
//       setTimeout(() => {
//         socketRef.current?.disconnect();
//         socketRef.current = null;
        
//         navigate(`/${gameData.gameType}/${gameData.mode}/${gameData.type}/${gameData.gameId}`, {
//           state: navigationState
//         });
//       }, 1500);
//     });

//     socketRef.current.on("invitation_declined", (data: { id: string; by: string }) => {
//       console.log("Invitation declined:", data); // Debug log
//       setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
//       // Clean up timer
//       setInvitationTimers(prev => {
//         const updated = { ...prev };
//         delete updated[data.id];
//         return updated;
//       });
      
//       setInvitationMessage(`${data.by} declined your invitation.`);
//       setShowInvitationModal(true);
      
//       setTimeout(() => {
//         setShowInvitationModal(false);
//       }, 2000);
//     });

//     socketRef.current.on("invitation_expired", (data: { id: string }) => {
//       console.log("Invitation expired:", data); // Debug log
      
//       // Check if this was a sent invitation
//       const wasSentInvitation = sentInvitations.some(inv => inv.id === data.id);
      
//       setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
//       setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
//       // Clean up timer
//       setInvitationTimers(prev => {
//         const updated = { ...prev };
//         delete updated[data.id];
//         return updated;
//       });
      
//       // Show notification about expiration
//       if (wasSentInvitation) {
//         setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
//       } else {
//         setInvitationMessage("⏰ Game invitation expired");
//       }
//       setShowInvitationModal(true);
//       setTimeout(() => setShowInvitationModal(false), 3000);
//     });

//     socketRef.current.on("invitation_cancelled", (data: { id: string; reason?: string; by?: string }) => {
//       console.log("Invitation cancelled:", data); // Debug log
//       setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
//       if (data.reason) {
//         setInvitationMessage(`Invitation cancelled: ${data.reason}`);
//         setShowInvitationModal(true);
//         setTimeout(() => setShowInvitationModal(false), 2000);
//       }
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       socketRef.current = null;
//     };
//   }, [user, navigate]); // FIXED: Removed problematic dependencies

//   // FIXED: Optimistic UI update for better UX
//   const sendPlayRequest = (opponent: OnlineUser) => {
//     if (!socketRef.current) return;

//     // Optimistically update the UI immediately
//     const tempInvitation: SentInvitation = {
//       id: `temp-${Date.now()}`, // temporary ID
//       to: { socketId: opponent.socketId, name: opponent.name },
//       gameType: selectedGameType,
//       timestamp: Date.now()
//     };
    
//     // Add to sent invitations immediately for better UX
//     setSentInvitations(prev => [...prev, tempInvitation]);

//     // Start countdown timer immediately (2 minutes = 120 seconds)
//     setInvitationTimers(prev => {
//       console.log(`Starting timer for invitation ${tempInvitation.id}: 120 seconds`);
//       return {
//         ...prev,
//         [tempInvitation.id]: 120
//       };
//     });

//     socketRef.current.emit("send_invitation", opponent.socketId, selectedGameType, (response: any) => {
//       if (response.error) {
//         // Remove the optimistic update if there's an error
//         setSentInvitations(prev => prev.filter(inv => inv.id !== tempInvitation.id));
//         setInvitationTimers(prev => {
//           const updated = { ...prev };
//           delete updated[tempInvitation.id];
//           return updated;
//         });
//         alert(response.error);
//       } else {
//         // The invitation_sent event will handle the real update
//         setInvitationMessage(`Invitation sent to ${opponent.name}!`);
//         setShowInvitationModal(true);
//         setTimeout(() => setShowInvitationModal(false), 2000);
//       }
//     });
//   };

//   // Respond to invitation
//   const respondToInvitation = (invitationId: string, response: "accept" | "decline") => {
//     if (!socketRef.current) return;

//     socketRef.current.emit("respond_to_invitation", invitationId, response, (result: any) => {
//       if (result.error) {
//         alert(result.error);
//       } else {
//         setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
//         // Clean up timer
//         setInvitationTimers(prev => {
//           const updated = { ...prev };
//           delete updated[invitationId];
//           return updated;
//         });
        
//         if (response === "accept") {
//           setInvitationMessage("Preparing game...");
//         } else {
//           setInvitationMessage("Invitation declined.");
//         }
//         setShowInvitationModal(true);
//         setTimeout(() => setShowInvitationModal(false), 1500);
//       }
//     });
//   };

//   // Cancel sent invitation
//   const cancelInvitation = (invitationId: string) => {
//     if (!socketRef.current) return;

//     socketRef.current.emit("cancel_invitation", invitationId, (result: any) => {
//       if (result.error) {
//         alert(result.error);
//       } else {
//         setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
//         // Clean up timer
//         setInvitationTimers(prev => {
//           const updated = { ...prev };
//           delete updated[invitationId];
//           return updated;
//         });
//         setSelectedOpponent(null);
//         setInvitationMessage("Invitation cancelled.");
//         setShowInvitationModal(true);
//         setTimeout(() => setShowInvitationModal(false), 1500);
//       }
//     });
//   };

//   // Avatar selection
//   const chooseAvatar = (target: "user" | "guest") => {
//     const currentIndex = target === "user" 
//       ? availableAvatars.findIndex(a => a.id === userAvatar?.name) 
//       : availableAvatars.findIndex(a => a.id === guestAvatar?.name);
    
//     const nextIndex = (currentIndex + 1) % availableAvatars.length;
//     const selectedAvatar = availableAvatars[nextIndex];
    
//     if (selectedAvatar) {
//       const avatarData = { name: selectedAvatar.id, image: selectedAvatar.imageUrl };
      
//       if (target === "user") {
//         setUserAvatar(avatarData);
//         localStorage.setItem("userAvatar", JSON.stringify(avatarData));
//       } else {
//         setGuestAvatar(avatarData);
//         localStorage.setItem("guestAvatar", JSON.stringify(avatarData));
//       }
//     }
//   };

//   // Check if game can be started
//   const canStartGame = () => {
//     if (selectedMode === "local") {
//       // Local mode requirements
//       return (
//         userAvatar && 
//         guestAvatar && 
//         guestName.trim() && 
//         validator.isAlphanumeric(guestName) &&
//         guestName !== loggedInUsername
//       );
//     } else {
//       // Remote mode requirements  
//       return userAvatar && selectedOpponent;
//     }
//   };

//   // Start specific game type
//   const startSpecificGame = (gameType: "pong" | "keyclash") => {
//     if (!canStartGame()) {
//       if (selectedMode === "local") {
//         alert("Please set up both players with valid usernames and avatars");
//       } else {
//         alert("Please select an opponent and ensure you have an avatar");
//       }
//       return;
//     }

//     // Set the selected game type
//     setSelectedGameType(gameType);

//     // Store game type for backend
//     localStorage.setItem("gameType", gameType);

//     if (selectedMode === "local") {
//       // Local game: Start immediately
//       startDuelGame({
//         user: loggedInUsername,
//         userAvatar: userAvatar.name,
//         guest: guestName,
//         guestAvatar: guestAvatar?.name || "",
//         gameType: gameType,
//       })
//       .then(() => {
//         socketRef.current?.emit("create_game", gameType, selectedMode);
//       })
//       .catch((err) => alert(`Failed to start game: ${err.message}`));
//     } else {
//       // Remote game: Send invitation
//       if (selectedOpponent) {
//         sendPlayRequestForGame(selectedOpponent, gameType);
//       }
//     }
//   };

//   // Send invitation for specific game type
//   const sendPlayRequestForGame = (opponent: OnlineUser, gameType: "pong" | "keyclash") => {
//     if (!socketRef.current) return;

//     // Optimistically update the UI immediately
//     const tempInvitation: SentInvitation = {
//       id: `temp-${Date.now()}`,
//       to: { socketId: opponent.socketId, name: opponent.name },
//       gameType: gameType,
//       timestamp: Date.now()
//     };
    
//     setSentInvitations(prev => [...prev, tempInvitation]);

//     // Start countdown timer immediately (2 minutes = 120 seconds)
//     setInvitationTimers(prev => {
//       console.log(`Starting timer for invitation ${tempInvitation.id}: 120 seconds`);
//       return {
//         ...prev,
//         [tempInvitation.id]: 120
//       };
//     });

//     socketRef.current.emit("send_invitation", opponent.socketId, gameType, (response: any) => {
//       if (response.error) {
//         setSentInvitations(prev => prev.filter(inv => inv.id !== tempInvitation.id));
//         setInvitationTimers(prev => {
//           const updated = { ...prev };
//           delete updated[tempInvitation.id];
//           return updated;
//         });
//         alert(response.error);
//       } else {
//         setInvitationMessage(`Invitation sent to ${opponent.name}!`);
//         setShowInvitationModal(true);
//         setTimeout(() => setShowInvitationModal(false), 2000);
//       }
//     });
//   };

//   const joinGame = (gameId: string, game: "pong" | "keyclash", mode: "local" | "remote") => {
//     socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
//       if (res.error) alert(res.error);
//     });
//   };

//   // Filter out current user from players list
//   const otherPlayers = players.filter(p => p.name !== loggedInUsername);

//   return (
//     <div className="w-full min-h-screen text-white p-8 flex flex-col items-center">
//       {/* Back Button */}
//       <button
//         onClick={() => navigate("/lobby")}
//         className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
//       >
//         🔙 Back to Lobby
//       </button>

//       {/* Invitation Notification Modal */}
//       {showInvitationModal && (
//         <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
//           <p>{invitationMessage}</p>
//         </div>
//       )}

//       {/* Pending Invitations Badge - Only count received invitations */}
//       {receivedInvitations.length > 0 && (
//         <div className="fixed top-6 right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-40">
//           {receivedInvitations.length}
//         </div>
//       )}

//       {/* Received Invitations Panel - REMOVED, moved to player cards */}

//       {/* Sent Invitations Panel - REMOVED as per user request */}

//       <h1 className="text-4xl font-bold text-center mb-6">
//         🎮 Quick Match Setup
//       </h1>

//       <div className="w-full max-w-4xl">
//         {/* 1. Game Mode Selection - FIRST */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
//           <h2 className="text-2xl font-bold mb-4 text-center">1️⃣ Choose Game Mode</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <button
//               onClick={() => {
//                 setSelectedMode("local");
//                 setSelectedOpponent(null);
//               }}
//               className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
//                 selectedMode === "local" 
//                   ? "bg-blue-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               🏠 Local (Same Computer)<br/>
//               <span className="text-sm font-normal">Play with a friend on same device</span>
//             </button>

//             <button
//               onClick={() => {
//                 setSelectedMode("remote");
//                 setSelectedOpponent(null);
//               }}
//               className={`p-4 rounded-xl font-bold shadow-xl transition-all ${
//                 selectedMode === "remote" 
//                   ? "bg-orange-600 text-white" 
//                   : "bg-gray-600 hover:bg-gray-500 text-gray-300"
//               }`}
//             >
//               🌐 Remote (Online)<br/>
//               <span className="text-sm font-normal">Play with others online</span>
//             </button>
//           </div>
//         </div>

//         {/* 2. Player Setup Section - SECOND */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
//           <h2 className="text-2xl font-bold mb-6 text-center">
//             2️⃣ {selectedMode === "local" ? "Setup Players & Avatars" : "Choose Your Opponent"}
//           </h2>
          
//           <div className="flex flex-col lg:flex-row gap-8 items-center">
//             {/* Player 1 - Always the same */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               <h3 className="text-2xl font-bold mb-2">👤 Player 1 (You)</h3>
//               <p className="mb-4 text-lg">
//                 Username: <strong>{loggedInUsername}</strong>
//               </p>

//               {userAvatar ? (
//                 <>
//                   <img
//                     src={userAvatar.image}
//                     alt={userAvatar.name}
//                     className="w-32 h-32 rounded-full border-4 border-blue-400 mb-2 object-cover"
//                   />
//                   <p className="capitalize mb-4">{userAvatar.name}</p>
//                 </>
//               ) : (
//                 <p className="mb-4 italic text-gray-400">No avatar selected</p>
//               )}

//               <button
//                 onClick={() => chooseAvatar("user")}
//                 className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
//               >
//                 Choose Avatar
//               </button>
//             </div>

//             {/* VS Separator */}
//             <div className="text-4xl font-bold text-yellow-400">VS</div>

//             {/* Player 2 - Different based on mode */}
//             <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
//               {selectedMode === "local" ? (
//                 // Local Mode: Guest Player Input
//                 <>
//                   <h3 className="text-2xl font-bold mb-2">👥 Player 2 (Guest)</h3>

//                   <input
//                     type="text"
//                     placeholder="Enter guest username"
//                     value={guestName}
//                     onChange={(e) => setGuestName(e.target.value)}
//                     className="mb-4 px-4 py-2 rounded text-pink-400 font-bold w-full max-w-sm text-center"
//                   />

//                   {guestAvatar ? (
//                     <>
//                       <img
//                         src={guestAvatar.image}
//                         alt={guestAvatar.name}
//                         className="w-32 h-32 rounded-full border-4 border-pink-400 mb-2 object-cover"
//                       />
//                       <p className="capitalize mb-4">{guestAvatar.name}</p>
//                     </>
//                   ) : (
//                     <p className="mb-4 italic text-gray-400">No avatar selected</p>
//                   )}

//                   <button
//                     onClick={() => chooseAvatar("guest")}
//                     className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold"
//                   >
//                     Choose Avatar
//                   </button>
//                 </>
//               ) : (
//                 // Remote Mode: Online Players List
//                 <>
//                   <h3 className="text-2xl font-bold mb-4">🌐 Choose Opponent</h3>
                  
//                   {selectedOpponent ? (
//                     // Show selected opponent
//                     <div className="text-center">
//                       <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
//                         {selectedOpponent.name.charAt(0).toUpperCase()}
//                       </div>
//                       <p className="font-bold text-lg mb-2">{selectedOpponent.name}</p>
//                       <p className="text-green-400 text-sm mb-4">Selected Opponent</p>
//                       <button
//                         onClick={() => setSelectedOpponent(null)}
//                         className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
//                       >
//                         Change Opponent
//                       </button>
//                     </div>
//                   ) : (
//                     // Show online players list
//                     <div className="w-full">
//                       <p className="text-center text-gray-400 mb-4">
//                         Online Players ({otherPlayers.length})
//                       </p>
                      
//                       <div className="max-h-60 overflow-y-auto space-y-2">
//                         {otherPlayers.length > 0 ? (
//                           otherPlayers.map(player => {
//                             // Check if we have sent an invitation to this player
//                             const sentInvitation = sentInvitations.find(inv => inv.to.socketId === player.socketId);
//                             // Check if we have received an invitation from this player  
//                             const receivedInvitation = receivedInvitations.find(inv => inv.from.socketId === player.socketId);
                            
//                             return (
//                               <div key={player.socketId} className="flex items-center justify-between bg-gray-600 p-3 rounded-lg">
//                                 <div className="flex items-center gap-3">
//                                   <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
//                                     {player.name.charAt(0).toUpperCase()}
//                                   </div>
//                                   <div>
//                                     <p className="font-semibold">{player.name}</p>
//                                     <p className="text-xs text-green-400">• Online</p>
//                                     {receivedInvitation && (
//                                       <p className="text-xs text-blue-400">• Wants to play {receivedInvitation.gameType}!</p>
//                                     )}
//                                   </div>
//                                 </div>
                                
//                                 <div className="flex flex-col gap-1">
//                                   {receivedInvitation ? (
//                                     // Show accept/decline buttons for received invitations with countdown
//                                     <div>
//                                       <div className={`flex gap-2 mb-1 ${
//                                         invitationTimers[receivedInvitation.id] <= 30 ? 'animate-pulse' : ''
//                                       }`}>
//                                         <button
//                                           onClick={() => respondToInvitation(receivedInvitation.id, "accept")}
//                                           className={`px-3 py-1 rounded text-sm font-medium ${
//                                             invitationTimers[receivedInvitation.id] <= 30 
//                                               ? 'bg-green-700 hover:bg-green-800 text-white' 
//                                               : 'bg-green-600 hover:bg-green-700 text-white'
//                                           }`}
//                                         >
//                                           ✅ Accept
//                                         </button>
//                                         <button
//                                           onClick={() => respondToInvitation(receivedInvitation.id, "decline")}
//                                           className={`px-3 py-1 rounded text-sm font-medium ${
//                                             invitationTimers[receivedInvitation.id] <= 30 
//                                               ? 'bg-red-700 hover:bg-red-800 text-white' 
//                                               : 'bg-red-600 hover:bg-red-700 text-white'
//                                           }`}
//                                         >
//                                           ❌ Decline
//                                         </button>
//                                       </div>
//                                       {invitationTimers[receivedInvitation.id] !== undefined && invitationTimers[receivedInvitation.id] >= 0 && (
//                                         <div className="text-center">
//                                           <span className={`text-xs ${
//                                             invitationTimers[receivedInvitation.id] <= 30 ? 'text-red-300 animate-pulse' : 'text-blue-300'
//                                           }`}>
//                                             Expires in {Math.floor(invitationTimers[receivedInvitation.id] / 60)}:{String(invitationTimers[receivedInvitation.id] % 60).padStart(2, '0')}
//                                           </span>
//                                         </div>
//                                       )}
//                                     </div>
//                                   ) : sentInvitation ? (
//                                     // Show pending status for sent invitations with countdown
//                                     <div className="flex items-center gap-2">
//                                       <div className="text-center">
//                                         <span className={`px-3 py-1 rounded text-sm font-medium block ${
//                                           invitationTimers[sentInvitation.id] <= 30 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500 text-black'
//                                         }`}>
//                                           Pending
//                                         </span>
//                                         {invitationTimers[sentInvitation.id] !== undefined && invitationTimers[sentInvitation.id] >= 0 && (
//                                           <span className={`text-xs mt-1 block ${
//                                             invitationTimers[sentInvitation.id] <= 30 ? 'text-red-300 animate-pulse' : 'text-yellow-300'
//                                           }`}>
//                                             {Math.floor(invitationTimers[sentInvitation.id] / 60)}:{String(invitationTimers[sentInvitation.id] % 60).padStart(2, '0')}
//                                           </span>
//                                         )}
//                                       </div>
//                                       <button
//                                         onClick={() => cancelInvitation(sentInvitation.id)}
//                                         className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
//                                       >
//                                         Cancel
//                                       </button>
//                                     </div>
//                                   ) : (
//                                     // Show invite button for players with no invitations
//                                     <button
//                                       onClick={() => sendPlayRequest(player)}
//                                       className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium"
//                                     >
//                                       Invite to Play
//                                     </button>
//                                   )}
//                                 </div>
//                               </div>
//                             );
//                           })
//                         ) : (
//                           <div className="text-center text-gray-400 py-8">
//                             <p className="text-4xl mb-2">👻</p>
//                             <p>No other players online</p>
//                             <p className="text-sm mt-1">Share the game with friends!</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* 3. Game Selection Buttons - THIRD */}
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <h2 className="text-2xl font-bold mb-6 text-center">3️⃣ Choose Your Game</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Ping Pong Button */}
//             <button
//               onClick={() => startSpecificGame("pong")}
//               disabled={!canStartGame()}
//               className={`p-8 rounded-xl text-2xl font-bold shadow-xl transition-all ${
//                 !canStartGame()
//                   ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                   : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
//               }`}
//             >
//               🏓 Start Ping Pong
//               {selectedMode === "remote" && selectedOpponent && (
//                 <div className="text-lg font-normal mt-2">vs {selectedOpponent.name}</div>
//               )}
//               {selectedMode === "local" && guestName && (
//                 <div className="text-lg font-normal mt-2">vs {guestName}</div>
//               )}
//             </button>

//             {/* Key Clash Button */}
//             <button
//               onClick={() => startSpecificGame("keyclash")}
//               disabled={!canStartGame()}
//               className={`p-8 rounded-xl text-2xl font-bold shadow-xl transition-all ${
//                 !canStartGame()
//                   ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                   : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
//               }`}
//             >
//               ⌨️ Start Key Clash
//               {selectedMode === "remote" && selectedOpponent && (
//                 <div className="text-lg font-normal mt-2">vs {selectedOpponent.name}</div>
//               )}
//               {selectedMode === "local" && guestName && (
//                 <div className="text-lg font-normal mt-2">vs {guestName}</div>
//               )}
//             </button>
//           </div>

//           {/* Status Message */}
//           <div className="text-center mt-4">
//             {!canStartGame() && (
//               <p className="text-gray-400 text-sm">
//                 {selectedMode === "local" 
//                   ? "Please set up both players and their avatars to start playing"
//                   : "Please select an opponent to start playing"
//                 }
//               </p>
//             )}
//             {canStartGame() && (
//               <p className="text-green-400 text-sm">
//                 ✅ Ready to start! Choose your game above
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Existing Games - Only show for remote mode at bottom if needed */}
//         {selectedMode === "remote" && (pongGames.length > 0 || keyClashGames.length > 0) && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Quick Join Games - Alternative way to join without invitations */}
//             {pongGames.length > 0 && (
//               <div className="bg-gray-800 rounded-xl p-6">
//                 <h3 className="text-xl font-semibold mb-4">🏓 Quick Join Pong Games</h3>
//                 <p className="text-sm text-gray-400 mb-3">Join games without invitations</p>
//                 <div className="space-y-2 max-h-32 overflow-y-auto">
//                   {pongGames.map(game => (
//                     <div
//                       key={game.id}
//                       onClick={() => {
//                         if (game.status === "waiting") joinGame(game.id, "pong", "remote");
//                       }}
//                       className={`p-3 rounded border cursor-pointer ${
//                         game.status === "waiting" 
//                           ? "bg-green-900 border-green-600 hover:bg-green-800" 
//                           : "bg-gray-700 border-gray-600"
//                       }`}
//                     >
//                       <div className="text-sm font-medium">Room-{game.id}</div>
//                       <div className="text-xs text-gray-400">
//                         {game.players.length}/2 players • {game.status}
//                       </div>
//                       {game.players.length > 0 && (
//                         <div className="text-xs mt-1">
//                           {game.players.map(p => p.name).join(", ")}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {keyClashGames.length > 0 && (
//               <div className="bg-gray-800 rounded-xl p-6">
//                 <h3 className="text-xl font-semibold mb-4">⌨️ Quick Join Key Clash Games</h3>
//                 <p className="text-sm text-gray-400 mb-3">Join games without invitations</p>
//                 <div className="space-y-2 max-h-32 overflow-y-auto">
//                   {keyClashGames.map(game => (
//                     <div
//                       key={game.id}
//                       onClick={() => {
//                         if (game.status === "waiting") joinGame(game.id, "keyclash", "remote");
//                       }}
//                       className={`p-3 rounded border cursor-pointer ${
//                         game.status === "waiting" 
//                           ? "bg-purple-900 border-purple-600 hover:bg-purple-800" 
//                           : "bg-gray-700 border-gray-600"
//                       }`}
//                     >
//                       <div className="text-sm font-medium">Room-{game.id}</div>
//                       <div className="text-xs text-gray-400">
//                         {game.players.length}/2 players • {game.status}
//                       </div>
//                       {game.players.length > 0 && (
//                         <div className="text-xs mt-1">
//                           {game.players.map(p => p.name).join(", ")}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }









import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatars } from "../../utils/lobbyApi";
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

export default function QuickmatchPage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
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

  // NEW: Add opponent avatar for remote mode
  const [opponentAvatar, setOpponentAvatar] = useState<{
    name: string;
    image: string;
  } | null>(() => {
    const saved = localStorage.getItem("opponentAvatar");
    return saved ? JSON.parse(saved) : null;
  });

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
  const [invitationTimers, setInvitationTimers] = useState<Record<string, number>>({});

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

        // Set default opponent avatar if not set
        if (!opponentAvatar && avatars.length > 1) {
          const defaultOpponentAvatar = { name: avatars[1].id, image: avatars[1].imageUrl };
          setOpponentAvatar(defaultOpponentAvatar);
          localStorage.setItem("opponentAvatar", JSON.stringify(defaultOpponentAvatar));
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

  // Save states to localStorage
  useEffect(() => {
    if (guestName) {
      localStorage.setItem("guestName", guestName);
    }
  }, [guestName]);

  useEffect(() => {
    if (opponentAvatar) {
      localStorage.setItem("opponentAvatar", JSON.stringify(opponentAvatar));
    }
  }, [opponentAvatar]);

  // Debug logging for invitation states
  useEffect(() => {
    console.log("Sent invitations updated:", sentInvitations);
  }, [sentInvitations]);

  useEffect(() => {
    console.log("Received invitations updated:", receivedInvitations);
  }, [receivedInvitations]);

  useEffect(() => {
    console.log("Invitation timers updated:", invitationTimers);
  }, [invitationTimers]);

  // Countdown timer for invitations with proper expiration handling
  useEffect(() => {
    const interval = setInterval(() => {
      setInvitationTimers(prev => {
        const updated = { ...prev };
        let hasExpired = false;
        
        Object.keys(updated).forEach(invitationId => {
          if (updated[invitationId] > 0) {
            updated[invitationId] -= 1;
            // Debug log every 10 seconds
            if (updated[invitationId] % 10 === 0) {
              console.log(`Invitation ${invitationId} timer: ${updated[invitationId]}s remaining`);
            }
          } else if (updated[invitationId] === 0) {
            // Timer just reached 0 - handle expiration
            hasExpired = true;
            console.log(`Invitation ${invitationId} expired!`);
            
            // Check if this is a sent or received invitation
            const sentInvitation = sentInvitations.find(inv => inv.id === invitationId);
            const receivedInvitation = receivedInvitations.find(inv => inv.id === invitationId);
            
            if (sentInvitation) {
              // Remove sent invitation and show notification
              setSentInvitations(current => current.filter(inv => inv.id !== invitationId));
              setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
              setShowInvitationModal(true);
              setTimeout(() => setShowInvitationModal(false), 3000);
            }
            
            if (receivedInvitation) {
              // Remove received invitation and show notification  
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
  console.log("joined_game event received:", { gameId, game, mode, selectedMode }); // Debug log
  
  // Only handle this for local games - remote games should use game_setup_complete flow
  if (selectedMode === "local") {
    console.log("Handling local game join"); // Debug log
    socketRef.current?.disconnect();
    socketRef.current = null;
    const type = "1v1";
    
    // Create comprehensive navigation state for local games
    const navigationState = {
      user: loggedInUsername,
      guest: guestName,
      userAvatar,
      guestAvatar,
      gameType: game,          // ← Changed from selectedGameType to game
      mode: mode,              // ← Added mode
      type: type,              // ← Added type
      fromQuickMatch: true,
      isLocal: true,           // ← Added isLocal flag
      gameId: gameId           // ← Added gameId
    };
    
    console.log("Navigating to local game with state:", navigationState);
    
    navigate(`/${game}/${mode}/${type}/${gameId}`, {
      state: navigationState
    });
  } else {
    console.log("Ignoring joined_game for remote mode - waiting for game_setup_complete"); // Debug log
    // For remote games, we should wait for game_setup_complete instead
  }
});

    // FIXED: Better handling of invitation_sent event
    socketRef.current.on("invitation_sent", (data: {
      id: string;
      to: { socketId: string; name: string };
      gameType: "pong" | "keyclash";
    }) => {
      console.log("Received invitation_sent:", data); // Debug log
      
      setSentInvitations(prev => {
        // Find and remove temporary invitation for the same recipient
        const tempInvitation = prev.find(inv => 
          inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-')
        );
        
        const filtered = prev.filter(inv => 
          !(inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-'))
        );
        
        // Add the real invitation with timestamp
        return [...filtered, {
          id: data.id,
          to: data.to,
          gameType: data.gameType,
          timestamp: Date.now()
        }];
      });

      // Transfer timer from temp invitation to real invitation
      setInvitationTimers(prev => {
        const updated = { ...prev };
        
        // Find the most recent temp invitation timer (there should typically only be one)
        const tempIds = Object.keys(updated).filter(id => id.startsWith('temp-'));
        const tempTimer = tempIds.length > 0 ? updated[tempIds[tempIds.length - 1]] : 120;
        
        console.log(`Transferring timer from temp invitation (${tempTimer}s) to ${data.id}`);
        
        // Remove all temp timers and add real timer
        tempIds.forEach(tempId => delete updated[tempId]);
        updated[data.id] = tempTimer;
        
        return updated;
      });
    });

    socketRef.current.on("invitation_received", (invitation: Invitation) => {
      console.log("Received invitation_received:", invitation); // Debug log
      setReceivedInvitations(prev => [...prev, invitation]);
      
      // Start countdown timer for received invitation (2 minutes = 120 seconds)
      setInvitationTimers(prev => {
        console.log(`Starting timer for received invitation ${invitation.id}: 120 seconds`);
        return {
          ...prev,
          [invitation.id]: 120
        };
      });
      
      // Show a brief notification but don't keep the modal open
      setInvitationMessage(`${invitation.from.name} invited you to play ${invitation.gameType}!`);
      setShowInvitationModal(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowInvitationModal(false);
      }, 3000);
    });

    // Handle complete game setup (replaces invitation_accepted)
    socketRef.current.on("game_setup_complete", (gameData: {
      gameId: string;
      gameType: string;
      mode: string;
      type: string;
      yourRole: "sender" | "receiver";
      yourSide: "left" | "right";
      senderData: { name: string; socketId: string };
      receiverData: { name: string; socketId: string };
    }) => {
      console.log("Game setup complete received:", gameData); // Debug log
      
      // Clear all invitations and timers immediately
      setReceivedInvitations([]);
      setSentInvitations([]);
      setInvitationTimers({});
      
      let navigationState;
      
      if (gameData.yourRole === "sender") {
        // Sender: they are the user, opponent is guest
        navigationState = {
          user: gameData.senderData.name,
          guest: gameData.receiverData.name,
          userAvatar: userAvatar || { name: "default", image: "/avatars/av1.jpeg" },
          guestAvatar: opponentAvatar || { name: "default", image: "/avatars/av2.jpeg" },
          gameType: gameData.gameType,
          mode: gameData.mode,
          fromRemoteInvitation: true,
          isRemote: true,
          yourSide: gameData.yourSide
        };
      } else {
        // Receiver: they are the user, sender is guest  
        navigationState = {
          user: gameData.receiverData.name,
          guest: gameData.senderData.name,
          userAvatar: userAvatar || { name: "default", image: "/avatars/av1.jpeg" },
          guestAvatar: opponentAvatar || { name: "default", image: "/avatars/av2.jpeg" },
          gameType: gameData.gameType,
          mode: gameData.mode,
          fromRemoteInvitation: true,
          isRemote: true,
          yourSide: gameData.yourSide
        };
      }
      
      console.log("Navigation state prepared:", navigationState); // Debug log
      
      setInvitationMessage("Game starting...");
      setShowInvitationModal(true);
      
      // Navigate immediately with the complete state
      setTimeout(() => {
        console.log("Navigating to game..."); // Debug log
        socketRef.current?.disconnect();
        socketRef.current = null;
        
        navigate(`/${gameData.gameType}/${gameData.mode}/${gameData.type}/${gameData.gameId}`, {
          state: navigationState
        });
      }, 1000); // Reduced delay for faster navigation
    });

    socketRef.current.on("invitation_declined", (data: { id: string; by: string }) => {
      console.log("Invitation declined:", data); // Debug log
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
      // Clean up timer
      setInvitationTimers(prev => {
        const updated = { ...prev };
        delete updated[data.id];
        return updated;
      });
      
      setInvitationMessage(`${data.by} declined your invitation.`);
      setShowInvitationModal(true);
      setTimeout(() => setShowInvitationModal(false), 2000);
    });

    socketRef.current.on("invitation_expired", (data: { id: string }) => {
      console.log("Invitation expired from server:", data); // Debug log
      
      // Check if this was a sent invitation
      const wasSentInvitation = sentInvitations.some(inv => inv.id === data.id);
      
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
      // Clean up timer
      setInvitationTimers(prev => {
        const updated = { ...prev };
        delete updated[data.id];
        return updated;
      });
      
      // Show notification about expiration
      if (wasSentInvitation) {
        setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
      } else {
        setInvitationMessage("⏰ Game invitation expired");
      }
      setShowInvitationModal(true);
      setTimeout(() => setShowInvitationModal(false), 3000);
    });

    socketRef.current.on("invitation_cancelled", (data: { id: string; reason?: string; by?: string }) => {
      console.log("Invitation cancelled:", data); // Debug log
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
      if (data.reason) {
        setInvitationMessage(`Invitation cancelled: ${data.reason}`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 2000);
      }
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate]); // FIXED: Removed problematic dependencies

  // FIXED: Send invitation function
  const sendPlayRequest = (opponent: OnlineUser) => {
    if (!socketRef.current) return;

    console.log("sendPlayRequest called for:", opponent.name, "gameType:", selectedGameType); // Debug log

    // Optimistically update the UI immediately
    const tempInvitation: SentInvitation = {
      id: `temp-${Date.now()}`, // temporary ID
      to: { socketId: opponent.socketId, name: opponent.name },
      gameType: selectedGameType,
      timestamp: Date.now()
    };
    
    // Add to sent invitations immediately for better UX
    setSentInvitations(prev => [...prev, tempInvitation]);

    // Start countdown timer immediately (2 minutes = 120 seconds)
    setInvitationTimers(prev => {
      console.log(`Starting timer for invitation ${tempInvitation.id}: 120 seconds`);
      return {
        ...prev,
        [tempInvitation.id]: 120
      };
    });

    socketRef.current.emit("send_invitation", opponent.socketId, selectedGameType, (response: any) => {
      console.log("send_invitation response:", response); // Debug log
      
      if (response.error) {
        // Remove the optimistic update if there's an error
        setSentInvitations(prev => prev.filter(inv => inv.id !== tempInvitation.id));
        setInvitationTimers(prev => {
          const updated = { ...prev };
          delete updated[tempInvitation.id];
          return updated;
        });
        alert(response.error);
      } else {
        // The invitation_sent event will handle the real update
        setInvitationMessage(`Invitation sent to ${opponent.name}!`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 2000);
      }
    });
  };

  // Respond to invitation
  const respondToInvitation = (invitationId: string, response: "accept" | "decline") => {
    if (!socketRef.current) return;

    console.log("=== RESPOND TO INVITATION START ===");
    console.log("Invitation ID:", invitationId);
    console.log("Response:", response);
    console.log("Current states:", {
      userAvatar: !!userAvatar,
      opponentAvatar: !!opponentAvatar,
      selectedOpponent: !!selectedOpponent,
      selectedMode,
      selectedGameType
    });

    socketRef.current.emit("respond_to_invitation", invitationId, response, (result: any) => {
      console.log("Response result:", result);
      
      if (result.error) {
        console.log("Error in response:", result.error);
        alert(result.error);
      } else {
        console.log("Successfully responded to invitation");
        
        // Clean up invitation immediately
        setReceivedInvitations(prev => {
          const filtered = prev.filter(inv => inv.id !== invitationId);
          console.log("Received invitations after cleanup:", filtered.length);
          return filtered;
        });
        
        setInvitationTimers(prev => {
          const updated = { ...prev };
          delete updated[invitationId];
          console.log("Timers after cleanup:", Object.keys(updated).length);
          return updated;
        });
        
        if (response === "accept") {
          console.log("Invitation accepted - waiting for game_setup_complete...");
          setInvitationMessage("Preparing game...");
          setShowInvitationModal(true);
          // Don't auto-hide for accept - let game_setup_complete handle it
        } else {
          console.log("Invitation declined");
          setInvitationMessage("Invitation declined.");
          setShowInvitationModal(true);
          setTimeout(() => setShowInvitationModal(false), 1500);
        }
      }
      console.log("=== RESPOND TO INVITATION END ===");
    });
  };

  // Cancel sent invitation
  const cancelInvitation = (invitationId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit("cancel_invitation", invitationId, (result: any) => {
      if (result.error) {
        alert(result.error);
      } else {
        setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        setInvitationTimers(prev => {
          const updated = { ...prev };
          delete updated[invitationId];
          return updated;
        });
        setSelectedOpponent(null);
        setInvitationMessage("Invitation cancelled.");
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 1500);
      }
    });
  };

  // Avatar selection - Enhanced to support opponent avatar
  const chooseAvatar = (target: "user" | "guest" | "opponent") => {
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
        setGuestAvatar(avatarData);
        localStorage.setItem("guestAvatar", JSON.stringify(avatarData));
      } else if (target === "opponent") {
        setOpponentAvatar(avatarData);
        localStorage.setItem("opponentAvatar", JSON.stringify(avatarData));
      }
    }
  };

  // Check if game can be started
  const canStartGame = () => {
    if (selectedMode === "local") {
      const result = (
        userAvatar && 
        guestAvatar && 
        guestName.trim() && 
        validator.isAlphanumeric(guestName) &&
        guestName !== loggedInUsername
      );
      console.log("canStartGame (local):", {
        userAvatar: !!userAvatar,
        guestAvatar: !!guestAvatar,
        guestName: guestName.trim(),
        isAlphanumeric: guestName ? validator.isAlphanumeric(guestName) : false,
        notSameName: guestName !== loggedInUsername,
        result
      });
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
  };

  // Start specific game type
  const startSpecificGame = (gameType: "pong" | "keyclash") => {
    console.log("=== START SPECIFIC GAME CALLED ===");
    console.log("Called with gameType:", gameType);
    console.log("Stack trace:", new Error().stack);
    console.log("Current states:", {
      selectedMode,
      userAvatar: !!userAvatar,
      guestAvatar: !!guestAvatar,
      opponentAvatar: !!opponentAvatar,
      selectedOpponent: !!selectedOpponent,
      guestName: guestName.trim(),
      canStart: canStartGame()
    });
    
    if (!canStartGame()) {
      console.log("Game cannot start - validation failed");
      if (selectedMode === "local") {
        console.log("Showing local mode alert");
        alert("Please set up both players with valid usernames and avatars");
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
  };

  // Send invitation for specific game type
  const sendPlayRequestForGame = (opponent: OnlineUser, gameType: "pong" | "keyclash") => {
    if (!socketRef.current) return;

    // Optimistically update the UI immediately
    const tempInvitation: SentInvitation = {
      id: `temp-${Date.now()}`,
      to: { socketId: opponent.socketId, name: opponent.name },
      gameType: gameType,
      timestamp: Date.now()
    };
    
    setSentInvitations(prev => [...prev, tempInvitation]);

    // Start countdown timer immediately (2 minutes = 120 seconds)
    setInvitationTimers(prev => {
      console.log(`Starting timer for invitation ${tempInvitation.id}: 120 seconds`);
      return {
        ...prev,
        [tempInvitation.id]: 120
      };
    });

    socketRef.current.emit("send_invitation", opponent.socketId, gameType, (response: any) => {
      if (response.error) {
        setSentInvitations(prev => prev.filter(inv => inv.id !== tempInvitation.id));
        setInvitationTimers(prev => {
          const updated = { ...prev };
          delete updated[tempInvitation.id];
          return updated;
        });
        alert(response.error);
      } else {
        setInvitationMessage(`Invitation sent to ${opponent.name}!`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 2000);
      }
    });
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
      {/* Back Button */}
      <button
        onClick={() => navigate("/lobby")}
        className="absolute top-35 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
      >
        🔙 Back to Lobby
      </button>

      {/* Invitation Notification Modal */}
      {showInvitationModal && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <p>{invitationMessage}</p>
        </div>
      )}

      {/* Pending Invitations Badge */}
      {receivedInvitations.length > 0 && (
        <div className="fixed top-6 right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-40">
          {receivedInvitations.length}
        </div>
      )}

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
              2️⃣ {selectedMode === "local" ? "Setup Players & Avatars" : "Choose Players & Avatars"}
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
                  // Remote Mode: Selected Opponent
                  <>
                    <h3 className="text-2xl font-bold mb-2">🎯 Player 2 (Opponent)</h3>
                    
                    {selectedOpponent ? (
                      <>
                        <p className="mb-4 text-lg">
                          <strong>{selectedOpponent.name}</strong>
                        </p>

                        {opponentAvatar ? (
                          <>
                            <img
                              src={opponentAvatar.image}
                              alt={opponentAvatar.name}
                              className="w-32 h-32 rounded-full border-4 border-green-400 mb-2 object-cover"
                            />
                            <p className="capitalize mb-4">{opponentAvatar.name}</p>
                          </>
                        ) : (
                          <p className="mb-4 italic text-gray-400">No avatar selected</p>
                        )}

                        <button
                          onClick={() => chooseAvatar("opponent")}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold mb-2"
                        >
                          Choose Avatar
                        </button>
                        
                        <button
                          onClick={() => setSelectedOpponent(null)}
                          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
                        >
                          Change Opponent
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center text-gray-400 text-4xl mb-4">
                          ?
                        </div>
                        <p className="text-gray-400 mb-2">Choose a player from the online list on the right →</p>
                      </div>
                    )}
                  </>
                )}
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
                {selectedMode === "remote" && selectedOpponent && (
                  <div className="text-base font-normal mt-2">vs {selectedOpponent.name}</div>
                )}
                {selectedMode === "local" && guestName && (
                  <div className="text-base font-normal mt-2">vs {guestName}</div>
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
                {selectedMode === "remote" && selectedOpponent && (
                  <div className="text-base font-normal mt-2">vs {selectedOpponent.name}</div>
                )}
                {selectedMode === "local" && guestName && (
                  <div className="text-base font-normal mt-2">vs {guestName}</div>
                )}
              </button>
            </div>

            {/* Status Message */}
            <div className="text-center mt-4">
              {!canStartGame() && (
                <p className="text-gray-400 text-sm">
                  {selectedMode === "local" 
                    ? "Please set up both players and their avatars to start playing"
                    : selectedOpponent 
                      ? "Please ensure both players have avatars selected"
                      : "Please select an opponent from the online players list"
                  }
                </p>
              )}
              {canStartGame() && (
                <p className="text-green-400 text-sm">
                  ✅ Ready to start! Choose your game above
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Online Users (Only for Remote Mode) */}
        {selectedMode === "remote" && (
          <div className="w-1/3">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg sticky top-6">
              <h2 className="text-2xl font-bold mb-4 text-center">🌐 Online Players</h2>
              <p className="text-center text-gray-400 text-sm mb-4">
                Choose a player or guest player from the online list ({otherPlayers.length} online)
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {otherPlayers.length > 0 ? (
                  otherPlayers.map(player => {
                    const sentInvitation = sentInvitations.find(inv => inv.to.socketId === player.socketId);
                    const receivedInvitation = receivedInvitations.find(inv => inv.from.socketId === player.socketId);
                    
                    // Debug logging
                    console.log(`Player ${player.name}:`, {
                      sentInvitation,
                      receivedInvitation,
                      sentInvitations: sentInvitations.length,
                      receivedInvitations: receivedInvitations.length
                    });
                    
                    return (
                      <div key={player.socketId} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-xs text-green-400">• Online</p>
                            {receivedInvitation && (
                              <p className="text-xs text-blue-400">• Wants to play {receivedInvitation.gameType}!</p>
                            )}
                          </div>
                        </div>
                        
                        {receivedInvitation ? (
                          // Show accept/decline buttons for received invitations with countdown
                          <div>
                            <div className={`flex gap-2 mb-2 ${
                              invitationTimers[receivedInvitation.id] <= 30 ? 'animate-pulse' : ''
                            }`}>
                              <button
                                onClick={() => {
                                  console.log("=== ACCEPT BUTTON CLICKED ===");
                                  console.log("Player:", player.name);
                                  console.log("Invitation:", receivedInvitation);
                                  console.log("Current selectedOpponent:", selectedOpponent);
                                  console.log("Current states before setting opponent:", {
                                    userAvatar: !!userAvatar,
                                    opponentAvatar: !!opponentAvatar,
                                    selectedMode,
                                    selectedGameType
                                  });
                                  
                                  // Set opponent first
                                  setSelectedOpponent(player);
                                  console.log("Set selectedOpponent to:", player.name);
                                  
                                  // Small delay to ensure state is updated
                                  setTimeout(() => {
                                    console.log("About to respond to invitation...");
                                    respondToInvitation(receivedInvitation.id, "accept");
                                  }, 100);
                                }}
                                className={`px-3 py-1 rounded text-sm font-medium flex-1 ${
                                  invitationTimers[receivedInvitation.id] <= 30 
                                    ? 'bg-green-700 hover:bg-green-800 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                ✅ Accept
                              </button>
                              <button
                                onClick={() => respondToInvitation(receivedInvitation.id, "decline")}
                                className={`px-3 py-1 rounded text-sm font-medium flex-1 ${
                                  invitationTimers[receivedInvitation.id] <= 30 
                                    ? 'bg-red-700 hover:bg-red-800 text-white' 
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                ❌ Decline
                              </button>
                            </div>
                            {invitationTimers[receivedInvitation.id] !== undefined && invitationTimers[receivedInvitation.id] >= 0 && (
                              <div className="text-center">
                                <span className={`text-xs ${
                                  invitationTimers[receivedInvitation.id] <= 30 ? 'text-red-300 animate-pulse' : 'text-blue-300'
                                }`}>
                                  Expires in {Math.floor(invitationTimers[receivedInvitation.id] / 60)}:{String(invitationTimers[receivedInvitation.id] % 60).padStart(2, '0')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : sentInvitation ? (
                          // Show pending status for sent invitations with countdown
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded text-sm font-medium flex-1 text-center ${
                                invitationTimers[sentInvitation.id] <= 30 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500 text-black'
                              }`}>
                                Pending
                              </span>
                              <button
                                onClick={() => cancelInvitation(sentInvitation.id)}
                                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                            {invitationTimers[sentInvitation.id] !== undefined && invitationTimers[sentInvitation.id] >= 0 && (
                              <div className="text-center">
                                <span className={`text-xs ${
                                  invitationTimers[sentInvitation.id] <= 30 ? 'text-red-300 animate-pulse' : 'text-yellow-300'
                                }`}>
                                  {Math.floor(invitationTimers[sentInvitation.id] / 60)}:{String(invitationTimers[sentInvitation.id] % 60).padStart(2, '0')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Show invite button for players with no invitations
                          <button
                            onClick={() => {
                              console.log("Select & Invite clicked for:", player.name); // Debug log
                              setSelectedOpponent(player);
                              sendPlayRequest(player);
                            }}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium w-full"
                          >
                            Select & Invite
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-4xl mb-2">👻</p>
                    <p>No other players online</p>
                    <p className="text-sm mt-1">Share the game with friends!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Join Games Section */}
      <div className="w-full max-w-4xl mt-6">
        {selectedMode === "remote" && (pongGames.length > 0 || keyClashGames.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pongGames.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">🏓 Quick Join Pong Games</h3>
                <p className="text-sm text-gray-400 mb-3">Join games without invitations</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
                </div>
              </div>
            )}

            {keyClashGames.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">⌨️ Quick Join Key Clash Games</h3>
                <p className="text-sm text-gray-400 mb-3">Join games without invitations</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}