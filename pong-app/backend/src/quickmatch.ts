// import { Server, Socket } from "socket.io";
// import { playersOnline, pongRooms, keyClashRooms, getLobbyState } from "./gameData";
// import PingPongGame from "./PingPongGame";
// import { state } from "./KeyClashGame";

// export function setupLobby(io: Server) {
//     const lobbyNamespace = io.of('/quickmatch');

//     lobbyNamespace.on("connection", (socket: Socket) => {
//       console.log(`Player connected: ${socket.id}`);

//       socket.on("name", (name: string | null, playerId: string | null, callback: Function) => {
//         if (playerId && playersOnline.some(p => p.playerId === playerId))
//           return callback({ error: "You're already in the lobby" });
//         if (name)
//           socket.data.name = name
//         else
//           socket.data.name = `Guest-${socket.id.slice(0, 3)}`;

//         playersOnline.push({ playerId: playerId, socketId: socket.id, name: socket.data.name });

//         lobbyNamespace.emit("lobby_update", getLobbyState());        
//       })

  
//       socket.on("create_game", (game: "pong" | "keyclash", mode: "local" | "remote") => {
//         const id = Math.random().toString(36).substring(2, 6);

//         if (game === "pong") pongRooms.push(new PingPongGame(id, mode, "1v1"));
//         else {
//           let newKeyClash: state = {
//             id: id,
//             score1: 0,
//             score2: 0,
//             prompts: ["-", "-"],
//             timeLeft: 20,
//             players: [],
//             matches: [],
//             interval: null,
//             player1ready: false,
//             player2ready: false,
//             p1: undefined,
//             p2: undefined,
//             status: "waiting",
//             mode: mode,
// 			      type: "1v1",
//             round: 0,
//           }
//           keyClashRooms.push(newKeyClash);
//         }
//         socket.emit("created_game", id, game, mode);
//       });
  
//       socket.on("join_game", (gameId, game, mode, callback) => {
//         if (game === "pong") { 
//           const gameRoom = pongRooms.find(g => g.getId() === gameId); 
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.state.status !== "waiting") return callback({ error: "Game already started" });                
//         }
//         else { 
//           const gameRoom = keyClashRooms.find(g => g.id === gameId);
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.status !== "waiting") return callback({ error: "Game already started" });          
//         } 
//         // remove player from list of players in lobby
//         const i = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (i !== -1) playersOnline.splice(i, 1);

//         lobbyNamespace.emit("lobby_update", getLobbyState());        

//         socket.emit("joined_game", gameId, game, mode);
//       });
  
//       socket.on("disconnect", () => {
//         console.log(`Player disconnected: ${socket.id}`);

//         const player = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (player !== -1) playersOnline.splice(player, 1);
  
//         lobbyNamespace.emit("lobby_update", getLobbyState());
//       });
//     });
//   }



// import { Server, Socket } from "socket.io";
// import { playersOnline, pongRooms, keyClashRooms, getLobbyState } from "./gameData";
// import PingPongGame from "./PingPongGame";
// import { state } from "./KeyClashGame";

// // Add invitation tracking
// interface Invitation {
//   id: string;
//   from: { socketId: string; name: string };
//   to: { socketId: string; name: string };
//   gameType: "pong" | "keyclash";
//   timestamp: number;
// }

// const activeInvitations = new Map<string, Invitation>();

// export function setupLobby(io: Server) {
//     const lobbyNamespace = io.of('/quickmatch');

//     lobbyNamespace.on("connection", (socket: Socket) => {
//       console.log(`Player connected: ${socket.id}`);

//       socket.on("name", (name: string | null, playerId: string | null, callback: Function) => {
//         if (playerId && playersOnline.some(p => p.playerId === playerId))
//           return callback({ error: "You're already in the lobby" });
//         if (name)
//           socket.data.name = name
//         else
//           socket.data.name = `Guest-${socket.id.slice(0, 3)}`;

//         playersOnline.push({ playerId: playerId, socketId: socket.id, name: socket.data.name });

