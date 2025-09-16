// // frontend/src/components/lobby/RallySquadTab.tsx
// import React, { useState, useEffect } from 'react';
// import { 
//   getRallySquadData, 
//   searchUsers, 
//   sendFriendRequest, 
//   respondToFriendRequest, 
//   removeFriend,
//   getFriendRequests,
//   getEnhancedFriends,
//   type RallySquadData,
//   type User,
//   type FriendRequest,
//   type Friend
// } from '../../utils/lobbyApi';

// export const RallySquadTab = () => {
//   // State management
//   const [searchQuery, setSearchQuery] = useState('');
//   const [allUsers, setAllUsers] = useState<User[]>([]);
//   const [friends, setFriends] = useState<Friend[]>([]);
//   const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
//   const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string>("");
//   const [showOnlineOnly, setShowOnlineOnly] = useState(true);

//   // Live search with debouncing
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       handleLiveSearch();
//     }, 500);
//     return () => clearTimeout(timeoutId);
//   }, [searchQuery]);

//   // Load all data on component mount
//   useEffect(() => {
//     loadAllData();
    
//     // Refresh data every 30 seconds to get updated online status
//     const interval = setInterval(loadAllData, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   // Load all data from database
//   const loadAllData = async () => {
//     setIsLoading(true);
//     try {
//       const rallySquadData = await getRallySquadData();
//       const users = await searchUsers(searchQuery || '');
      
//       // Remove duplicates based on user ID
//       const uniqueUsers = users.filter((user, index, self) => 
//         index === self.findIndex(u => u.id === user.id)
//       );
      
//       setAllUsers(uniqueUsers);
//       setFriends(rallySquadData.friends);
//       setFriendRequests(rallySquadData.friendRequests);
//       setSentRequests(rallySquadData.sentRequests);
//       setError(null);
//     } catch (error) {
//       console.error('Failed to load data:', error);
//       setError('Failed to load data. Please try refreshing.');
//       setTimeout(() => setError(null), 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle live search as user types
//   const handleLiveSearch = async () => {
//     setIsSearching(true);
//     try {
//       const results = await searchUsers(searchQuery);
      
//       // Remove duplicates
//       const uniqueResults = results.filter((user, index, self) => 
//         index === self.findIndex(u => u.id === user.id)
//       );
      
//       setAllUsers(uniqueResults);
//     } catch (error) {
//       console.error('Live search failed:', error);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleSendFriendRequest = async (userId: string) => {
//     try {
//       console.log('Sending friend request to user ID:', userId);
//       await sendFriendRequest(userId);
//       setSuccessMessage("Friend request sent!");
//       setTimeout(() => setSuccessMessage(""), 3000);
//       // Refresh data to get updated state
//       await loadAllData();
//     } catch (err: any) {
//       console.error('Send friend request error:', err);
//       setError(err.response?.data?.error || "Failed to send friend request");
//       setTimeout(() => setError(null), 3000);
//     }
//   };

//   const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
//     try {
//       await respondToFriendRequest(requestId, action);
//       setSuccessMessage(`Friend request ${action}ed!`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//       await loadAllData(); // Refresh data
//     } catch (err: any) {
//       setError(err.response?.data?.error || `Failed to ${action} friend request`);
//       setTimeout(() => setError(null), 3000);
//     }
//   };

//   const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
//     if (!confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    
//     try {
//       await removeFriend(friendshipId);
//       setSuccessMessage(`Removed ${friendName} from friends`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//       await loadAllData(); // Refresh data
//     } catch (err: any) {
//       setError(err.response?.data?.error || "Failed to remove friend");
//       setTimeout(() => setError(null), 3000);
//     }
//   };

//   // Refresh all data
//   const handleRefresh = async () => {
//     await loadAllData();
//     setSuccessMessage('Data refreshed successfully!');
//     setTimeout(() => setSuccessMessage(""), 3000);
//   };

