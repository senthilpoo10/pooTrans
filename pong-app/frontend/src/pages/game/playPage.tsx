
// // frontend/src/pages/game/playPage.tsx
// import React, { useEffect, useRef } from 'react';
// import PingPongClient from '../../utils/PingPongClient';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import KeyClashClient from '../../utils/keyClashClient';

// interface PlayPageLocationState {
//   user: string;
//   guest: string;
//   userAvatar: { name: string; image: string };
//   guestAvatar: { name: string; image: string };
//   gameType: "pong" | "keyclash";
//   mode: "local" | "remote";
//   type: "1v1" | "tournament";
//   fromQuickMatch: boolean;
//   isLocal: boolean;
//   gameId: string;
// }

// const PlayPage: React.FC = () => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const pongInstance = useRef<PingPongClient>(null);
//   const { gameId } = useParams<{ gameId: string }>();
//   const { mode } = useParams<{ mode: "local" | "remote" }>();
//   const { game } = useParams<{ game: "pong" | "keyclash" }>();
//   const { type } = useParams<{ type: "1v1" | "tournament" }>(); 
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (containerRef.current && gameId && mode && type && game) {
//       // Extract player names from location state if coming from quickmatch
//       const state = location.state as PlayPageLocationState;
//       let playerNames: { player1: string | null, player2: string | null, player3: string | null, player4: string | null } = {
//         player1: null,
//         player2: null,
//         player3: null,
//         player4: null
//       };

//       if (state?.fromQuickMatch && state.isLocal) {
//         // Use names from quickmatch page
//         playerNames.player1 = state.user;
//         playerNames.player2 = state.guest;
        
//         if (game === "pong") {
//           pongInstance.current = new PingPongClient(
//             containerRef.current, 
//             gameId, 
//             mode, 
//             type, 
//             navigate, 
//             playerNames // Pass the names object instead of single name
//           );
//         } else if (game === "keyclash") {
//           const cleanup = KeyClashClient(
//             containerRef.current, 
//             gameId, 
//             mode, 
//             type, 
//             navigate, 
//             playerNames // Pass the names object instead of single name
//           );
//           return cleanup;
//         }
//       } else {
//         // Original logic for non-quickmatch games
//         let name: string | null = null;
//         if (location.state?.name) {
//           name = location.state.name;
//         }
        
//         if (game === "pong") {
//           pongInstance.current = new PingPongClient(
//             containerRef.current, 
//             gameId, 
//             mode, 
//             type, 
//             navigate, 
//             name
//           );
//         } else if (game === "keyclash") {
//           const cleanup = KeyClashClient(
//             containerRef.current, 
//             gameId, 
//             mode, 
//             type, 
//             navigate, 
//             name
//           );
//           return cleanup;
//         }
//       }
      
//       return () => {
//         if (pongInstance.current) {
//           pongInstance.current.dispose?.();
//           pongInstance.current = null; 
//         }      
//       }
//     } else {
//       alert("No such page");
//       navigate("/");
//     }
//   }, [gameId, mode, game, type, location, navigate]);

//   if (game === "pong")
//     return <div ref={containerRef} className="flex-grow relative w-full h-full bg-black" />;
//   else if (game === "keyclash")
//     return (
//       <div ref={containerRef} className="game-container">
//         <div className="players-row">
//           <div className="player" id="p1">
//             <div id="prompt1">-</div>
//             <div id="score1">Score: 0</div>
//           </div>
//           <div className="player" id="p2">
//             <div id="prompt2">-</div>
//             <div id="score2">Score: 0</div>
//           </div>
//         </div>
    
//         <div id="timer">Time Left: 20s</div>
//         <div id="start-prompt">Press SPACE to Start</div>
//       </div>
//     );
//   else return null; 
// };

// export default PlayPage;



// frontend/src/pages/game/playPage.tsx
import React, { useEffect, useRef } from 'react';
import PingPongClient from '../../utils/PingPongClient';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import KeyClashClient from '../../utils/keyClashClient';

interface PlayPageLocationState {
  user: string;
  guest: string;
  userAvatar: { name: string; image: string };
  guestAvatar: { name: string; image: string };
  gameType: "pong" | "keyclash";
  mode: "local" | "remote";
  type: "1v1" | "tournament";
  fromQuickMatch?: boolean;        // <- For local games
  fromRemoteInvitation?: boolean;  // <- For remote games  
  isLocal?: boolean;
  isRemote?: boolean;
  gameId: string;
  yourSide?: "left" | "right";
}

const PlayPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pongInstance = useRef<PingPongClient>(null);
  const { gameId } = useParams<{ gameId: string }>();
  const { mode } = useParams<{ mode: "local" | "remote" }>();
  const { game } = useParams<{ game: "pong" | "keyclash" }>();
  const { type } = useParams<{ type: "1v1" | "tournament" }>(); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (containerRef.current && gameId && mode && type && game) {
      // Extract player names from location state
      const state = location.state as PlayPageLocationState;
      let playerNames: { player1: string | null, player2: string | null, player3: string | null, player4: string | null } = {
        player1: null,
        player2: null,
        player3: null,
        player4: null
      };

      // ===== NEW: Handle both LOCAL and REMOTE quickmatch games =====
      if (state && 
          ((state.fromQuickMatch && state.isLocal) ||           // Local games
           (state.fromRemoteInvitation && state.isRemote))) {   // Remote games
        
        console.log("Using names from quickmatch:", { 
          user: state.user, 
          guest: state.guest, 
          mode: mode,
          isLocal: state.isLocal,
          isRemote: state.isRemote 
        });
        
        // Use names from quickmatch page (both local and remote)
        playerNames.player1 = state.user;
        playerNames.player2 = state.guest;
        
        if (game === "pong") {
          pongInstance.current = new PingPongClient(
            containerRef.current, 
            gameId, 
            mode, 
            type, 
            navigate, 
            playerNames // Pass the names object instead of single name
          );
        } else if (game === "keyclash") {
          const cleanup = KeyClashClient(
            containerRef.current, 
            gameId, 
            mode, 
            type, 
            navigate, 
            playerNames // Pass the names object instead of single name
          );
          return cleanup;
        }
      } else {
        // ===== ORIGINAL: Legacy approach for non-quickmatch games =====
        console.log("Using legacy single name approach");
        
        let name: string | null = null;
        if (location.state?.name) {
          name = location.state.name;
        }
        
        if (game === "pong") {
          pongInstance.current = new PingPongClient(
            containerRef.current, 
            gameId, 
            mode, 
            type, 
            navigate, 
            name
          );
        } else if (game === "keyclash") {
          const cleanup = KeyClashClient(
            containerRef.current, 
            gameId, 
            mode, 
            type, 
            navigate, 
            name
          );
          return cleanup;
        }
      }
      
      return () => {
        if (pongInstance.current) {
          pongInstance.current.dispose?.();
          pongInstance.current = null; 
        }      
      }
    } else {
      console.error("Missing required parameters:", { gameId, mode, game, type });
      alert("Invalid game parameters");
      navigate("/");
    }
  }, [gameId, mode, game, type, location, navigate]);

  if (game === "pong")
    return <div ref={containerRef} className="flex-grow relative w-full h-full bg-black" />;
  else if (game === "keyclash")
    return (
      <div ref={containerRef} className="game-container">
        <div className="players-row">
          <div className="player" id="p1">
            <div id="prompt1">-</div>
            <div id="score1">Score: 0</div>
          </div>
          <div className="player" id="p2">
            <div id="prompt2">-</div>
            <div id="score2">Score: 0</div>
          </div>
        </div>
    
        <div id="timer">Time Left: 20s</div>
        <div id="start-prompt">Press SPACE to Start</div>
      </div>
    );
  else return null; 
};

export default PlayPage;