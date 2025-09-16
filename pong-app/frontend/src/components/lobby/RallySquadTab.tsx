// // frontend/src/components/lobby/RallySquadTab.tsx
// import React, { useEffect, useState } from "react";
// import { 
//   getRallySquadData, 
//   searchUsers, 
//   sendFriendRequest, 
//   respondToFriendRequest, 
//   removeFriend,
//   type RallySquadData,
//   type User 
// } from "../../utils/lobbyApi";

// export const RallySquadTab: React.FC = () => {
//   const [rallySquadData, setRallySquadData] = useState<RallySquadData | null>(null);
//   const [searchResults, setSearchResults] = useState<User[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string>("");

//   useEffect(() => {
//     loadRallySquadData();
//   }, []);

//   const loadRallySquadData = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const data = await getRallySquadData();
//       setRallySquadData(data);
//     } catch (err: any) {
//       console.error("Error loading rally squad data:", err);
//       setError("Failed to load rally squad data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSearch = async (query: string) => {
//     setSearchQuery(query);
//     if (query.trim().length < 2) {
//       setSearchResults([]);
//       return;
//     }

//     try {
//       setIsSearching(true);
//       const results = await searchUsers(query);
//       setSearchResults(results);
//     } catch (err) {
//       console.error("Search failed:", err);
//       setError("Search failed");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleSendFriendRequest = async (userId: string) => {
//     try {
//       await sendFriendRequest(userId);
//       setSuccessMessage("Friend request sent!");
//       setTimeout(() => setSuccessMessage(""), 3000);
//       // Remove user from search results
//       setSearchResults(prev => prev.filter(user => user.id !== userId));
//     } catch (err: any) {
//       setError(err.response?.data?.error || "Failed to send friend request");
//     }
//   };

//   const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
//     try {
//       await respondToFriendRequest(requestId, action);
//       setSuccessMessage(`Friend request ${action}ed!`);
//       setTimeout(() => setSuccessMessage(""), 3000);
//       await loadRallySquadData(); // Refresh data
//     } catch (err: any) {
//       setError(err.response?.data?.error || `Failed to ${action} friend request`);
//     }
//   };

//   const handleRemoveFriend = async (friendshipId: string) => {
//     if (!confirm("Are you sure you want to remove this friend?")) return;
    
//     try {
//       await removeFriend(friendshipId);
//       setSuccessMessage("Friend removed");
//       setTimeout(() => setSuccessMessage(""), 3000);
//       await loadRallySquadData(); // Refresh data
//     } catch (err: any) {
//       setError(err.response?.data?.error || "Failed to remove friend");
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
//         <h3 className="font-bold mb-2">Error Loading Rally Squad</h3>
//         <p>{error}</p>
//         <button 
//           onClick={() => {
//             setError(null);
//             loadRallySquadData();
//           }} 
//           className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   if (!rallySquadData) {
//     return <div className="text-gray-400">No data available</div>;
//   }

//   const { friends, friendRequests, onlineCount } = rallySquadData;

//   return (
//     <div className="space-y-6">
//       {/* Success Message */}
//       {successMessage && (
//         <div className="bg-green-900 border border-green-700 text-green-100 p-4 rounded-lg">
//           {successMessage}
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-gradient-to-r from-green-800 to-teal-800 rounded-lg p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-bold text-white">Your Rally Squad</h2>
//             <p className="text-green-200">
//               Connect with friends and challenge them to matches
//             </p>
//           </div>
//           <div className="text-center">
//             <div className="text-3xl font-bold text-white">{onlineCount}</div>
//             <div className="text-green-200 text-sm">Friends Online</div>
//           </div>
//         </div>
//       </div>

//       {/* Search Section */}
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-xl font-semibold mb-4 text-white">Find Friends</h3>
//         <div className="space-y-4">
//           <input
//             type="text"
//             placeholder="Search for users by username or email..."
//             value={searchQuery}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
          
//           {isSearching && (
//             <div className="text-center py-4">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
//             </div>
//           )}