//   // Determine user's friend status
//   const getUserFriendStatus = (user: User) => {
//     // Check if user is already a friend
//     const friend = friends.find(f => f.id.toString() === user.id.toString());
//     if (friend) {
//       return {
//         status: 'Friend',
//         type: 'friend',
//         friendshipId: friend.friendshipId || friend.id.toString(),
//         bgColor: 'bg-green-500'
//       };
//     }

//     // Check if there's an INCOMING friend request from this user (they sent to me)
//     const incomingRequest = friendRequests.find(r => r.sender_username === user.name);
//     if (incomingRequest) {
//       return {
//         status: 'Incoming Request',
//         type: 'incoming',
//         requestId: incomingRequest.id,
//         senderName: user.name,
//         bgColor: 'bg-blue-500'
//       };
//     }

//     // Check if I sent a request TO this user (outgoing)
//     const outgoingRequest = sentRequests.find(r => r.receiver_username === user.name);
//     if (outgoingRequest) {
//       return {
//         status: 'Request Sent',
//         type: 'pending',
//         bgColor: 'bg-yellow-500'
//       };
//     }

//     // Default: no relationship
//     return {
//       status: 'Not a Friend',
//       type: 'none',
//       bgColor: 'bg-purple-500'
//     };
//   };

//   // Render action buttons based on user status
//   const renderActionButton = (user: User) => {
//     const friendStatus = getUserFriendStatus(user);

//     switch (friendStatus.type) {
//       case 'friend':
//         return (
//           <button 
//             onClick={() => handleRemoveFriend(friendStatus.friendshipId!, user.name)}
//             className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
//           >
//             Remove Friend
//           </button>
//         );
//       case 'incoming':
//         return (
//           <div className="flex gap-1">
//             <button 
//               onClick={() => handleRespondToRequest(friendStatus.requestId!, 'accept')}
//               className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Accept
//             </button>
//             <button 
//               onClick={() => handleRespondToRequest(friendStatus.requestId!, 'decline')}
//               className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Decline
//             </button>
//           </div>
//         );
//       case 'pending':
//         return (
//           <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
//             Request Sent
//           </span>
//         );
//       case 'none':
//         return (
//           <button 
//             onClick={() => handleSendFriendRequest(user.id.toString())}
//             className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded text-sm"
//           >
//             Add Friend
//           </button>
//         );
//       default:
//         return null;
//     }
//   };

//   // Get status info for display
//   const getStatusInfo = (status: string) => {
//     switch (status) {
//       case 'online':
//         return { color: 'bg-green-500', text: 'Online', textColor: 'text-green-400' };
//       case 'in-game':
//         return { color: 'bg-yellow-500', text: 'In Game', textColor: 'text-yellow-400' };
//       default:
//         return { color: 'bg-gray-500', text: 'Offline', textColor: 'text-gray-400' };
//     }
//   };

//   // Get status badge styling
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'online':
//         return 'bg-green-500 text-white';
//       case 'in-game':
//         return 'bg-yellow-500 text-black';
//       default:
//         return 'bg-gray-500 text-white';
//     }
//   };

//   // Filter users based on current settings
//   const getFilteredUsers = () => {
//     let filtered = allUsers;
    
//     if (showOnlineOnly && !searchQuery.trim()) {
//       filtered = allUsers.filter(user => user.online_status === 'online');
//     }
    
//     return filtered;
//   };

//   const filteredUsers = getFilteredUsers();
//   const onlineUsers = allUsers.filter(user => user.online_status === 'online');
//   const totalUsers = allUsers.length;

//   if (error && allUsers.length === 0) {
//     return (
//       <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
//         <h3 className="font-bold mb-2">Error Loading Rally Squad</h3>
//         <p>{error}</p>
//         <button 
//           onClick={() => {
//             setError(null);
//             loadAllData();
//           }} 
//           className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       {/* Success Message */}
//       {successMessage && (
//         <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-center">
//           {successMessage}
//           <button onClick={() => setSuccessMessage('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
//         </div>
//       )}

