
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
// frontend/src/pages/game/playPage.tsx
import React, { useEffect, useRef, useState } from 'react';
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
  const gameCleanupRef = useRef<(() => void) | null>(null);
  const { gameId } = useParams<{ gameId: string }>();
  const { mode } = useParams<{ mode: "local" | "remote" }>();
  const { game } = useParams<{ game: "pong" | "keyclash" }>();
  const { type } = useParams<{ type: "1v1" | "tournament" }>(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for cancel confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [gameHasEnded, setGameHasEnded] = useState(false);

  // ========== CORE CLEANUP FUNCTION ==========
  const clearGameState = () => {
    console.log("🧹 Clearing game state...");
    
    // Clear all localStorage related to current game
    localStorage.removeItem("userInGame");
    localStorage.removeItem("activeGameInfo");
    localStorage.removeItem("currentGameId");
    localStorage.removeItem("gameType");
    
    // Clean up any pairing data (for remote games)
    localStorage.removeItem("pairingData");
    
    // Mark game as ended to prevent multiple cleanups
    setGameHasEnded(true);
    
    console.log("✅ Game state cleared successfully");
  };

  // ========== GAME END DETECTION ==========
  const detectGameEnd = () => {
    // Check if game container has any "game over" indicators
    if (!containerRef.current) return false;

    // Method 1: Check for common game over elements
    const gameOverElements = containerRef.current.querySelectorAll(
      '[class*="game-over"], [class*="winner"], [class*="game-end"], [id*="game-over"], [id*="winner"]'
    );
    
    if (gameOverElements.length > 0) {
      console.log("🏁 Game end detected via DOM elements");
      return true;
    }

    // Method 2: Check for specific text content indicating game end
    const textContent = containerRef.current.textContent || '';
    const gameEndKeywords = ['winner', 'game over', 'match complete', 'victory', 'you win', 'you lose'];
    
    for (const keyword of gameEndKeywords) {
      if (textContent.toLowerCase().includes(keyword)) {
        console.log(`🏁 Game end detected via text: "${keyword}"`);
        return true;
      }
    }

    return false;
  };

  // ========== GAME END MONITORING ==========
  useEffect(() => {
    if (gameHasEnded) return;

    const checkForGameEnd = () => {
      if (detectGameEnd()) {
        console.log("🎯 Game ended naturally - cleaning up...");
        clearGameState();
        
        // Optional: Show brief message before staying on page
        // (user can manually navigate back or use browser back button)
      }
    };

    // Check every 2 seconds for game end
    const gameEndInterval = setInterval(checkForGameEnd, 2000);

    // Also check when DOM changes (using MutationObserver)
    let observer: MutationObserver | null = null;
    
    if (containerRef.current) {
      observer = new MutationObserver((mutations) => {
        // Debounce the check to avoid excessive calls
        setTimeout(checkForGameEnd, 500);
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      clearInterval(gameEndInterval);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [gameHasEnded]);

  // ========== WINDOW/TAB CLOSE DETECTION ==========
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear game state when user closes tab/window
      // This helps prevent stale state when user reopens
      clearGameState();
    };

    const handleVisibilityChange = () => {
      // Optional: Handle when user switches tabs
      // You might want to pause game or mark as inactive
      if (document.hidden) {
        console.log("👁️ Tab became hidden");
      } else {
        console.log("👁️ Tab became visible");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to handle game cancellation
  const handleCancelGame = () => {
    console.log("❌ User cancelled game");
    
    // Clear game state
    clearGameState();
    
    // Clean up game instances
    if (pongInstance.current) {
      pongInstance.current.dispose?.();
      pongInstance.current = null; 
    }
    
    if (gameCleanupRef.current) {
      gameCleanupRef.current();
      gameCleanupRef.current = null;
    }
    
    // Navigate back to appropriate lobby
    const state = location.state as PlayPageLocationState;
    if (state?.isLocal || state?.fromQuickMatch) {
      navigate("/quickmatch-local");
    } else if (state?.isRemote || state?.fromRemoteInvitation) {
      navigate("/quickmatch-remote");
    } else {
      navigate("/lobby");
    }
  };

  const confirmCancelGame = () => {
    setShowCancelModal(false);
    handleCancelGame();
  };

  // ========== GAME INITIALIZATION ==========
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

      // ===== Handle both LOCAL and REMOTE quickmatch games =====
      if (state && 
          ((state.fromQuickMatch && state.isLocal) ||           // Local games
           (state.fromRemoteInvitation && state.isRemote))) {   // Remote games
        
        console.log("🎮 Initializing game from quickmatch:", { 
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
          gameCleanupRef.current = cleanup;
          return cleanup;
        }
      } else {
        // ===== ORIGINAL: Legacy approach for non-quickmatch games =====
        console.log("🎮 Initializing game with legacy approach");
        
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
          gameCleanupRef.current = cleanup;
          return cleanup;
        }
      }
      
      return () => {
        console.log("🧹 Component cleanup - disposing game instances");
        if (pongInstance.current) {
          pongInstance.current.dispose?.();
          pongInstance.current = null; 
        }
        if (gameCleanupRef.current) {
          gameCleanupRef.current();
          gameCleanupRef.current = null;
        }
      }
    } else {
      console.error("❌ Missing required parameters:", { gameId, mode, game, type });
      alert("Invalid game parameters");
      navigate("/");
    }
  }, [gameId, mode, game, type, location, navigate]);

  // ========== ERROR BOUNDARY FOR GAME ROOM NOT FOUND ==========
  useEffect(() => {
    // Listen for any error messages from the game clients
    const handleGameError = (event: any) => {
      if (event.detail && event.detail.includes("Can't find")) {
        console.log("🚨 Game room not found - clearing stale state");
        clearGameState();
      }
    };

    // Custom event listener (if your game clients dispatch these)
    window.addEventListener('gameError', handleGameError);
    
    return () => {
      window.removeEventListener('gameError', handleGameError);
    };
  }, []);

  if (game === "pong") {
    return (
      <div className="relative w-full h-full">
        {/* Cancel Button Overlay */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200"
        >
          ❌ Cancel Game
        </button>

        {/* Game Container */}
        <div ref={containerRef} className="flex-grow relative w-full h-full bg-black" />

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg max-w-md">
              <h3 className="text-xl font-bold mb-4">Cancel Game?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to cancel this game? This action cannot be undone and the game will end immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmCancelGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                >
                  Yes, Cancel Game
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                >
                  Continue Playing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else if (game === "keyclash") {
    return (
      <div className="relative w-full h-full">
        {/* Cancel Button Overlay */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200"
        >
          ❌ Cancel Game
        </button>

        {/* Game Container */}
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

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg max-w-md">
              <h3 className="text-xl font-bold mb-4">Cancel Game?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to cancel this game? This action cannot be undone and the game will end immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmCancelGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                >
                  Yes, Cancel Game
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                >
                  Continue Playing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return null;
  }
};

export default PlayPage;