//         lobbyNamespace.emit("lobby_update", getLobbyState());        
//       })

//       // Send invitation to another player
//       socket.on("send_invitation", (targetSocketId: string, gameType: "pong" | "keyclash", callback: Function) => {
//         const targetSocket = lobbyNamespace.sockets.get(targetSocketId);
//         const senderPlayer = playersOnline.find(p => p.socketId === socket.id);
//         const targetPlayer = playersOnline.find(p => p.socketId === targetSocketId);

//         if (!targetSocket) {
//           return callback({ error: "Player not found or offline" });
//         }

//         if (!senderPlayer || !targetPlayer) {
//           return callback({ error: "Player data not found" });
//         }

//         // Check if there's already a pending invitation between these players
//         const existingInvitation = Array.from(activeInvitations.values()).find(inv => 
//           (inv.from.socketId === socket.id && inv.to.socketId === targetSocketId) ||
//           (inv.from.socketId === targetSocketId && inv.to.socketId === socket.id)
//         );

//         if (existingInvitation) {
//           return callback({ error: "There's already a pending invitation between you two" });
//         }

//         const invitationId = Math.random().toString(36).substring(2, 8);
//         const invitation: Invitation = {
//           id: invitationId,
//           from: { socketId: socket.id, name: senderPlayer.name },
//           to: { socketId: targetSocketId, name: targetPlayer.name },
//           gameType,
//           timestamp: Date.now()
//         };

//         activeInvitations.set(invitationId, invitation);

//         // Send invitation to target player
//         targetSocket.emit("invitation_received", {
//           id: invitationId,
//           from: invitation.from,
//           gameType,
//           message: `${senderPlayer.name} invited you to play ${gameType}`
//         });

//         // Confirm to sender
//         callback({ success: true, message: `Invitation sent to ${targetPlayer.name}` });
        
//         // Notify sender that invitation was sent
//         socket.emit("invitation_sent", {
//           id: invitationId,
//           to: invitation.to,
//           gameType
//         });

//         // Auto-cancel invitation after 30 seconds
//         setTimeout(() => {
//           if (activeInvitations.has(invitationId)) {
//             activeInvitations.delete(invitationId);
//             socket.emit("invitation_expired", { id: invitationId });
//             targetSocket.emit("invitation_expired", { id: invitationId });
//           }
//         }, 30000);
//       });

//       // Respond to invitation (accept/decline)
//       socket.on("respond_to_invitation", (invitationId: string, response: "accept" | "decline", callback: Function) => {
//         const invitation = activeInvitations.get(invitationId);
        
//         if (!invitation) {
//           return callback({ error: "Invitation not found or expired" });
//         }

//         if (invitation.to.socketId !== socket.id) {
//           return callback({ error: "This invitation is not for you" });
//         }

//         const senderSocket = lobbyNamespace.sockets.get(invitation.from.socketId);
        
//         if (!senderSocket) {
//           activeInvitations.delete(invitationId);
//           return callback({ error: "The other player is no longer online" });
//         }

//         if (response === "accept") {
//           // Create a game room
//           const gameId = Math.random().toString(36).substring(2, 6);

//           if (invitation.gameType === "pong") {
//             pongRooms.push(new PingPongGame(gameId, "remote", "1v1"));
//           } else {
//             let newKeyClash: state = {
//               id: gameId,
//               score1: 0,
//               score2: 0,
//               prompts: ["-", "-"],
//               timeLeft: 20,
//               players: [],
//               matches: [],
//               interval: null,
//               player1ready: false,
//               player2ready: false,
//               p1: undefined,
//               p2: undefined,
//               status: "waiting",
//               mode: "remote",
//               type: "1v1",
//               round: 0,
//             }
//             keyClashRooms.push(newKeyClash);
//           }

//           // Remove invitation
//           activeInvitations.delete(invitationId);

//           // Notify both players to join the game
//           const gameData = {
//             gameId,
//             gameType: invitation.gameType,
//             mode: "remote"
//           };