//       {/* Error Message */}
//       {error && (
//         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
//           {error}
//           <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
//         </div>
//       )}

//       <div className="bg-gray-800 rounded-xl p-6">
//         <h2 className="text-3xl font-bold mb-6 text-center text-purple-300">Rally Squad</h2>
        
//         {/* Stats Header */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//           <div className="text-center">
//             <div className="text-2xl font-bold text-white">{onlineUsers.length}</div>
//             <div className="text-purple-200 text-sm">Online Now</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-white">{friends.length}</div>
//             <div className="text-purple-200 text-sm">Friends</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-white">{friendRequests.length}</div>
//             <div className="text-purple-200 text-sm">Requests</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-white">{totalUsers}</div>
//             <div className="text-purple-200 text-sm">Total Players</div>
//           </div>
//         </div>
        
//         {/* Search Controls */}
//         <div className="flex gap-2 mb-6">
//           <div className="relative flex-1">
//             <input
//               type="text"
//               placeholder="Search users by name or email... (live search)"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400"
//             />
//             {isSearching && (
//               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                 <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
//               </div>
//             )}
//           </div>
//           {!searchQuery.trim() && (
//             <div className="flex items-center space-x-4">
//               <label className="flex items-center space-x-2 text-gray-300">
//                 <input
//                   type="checkbox"
//                   checked={showOnlineOnly}
//                   onChange={(e) => setShowOnlineOnly(e.target.checked)}
//                   className="rounded"
//                 />
//                 <span className="text-sm">Online Only</span>
//               </label>
//             </div>
//           )}
//           <button 
//             onClick={() => {
//               setSearchQuery('');
//             }}
//             className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
//           >
//             Clear
//           </button>
//           <button 
//             onClick={handleRefresh}
//             disabled={isLoading}
//             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg"
//           >
//             {isLoading ? 'Loading...' : 'Refresh'}
//           </button>
//         </div>

//         {/* Users Table */}
//         <div className="bg-gray-700 rounded-xl overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-gray-600">
//               <tr>
//                 <th className="text-left p-4 font-semibold w-2/5">User</th>
//                 <th className="text-left p-4 font-semibold w-1/5">Online Status</th>
//                 <th className="text-left p-4 font-semibold w-1/5">Friend Status</th>
//                 <th className="p-4 w-1/5"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading && allUsers.length === 0 ? (
//                 <tr>
//                   <td colSpan={4} className="p-8 text-center text-gray-400">
//                     Loading users...
//                   </td>
//                 </tr>
//               ) : filteredUsers.length > 0 ? (
//                 filteredUsers.map((user, index) => {
//                   const friendStatus = getUserFriendStatus(user);
//                   const statusInfo = getStatusInfo(user.online_status || 'offline');
//                   return (
//                     <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-650'}>
//                       <td className="p-4">
//                         <div className="flex items-center gap-3">
//                           <div className="relative">
//                             <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
//                               {user.name.charAt(0).toUpperCase()}
//                             </div>
//                             <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-700 ${statusInfo.color}`}></div>
//                           </div>
//                           <div>
//                             <div className="font-semibold">{user.name}</div>
//                             <div className="text-sm text-gray-400">{user.email}</div>
//                             {user.createdAt && (
//                               <div className="text-xs text-gray-500">
//                                 Joined {new Date(user.createdAt).toLocaleDateString()}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.online_status || 'offline')}`}>
//                           {statusInfo.text}
//                         </span>
//                       </td>
//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${friendStatus.bgColor}`}>
//                           {friendStatus.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right">
//                         {renderActionButton(user)}
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="p-8 text-center text-gray-400">
//                     {searchQuery ? `No users found for "${searchQuery}"` : 'No users available.'}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Debug Info */}
//         <div className="mt-4 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
//           <p className="font-semibold mb-2">Debug Info:</p>
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             <div>Total Users: {totalUsers}</div>
//             <div>Filtered Users: {filteredUsers.length}</div>
//             <div>Online Users: {onlineUsers.length}</div>
//             <div>Friends: {friends.length}</div>
//             <div>Requests: {friendRequests.length}</div>
//           </div>
//           <div className="mt-2 text-xs text-gray-400">
//             <div>Search Query: "{searchQuery}"</div>
//             <div>Show Online Only: {showOnlineOnly.toString()}</div>
//             <div>Sent Requests: {sentRequests.length}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };





