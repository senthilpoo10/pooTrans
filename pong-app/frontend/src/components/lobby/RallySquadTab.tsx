// pong-app/frontend/src/components/RallySquadTab.tsx
import React, { useEffect, useState } from 'react';
import { lobbyApi, RallySquadData, useLobbyData, LeaderboardData } from '../utils/lobbyApi';
import { LoadingSpinner } from './general/LoadingSpinner';

export const RallySquadTab: React.FC = () => {
  const [rallySquadData, setRallySquadData] = useState<RallySquadData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard' | 'recent'>('friends');
  const { isLoading, error, fetchWithErrorHandling } = useLobbyData();

  useEffect(() => {
    const loadData = async () => {
      const [rallyData, leaderData] = await Promise.all([
        fetchWithErrorHandling(() => lobbyApi.getRallySquad()),
        fetchWithErrorHandling(() => lobbyApi.getLeaderboard())
      ]);
      
      if (rallyData) setRallySquadData(rallyData);
      if (leaderData) setLeaderboardData(leaderData);
    };

    loadData();
  }, []);

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      const result = await fetchWithErrorHandling(() => lobbyApi.removeFriend(friendId));
      if (result) {
        // Refresh the data
        const updatedData = await fetchWithErrorHandling(() => lobbyApi.getRallySquad());
        if (updatedData) setRallySquadData(updatedData);
      }
    }
  };

  if (isLoading && !rallySquadData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !rallySquadData) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Rally Squad</h3>
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

  if (!rallySquadData) {
    return <div className="text-gray-400">No data available</div>;
  }

  const { friends, recentOpponents, onlineCount } = rallySquadData;

  return (
    <div className="space-y-6">
      {/* Header with Online Count */}
      <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Rally Squad</h2>
            <p className="text-green-200">Connect with friends and find new opponents</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{onlineCount}</div>
            <div className="text-green-200 text-sm">Players Online</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'friends', label: 'Friends', icon: '👥', count: friends.length },
          { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', count: null },
          { id: 'recent', label: 'Recent Players', icon: '🕒', count: recentOpponents.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Friends ({friends.length})</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              + Add Friend
            </button>
          </div>
          
          {friends.length > 0 ? (
            <div className="grid gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {friend.avatarUrl ? (
                          <img 
                            src={friend.avatarUrl} 
                            alt={friend.name} 
                            className="h-12 w-12 rounded-full object-cover" 
                          />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Online indicator (would be real-time with WebSocket) */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-700 rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-white font-medium">{friend.name}</div>
                      <div className="text-gray-400 text-sm">
                        Friends since {new Date(friend.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm">
                      Challenge
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
                      Message
                    </button>
                    <button 
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h4 className="text-xl font-semibold text-white mb-2">No Friends Yet</h4>
              <p className="text-gray-400 mb-6">Start building your rally squad by adding friends!</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                Find Friends
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Global Leaderboard</h3>
          
          {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboardData.leaderboard.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-800 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-600 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-yellow-700 to-yellow-800' :
                    'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {player.avatarUrl ? (
                        <img 
                          src={player.avatarUrl} 
                          alt={player.name} 
                          className="h-12 w-12 rounded-full object-cover" 
                        />
                      ) : (
                        player.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center space-x-2">
                        <span>{player.name}</span>
                        {index < 3 && (
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {player.wins} wins • {player.totalMatches} total games
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{player.winRate}%</div>
                    <div className="text-gray-300 text-sm">Win Rate</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h4 className="text-xl font-semibold text-white mb-2">Leaderboard Loading...</h4>
              <p className="text-gray-400">Check back soon to see the top players!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Opponents</h3>
          
          {recentOpponents.length > 0 ? (
            <div className="grid gap-4">
              {recentOpponents.map((opponent) => (
                <div key={opponent.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {opponent.avatarUrl ? (
                        <img 
                          src={opponent.avatarUrl} 
                          alt={opponent.name} 
                          className="h-12 w-12 rounded-full object-cover" 
                        />
                      ) : (
                        opponent.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{opponent.name}</div>
                      <div className="text-gray-400 text-sm">Recent opponent</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm">
                      Rematch
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
                      Add Friend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🕒</div>
              <h4 className="text-xl font-semibold text-white mb-2">No Recent Opponents</h4>
              <p className="text-gray-400 mb-6">Play some matches to see your recent opponents here!</p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg">
                Find Match
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
            <span className="text-2xl">⚡</span>
            <span className="text-sm">Quick Match</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
            <span className="text-2xl">🏆</span>
            <span className="text-sm">Tournament</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
            <span className="text-2xl">🔍</span>
            <span className="text-sm">Find Players</span>
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
            <span className="text-2xl">💬</span>
            <span className="text-sm">Chat Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};