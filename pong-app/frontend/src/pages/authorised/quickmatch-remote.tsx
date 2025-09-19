// frontend/src/pages/authorised/quickmatch_remote.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatars } from "../../utils/lobbyApi";
import { AvatarSelector } from "../../components/shared/AvatarSelector";
import { 
  getStoredAvatarData, 
  saveAvatarData, 
  getNextAvatar,
  cleanupGameStorage 
} from "../../shared/utils";
import { 
  Avatar, 
  AvatarData, 
  GameType, 
  Player, 
  OnlineUser, 
  GameRoom, 
  Invitation, 
  SentInvitation 
} from "../../shared/types";

export default function QuickmatchRemotePage() {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const loggedInUsername = user?.username || "";
  
  // Lobby state
  const [players, setPlayers] = useState<Player[]>([]);
  const [pongGames, setPongGames] = useState<GameRoom[]>([]);
  const [keyClashGames, setKeyClashGames] = useState<GameRoom[]>([]);
  
  // Invitation state
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");
  const [invitationTimers, setInvitationTimers] = useState<Record<string, number>>({});
  
  // Game selection state
  const [selectedGameType, setSelectedGameType] = useState<GameType>("pong");
  const [selectedOpponent, setSelectedOpponent] = useState<OnlineUser | null>(null);
  
  // Avatar state
  const [userAvatar, setUserAvatar] = useState<AvatarData | null>(() => 
    getStoredAvatarData("userAvatar")
  );
  
  const [opponentAvatar, setOpponentAvatar] = useState<AvatarData | null>(() => 
    getStoredAvatarData("opponentAvatar")
  );

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

   // Filter out current user from players list
  const otherPlayers = players.filter(p => p.name !== loggedInUsername);

  // Avatar change handlers
  const handleUserAvatarChange = useCallback((newAvatar: AvatarData | null) => {
    setUserAvatar(newAvatar);
    saveAvatarData("userAvatar", newAvatar);
  }, []);

  const handleOpponentAvatarChange = useCallback((newAvatar: AvatarData | null) => {
    setOpponentAvatar(newAvatar);
    saveAvatarData("opponentAvatar", newAvatar);
  }, []);

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

        if (!opponentAvatar && avatars.length > 1) {
          const defaultOpponentAvatar = { name: avatars[1].id, image: avatars[1].imageUrl };
          handleOpponentAvatarChange(defaultOpponentAvatar);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load avatars:", error);
        setIsInitialized(true);
      }
    };
    
    loadAvatars();
  }, [isInitialized, userAvatar, opponentAvatar, handleUserAvatarChange, handleOpponentAvatarChange]);

  // Cleanup on mount
  useEffect(() => {
    cleanupGameStorage();
  }, []);


  // Clear selected opponent if they're no longer in the online list