// import React, { useState, useEffect } from 'react';
// import { 
//   searchUsers, 
//   sendFriendRequest, 
//   respondToFriendRequest,
//   removeFriend, 
//   getFriendRequests,
//   getFriends,
//   User, 
//   Friend, 
//   FriendRequest 
// } from '../../utils/friendApi';

// export const RallySquadTab = () => {
//   // State management
//   const [searchQuery, setSearchQuery] = useState('');
//   const [allUsers, setAllUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [friends, setFriends] = useState<Friend[]>([]);
//   const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [message, setMessage] = useState('');
//   const [sentRequests, setSentRequests] = useState<string[]>([]);

//   // Load all data on component mount
//   useEffect(() => {
//     loadAllData();
//   }, []);

//   // Live search with debouncing - filters locally from already loaded data
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       handleLocalSearch();
//     }, 300); // 300ms debounce for smoother typing
    
//     return () => clearTimeout(timeoutId);
//   }, [searchQuery, allUsers]);

//   // Load all data from database
//   const loadAllData = async () => {
//     setIsLoading(true);
//     try {
//       const [users, requests, friendsData] = await Promise.all([
//         searchUsers(''), // Get all users initially
//         getFriendRequests(),
//         getFriends()
//       ]);
//       setAllUsers(users);
//       setFilteredUsers(users); // Initially show all users
//       setFriendRequests(requests);
//       setFriends(friendsData);
//     } catch (error) {
//       console.error('Failed to load data:', error);
//       setMessage('Failed to load data. Please try refreshing.');
//       setTimeout(() => setMessage(''), 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle local search filtering (no API call)
//   const handleLocalSearch = () => {
//     setIsSearching(true);
    
//     let results = allUsers;
    
