// import React, { useEffect, useRef } from 'react';
// import PingPongClient from '../../utils/PingPongClient';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import KeyClashClient from '../../utils/keyClashClient';

// const PlayPage: React.FC = () => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const pongInstance = useRef<PingPongClient>(null);
//   const { gameId } = useParams<{ gameId: string }>();
//   const { mode } = useParams<{ mode: "local" | "remote" }>();
//   const { game } = useParams<{ game: "pong" | "keyclash" }>();
//   const { type } = useParams<{ type: "1v1" | "tournament" }>(); 
//   const navigate = useNavigate();
//   const location  = useLocation();

//   useEffect(() => {
//     let name: string | null = null;
//     if (location.state?.name)
//       name = location.state.name;
//     if (containerRef.current && gameId && mode && type && game === "pong") {
//       pongInstance.current = new PingPongClient(containerRef.current, gameId, mode, type, navigate, name);
//       return () => {
//         if (pongInstance.current) {
//           pongInstance.current.dispose?.(); // fix the game dup
//           pongInstance.current = null; 
//         }      
//       }
//     }
//     else if (containerRef.current && gameId && mode && type && game === "keyclash") {
//       const cleanup = KeyClashClient(containerRef.current, gameId, mode, type, navigate, name);
//       return cleanup;
//     }
//     else {
//       alert("No such page");
//       navigate("/");
//     }
//   }, [gameId, mode, game, type, location]);

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
//   else return; 
// };

// export default PlayPage;