//           senderSocket.emit("invitation_accepted", gameData);
//           socket.emit("invitation_accepted", gameData);

//           // Auto-join both players to the game
//           setTimeout(() => {
//             senderSocket.emit("joined_game", gameId, invitation.gameType, "remote");
//             socket.emit("joined_game", gameId, invitation.gameType, "remote");
//           }, 1000);

//           callback({ success: true, message: "Invitation accepted, starting game..." });
//         } else {
//           // Decline invitation
//           activeInvitations.delete(invitationId);
//           senderSocket.emit("invitation_declined", {
//             id: invitationId,
//             by: invitation.to.name
//           });
//           callback({ success: true, message: "Invitation declined" });
//         }
//       });

//       // Cancel invitation (by sender)
//       socket.on("cancel_invitation", (invitationId: string, callback: Function) => {
//         const invitation = activeInvitations.get(invitationId);
        
//         if (!invitation) {
//           return callback({ error: "Invitation not found" });
//         }

//         if (invitation.from.socketId !== socket.id) {
//           return callback({ error: "You can only cancel your own invitations" });
//         }

//         const targetSocket = lobbyNamespace.sockets.get(invitation.to.socketId);
//         if (targetSocket) {
//           targetSocket.emit("invitation_cancelled", { id: invitationId });
//         }

//         activeInvitations.delete(invitationId);
//         callback({ success: true, message: "Invitation cancelled" });
//       });

//       // Get pending invitations for this player
//       socket.on("get_pending_invitations", (callback: Function) => {
//         const pendingInvitations = Array.from(activeInvitations.values())
//           .filter(inv => inv.to.socketId === socket.id)
//           .map(inv => ({
//             id: inv.id,
//             from: inv.from,
//             gameType: inv.gameType,
//             timestamp: inv.timestamp
//           }));

//         callback({ invitations: pendingInvitations });
//       });

//       // Original game creation and joining logic
//       socket.on("create_game", (game: "pong" | "keyclash", mode: "local" | "remote") => {
//         const id = Math.random().toString(36).substring(2, 6);

//         if (game === "pong") pongRooms.push(new PingPongGame(id, mode, "1v1"));
//         else {
//           let newKeyClash: state = {
//             id: id,
//             score1: 0,
//             score2: 0,
//             prompts: ["-", "-"],
//             timeLeft: 20,
//             players: [],
//             matches: [],
//             interval: null,
//             player1ready: false,
//             player2ready: false,
//             p1: undefined,
//             p2: undefined,
//             status: "waiting",
//             mode: mode,
//             type: "1v1",
//             round: 0,
//           }
//           keyClashRooms.push(newKeyClash);
//         }
//         socket.emit("created_game", id, game, mode);
//       });
  
//       socket.on("join_game", (gameId, game, mode, callback) => {
//         if (game === "pong") { 
//           const gameRoom = pongRooms.find(g => g.getId() === gameId); 
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.state.status !== "waiting") return callback({ error: "Game already started" });                
//         }
//         else { 
//           const gameRoom = keyClashRooms.find(g => g.id === gameId);
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.status !== "waiting") return callback({ error: "Game already started" });          
//         } 
//         // remove player from list of players in lobby
//         const i = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (i !== -1) playersOnline.splice(i, 1);

//         lobbyNamespace.emit("lobby_update", getLobbyState());        

//         socket.emit("joined_game", gameId, game, mode);
//       });
  
//       socket.on("disconnect", () => {
//         console.log(`Player disconnected: ${socket.id}`);

//         // Cancel all invitations involving this player
//         const toCancel = Array.from(activeInvitations.entries()).filter(([id, inv]) => 
//           inv.from.socketId === socket.id || inv.to.socketId === socket.id
//         );

//         toCancel.forEach(([id, inv]) => {
//           const otherSocketId = inv.from.socketId === socket.id ? inv.to.socketId : inv.from.socketId;
//           const otherSocket = lobbyNamespace.sockets.get(otherSocketId);
//           if (otherSocket) {
//             otherSocket.emit("invitation_cancelled", { id, reason: "Player disconnected" });
//           }
//           activeInvitations.delete(id);
//         });