//     // Filter by search query
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       results = results.filter(user => 
//         user.name.toLowerCase().includes(query) ||
//         user.email.toLowerCase().includes(query)
//       );
//     }
    
//     setFilteredUsers(results);
//     setIsSearching(false);
//   };

//   // Send friend request
//   const handleSendRequest = async (userId: string) => {
//     try {
//       await sendFriendRequest(userId);
//       setMessage('Friend request sent!');
//       setSentRequests(prev => [...prev, userId]);
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       console.error('Failed to send friend request:', error);
//       setMessage('Failed to send friend request.');
//       setTimeout(() => setMessage(''), 3000);
//     }
//   };

//   // Accept friend request
//   const handleAcceptRequest = async (requestId: string, senderName: string) => {
//     try {
//       await respondToFriendRequest(requestId, 'accept');
//       setMessage(`You are now friends with ${senderName}!`);
      
//       // Remove from requests and refresh friends
//       setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
//       // Refresh friends data to get updated list
//       const updatedFriends = await getFriends();
//       setFriends(updatedFriends);
      
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       console.error('Failed to accept friend request:', error);
//       setMessage('Failed to accept friend request.');
//       setTimeout(() => setMessage(''), 3000);
//     }
//   };

//   // Decline friend request
//   const handleDeclineRequest = async (requestId: string, senderName: string) => {
//     try {
//       await respondToFriendRequest(requestId, 'decline');
//       setMessage(`Declined friend request from ${senderName}.`);
      
//       // Remove from requests immediately
//       setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       console.error('Failed to decline friend request:', error);
//       setMessage('Failed to decline friend request.');
//       setTimeout(() => setMessage(''), 3000);
//     }
//   };

//   // Remove friend
//   const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
//     if (!confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    
//     try {
//       await removeFriend(friendshipId);
//       setMessage(`Removed ${friendName} from friends.`);
      
//       // Refresh friends data
//       const updatedFriends = await getFriends();
//       setFriends(updatedFriends);
      
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       console.error('Failed to remove friend:', error);
//       setMessage('Failed to remove friend.');
//       setTimeout(() => setMessage(''), 3000);
//     }
//   };

//   // Refresh all data from database
//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       const [users, requests, friendsData] = await Promise.all([
//         searchUsers(''), // Get all users
//         getFriendRequests(),
//         getFriends()
//       ]);
//       setAllUsers(users);
//       setFilteredUsers(users);
//       setFriendRequests(requests);
//       setFriends(friendsData);
//       setSentRequests([]); // Clear pending states
//       setMessage('Data refreshed successfully!');
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       console.error('Failed to refresh data:', error);
//       setMessage('Failed to refresh data.');
//       setTimeout(() => setMessage(''), 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Clear search and show all users
//   const handleClearSearch = () => {
//     setSearchQuery('');
//   };

//   // Determine user's friend status
//   const getUserFriendStatus = (user: User) => {
//     // Check if user is already a friend
//     const friend = friends.find(f => f.id === user.id);
//     if (friend) {
//       return {
//         status: 'Accepted',
//         type: 'friend',
//         friendshipId: friend.friendshipId,
//         bgColor: 'bg-green-500'
//       };
//     }

//     // Check if there's an incoming friend request from this user
//     const incomingRequest = friendRequests.find(r => r.sender_username === user.name);
//     if (incomingRequest) {
//       return {
//         status: 'Incoming Request',
//         type: 'incoming',
//         requestId: incomingRequest.id,
//         senderName: user.name,
//         bgColor: 'bg-blue-500'
//       };
//     }

//     // Check if we sent a request to this user
//     if (sentRequests.includes(user.id)) {
//       return {
//         status: 'Pending',
//         type: 'pending',
//         bgColor: 'bg-yellow-500'
//       };
//     }

//     // Default: no relationship
//     return {
//       status: 'Not Connected',
//       type: 'none',
//       bgColor: 'bg-gray-500'
//     };
//   };

//   // Render action buttons based on user status
//   const renderActionButton = (user: User) => {
//     const friendStatus = getUserFriendStatus(user);

//     switch (friendStatus.type) {
//       case 'friend':
//         return (
//           <button 
//             onClick={() => handleRemoveFriend(friendStatus.friendshipId!, user.name)}
//             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
//           >
//             Remove Friend
//           </button>
//         );
//       case 'incoming':
//         return (
//           <div className="flex gap-1">
//             <button 
//               onClick={() => handleAcceptRequest(friendStatus.requestId!, friendStatus.senderName!)}
//               className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
//             >
//               Accept
//             </button>
//             <button 
//               onClick={() => handleDeclineRequest(friendStatus.requestId!, friendStatus.senderName!)}
//               className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
//             >
//               Decline
//             </button>
//           </div>
//         );
//       case 'pending':
//         return (
//           <span className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
//             Pending
//           </span>
//         );
//       case 'none':
//         return (
//           <button 
//             onClick={() => handleSendRequest(user.id)}
//             className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
//           >
//             Add Friend
//           </button>
//         );
//       default:
//         return null;
//     }
//   };

//   // Get status badge color for online status
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'online':
//         return 'bg-green-500 text-white';
//       case 'in-game':
//         return 'bg-yellow-500 text-black';
//       default:
//         return 'bg-gray-500 text-white';
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto">
//       {message && (
//         <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md text-center">
//           {message}
//           <button onClick={() => setMessage('')} className="ml-2 text-blue-500 hover:text-blue-700">×</button>
//         </div>
//       )}

//       <div className="bg-gray-800 rounded-xl p-6">
//         <h2 className="text-3xl font-bold mb-6 text-center text-purple-300">Rally Squad</h2>
        
//         <div className="flex gap-2 mb-6">
//           <div className="relative flex-1">
//             <input
//               type="text"
//               placeholder="Search users by name or email... (live search)"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400"
//             />
//             {isSearching && (
//               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                 <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
//               </div>
//             )}
//           </div>
//           <button 
//             onClick={() => {
//               setSearchQuery('');
//             }}
//             className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
//           >
//             Clear
//           </button>
//           <button 
//             onClick={handleRefresh}
//             disabled={isLoading}
//             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg"
//           >
//             {isLoading ? 'Loading...' : 'Refresh'}
//           </button>
//         </div>

//         <div className="bg-gray-700 rounded-xl overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-gray-600">
//               <tr>
//                 <th className="text-left p-4 font-semibold w-2/5">User</th>
//                 <th className="text-left p-4 font-semibold w-1/5">Online Status</th>
//                 <th className="text-left p-4 font-semibold w-1/5">Friend Status</th>
//                 <th className="p-4 w-1/5"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <td colSpan={4} className="p-8 text-center text-gray-400">
//                     Loading users...
//                   </td>
//                 </tr>
//               ) : filteredUsers.length > 0 ? (
//                 filteredUsers.map((user, index) => {
//                   const friendStatus = getUserFriendStatus(user);
//                   return (
//                     <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-650'}>
//                       <td className="p-4">
//                         <div className="flex items-center gap-3">
//                           <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
//                             {user.name.charAt(0).toUpperCase()}
//                           </div>
//                           <div>
//                             <div className="font-semibold">{user.name}</div>
//                             <div className="text-sm text-gray-400">{user.email}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.online_status || 'offline')}`}>
//                           {user.online_status || 'offline'}
//                         </span>
//                       </td>
//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${friendStatus.bgColor}`}>
//                           {friendStatus.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right">
//                         {renderActionButton(user)}
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="p-8 text-center text-gray-400">
//                     {searchQuery ? `No users found for "${searchQuery}"` : 'No users available.'}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };



// frontend/src/components/lobby/RallySquadTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  getRallySquadData, 
  searchUsers, 
  sendFriendRequest, 
  respondToFriendRequest, 
  removeFriend,
  getFriendRequests,
  getEnhancedFriends,
  type RallySquadData,
  type User,
  type FriendRequest,
  type Friend
} from '../../utils/lobbyApi';

