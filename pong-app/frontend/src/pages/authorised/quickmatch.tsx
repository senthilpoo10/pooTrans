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

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

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

  // Socket setup for lobby and invitations
  useEffect(() => {
    // Declare variables inside the effect
    let name: string | null = null;
    let playerId: string | null = null;

    socketRef.current = io("/quickmatch", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true
    });

    socketRef.current.on("connect", () => {
      // Initialize as null
      name = null;
      playerId = null;
      
      if (user) {
        // Use username since that's what's in the schema
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

    // For local games only - remote games now use game_setup_complete flow
    socketRef.current.on("joined_game", (gameId, game, mode) => {
      // Only handle this for local games
      if (selectedMode === "local") {
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
      }
      // Remote games are handled by game_setup_complete
    });

    // Invitation event handlers
    socketRef.current.on("invitation_received", (invitation: Invitation) => {
      setReceivedInvitations(prev => [...prev, invitation]);
      setInvitationMessage(`${invitation.from.name} invited you to play ${invitation.gameType}!`);
      setShowInvitationModal(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowInvitationModal(false);
      }, 5000);
    });

    socketRef.current.on("invitation_sent", (sentInvitation: SentInvitation) => {
      setSentInvitations(prev => [...prev, sentInvitation]);
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
      console.log("Game setup complete:", gameData);
      
      // Clear invitations
      setReceivedInvitations([]);
      setSentInvitations([]);
      
      // Prepare navigation state that matches what game components expect
      let navigationState;
      
      if (gameData.yourRole === "sender") {
        // Sender: they are the user, opponent is guest
        navigationState = {
          user: gameData.senderData.name,
          guest: gameData.receiverData.name,
          userAvatar: userAvatar || { name: "default", image: "/avatars/av1.jpeg" },
          guestAvatar: { name: "default", image: "/avatars/av2.jpeg" },
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
          userAvatar: { name: "default", image: "/avatars/av1.jpeg" },
          guestAvatar: { name: "default", image: "/avatars/av2.jpeg" },
          gameType: gameData.gameType,
          mode: gameData.mode,
          fromRemoteInvitation: true,
          isRemote: true,
          yourSide: gameData.yourSide
        };
      }
      
      setInvitationMessage("Game starting...");
      setShowInvitationModal(true);
      
      // Navigate immediately with the complete state
      setTimeout(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        
        navigate(`/${gameData.gameType}/${gameData.mode}/${gameData.type}/${gameData.gameId}`, {
          state: navigationState
        });
      }, 1500);
    });

    socketRef.current.on("invitation_declined", (data: { id: string; by: string }) => {
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      setInvitationMessage(`${data.by} declined your invitation.`);
      setShowInvitationModal(true);
      
      setTimeout(() => {
        setShowInvitationModal(false);
      }, 3000);
    });

    socketRef.current.on("invitation_expired", (data: { id: string }) => {
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
    });

    socketRef.current.on("invitation_cancelled", (data: { id: string; reason?: string }) => {
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
      if (data.reason) {
        setInvitationMessage(`Invitation cancelled: ${data.reason}`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 3000);
      }
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate, loggedInUsername, guestName, userAvatar, guestAvatar, selectedGameType]);

  // Send invitation to player
  const sendPlayRequest = (opponent: OnlineUser) => {
    if (!socketRef.current) return;

    socketRef.current.emit("send_invitation", opponent.socketId, selectedGameType, (response: any) => {
      if (response.error) {
        alert(response.error);
      } else {
        setSelectedOpponent(opponent);
        setInvitationMessage(`Invitation sent to ${opponent.name}!`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 3000);
      }
    });
  };

  // Respond to invitation
  const respondToInvitation = (invitationId: string, response: "accept" | "decline") => {
    if (!socketRef.current) return;

    socketRef.current.emit("respond_to_invitation", invitationId, response, (result: any) => {
      if (result.error) {
        alert(result.error);
      } else {
        setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        if (response === "accept") {
          setInvitationMessage("Invitation accepted! Preparing game...");
        } else {
          setInvitationMessage("Invitation declined.");
        }
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 2000);
      }
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
        setSelectedOpponent(null);
        setInvitationMessage("Invitation cancelled.");
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 2000);
      }
    });
  };

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

  // Check if game can be started
  const canStartGame = () => {
    if (selectedMode === "local") {
      // Local mode requirements
      return (
        userAvatar && 
        guestAvatar && 
        guestName.trim() && 
        validator.isAlphanumeric(guestName) &&
        guestName !== loggedInUsername
      );
    } else {
      // Remote mode requirements  
      return userAvatar && selectedOpponent;
    }
  };

  // Start specific game type
  const startSpecificGame = (gameType: "pong" | "keyclash") => {
    if (!canStartGame()) {
      if (selectedMode === "local") {
        alert("Please set up both players with valid usernames and avatars");
      } else {
        alert("Please select an opponent and ensure you have an avatar");
      }
      return;
    }

    // Set the selected game type
    setSelectedGameType(gameType);

    // Store game type for backend
    localStorage.setItem("gameType", gameType);

    if (selectedMode === "local") {
      // Local game: Start immediately
      startDuelGame({
        user: loggedInUsername,
        userAvatar: userAvatar.name,
        guest: guestName,
        guestAvatar: guestAvatar?.name || "",
        gameType: gameType,
      })
      .then(() => {
        socketRef.current?.emit("create_game", gameType, selectedMode);
      })
      .catch((err) => alert(`Failed to start game: ${err.message}`));
    } else {
      // Remote game: Send invitation
      if (selectedOpponent) {
        sendPlayRequestForGame(selectedOpponent, gameType);
      }
    }
  };

  // Send invitation for specific game type
  const sendPlayRequestForGame = (opponent: OnlineUser, gameType: "pong" | "keyclash") => {
    if (!socketRef.current) return;

    socketRef.current.emit("send_invitation", opponent.socketId, gameType, (response: any) => {
      if (response.error) {
        alert(response.error);
      } else {
        setInvitationMessage(`${gameType === "pong" ? "🏓 Ping Pong" : "⌨️ Key Clash"} invitation sent to ${opponent.name}!`);
        setShowInvitationModal(true);
        setTimeout(() => setShowInvitationModal(false), 3000);
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
        className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
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
      {(receivedInvitations.length > 0 || sentInvitations.length > 0) && (
        <div className="fixed top-6 right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-40">
          {receivedInvitations.length + sentInvitations.length}
        </div>
      )}

      {/* Received Invitations Panel */}
      {receivedInvitations.length > 0 && (
        <div className="fixed top-20 right-4 bg-gray-800 border border-blue-500 rounded-lg p-4 z-50 max-w-sm">
          <h3 className="text-lg font-bold mb-3 text-blue-300">🎮 Game Invitations</h3>
          {receivedInvitations.map(invitation => (
            <div key={invitation.id} className="bg-gray-700 p-3 rounded mb-2">
              <p className="text-sm mb-2">{invitation.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => respondToInvitation(invitation.id, "accept")}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToInvitation(invitation.id, "decline")}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent Invitations Panel */}
      {sentInvitations.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-yellow-500 rounded-lg p-4 z-50 max-w-sm">
          <h3 className="text-lg font-bold mb-3 text-yellow-300">📤 Sent Invitations</h3>
          {sentInvitations.map(invitation => (
            <div key={invitation.id} className="bg-gray-700 p-3 rounded mb-2">
              <p className="text-sm mb-2">
                Waiting for {invitation.to.name} to respond ({invitation.gameType})
              </p>
              <button
                onClick={() => cancelInvitation(invitation.id)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm w-full"
              >
                Cancel Invitation
              </button>
            </div>
          ))}
        </div>
      )}

      <h1 className="text-4xl font-bold text-center mb-6">
        🎮 Quick Match Setup
      </h1>

      <div className="w-full max-w-4xl">
        {/* 1. Game Mode Selection - FIRST */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">1️⃣ Choose Game Mode</h2>
          
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

        {/* 2. Player Setup Section - SECOND */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            2️⃣ {selectedMode === "local" ? "Setup Players & Avatars" : "Choose Your Opponent"}
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
                          otherPlayers.map(player => {
                            // Check if we already sent invitation to this player
                            const hasSentInvitation = sentInvitations.some(inv => inv.to.socketId === player.socketId);
                            
                            return (
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
                                {hasSentInvitation ? (
                                  <span className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-medium">
                                    Invitation Sent
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => sendPlayRequest(player)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium"
                                  >
                                    Invite to Play
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Game Selection Buttons - THIRD */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">3️⃣ Choose Your Game</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ping Pong Button */}
            <button
              onClick={() => startSpecificGame("pong")}
              disabled={!canStartGame()}
              className={`p-8 rounded-xl text-2xl font-bold shadow-xl transition-all ${
                !canStartGame()
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              }`}
            >
              🏓 Start Ping Pong
              {selectedMode === "remote" && selectedOpponent && (
                <div className="text-lg font-normal mt-2">vs {selectedOpponent.name}</div>
              )}
              {selectedMode === "local" && guestName && (
                <div className="text-lg font-normal mt-2">vs {guestName}</div>
              )}
            </button>

            {/* Key Clash Button */}
            <button
              onClick={() => startSpecificGame("keyclash")}
              disabled={!canStartGame()}
              className={`p-8 rounded-xl text-2xl font-bold shadow-xl transition-all ${
                !canStartGame()
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              }`}
            >
              ⌨️ Start Key Clash
              {selectedMode === "remote" && selectedOpponent && (
                <div className="text-lg font-normal mt-2">vs {selectedOpponent.name}</div>
              )}
              {selectedMode === "local" && guestName && (
                <div className="text-lg font-normal mt-2">vs {guestName}</div>
              )}
            </button>
          </div>

          {/* Status Message */}
          <div className="text-center mt-4">
            {!canStartGame() && (
              <p className="text-gray-400 text-sm">
                {selectedMode === "local" 
                  ? "Please set up both players and their avatars to start playing"
                  : "Please select an opponent to start playing"
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