useEffect(() => {
  if (selectedOpponent) {
    const isOpponentStillOnline = otherPlayers.some(
      player => player.socketId === selectedOpponent.socketId
    );
    
    if (!isOpponentStillOnline) {
      console.log(`Selected opponent ${selectedOpponent.name} is no longer online - clearing selection`);
      setSelectedOpponent(null);
    }
  }
}, [otherPlayers, selectedOpponent]);

    useEffect(() => {
  // Clear selected opponent if no players are available online
  if (otherPlayers.length === 0 && selectedOpponent) {
    console.log("No players online - clearing selected opponent");
    setSelectedOpponent(null);
  }
}, [otherPlayers.length, selectedOpponent]);

  // Countdown timer for invitations
  useEffect(() => {
    const interval = setInterval(() => {
      setInvitationTimers(prev => {
        const updated = { ...prev };
        let hasExpired = false;
        
        Object.keys(updated).forEach(invitationId => {
          if (updated[invitationId] > 0) {
            updated[invitationId] -= 1;
            if (updated[invitationId] % 10 === 0) {
              console.log(`Invitation ${invitationId} timer: ${updated[invitationId]}s remaining`);
            }
          } else if (updated[invitationId] === 0) {
            hasExpired = true;
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

  // Socket setup for remote games
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
      console.log("=== SOCKET CONNECTION DEBUG ===");
  console.log("Socket connected with ID:", socketRef.current?.id);
  console.log("User object:", user);
  console.log("Username:", loggedInUsername);
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

      console.log("Emitting name with:", { name, playerId });
      
      socketRef.current?.emit("name", name, playerId, (res: { error: string }) => {
        if (res.error) {
          alert(res.error);
          navigate("/lobby");
        }
      });
    });

    socketRef.current.on("lobby_update", (data) => {
      setPlayers(data.players);
      setPongGames(data.pongGames);
      setKeyClashGames(data.keyClashGames);
    });

    socketRef.current.on("created_game", (gameId, game, mode) => {
      joinGame(gameId, game, mode);
    });

    socketRef.current.on("invitation_sent", (data: {
      id: string;
      to: { socketId: string; name: string };
      gameType: GameType;
    }) => {
      console.log("Received invitation_sent:", data);
      
      setSentInvitations(prev => {
        const tempInvitation = prev.find(inv => 
          inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-')
        );
        
        const filtered = prev.filter(inv => 
          !(inv.to.socketId === data.to.socketId && inv.id.startsWith('temp-'))
        );
        
        return [...filtered, {
          id: data.id,
          to: data.to,
          gameType: data.gameType,
          timestamp: Date.now()
        }];
      });

      setInvitationTimers(prev => {
        const updated = { ...prev };
        const tempIds = Object.keys(updated).filter(id => id.startsWith('temp-'));
        const tempTimer = tempIds.length > 0 ? updated[tempIds[tempIds.length - 1]] : 120;
        
        console.log(`Transferring timer from temp invitation (${tempTimer}s) to ${data.id}`);
        tempIds.forEach(tempId => delete updated[tempId]);
        updated[data.id] = tempTimer;
        
        return updated;
      });
    });

    socketRef.current.on("invitation_received", (invitation: Invitation) => {
      console.log("Received invitation_received:", invitation);
      setReceivedInvitations(prev => [...prev, invitation]);
      
      setInvitationTimers(prev => {
        console.log(`Starting timer for received invitation ${invitation.id}: 120 seconds`);
        return {
          ...prev,
          [invitation.id]: 120
        };
      });
      
      setInvitationMessage(`${invitation.from.name} invited you to play ${invitation.gameType}!`);
      setShowInvitationModal(true);
      
      setTimeout(() => {
        setShowInvitationModal(false);
      }, 3000);
    });

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
      console.log("Game setup complete received:", gameData);
      
      setReceivedInvitations([]);
      setSentInvitations([]);
      setInvitationTimers({});
      
      let navigationState;
      
      if (gameData.yourRole === "sender") {
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
      
      console.log("Navigation state prepared:", navigationState);
      
      setInvitationMessage("Game starting...");
      setShowInvitationModal(true);
      
      setTimeout(() => {
        console.log("Navigating to game...");
        socketRef.current?.disconnect();
        socketRef.current = null;
        
        navigate(`/${gameData.gameType}/${gameData.mode}/${gameData.type}/${gameData.gameId}`, {
          state: navigationState
        });
      }, 1000);
    });

    socketRef.current.on("invitation_declined", (data: { id: string; by: string }) => {
      console.log("Invitation declined:", data);
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
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
      console.log("Invitation expired from server:", data);
      
      const wasSentInvitation = sentInvitations.some(inv => inv.id === data.id);
      
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== data.id));
      setSentInvitations(prev => prev.filter(inv => inv.id !== data.id));
      
      setInvitationTimers(prev => {
        const updated = { ...prev };
        delete updated[data.id];
        return updated;
      });
      
      if (wasSentInvitation) {
        setInvitationMessage("⏰ Your invitation expired (2 minutes timeout)");
      } else {
        setInvitationMessage("⏰ Game invitation expired");
      }
      setShowInvitationModal(true);
      setTimeout(() => setShowInvitationModal(false), 3000);
    });

    socketRef.current.on("invitation_cancelled", (data: { id: string; reason?: string; by?: string }) => {
      console.log("Invitation cancelled:", data);
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
  }, [isInitialized, user, navigate, loggedInUsername, userAvatar, opponentAvatar]);

  // Send invitation
  const sendPlayRequest = (opponent: OnlineUser) => {
    if (!socketRef.current) return;

    console.log("sendPlayRequest called for:", opponent.name, "gameType:", selectedGameType);

    const tempInvitation: SentInvitation = {
      id: `temp-${Date.now()}`,
      to: { socketId: opponent.socketId, name: opponent.name },
      gameType: selectedGameType,
      timestamp: Date.now()
    };
    
    setSentInvitations(prev => [...prev, tempInvitation]);

    setInvitationTimers(prev => {
      console.log(`Starting timer for invitation ${tempInvitation.id}: 120 seconds`);
      return {
        ...prev,
        [tempInvitation.id]: 120
      };
    });

    socketRef.current.emit("send_invitation", opponent.socketId, selectedGameType, (response: any) => {
      console.log("send_invitation response:", response);
      
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

  // Respond to invitation
  const respondToInvitation = (invitationId: string, response: "accept" | "decline") => {
    if (!socketRef.current) return;

    console.log("=== RESPOND TO INVITATION START ===");
    console.log("Invitation ID:", invitationId);
    console.log("Response:", response);

    socketRef.current.emit("respond_to_invitation", invitationId, response, (result: any) => {
      console.log("Response result:", result);
      
      if (result.error) {
        console.log("Error in response:", result.error);
        alert(result.error);
      } else {
        console.log("Successfully responded to invitation");
        
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

  // Avatar selection
  const chooseAvatar = useCallback((target: "user" | "opponent") => {
    const nextAvatar = getNextAvatar(
      availableAvatars, 
      target === "user" ? userAvatar : opponentAvatar
    );
    
    if (nextAvatar) {
      if (target === "user") {
        handleUserAvatarChange(nextAvatar);
      } else {
        handleOpponentAvatarChange(nextAvatar);
      }
    }
  }, [availableAvatars, userAvatar, opponentAvatar, handleUserAvatarChange, handleOpponentAvatarChange]);

  // Validation
  const canStartGame = useCallback(() => {
    return userAvatar && opponentAvatar && selectedOpponent;
  }, [userAvatar, opponentAvatar, selectedOpponent]);

  // Start game
  const startSpecificGame = useCallback((gameType: GameType) => {
    if (!canStartGame()) {
      alert("Please select an opponent and ensure both players have avatars");
      return;
    }

    setSelectedGameType(gameType);
    localStorage.setItem("gameType", gameType);

    if (selectedOpponent) {
      console.log("Sending invitation for remote game to:", selectedOpponent.name);
      sendPlayRequest(selectedOpponent);
    } else {
      console.log("No opponent selected for remote game");
      alert("Please select an opponent first");
    }
  }, [canStartGame, selectedOpponent]);

  const joinGame = (gameId: string, game: GameType, mode: "remote") => {
    socketRef.current?.emit("join_game", gameId, game, mode, (res: { error: string }) => {
      if (res.error) alert(res.error);
    });
  };

  // Validation message
  const getValidationMessage = useCallback(() => {
    if (!userAvatar) return "Please select your avatar";
    if (!selectedOpponent) return "Please select an opponent from the online players list";
    if (!opponentAvatar) return "Please choose an avatar for your opponent";
    return "✅ Ready to start! Choose your game above";
  }, [userAvatar, selectedOpponent, opponentAvatar]);

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
        🌐 Remote Quick Match Setup
      </h1>

      <div className="w-full max-w-7xl flex gap-6">
        {/* Left Column - Main Content */}
        <div className="w-2/3 space-y-6">
          {/* Player Setup Section */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Players & Avatars</h2>
            
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

              {/* Player 2 - Selected Opponent */}
              <div className="bg-gray-700 p-6 w-full lg:w-1/2 rounded-xl shadow-lg flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-2">🎯 Player 2 (Opponent)</h3>
                
                {selectedOpponent ? (
                  <>
                    <p className="mb-4 text-lg">
                      <strong>{selectedOpponent.name}</strong>
                    </p>

                    <AvatarSelector
                      avatar={opponentAvatar}
                      onChooseAvatar={() => chooseAvatar("opponent")}
                      borderColor="border-green-400"
                      buttonColor="bg-green-600"
                      buttonHoverColor="bg-green-700"
                    />
                    
                    <button
                      onClick={() => setSelectedOpponent(null)}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm mt-2"
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
              </div>
            </div>
          </div>

          {/* Game Selection Buttons */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game</h2>
            
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
                {selectedOpponent && (
                  <div className="text-base font-normal mt-2">vs {selectedOpponent.name}</div>
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
                {selectedOpponent && (
                  <div className="text-base font-normal mt-2">vs {selectedOpponent.name}</div>
                )}
              </button>
            </div>

            {/* Dynamic status message */}
            <div className="text-center mt-4">
              <p className={`text-sm ${canStartGame() ? 'text-green-400' : 'text-gray-400'}`}>
                {getValidationMessage()}
              </p>
            </div>
          </div>

          {/* Quick Join Games Section */}
          {(pongGames.length > 0 || keyClashGames.length > 0) && (
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

        {/* Right Column - Online Users */}
        <div className="w-1/3">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg sticky top-6">
            <h2 className="text-2xl font-bold mb-4 text-center">🌐 Online Players</h2>
            <p className="text-center text-gray-400 text-sm mb-4">
              Choose a player from the online list ({otherPlayers.length} online)
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {otherPlayers.length > 0 ? (
                otherPlayers.map(player => {
                  const sentInvitation = sentInvitations.find(inv => inv.to.socketId === player.socketId);
                  const receivedInvitation = receivedInvitations.find(inv => inv.from.socketId === player.socketId);

                   console.log(`=== PLAYER ${player.name} RENDER DEBUG ===`);
    console.log("Player socketId:", player.socketId);
    console.log("My socketId:", socketRef.current?.id);
    console.log("sentInvitation found:", !!sentInvitation);
    console.log("receivedInvitation found:", !!receivedInvitation);
    console.log("All receivedInvitations:", receivedInvitations);
                  
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
                        <div>
                          <div className={`flex gap-2 mb-2 ${
                            invitationTimers[receivedInvitation.id] <= 30 ? 'animate-pulse' : ''
                          }`}>
                            <button
                              onClick={() => {
                                setSelectedOpponent(player);
                                setTimeout(() => {
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
                        <button
                          onClick={() => {
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
      </div>
    </div>
  );
}