//         const player = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (player !== -1) playersOnline.splice(player, 1);
  
//         lobbyNamespace.emit("lobby_update", getLobbyState());
//       });
//     });
//   }


// import { Server, Socket } from "socket.io";
// import { playersOnline, pongRooms, keyClashRooms, getLobbyState } from "./gameData";
// import PingPongGame from "./PingPongGame";
// import { state } from "./KeyClashGame";

// // Add invitation tracking
// interface Invitation {
//   id: string;
//   from: { socketId: string; name: string };
//   to: { socketId: string; name: string };
//   gameType: "pong" | "keyclash";
//   timestamp: number;
// }

// const activeInvitations = new Map<string, Invitation>();

// export function setupLobby(io: Server) {
//     const lobbyNamespace = io.of('/quickmatch');

//     lobbyNamespace.on("connection", (socket: Socket) => {
//       console.log(`Player connected: ${socket.id}`);

//       socket.on("name", (name: string | null, playerId: string | null, callback: Function) => {
//         if (playerId && playersOnline.some(p => p.playerId === playerId))
//           return callback({ error: "You're already in the lobby" });
//         if (name)
//           socket.data.name = name
//         else
//           socket.data.name = `Guest-${socket.id.slice(0, 3)}`;

//         playersOnline.push({ playerId: playerId, socketId: socket.id, name: socket.data.name });

//         lobbyNamespace.emit("lobby_update", getLobbyState());        
//       })

//       // Send invitation to another player
//       socket.on("send_invitation", (targetSocketId: string, gameType: "pong" | "keyclash", callback: Function) => {
//         const targetSocket = lobbyNamespace.sockets.get(targetSocketId);
//         const senderPlayer = playersOnline.find(p => p.socketId === socket.id);
//         const targetPlayer = playersOnline.find(p => p.socketId === targetSocketId);

//         if (!targetSocket) {
//           return callback({ error: "Player not found or offline" });
//         }

//         if (!senderPlayer || !targetPlayer) {
//           return callback({ error: "Player data not found" });
//         }

//         // Check if there's already a pending invitation between these players
//         const existingInvitation = Array.from(activeInvitations.values()).find(inv => 
//           (inv.from.socketId === socket.id && inv.to.socketId === targetSocketId) ||
//           (inv.from.socketId === targetSocketId && inv.to.socketId === socket.id)
//         );

//         if (existingInvitation) {
//           return callback({ error: "There's already a pending invitation between you two" });
//         }

//         const invitationId = Math.random().toString(36).substring(2, 8);
//         const invitation: Invitation = {
//           id: invitationId,
//           from: { socketId: socket.id, name: senderPlayer.name },
//           to: { socketId: targetSocketId, name: targetPlayer.name },
//           gameType,
//           timestamp: Date.now()
//         };

//         activeInvitations.set(invitationId, invitation);

//         // Send invitation to target player
//         targetSocket.emit("invitation_received", {
//           id: invitationId,
//           from: invitation.from,
//           gameType,
//           message: `${senderPlayer.name} invited you to play ${gameType}`
//         });

//         // Confirm to sender
//         callback({ success: true, message: `Invitation sent to ${targetPlayer.name}` });
        
//         // Notify sender that invitation was sent
//         socket.emit("invitation_sent", {
//           id: invitationId,
//           to: invitation.to,
//           gameType
//         });

//         // Auto-cancel invitation after 30 seconds
//         setTimeout(() => {
//           if (activeInvitations.has(invitationId)) {
//             activeInvitations.delete(invitationId);
//             socket.emit("invitation_expired", { id: invitationId });
//             targetSocket.emit("invitation_expired", { id: invitationId });
//           }
//         }, 30000);
//       });

//       // Respond to invitation (accept/decline)
//       socket.on("respond_to_invitation", (invitationId: string, response: "accept" | "decline", callback: Function) => {
//         const invitation = activeInvitations.get(invitationId);
        