//           {searchResults.length > 0 && (
//             <div className="space-y-2">
//               {searchResults.map(user => (
//                 <div key={user.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
//                   <div>
//                     <h4 className="text-white font-medium">{user.name}</h4>
//                     <p className="text-gray-400 text-sm">{user.email}</p>
//                   </div>
//                   <button
//                     onClick={() => handleSendFriendRequest(user.id)}
//                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//                   >
//                     Add Friend
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Friend Requests */}
//       {friendRequests.length > 0 && (
//         <div className="bg-gray-800 rounded-lg p-6">
//           <h3 className="text-xl font-semibold mb-4 text-white">
//             Friend Requests ({friendRequests.length})
//           </h3>
//           <div className="space-y-3">
//             {friendRequests.map(request => (
//               <div key={request.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
//                 <div>
//                   <h4 className="text-white font-medium">{request.sender_username}</h4>
//                   <p className="text-gray-400 text-sm">wants to be your friend</p>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleRespondToRequest(request.id, 'accept')}
//                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
//                   >
//                     Accept
//                   </button>
//                   <button
//                     onClick={() => handleRespondToRequest(request.id, 'decline')}
//                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
//                   >
//                     Decline
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Friends List */}
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-xl font-semibold mb-4 text-white">
//           Friends ({friends.length})
//         </h3>
        
//         {friends.length === 0 ? (
//           <div className="text-center py-12 text-gray-400">
//             <div className="text-4xl mb-4">👥</div>
//             <p>No friends yet</p>
//             <p className="text-sm">Add some friends to build your squad!</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {friends.map((friend) => (
//               <div key={friend.id} className="bg-gray-700 rounded-lg p-4">
//                 <div className="flex items-center space-x-3 mb-3">
//                   <div className="relative">
//                     <div className={`w-3 h-3 rounded-full absolute -top-1 -right-1 z-10 ${
//                       friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
//                     }`}></div>
//                     <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
//                       {friend.name.charAt(0).toUpperCase()}
//                     </div>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <h4 className="text-white font-medium truncate">{friend.name}</h4>
//                     <p className="text-gray-400 text-sm truncate">
//                       {friend.status === 'online' ? 'Online' : 'Offline'}
//                     </p>
//                   </div>
//                 </div>
                
//                 <div className="flex space-x-2">
//                   <button
//                     disabled={friend.status !== 'online'}
//                     className={`flex-1 px-3 py-1 rounded text-sm ${
//                       friend.status === 'online' 
//                         ? 'bg-blue-600 hover:bg-blue-700 text-white' 
//                         : 'bg-gray-600 text-gray-400 cursor-not-allowed'
//                     }`}
//                   >
//                     Challenge
//                   </button>
//                   <button
//                     onClick={() => handleRemoveFriend(friend.friendshipId || friend.id.toString())}
//                     className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };


// // frontend/src/components/lobby/RallySquadTab.tsx
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
//   const [friends, setFriends] = useState<Friend[]>([]);
//   const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [message, setMessage] = useState('');
//   const [sentRequests, setSentRequests] = useState<string[]>([]);
//   const [showOnlineOnly, setShowOnlineOnly] = useState(true);

//   // Load all data on component mount
//   useEffect(() => {
//     loadAllData();
    
