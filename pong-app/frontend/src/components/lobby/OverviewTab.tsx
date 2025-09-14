// pong-app/frontend/src/components/OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import { lobbyApi, OverviewData, useLobbyData } from '../utils/lobbyApi';
import { LoadingSpinner } from './general/LoadingSpinner';

export const OverviewTab: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const { isLoading, error, fetchWithErrorHandling } = useLobbyData();

  useEffect(() => {
    const loadOverviewData = async () => {
      const data = await fetchWithErrorHandling(() => lobbyApi.getOverview());
      if (data) {
        setOverviewData(data);
      }
    };

    loadOverviewData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Overview</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overviewData) {
    return <div className="text-gray-400">No data available</div>;
  }

  const { user, stats, recentMatches, friendsCount } = overviewData;

  return (
    <div className="space-y-6">
      {/* User Welcome Section */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back, {user.name}!</h2>
            <p className="text-blue-200">
              Member since {new Date(user.memberSince || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className="text-gray-400 text-sm">Wins</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className="text-gray-400 text-sm">Losses</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalMatches}</div>
          <div className="text-gray-400 text-sm">Total Games</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.winRate}%</div>
          <div className="text-gray-400 text-sm">Win Rate</div>
        </div>
      </div>

      {/* Quick Stats and Friends */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Performance Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Matches:</span>
              <span className="text-white font-medium">{stats.totalMatches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Win Streak:</span>
              <span className="text-green-400 font-medium">
                {/* Calculate current win streak from recent matches */}
                {(() => {
                  let streak = 0;
                  for (const match of recentMatches) {
                    if (match.isUserWinner) streak++;
                    else break;
                  }
                  return streak;
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Friends:</span>
              <span className="text-blue-400 font-medium">{friendsCount}</span>
            </div>
          </div>
          
          {/* Win Rate Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-white">{stats.winRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.winRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Recent Matches</h3>
          <div className="space-y-3">
            {recentMatches.length > 0 ? (
              recentMatches.slice(0, 5).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${match.isUserWinner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <div className="text-white text-sm">
                        vs {match.player1.id === user.id ? match.player2.name : match.player1.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${match.isUserWinner ? 'text-green-400' : 'text-red-400'}`}>
                    {match.isUserWinner ? 'W' : 'L'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-8">
                <div className="text-4xl mb-2">🏓</div>
                <p>No matches played yet</p>
                <p className="text-sm">Start playing to see your history!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors">
            🎯 Quick Match
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors">
            🏆 Tournament
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors">
            👥 Find Friends
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors">
            📊 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};