import React, { useState, useEffect } from 'react';


export const RallySquadTab = () => {



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