//     // Refresh data every 30 seconds to get updated online status
//     const interval = setInterval(loadAllData, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   // Live search with debouncing
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (searchQuery.trim()) {
//         handleLiveSearch();
//       } else {
//         // When search is cleared, reload all users
//         loadAllUsers();
//       }
//     }, 500);
//     return () => clearTimeout(timeoutId);
//   }, [searchQuery]);

//   // Load all data from database
//   const loadAllData = async () => {
//     setIsLoading(true);
//     try {
//       const [requests, friendsData] = await Promise.all([
//         getFriendRequests(),
//         getFriends()
//       ]);
      
//       setFriendRequests(requests);
//       setFriends(friendsData);
      
//       // Load users (all users by default)
//       await loadAllUsers();
      
//     } catch (error) {
//       console.error('Failed to load data:', error);
//       setMessage('Failed to load data. Please try refreshing.');
//       setTimeout(() => setMessage(''), 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Load all users and separate online/offline
//   const loadAllUsers = async () => {
//     try {
//       const users = await searchUsers(''); // Get all users
//       setAllUsers(users);
//     } catch (error) {
//       console.error('Failed to load users:', error);
//     }
//   };

//   // Handle live search as user types
//   const handleLiveSearch = async () => {
//     if (!searchQuery.trim()) return;
    
//     setIsSearching(true);
//     try {
//       const results = await searchUsers(searchQuery);
//       setAllUsers(results);
//     } catch (error) {
//       console.error('Live search failed:', error);
//     } finally {
//       setIsSearching(false);
//     }
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
//       await loadAllData();
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

//   // Determine user's friend status
//   const getUserFriendStatus = (user: User) => {
//     // Check if user is already a friend
//     const friend = friends.find(f => f.id.toString() === user.id);
//     if (friend) {
//       return {
//         status: 'Friend',
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
//         status: 'Request Sent',
//         type: 'pending',
//         bgColor: 'bg-yellow-500'
//       };
//     }

//     // Default: no relationship
//     return {
//       status: 'Add Friend',
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
//           <div className="flex gap-2">
//             <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
//               Message
//             </button>
//             <button 
//               onClick={() => handleRemoveFriend(friendStatus.friendshipId!, user.name)}
//               className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Remove
//             </button>
//           </div>
//         );
//       case 'incoming':
//         return (
//           <div className="flex gap-1">
//             <button 
//               onClick={() => handleAcceptRequest(friendStatus.requestId!, friendStatus.senderName!)}
//               className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Accept
//             </button>
//             <button 
//               onClick={() => handleDeclineRequest(friendStatus.requestId!, friendStatus.senderName!)}
//               className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
//             >
//               Decline
//             </button>
//           </div>
//         );
//       case 'pending':
//         return (
//           <span className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
//             Pending
//           </span>
//         );
//       case 'none':
//         return (
//           <button 
//             onClick={() => handleSendRequest(user.id)}
//             className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
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

//   return (
//     <div className="space-y-6">
//       {/* Success/Error Message */}
//       {message && (
//         <div className="bg-blue-900 border border-blue-700 text-blue-100 p-4 rounded-lg">
//           <div className="flex justify-between items-center">
//             <span>{message}</span>
//             <button onClick={() => setMessage('')} className="text-blue-300 hover:text-white">×</button>
//           </div>
//         </div>
//       )}

//       {/* Header Section */}
//       <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-3xl font-bold text-white">Rally Squad</h2>
//             <p className="text-purple-200">Connect with players and build your network</p>
//           </div>
//           <div className="flex items-center space-x-6">
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{onlineUsers.length}</div>
//               <div className="text-purple-200 text-sm">Online Now</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{friends.length}</div>
//               <div className="text-purple-200 text-sm">Friends</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{friendRequests.length}</div>
//               <div className="text-purple-200 text-sm">Requests</div>
//             </div>
//             <button 
//               onClick={handleRefresh}
//               disabled={isLoading}
//               className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//             >
//               {isLoading ? 'Refreshing...' : 'Refresh'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Search and Filter Controls */}
//       <div className="bg-gray-800 rounded-lg p-4">
//         <div className="flex gap-4 items-center">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Search users by name or email..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 border border-gray-600 focus:border-purple-500 focus:outline-none"
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
//                 <span>Show Online Only</span>
//               </label>
//             </div>
//           )}
          
//           {searchQuery.trim() && (
//             <button 
//               onClick={() => setSearchQuery('')}
//               className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Users List */}
//       <div className="bg-gray-800 rounded-lg">
//         <div className="p-4 border-b border-gray-700">
//           <h3 className="text-xl font-semibold text-white">
//             {searchQuery.trim() 
//               ? `Search Results (${filteredUsers.length})` 
//               : showOnlineOnly 
//                 ? `Online Players (${filteredUsers.length})` 
//                 : `All Players (${filteredUsers.length})`
//             }
//           </h3>
//         </div>
        
//         <div className="divide-y divide-gray-700">
//           {isLoading ? (
//             <div className="p-8 text-center text-gray-400">
//               <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent mx-auto mb-4"></div>
//               Loading players...
//             </div>
//           ) : filteredUsers.length > 0 ? (
//             filteredUsers.map((user) => {
//               const friendStatus = getUserFriendStatus(user);
//               const statusInfo = getStatusInfo(user.online_status || 'offline');
              
//               return (
//                 <div key={user.id} className="p-4 hover:bg-gray-700 transition-colors">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       {/* Avatar with online indicator */}
//                       <div className="relative">
//                         <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
//                           {user.name.charAt(0).toUpperCase()}
//                         </div>
//                         <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${statusInfo.color}`}></div>
//                       </div>
                      
//                       {/* User info */}
//                       <div>
//                         <h4 className="text-lg font-semibold text-white">{user.name}</h4>
//                         <p className="text-sm text-gray-400">{user.email}</p>
//                         <div className="flex items-center space-x-3 mt-1">
//                           <span className={`text-xs ${statusInfo.textColor}`}>
//                             {statusInfo.text}
//                           </span>
//                           {user.createdAt && (
//                             <span className="text-xs text-gray-500">
//                               Joined {new Date(user.createdAt).toLocaleDateString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Status and actions */}
//                     <div className="flex items-center space-x-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${friendStatus.bgColor}`}>
//                         {friendStatus.status}
//                       </span>
//                       {renderActionButton(user)}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <div className="p-8 text-center text-gray-400">
//               <div className="text-4xl mb-4">👥</div>
//               {searchQuery.trim() 
//                 ? `No users found for "${searchQuery}"` 
//                 : showOnlineOnly 
//                   ? 'No players are currently online' 
//                   : 'No players found'
//               }
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Debug Info (remove in production) */}
//       <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
//         <p className="font-semibold mb-2">Debug Info:</p>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <div>Total Users: {totalUsers}</div>
//           <div>Online Users: {onlineUsers.length}</div>
//           <div>Friends: {friends.length}</div>
//           <div>Friend Requests: {friendRequests.length}</div>
//         </div>
//       </div>
//     </div>
//   );
// };