//         if (!invitation) {
//           return callback({ error: "Invitation not found or expired" });
//         }

//         if (invitation.to.socketId !== socket.id) {
//           return callback({ error: "This invitation is not for you" });
//         }

//         const senderSocket = lobbyNamespace.sockets.get(invitation.from.socketId);
        
//         if (!senderSocket) {
//           activeInvitations.delete(invitationId);
//           return callback({ error: "The other player is no longer online" });
//         }

//         if (response === "accept") {
//           // Create a game room
//           const gameId = Math.random().toString(36).substring(2, 6);

//           if (invitation.gameType === "pong") {
//             pongRooms.push(new PingPongGame(gameId, "remote", "1v1"));
//           } else {
//             let newKeyClash: state = {
//               id: gameId,
//               score1: 0,
//               score2: 0,
//               prompts: ["-", "-"],
//               timeLeft: 20,
//               players: [],
//               matches: [],
//               interval: null,
//               player1ready: false,
//               player2ready: false,
//               p1: undefined,
//               p2: undefined,
//               status: "waiting",
//               mode: "remote",
//               type: "1v1",
//               round: 0,
//             }
//             keyClashRooms.push(newKeyClash);
//           }

//           // Remove invitation
//           activeInvitations.delete(invitationId);

//           // Notify both players to join the game
//           const gameData = {
//             gameId,
//             gameType: invitation.gameType,
//             mode: "remote"
//           };

//           senderSocket.emit("invitation_accepted", gameData);
//           socket.emit("invitation_accepted", gameData);

//           // Auto-join both players to the game
//           setTimeout(() => {
//             senderSocket.emit("joined_game", gameId, invitation.gameType, "remote");
//             socket.emit("joined_game", gameId, invitation.gameType, "remote");
//           }, 1000);

//           callback({ success: true, message: "Invitation accepted, starting game..." });
//         } else {
//           // Decline invitation
//           activeInvitations.delete(invitationId);
//           senderSocket.emit("invitation_declined", {
//             id: invitationId,
//             by: invitation.to.name
//           });
//           callback({ success: true, message: "Invitation declined" });
//         }
//       });

//       // Cancel invitation (by sender)
//       socket.on("cancel_invitation", (invitationId: string, callback: Function) => {
//         const invitation = activeInvitations.get(invitationId);
        
//         if (!invitation) {
//           return callback({ error: "Invitation not found" });
//         }

//         if (invitation.from.socketId !== socket.id) {
//           return callback({ error: "You can only cancel your own invitations" });
//         }

//         const targetSocket = lobbyNamespace.sockets.get(invitation.to.socketId);
//         if (targetSocket) {
//           targetSocket.emit("invitation_cancelled", { id: invitationId });
//         }

//         activeInvitations.delete(invitationId);
//         callback({ success: true, message: "Invitation cancelled" });
//       });

//       // Get pending invitations for this player
//       socket.on("get_pending_invitations", (callback: Function) => {
//         const pendingInvitations = Array.from(activeInvitations.values())
//           .filter(inv => inv.to.socketId === socket.id)
//           .map(inv => ({
//             id: inv.id,
//             from: inv.from,
//             gameType: inv.gameType,
//             timestamp: inv.timestamp
//           }));

//         callback({ invitations: pendingInvitations });
//       });

//       // Original game creation and joining logic
//       socket.on("create_game", (game: "pong" | "keyclash", mode: "local" | "remote") => {
//         const id = Math.random().toString(36).substring(2, 6);

//         if (game === "pong") pongRooms.push(new PingPongGame(id, mode, "1v1"));
//         else {
//           let newKeyClash: state = {
//             id: id,
//             score1: 0,
//             score2: 0,
//             prompts: ["-", "-"],
//             timeLeft: 20,
//             players: [],
//             matches: [],
//             interval: null,
//             player1ready: false,
//             player2ready: false,
//             p1: undefined,
//             p2: undefined,
//             status: "waiting",
//             mode: mode,
//             type: "1v1",
//             round: 0,
//           }
//           keyClashRooms.push(newKeyClash);
//         }
//         socket.emit("created_game", id, game, mode);
//       });
  
