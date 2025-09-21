// frontend/src/components/shared/GameStatusBanner.tsx
import React, { useState, useEffect } from 'react';

interface GameInfo {
  player1: string;
  player2: string;
  gameType: 'pong' | 'keyclash';
  mode: 'local' | 'remote';
  gameId: string;
  startTime: number;
}

interface GameStatusBannerProps {
  isInGame: boolean;
  gameInfo?: GameInfo | null;
  onReturnToGame: () => void;
  onEndGame: () => void;
}

export const GameStatusBanner: React.FC<GameStatusBannerProps> = ({
  isInGame,
  gameInfo,
  onReturnToGame,
  onEndGame
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('0:00');

  const formatGameType = (type: string) => {
    return type === 'pong' ? 'Ping Pong' : 'Key Clash';
  };

  const getElapsedTime = () => {
    if (!gameInfo) return '0:00';
    const elapsed = Math.floor((Date.now() - gameInfo.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isInGame || !gameInfo) {
      setElapsedTime('0:00');
      return;
    }

    const updateTime = () => {
      setElapsedTime(getElapsedTime());
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isInGame, gameInfo]);

  if (!isInGame || !gameInfo) return null;

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          🎮 <span className="font-medium">Game Active</span>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span className="font-bold text-lg">🎮 Game In Progress</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatGameType(gameInfo.gameType)}</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs uppercase">
                  {gameInfo.mode}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span>👤 {gameInfo.player1}</span>
                <span className="text-yellow-300">VS</span>
                <span>👤 {gameInfo.player2}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span>⏱️ {elapsedTime}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span>🏠 Room: {gameInfo.gameId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToGame}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              ↩️ Return to Game
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end the game? This action cannot be undone.')) {
                  onEndGame();
                }
              }}
              className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              🛑 End Game
            </button>
            
            <button
              onClick={() => setIsMinimized(true)}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
              title="Minimize banner"
            >
              ➖
            </button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>{formatGameType(gameInfo.gameType)} ({gameInfo.mode})</div>
          <div>⏱️ {elapsedTime}</div>
          <div className="col-span-2">👤 {gameInfo.player1} VS {gameInfo.player2}</div>
          <div className="col-span-2">🏠 Room: {gameInfo.gameId}</div>
        </div>
      </div>
    </div>
  );
};