// // frontend/src/components/lobby/RallySquadTab.tsx
// import React, { useState, useEffect } from 'react';
// import { 
//   getRallySquadData, 
//   searchUsers, 
//   sendFriendRequest, 
//   respondToFriendRequest, 
//   removeFriend,
//   type RallySquadData,
//   type User 
// } from '../../utils/lobbyApi';

// export const RallySquadTab = () => {
//   // State management
//   const [searchQuery, setSearchQuery] = useState('');
//   const [allUsers, setAllUsers] = useState<User[]>([]);
//   const [rallySquadData, setRallySquadData] = useState<RallySquadData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string>("");
//   const [showOnlineOnly, setShowOnlineOnly] = useState(true);

//   // Load all data on component mount
//   useEffect(() => {
//     loadRallySquadData();
    
//     // Refresh data every 30 seconds to get updated online status
//     const interval = setInterval(loadRallySquadData, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   // Live search with debouncing
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (searchQuery.trim()) {
//         handleLiveSearch();
//       } else {
//         loadAllUsers();
//       }
//     }, 500);
//     return () => clearTimeout(timeoutId);
//   }, [searchQuery]);

//   const loadRallySquadData = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const data = await getRallySquadData();
//       setRallySquadData(data);
      
//       // Also load all users to show everyone
//       await loadAllUsers();
      
//     } catch (err: any) {
//       console.error("Error loading rally squad data:", err);
//       setError("Failed to load rally squad data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Load all users with duplicate prevention
//   const loadAllUsers = async () => {
//     try {
//       const users = await searchUsers(''); // Get all users
//       console.log('Loaded users:', users);
      
//       // Remove duplicates based on user ID
//       const uniqueUsers = users.filter((user, index, self) => 
//         index === self.findIndex(u => u.id === user.id)
//       );
      
//       console.log('Unique users after deduplication:', uniqueUsers);
//       setAllUsers(uniqueUsers);
//     } catch (error) {
//       console.error('Failed to load users:', error);
//       setError('Failed to load users');
//     }
//   };

//   // Handle live search with duplicate prevention
//   const handleLiveSearch = async () => {
//     if (!searchQuery.trim()) return;
    
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
//       setError('Search failed');
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
//       await loadRallySquadData();
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
//       await loadRallySquadData(); // Refresh data
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
//       await loadRallySquadData(); // Refresh data
//     } catch (err: any) {
//       setError(err.response?.data?.error || "Failed to remove friend");
//       setTimeout(() => setError(null), 3000);
//     }
//   };

//   // Refresh all data
//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       await loadRallySquadData();
//       setSuccessMessage('Data refreshed successfully!');
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (error) {
//       console.error('Failed to refresh data:', error);
//       setError('Failed to refresh data');
//       setTimeout(() => setError(null), 3000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fixed: Determine user's friend status
//   const getUserFriendStatus = (user: User) => {
//     if (!rallySquadData) return { status: 'Loading...', type: 'none', bgColor: 'bg-gray-500' };

//     // Check if user is already a friend
//     const friend = rallySquadData.friends.find(f => f.id.toString() === user.id.toString());
//     if (friend) {
//       return {
//         status: 'Friend',
//         type: 'friend',
//         friendshipId: friend.friendshipId || friend.id.toString(),
//         bgColor: 'bg-green-500'
//       };
//     }

//     // Check if there's an INCOMING friend request from this user (they sent to me)
//     const incomingRequest = rallySquadData.friendRequests.find(r => r.sender_username === user.name);
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
//     const outgoingRequest = rallySquadData.sentRequests.find(r => r.receiver_username === user.name);
//     if (outgoingRequest) {
//       return {
//         status: 'Request Sent',
//         type: 'pending',
//         bgColor: 'bg-yellow-500'
//       };
//     }

//     // Default: no relationship
//     return {
//       status: 'Not Friend',
//       type: 'none',
//       bgColor: 'bg-purple-500'
//     };
//   };

//   // Simplified: Render action buttons based on user status
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

//   if (error && !rallySquadData) {
//     return (
//       <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
//         <h3 className="font-bold mb-2">Error Loading Rally Squad</h3>
//         <p>{error}</p>
//         <button 
//           onClick={() => {
//             setError(null);
//             loadRallySquadData();
//           }} 
//           className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Success Message */}
//       {successMessage && (
//         <div className="bg-green-900 border border-green-700 text-green-100 p-4 rounded-lg">
//           <div className="flex justify-between items-center">
//             <span>{successMessage}</span>
//             <button onClick={() => setSuccessMessage('')} className="text-green-300 hover:text-white">×</button>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
//           <div className="flex justify-between items-center">
//             <span>{error}</span>
//             <button onClick={() => setError(null)} className="text-red-300 hover:text-white">×</button>
//           </div>
//         </div>
//       )}

//       {/* Header Section */}
//       <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-3xl font-bold text-white">Rally Squad</h2>
//             <p className="text-purple-200">Connect with players and build your network</p>
//           </div>
//           <div className="flex items-center space-x-6">
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{onlineUsers.length}</div>
//               <div className="text-purple-200 text-sm">Online Now</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{rallySquadData?.friends.length || 0}</div>
//               <div className="text-purple-200 text-sm">Friends</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">{rallySquadData?.friendRequests.length || 0}</div>
//               <div className="text-purple-200 text-sm">Requests</div>
//             </div>
//             <button 
//               onClick={handleRefresh}
//               disabled={isLoading}
//               className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//             >
//               {isLoading ? 'Refreshing...' : 'Refresh'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Search and Filter Controls */}
//       <div className="bg-gray-800 rounded-lg p-4">
//         <div className="flex gap-4 items-center">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Search users by name or email..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 border border-gray-600 focus:border-purple-500 focus:outline-none"
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
//                 <span>Show Online Only</span>
//               </label>
//             </div>
//           )}
          
//           {searchQuery.trim() && (
//             <button 
//               onClick={() => setSearchQuery('')}
//               className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Users List */}
//       <div className="bg-gray-800 rounded-lg">
//         <div className="p-4 border-b border-gray-700">
//           <h3 className="text-xl font-semibold text-white">
//             {searchQuery.trim() 
//               ? `Search Results (${filteredUsers.length})` 
//               : showOnlineOnly 
//                 ? `Online Players (${filteredUsers.length})` 
//                 : `All Players (${filteredUsers.length})`
//             }
//           </h3>
//         </div>
        
//         <div className="divide-y divide-gray-700">
//           {isLoading ? (
//             <div className="p-8 text-center text-gray-400">
//               <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent mx-auto mb-4"></div>
//               Loading players...
//             </div>
//           ) : filteredUsers.length > 0 ? (
//             filteredUsers.map((user) => {
//               const friendStatus = getUserFriendStatus(user);
//               const statusInfo = getStatusInfo(user.online_status || 'offline');
              
//               return (
//                 <div key={user.id} className="p-4 hover:bg-gray-700 transition-colors">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       {/* Avatar with online indicator */}
//                       <div className="relative">
//                         <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
//                           {user.name.charAt(0).toUpperCase()}
//                         </div>
//                         <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${statusInfo.color}`}></div>
//                       </div>
                      
//                       {/* User info */}
//                       <div>
//                         <h4 className="text-lg font-semibold text-white">{user.name}</h4>
//                         <p className="text-sm text-gray-400">{user.email}</p>
//                         <div className="flex items-center space-x-3 mt-1">
//                           <span className={`text-xs ${statusInfo.textColor}`}>
//                             {statusInfo.text}
//                           </span>
//                           {user.createdAt && (
//                             <span className="text-xs text-gray-500">
//                               Joined {new Date(user.createdAt).toLocaleDateString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Status and actions */}
//                     <div className="flex items-center space-x-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${friendStatus.bgColor}`}>
//                         {friendStatus.status}
//                       </span>
//                       {renderActionButton(user)}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <div className="p-8 text-center text-gray-400">
//               <div className="text-4xl mb-4">👥</div>
//               {searchQuery.trim() 
//                 ? `No users found for "${searchQuery}"` 
//                 : showOnlineOnly 
//                   ? 'No players are currently online' 
//                   : 'No players found'
//               }
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Debug Info */}
//       <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
//         <p className="font-semibold mb-2">Debug Info:</p>
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//           <div>Total Users: {totalUsers}</div>
//           <div>Online Users: {onlineUsers.length}</div>
//           <div>Friends: {rallySquadData?.friends.length || 0}</div>
//           <div>Incoming Requests: {rallySquadData?.friendRequests.length || 0}</div>
//           <div>Sent Requests: {rallySquadData?.sentRequests.length || 0}</div>
//         </div>
//         <div className="mt-2 text-xs text-gray-400">
//           <div>Search Query: "{searchQuery}"</div>
//           <div>Show Online Only: {showOnlineOnly.toString()}</div>
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

  // Live search with debouncing
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

  // Handle live search as user types
  const handleLiveSearch = async () => {
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
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-300">Rally Squad</h2>
        
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

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
          <p className="font-semibold mb-2">Debug Info:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>Total Users: {totalUsers}</div>
            <div>Filtered Users: {filteredUsers.length}</div>
            <div>Online Users: {onlineUsers.length}</div>
            <div>Friends: {friends.length}</div>
            <div>Requests: {friendRequests.length}</div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <div>Search Query: "{searchQuery}"</div>
            <div>Show Online Only: {showOnlineOnly.toString()}</div>
            <div>Sent Requests: {sentRequests.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};