//       socket.on("join_game", (gameId, game, mode, callback) => {
//         if (game === "pong") { 
//           const gameRoom = pongRooms.find(g => g.getId() === gameId); 
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.state.status !== "waiting") return callback({ error: "Game already started" });                
//         }
//         else { 
//           const gameRoom = keyClashRooms.find(g => g.id === gameId);
//           if (!gameRoom) return callback({ error: "Game not found" });
//           if (gameRoom.status !== "waiting") return callback({ error: "Game already started" });          
//         } 
//         // remove player from list of players in lobby
//         const i = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (i !== -1) playersOnline.splice(i, 1);

//         lobbyNamespace.emit("lobby_update", getLobbyState());        

//         socket.emit("joined_game", gameId, game, mode);
//       });
  
//       socket.on("disconnect", () => {
//         console.log(`Player disconnected: ${socket.id}`);

//         // Cancel all invitations involving this player
//         const toCancel = Array.from(activeInvitations.entries()).filter(([id, inv]) => 
//           inv.from.socketId === socket.id || inv.to.socketId === socket.id
//         );

//         toCancel.forEach(([id, inv]) => {
//           const otherSocketId = inv.from.socketId === socket.id ? inv.to.socketId : inv.from.socketId;
//           const otherSocket = lobbyNamespace.sockets.get(otherSocketId);
//           if (otherSocket) {
//             otherSocket.emit("invitation_cancelled", { id, reason: "Player disconnected" });
//           }
//           activeInvitations.delete(id);
//         });

//         const player = playersOnline.findIndex(p => p.socketId === socket.id);
//         if (player !== -1) playersOnline.splice(player, 1);
  
//         lobbyNamespace.emit("lobby_update", getLobbyState());
//       });
//     });
//   }





import { Server, Socket } from "socket.io";
import { playersOnline, pongRooms, keyClashRooms, getLobbyState } from "./gameData";
import PingPongGame from "./PingPongGame";
import { state } from "./KeyClashGame";

// Local Player interface that matches what we need for the lobby
interface LobbyPlayer {
  playerId: string | null;
  socketId: string;
  name: string;
}

// Add invitation tracking
interface Invitation {
  id: string;
  from: { socketId: string; name: string };
  to: { socketId: string; name: string };
  gameType: "pong" | "keyclash";
  timestamp: number;
}

const activeInvitations = new Map<string, Invitation>();

