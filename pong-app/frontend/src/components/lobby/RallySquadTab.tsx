import React, { useState, useEffect } from 'react';
import { 
  searchUsers, 
  sendFriendRequest, 
  respondToFriendRequest,
  removeFriend, 
  getFriendRequests,
  getFriends,
  User, 
  Friend, 
  FriendRequest 
} from '../../utils/friendApi';

export const RallySquadTab = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Live search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleLiveSearch();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load all data from database
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [users, requests, friendsData] = await Promise.all([
        searchUsers(searchQuery || ''),
        getFriendRequests(),
        getFriends()
      ]);
      setAllUsers(users);
      setFriendRequests(requests);
      setFriends(friendsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage('Failed to load data. Please try refreshing.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle live search as user types
  const handleLiveSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setAllUsers(results);
    } catch (error) {
      console.error('Live search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setMessage('Friend request sent!');
      setSentRequests(prev => [...prev, userId]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to send friend request:', error);
      setMessage('Failed to send friend request.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await respondToFriendRequest(requestId, 'accept');
      setMessage(`You are now friends with ${senderName}!`);
      
      // Remove from requests and refresh friends
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Refresh friends data to get updated list
      const updatedFriends = await getFriends();
      setFriends(updatedFriends);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      setMessage('Failed to accept friend request.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Decline friend request
  const handleDeclineRequest = async (requestId: string, senderName: string) => {
    try {
      await respondToFriendRequest(requestId, 'decline');
      setMessage(`Declined friend request from ${senderName}.`);
      
      // Remove from requests immediately
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      setMessage('Failed to decline friend request.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    
    try {
      await removeFriend(friendshipId);
      setMessage(`Removed ${friendName} from friends.`);
      
      // Refresh friends data
      const updatedFriends = await getFriends();
      setFriends(updatedFriends);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setMessage('Failed to remove friend.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Refresh all data from database
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [users, requests, friendsData] = await Promise.all([
        searchUsers(searchQuery),
        getFriendRequests(),
        getFriends()
      ]);
      setAllUsers(users);
      setFriendRequests(requests);
      setFriends(friendsData);
      setSentRequests([]); // Clear pending states
      setMessage('Data refreshed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setMessage('Failed to refresh data.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search and show all users
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Determine user's friend status
  const getUserFriendStatus = (user: User) => {
    // Check if user is already a friend
    const friend = friends.find(f => f.id === user.id);
    if (friend) {
      return {
        status: 'Accepted',
        type: 'friend',
        friendshipId: friend.friendshipId,
        bgColor: 'bg-green-500'
      };
    }

    // Check if there's an incoming friend request from this user
    const incomingRequest = friendRequests.find(r => r.sender_username === user.name);
    if (incomingRequest) {
      return {
        status: 'Incoming Request',
        type: 'incoming',
        requestId: incomingRequest.id,
        senderName: user.name,
        bgColor: 'bg-blue-500'
      };
    }

    // Check if we sent a request to this user
    if (sentRequests.includes(user.id)) {
      return {
        status: 'Pending',
        type: 'pending',
        bgColor: 'bg-yellow-500'
      };
    }

    // Default: no relationship
    return {
      status: 'Not Connected',
      type: 'none',
      bgColor: 'bg-gray-500'
    };
  };

  // Render action buttons based on user status
  const renderActionButton = (user: User) => {
    const friendStatus = getUserFriendStatus(user);

    switch (friendStatus.type) {
      case 'friend':
        return (
          <button 
            onClick={() => handleRemoveFriend(friendStatus.friendshipId!, user.name)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Remove Friend
          </button>
        );
      case 'incoming':
        return (
          <div className="flex gap-1">
            <button 
              onClick={() => handleAcceptRequest(friendStatus.requestId!, friendStatus.senderName!)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
            >
              Accept
            </button>
            <button 
              onClick={() => handleDeclineRequest(friendStatus.requestId!, friendStatus.senderName!)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
            >
              Decline
            </button>
          </div>
        );
      case 'pending':
        return (
          <span className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Pending
          </span>
        );
      case 'none':
        return (
          <button 
            onClick={() => handleSendRequest(user.id)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Add Friend
          </button>
        );
      default:
        return null;
    }
  };

  // Get status badge color for online status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 text-white';
      case 'in-game':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // The component state and functions are now ready
  // All data is fetched directly from the database
  // No dependency on parent component props
  
  // You can now add your return JSX here...


  return (
    <div className="max-w-6xl mx-auto">
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md text-center">
          {message}
          <button onClick={() => setMessage('')} className="ml-2 text-blue-500 hover:text-blue-700">×</button>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-300">Rally Squad</h2>
        
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users by name or email... (live search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setSearchQuery('');
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
          >
            Clear
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="bg-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-600">
              <tr>
                <th className="text-left p-4 font-semibold w-2/5">User</th>
                <th className="text-left p-4 font-semibold w-1/5">Online Status</th>
                <th className="text-left p-4 font-semibold w-1/5">Friend Status</th>
                <th className="p-4 w-1/5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : allUsers.length > 0 ? (
                allUsers.map((user, index) => {
                  const friendStatus = getUserFriendStatus(user);
                  return (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-650'}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.online_status || 'offline')}`}>
                          {user.online_status || 'offline'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${friendStatus.bgColor}`}>
                          {friendStatus.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {renderActionButton(user)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    {searchQuery ? `No users found for "${searchQuery}"` : 'No users available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