export const RallySquadTab = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(true);

  // Live search with debouncing - This provides the dynamic search as you type
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleLiveSearch();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
    
    // Refresh data every 30 seconds to get updated online status
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load all data from database
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const rallySquadData = await getRallySquadData();
      const users = await searchUsers(searchQuery || '');
      
      // Remove duplicates based on user ID
      const uniqueUsers = users.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      setAllUsers(uniqueUsers);
      setFriends(rallySquadData.friends);
      setFriendRequests(rallySquadData.friendRequests);
      setSentRequests(rallySquadData.sentRequests);
      setError(null);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data. Please try refreshing.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle live search as user types - This provides the dynamic search functionality
  const handleLiveSearch = async () => {
    if (searchQuery.trim() === '') {
      // If search query is empty, load all data
      await loadAllData();
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      
      // Remove duplicates
      const uniqueResults = results.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      setAllUsers(uniqueResults);
    } catch (error) {
      console.error('Live search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      console.log('Sending friend request to user ID:', userId);
      await sendFriendRequest(userId);
      setSuccessMessage("Friend request sent!");
      setTimeout(() => setSuccessMessage(""), 3000);
      // Refresh data to get updated state
      await loadAllData();
    } catch (err: any) {
      console.error('Send friend request error:', err);
      setError(err.response?.data?.error || "Failed to send friend request");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await respondToFriendRequest(requestId, action);
      setSuccessMessage(`Friend request ${action}ed!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadAllData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} friend request`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    
    try {
      await removeFriend(friendshipId);
      setSuccessMessage(`Removed ${friendName} from friends`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadAllData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove friend");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    await loadAllData();
    setSuccessMessage('Data refreshed successfully!');
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Determine user's friend status
  const getUserFriendStatus = (user: User) => {
    // Check if user is already a friend
    const friend = friends.find(f => f.id.toString() === user.id.toString());
    if (friend) {
      return {
        status: 'Friend',
        type: 'friend',
        friendshipId: friend.friendshipId || friend.id.toString(),
        bgColor: 'bg-green-500'
      };
    }

    // Check if there's an INCOMING friend request from this user (they sent to me)
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

    // Check if I sent a request TO this user (outgoing)
    const outgoingRequest = sentRequests.find(r => r.receiver_username === user.name);
    if (outgoingRequest) {
      return {
        status: 'Request Sent',
        type: 'pending',
        bgColor: 'bg-yellow-500'
      };
    }

    // Default: no relationship
    return {
      status: 'Not a Friend',
      type: 'none',
      bgColor: 'bg-purple-500'
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
          >
            Remove Friend
          </button>
        );
      case 'incoming':
        return (
          <div className="flex gap-1">
            <button 
              onClick={() => handleRespondToRequest(friendStatus.requestId!, 'accept')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Accept
            </button>
            <button 
              onClick={() => handleRespondToRequest(friendStatus.requestId!, 'decline')}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Decline
            </button>
          </div>
        );
      case 'pending':
        return (
          <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
            Request Sent
          </span>
        );
      case 'none':
        return (
          <button 
            onClick={() => handleSendFriendRequest(user.id.toString())}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded text-sm"
          >
            Add Friend
          </button>
        );
      default:
        return null;
    }
  };

  // Get status info for display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online':
        return { color: 'bg-green-500', text: 'Online', textColor: 'text-green-400' };
      case 'in-game':
        return { color: 'bg-yellow-500', text: 'In Game', textColor: 'text-yellow-400' };
      default:
        return { color: 'bg-gray-500', text: 'Offline', textColor: 'text-gray-400' };
    }
  };

  // Get status badge styling
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

  // Filter users based on current settings
  const getFilteredUsers = () => {
    let filtered = allUsers;
    
    if (showOnlineOnly && !searchQuery.trim()) {
      filtered = allUsers.filter(user => user.online_status === 'online');
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const onlineUsers = allUsers.filter(user => user.online_status === 'online');
  const totalUsers = allUsers.length;

  if (error && allUsers.length === 0) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Rally Squad</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            loadAllData();
          }} 
          className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-center">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-300">🤝 Rally Squad</h2>
        
        {/* Stats Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{onlineUsers.length}</div>
            <div className="text-purple-200 text-sm">Online Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{friends.length}</div>
            <div className="text-purple-200 text-sm">Friends</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{friendRequests.length}</div>
            <div className="text-purple-200 text-sm">Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <div className="text-purple-200 text-sm">Total Players</div>
          </div>
        </div>
        
        {/* Search Controls */}
        <div className="flex gap-2 mb-6 my-5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
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
          {!searchQuery.trim() && (
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Online Only</span>
              </label>
            </div>
          )}
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

        {/* Users Table */}
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
              {isLoading && allUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const friendStatus = getUserFriendStatus(user);
                  const statusInfo = getStatusInfo(user.online_status || 'offline');
                  return (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-650'}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-700 ${statusInfo.color}`}></div>
                          </div>
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            {user.createdAt && (
                              <div className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.online_status || 'offline')}`}>
                          {statusInfo.text}
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