export function setupLobby(io: Server) {
    const lobbyNamespace = io.of('/quickmatch');

    lobbyNamespace.on("connection", (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);

      socket.on("name", (username: string | null, playerId: string | null, callback: Function) => {
        if (playerId && (playersOnline as LobbyPlayer[]).some(p => p.playerId === playerId))
          return callback({ error: "You're already in the lobby" });
        
        // Guarantee these are always strings, never null
        const playerName: string = username ?? `Guest-${socket.id.slice(0, 3)}`;
        const playerSocketId: string = socket.id; // Always a string
        
        socket.data.name = playerName;

        // Create the player object with explicit typing
        const newPlayer: LobbyPlayer = {
          playerId: playerId, // Can be null
          socketId: playerSocketId, // Always string
          name: playerName // Always string
        };

        (playersOnline as LobbyPlayer[]).push(newPlayer);

        lobbyNamespace.emit("lobby_update", getLobbyState());        
      })

      // Send invitation to another player
      socket.on("send_invitation", (targetSocketId: string, gameType: "pong" | "keyclash", callback: Function) => {
        const targetSocket = lobbyNamespace.sockets.get(targetSocketId);
        const senderPlayer = (playersOnline as LobbyPlayer[]).find(p => p.socketId === socket.id);
        const targetPlayer = (playersOnline as LobbyPlayer[]).find(p => p.socketId === targetSocketId);

        if (!targetSocket) {
          return callback({ error: "Player not found or offline" });
        }

        if (!senderPlayer || !targetPlayer) {
          return callback({ error: "Player data not found" });
        }

        // Check if there's already a pending invitation between these players
        const existingInvitation = Array.from(activeInvitations.values()).find(inv => 
          (inv.from.socketId === socket.id && inv.to.socketId === targetSocketId) ||
          (inv.from.socketId === targetSocketId && inv.to.socketId === socket.id)
        );

        if (existingInvitation) {
          return callback({ error: "There's already a pending invitation between you two" });
        }

        const invitationId = Math.random().toString(36).substring(2, 8);
        const invitation: Invitation = {
          id: invitationId,
          from: { socketId: socket.id, name: senderPlayer.name },
          to: { socketId: targetSocketId, name: targetPlayer.name },
          gameType,
          timestamp: Date.now()
        };

        activeInvitations.set(invitationId, invitation);

        // Send invitation to target player
        targetSocket.emit("invitation_received", {
          id: invitationId,
          from: invitation.from,
          gameType,
          message: `${senderPlayer.name} invited you to play ${gameType}`
        });

        // Confirm to sender
        callback({ success: true, message: `Invitation sent to ${targetPlayer.name}` });
        
        // Notify sender that invitation was sent
        socket.emit("invitation_sent", {
          id: invitationId,
          to: invitation.to,
          gameType
        });

        // Auto-cancel invitation after 30 seconds
        setTimeout(() => {
          if (activeInvitations.has(invitationId)) {
            activeInvitations.delete(invitationId);
            socket.emit("invitation_expired", { id: invitationId });
            targetSocket.emit("invitation_expired", { id: invitationId });
          }
        }, 30000);
      });

      // Respond to invitation (accept/decline)
      socket.on("respond_to_invitation", (invitationId: string, response: "accept" | "decline", callback: Function) => {
        const invitation = activeInvitations.get(invitationId);
        
        if (!invitation) {
          return callback({ error: "Invitation not found or expired" });
        }

        if (invitation.to.socketId !== socket.id) {
          return callback({ error: "This invitation is not for you" });
        }

        const senderSocket = lobbyNamespace.sockets.get(invitation.from.socketId);
        
        if (!senderSocket) {
          activeInvitations.delete(invitationId);
          return callback({ error: "The other player is no longer online" });
        }

        if (response === "accept") {
          // Create a game room
          const gameId = Math.random().toString(36).substring(2, 6);

          if (invitation.gameType === "pong") {
            pongRooms.push(new PingPongGame(gameId, "remote", "1v1"));
          } else {
            let newKeyClash: state = {
              id: gameId,
              score1: 0,
              score2: 0,
              prompts: ["-", "-"],
              timeLeft: 20,
              players: [],
              matches: [],
              interval: null,
              player1ready: false,
              player2ready: false,
              p1: undefined,
              p2: undefined,
              status: "waiting",
              mode: "remote",
              type: "1v1",
              round: 0,
            }
            keyClashRooms.push(newKeyClash);
          }

          // Remove invitation
          activeInvitations.delete(invitationId);

          // Prepare game data with player information for both sides
          const gameData = {
            gameId,
            gameType: invitation.gameType,
            mode: "remote",
            // Player data for both sides
            player1: {
              name: invitation.from.name,
              socketId: invitation.from.socketId,
              side: "left"
            },
            player2: {
              name: invitation.to.name,
              socketId: invitation.to.socketId,
              side: "right"
            }
          };

          // Send specific data to each player
          senderSocket.emit("invitation_accepted", {
            ...gameData,
            yourSide: "left",
            opponent: gameData.player2.name
          });
          
          socket.emit("invitation_accepted", {
            ...gameData,
            yourSide: "right", 
            opponent: gameData.player1.name
          });

          // Auto-join both players to the game after a short delay
          setTimeout(() => {
            senderSocket.emit("joined_game", gameId, invitation.gameType, "remote");
            socket.emit("joined_game", gameId, invitation.gameType, "remote");
          }, 1000);

          callback({ success: true, message: "Invitation accepted, starting game..." });
        } else {
          // Decline invitation
          activeInvitations.delete(invitationId);
          senderSocket.emit("invitation_declined", {
            id: invitationId,
            by: invitation.to.name
          });
          callback({ success: true, message: "Invitation declined" });
        }
      });

      // Cancel invitation (by sender)
      socket.on("cancel_invitation", (invitationId: string, callback: Function) => {
        const invitation = activeInvitations.get(invitationId);
        
        if (!invitation) {
          return callback({ error: "Invitation not found" });
        }

        if (invitation.from.socketId !== socket.id) {
          return callback({ error: "You can only cancel your own invitations" });
        }

        const targetSocket = lobbyNamespace.sockets.get(invitation.to.socketId);
        if (targetSocket) {
          targetSocket.emit("invitation_cancelled", { id: invitationId });
        }

        activeInvitations.delete(invitationId);
        callback({ success: true, message: "Invitation cancelled" });
      });

      // Get pending invitations for this player
      socket.on("get_pending_invitations", (callback: Function) => {
        const pendingInvitations = Array.from(activeInvitations.values())
          .filter(inv => inv.to.socketId === socket.id)
          .map(inv => ({
            id: inv.id,
            from: inv.from,
            gameType: inv.gameType,
            timestamp: inv.timestamp
          }));

        callback({ invitations: pendingInvitations });
      });

      // Original game creation and joining logic
      socket.on("create_game", (game: "pong" | "keyclash", mode: "local" | "remote") => {
        const id = Math.random().toString(36).substring(2, 6);

        if (game === "pong") pongRooms.push(new PingPongGame(id, mode, "1v1"));
        else {
          let newKeyClash: state = {
            id: id,
            score1: 0,
            score2: 0,
            prompts: ["-", "-"],
            timeLeft: 20,
            players: [],
            matches: [],
            interval: null,
            player1ready: false,
            player2ready: false,
            p1: undefined,
            p2: undefined,
            status: "waiting",
            mode: mode,
            type: "1v1",
            round: 0,
          }
          keyClashRooms.push(newKeyClash);
        }
        socket.emit("created_game", id, game, mode);
      });
  
      socket.on("join_game", (gameId, game, mode, callback) => {
        if (game === "pong") { 
          const gameRoom = pongRooms.find(g => g.getId() === gameId); 
          if (!gameRoom) return callback({ error: "Game not found" });
          if (gameRoom.state.status !== "waiting") return callback({ error: "Game already started" });                
        }
        else { 
          const gameRoom = keyClashRooms.find(g => g.id === gameId);
          if (!gameRoom) return callback({ error: "Game not found" });
          if (gameRoom.status !== "waiting") return callback({ error: "Game already started" });          
        } 
        // remove player from list of players in lobby
        const i = playersOnline.findIndex(p => p.socketId === socket.id);
        if (i !== -1) playersOnline.splice(i, 1);

        lobbyNamespace.emit("lobby_update", getLobbyState());        

        socket.emit("joined_game", gameId, game, mode);
      });
  
      socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);

        // Cancel all invitations involving this player
        const toCancel = Array.from(activeInvitations.entries()).filter(([id, inv]) => 
          inv.from.socketId === socket.id || inv.to.socketId === socket.id
        );

        toCancel.forEach(([id, inv]) => {
          const otherSocketId = inv.from.socketId === socket.id ? inv.to.socketId : inv.from.socketId;
          const otherSocket = lobbyNamespace.sockets.get(otherSocketId);
          if (otherSocket) {
            otherSocket.emit("invitation_cancelled", { id, reason: "Player disconnected" });
          }
          activeInvitations.delete(id);
        });

        const playerIndex = (playersOnline as LobbyPlayer[]).findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) (playersOnline as LobbyPlayer[]).splice(playerIndex, 1);
  
        lobbyNamespace.emit("lobby_update", getLobbyState());
      });
    });
  }