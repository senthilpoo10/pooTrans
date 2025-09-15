// frontend/src/components/lobby/RallySquadTab.tsx
import React, { useEffect, useState } from "react";
import { 
  getRallySquadData, 
  searchUsers, 
  sendFriendRequest, 
  respondToFriendRequest, 
  removeFriend,
  type RallySquadData,
  type User 
} from "../../utils/lobbyApi";

export const RallySquadTab: React.FC = () => {
  const [rallySquadData, setRallySquadData] = useState<RallySquadData | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    loadRallySquadData();
  }, []);

  const loadRallySquadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRallySquadData();
      setRallySquadData(data);
    } catch (err: any) {
      console.error("Error loading rally squad data:", err);
      setError("Failed to load rally squad data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setSuccessMessage("Friend request sent!");
      setTimeout(() => setSuccessMessage(""), 3000);
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send friend request");
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await respondToFriendRequest(requestId, action);
      setSuccessMessage(`Friend request ${action}ed!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadRallySquadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} friend request`);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      await removeFriend(friendshipId);
      setSuccessMessage("Friend removed");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadRallySquadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove friend");
    }
  };

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
          onClick={() => {
            setError(null);
            loadRallySquadData();
          }} 
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

  const { friends, friendRequests, onlineCount } = rallySquadData;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900 border border-green-700 text-green-100 p-4 rounded-lg">
          {successMessage}
        </div>
      )}

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
            <div className="text-green-200 text-sm">Friends Online</div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Find Friends</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search for users by username or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{user.name}</h4>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Friend Requests ({friendRequests.length})
          </h3>
          <div className="space-y-3">
            {friendRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">{request.sender_username}</h4>
                  <p className="text-gray-400 text-sm">wants to be your friend</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'accept')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'decline')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {friends.map((friend) => (
              <div key={friend.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full absolute -top-1 -right-1 z-10 ${
                      friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{friend.name}</h4>
                    <p className="text-gray-400 text-sm truncate">
                      {friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    disabled={friend.status !== 'online'}
                    className={`flex-1 px-3 py-1 rounded text-sm ${
                      friend.status === 'online' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Challenge
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(friend.friendshipId || friend.id.toString())}
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