import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const PlayPage: React.FC = () => {
  const { game, mode, type, gameId } = useParams<{
    game: string;
    mode: string;
    type: string;
    gameId: string;
  }>();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Get pre-configured data from navigation state (friend's approach)
  const gameData = location.state as {
    user: string;
    guest: string;
    userAvatar: { name: string; image: string };
    guestAvatar: { name: string; image: string };
    gameType: string;
    fromQuickMatch?: boolean;
  };

  useEffect(() => {
    console.log('PlayPage loaded with params:', { game, mode, type, gameId });
    console.log('Game data from navigation:', gameData);
    
    // Validate required parameters
    if (!game || !mode || !type || !gameId) {
      setError('Invalid game parameters');
      return;
    }

    // Validate that we have pre-configured data (friend's approach)
    if (!gameData?.fromQuickMatch || !gameData?.user || !gameData?.guest) {
      console.log('No pre-configured data found, redirecting to quickmatch');
      alert('Please set up players before starting a game');
      navigate('/quickmatch', { replace: true });
      return;
    }

    initializeGame();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [game, mode, type, gameId, gameData, navigate]);

  const initializeGame = () => {
    try {
      // Determine the socket namespace based on game type
      const namespace = game === 'pong' ? '/pong' : '/keyclash';
      
      console.log('Connecting to namespace:', namespace);
      
      socketRef.current = io(namespace, {
        path: '/socket.io',
        transports: ['websocket'],
        secure: true
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to game server');
        setIsConnected(true);
        joinGameRoom();
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from game server');
        setIsConnected(false);
      });

      // When server asks for names, send pre-configured data (friend's approach)
      socketRef.current.on('get_names', (existingPlayers?: any[]) => {
        console.log('Server requesting names, using pre-configured data');
        const names = {
          player1: gameData.user,
          player2: gameData.guest,
          player3: '', // For tournament mode if needed
          player4: ''  // For tournament mode if needed
        };
        console.log('Sending pre-configured names:', names);
        socketRef.current?.emit('names', names);
      });

      // Game state updates
      socketRef.current.on('stateUpdate', (state: any, action?: string) => {
        console.log('Game state update:', state, action);
        setGameState(state);
        if (action === 'start') {
          setIsLoading(false);
        }
      });

      socketRef.current.on('gameState', (state: any) => {
        console.log('Key clash game state:', state);
        setGameState(state);
        setIsLoading(false);
      });

      socketRef.current.on('waiting', (state: any) => {
        console.log('Waiting for players:', state);
        setGameState(state);
        setIsLoading(false);
      });

      socketRef.current.on('gameStart', (state: any) => {
        console.log('Game starting:', state);
        setGameState(state);
        setIsLoading(false);
      });

      socketRef.current.on('gameOver', (state: any) => {
        console.log('Game over:', state);
        setGameState(state);
      });

      socketRef.current.on('refreshPlayerSides', (players: any[]) => {
        console.log('Player sides refreshed:', players);
      });

      socketRef.current.on('disconnection', () => {
        console.log('Game disconnection event');
        setError('Game session ended due to disconnection');
      });

      // Error handling
      socketRef.current.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        setError(`Connection failed: ${error.message}`);
        setIsLoading(false);
      });

      socketRef.current.on('error', (error: any) => {
        console.error('Socket error:', error);
        setError(`Game error: ${error.message}`);
      });

    } catch (error) {
      console.error('Failed to initialize game:', error);
      setError('Failed to initialize game');
      setIsLoading(false);
    }
  };

  const joinGameRoom = () => {
    if (!socketRef.current || !gameId) return;

    console.log('Joining game room:', gameId);
    
    if (type === 'tournament') {
      socketRef.current.emit('join_tournament_room', gameId, (response: any) => {
        if (response?.error) {
          console.error('Failed to join tournament:', response.error);
          setError(response.error);
          setIsLoading(false);
        } else {
          console.log('Successfully joined tournament');
        }
      });
    } else {
      socketRef.current.emit('join_game_room', gameId, (response: any) => {
        if (response?.error) {
          console.error('Failed to join game:', response.error);
          setError(response.error);
          setIsLoading(false);
        } else {
          console.log('Successfully joined game');
        }
      });
    }
  };

  const handleBackToQuickMatch = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    navigate('/quickmatch');
  };

  // Handle keyboard events for game controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!socketRef.current || !gameState || gameState.status !== 'in-progress') return;

      if (game === 'keyclash') {
        socketRef.current.emit('keypress', { key: event.key });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!socketRef.current || !gameState) return;

      if (game === 'pong') {
        if (event.key === 'Escape') {
          socketRef.current.emit('pause');
        }
        if (event.key === ' ' && (gameState.status === 'starting' || gameState.status === 'paused')) {
          event.preventDefault();
          socketRef.current.emit('setReady');
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game, gameState]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
          <p className="text-gray-400">
            {game === 'pong' ? '🏓 Ping Pong' : '⌨️ Key Clash'} • {mode} Mode
          </p>
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          {gameData && (
            <div className="mt-4 text-sm text-gray-500">
              {gameData.user} vs {gameData.guest}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleBackToQuickMatch}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Back to Quick Match
          </button>
        </div>
      </div>
    );
  }

  // Render game interface
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToQuickMatch}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Quick Match
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {game === 'pong' ? '🏓 Ping Pong' : '⌨️ Key Clash'}
              </h1>
              <p className="text-gray-400 text-sm">
                {mode} Mode • Room: {gameId}
              </p>
              {gameData && (
                <p className="text-gray-500 text-xs">
                  {gameData.user} vs {gameData.guest}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Player Display (using pre-configured data) */}
          {gameData && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-400 mx-auto mb-2">
                    <img 
                      src={gameData.userAvatar.image} 
                      alt={gameData.userAvatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-blue-400 text-lg">{gameData.user}</h3>
                  <p className="text-sm text-gray-400 capitalize">{gameData.userAvatar.name}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-400 mx-auto mb-2">
                    <img 
                      src={gameData.guestAvatar.image} 
                      alt={gameData.guestAvatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-pink-400 text-lg">{gameData.guest}</h3>
                  <p className="text-sm text-gray-400 capitalize">{gameData.guestAvatar.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Display */}
          {gameState ? (
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-2">
                  Game Status: <span className="capitalize">{gameState.status}</span>
                </h2>
                {gameState.scoreDisplay && (
                  <p className="text-lg">{gameState.scoreDisplay}</p>
                )}
                {gameState.timerDisplay && (
                  <p className="text-gray-400">{gameState.timerDisplay}</p>
                )}
                {gameState.matchInfo && (
                  <p className="text-yellow-400 mt-2">{gameState.matchInfo}</p>
                )}
              </div>

              {/* Player Information */}
              {gameState.players && gameState.players.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Players in Game:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gameState.players.map((player: any, index: number) => (
                      <div key={player.id || index} className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="font-medium">{player.name}</p>
                        {player.side && (
                          <p className="text-sm text-gray-400">Side: {player.side}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Canvas/Display Area */}
              <div className="bg-black rounded-lg min-h-[400px] flex items-center justify-center">
                {gameState.status === 'waiting' && (
                  <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-xl">Waiting for players...</p>
                    {mode === 'remote' && (
                      <p className="text-gray-400 mt-2">
                        Share room ID: <span className="font-mono text-blue-400">{gameId}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {gameState.status === 'starting' && (
                  <div className="text-center">
                    <div className="text-4xl mb-4">🚀</div>
                    <p className="text-xl">Get ready to play!</p>
                    {mode === 'local' && (
                      <p className="text-gray-400 mt-2">Press SPACE to start</p>
                    )}
                    {mode === 'remote' && (
                      <p className="text-gray-400 mt-2">Waiting for all players to be ready...</p>
                    )}
                  </div>
                )}
                
                {gameState.status === 'in-progress' && (
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎮</div>
                    <p className="text-xl">Game in progress!</p>
                    <div className="text-gray-400 mt-2">
                      {game === 'pong' && (
                        <p>Use mouse to control paddle • Press ESC to pause</p>
                      )}
                      {game === 'keyclash' && (
                        <p>Use WASD and Arrow Keys • Match the prompts!</p>
                      )}
                    </div>
                    {game === 'keyclash' && gameState.prompts && (
                      <div className="mt-4">
                        <div className="flex justify-center gap-8 text-2xl font-mono">
                          <div className="bg-blue-600 px-4 py-2 rounded">
                            {gameData.user}: {gameState.prompts[0]}
                          </div>
                          <div className="bg-pink-600 px-4 py-2 rounded">
                            {gameData.guest}: {gameState.prompts[1]}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {gameState.status === 'paused' && (
                  <div className="text-center">
                    <div className="text-4xl mb-4">⏸️</div>
                    <p className="text-xl">Game Paused</p>
                    <p className="text-gray-400 mt-2">Press ESC to resume</p>
                  </div>
                )}
                
                {gameState.status === 'finished' && (
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-xl">Game finished!</p>
                    {gameState.matchInfo && (
                      <p className="text-yellow-400 mt-2">{gameState.matchInfo}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Game Controls */}
              <div className="mt-6 flex justify-center gap-4">
                {gameState.status === 'starting' && mode === 'remote' && (
                  <button
                    onClick={() => socketRef.current?.emit('setReady')}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
                  >
                    Ready to Play
                  </button>
                )}
                
                {gameState.status === 'starting' && mode === 'local' && (
                  <button
                    onClick={() => socketRef.current?.emit('setReady')}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
                  >
                    Start Game
                  </button>
                )}
                
                {gameState.status === 'finished' && (
                  <button
                    onClick={() => socketRef.current?.emit('restart')}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
                  >
                    Play Again
                  </button>
                )}
                
                {gameState.status === 'in-progress' && game === 'pong' && mode === 'local' && (
                  <button
                    onClick={() => socketRef.current?.emit('pause')}
                    className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-semibold"
                  >
                    Pause Game
                  </button>
                )}
              </div>

              {/* Tournament Information */}
              {type === 'tournament' && gameState.matches && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Tournament Bracket:</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    {gameState.matches.map((match: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-gray-600 rounded">
                        <span className="font-medium">
                          {match.player1.name} vs {match.player2.name}
                        </span>
                        {match.winner && (
                          <span className="ml-4 text-green-400">
                            Winner: {match.winner.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-xl">Connecting to game...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayPage;