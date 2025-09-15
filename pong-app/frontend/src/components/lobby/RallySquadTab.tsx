// frontend/src/components/lobby/RallySquadTab.tsx
import React, { useEffect, useState } from "react";
import { lobbyApi, useLobbyData } from "../../utils/lobbyApi";

export const RallySquadTab: React.FC = () => {
  const [rallySquadData, setRallySquadData] = useState<any>(null);
  const { isLoading, error, fetchWithErrorHandling } = useLobbyData();

  useEffect(() => {
    const loadRallySquadData = async () => {
      const data = await fetchWithErrorHandling(() => lobbyApi.getRallySquad());
      if (data) {
        setRallySquadData(data);
      }
    };

    loadRallySquadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
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

  const { friends, onlineCount } = rallySquadData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-teal-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Rally Squad</h2>
            <p className="text-green-200">
              Connect with friends and challenge them to matches
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{onlineCount}</div>
            <div className="text-green-200 text-sm">Players Online</div>
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Friends ({friends.length})
        </h3>
        
        {friends.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">👥</div>
            <p>No friends yet</p>
            <p className="text-sm">Add some friends to build your squad!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend: any) => (
              <div key={friend.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full absolute -top-1 -right-1 z-10 ${
                      friend.online_status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{friend.name}</h4>
                    <p className="text-gray-400 text-sm truncate">
                      {friend.online_status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    disabled={friend.online_status !== 'online'}
                    className={`flex-1 px-3 py-1 rounded text-sm ${
                      friend.online_status === 'online' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Challenge
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};