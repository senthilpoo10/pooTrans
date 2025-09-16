// frontend/src/utils/lobbyApi.ts
import { useState } from 'react';
import api from './api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  online_status?: string;
  createdAt?: string;
}

export interface Stats {
  totalMatches: number;
  winRate: number;
  currentWinStreak: number;
  monthlyWins: number;
  wins: number;
  losses: number;
}

export interface Friend {
  id: number;
  name: string;
  status: string;
  rank: number;
  lastActive: string;
  friendshipId?: string;
}

export interface Match {
  id: string;
  opponent: string;
  result: string;
  score: string;
  matchType: string;
  date: string;
  duration: string;
}

export interface FriendRequest {
  id: string;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  receiver_username: string;
  status: string;
  createdAt: string;
}

export interface RallySquadData {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onlineCount: number;
}

// Individual API functions
export async function getLobbyStats(): Promise<Stats> {
  try {
    const response = await api.get('/lobby/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lobby stats:', error);
    throw error;
  }
}

export async function getLobbyFriends(): Promise<Friend[]> {
  try {
    const response = await api.get('/lobby/friends');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lobby friends:', error);
    throw error;
  }
}

export async function getLobbyRecentMatches(): Promise<Match[]> {
  try {
    const response = await api.get('/lobby/recent-matches');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent matches:', error);
    throw error;
  }
}

export async function getLobbyProfile() {
  try {
    const response = await api.get('/lobby/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lobby profile:', error);
    throw error;
  }
}

export async function updateLobbyProfile(profileData: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  favAvatar?: string;
  profilePic?: string;
}) {
  try {
    const response = await api.post('/lobby/profile/update', profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}

export async function getAvatars() {
  try {
    const response = await api.get('/lobby/avatars');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch avatars:', error);
    throw error;
  }
}

// Rally Squad specific functions with enhanced error handling
export async function searchUsers(query: string = ''): Promise<User[]> {
  try {
    console.log('Searching users with query:', query);
    const response = await api.get(`/lobby/users/search?q=${encodeURIComponent(query)}`);
    console.log('Search users response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to search users:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function sendFriendRequest(userId: string): Promise<{ message: string }> {
  try {
    console.log('Sending friend request to userId:', userId, 'type:', typeof userId);
    
    // Ensure userId is converted to number for backend
    const receiverId = parseInt(userId, 10);
    console.log('Parsed receiverId:', receiverId, 'type:', typeof receiverId);
    
    if (isNaN(receiverId)) {
      throw new Error('Invalid user ID format');
    }
    
    const requestBody = { receiverId };
    console.log('Request body:', requestBody);
    
    const response = await api.post('/lobby/friend-requests/send', requestBody);
    console.log('Send friend request response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to send friend request:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Re-throw with more specific error information
    if (error.response?.data?.error) {
      const err = new Error(error.response.data.message || error.response.data.error);
      (err as any).response = error.response;
      throw err;
    }
    throw error;
  }
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    console.log('Fetching friend requests');
    const response = await api.get('/lobby/friend-requests');
    console.log('Friend requests response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch friend requests:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  try {
    console.log('Fetching sent friend requests');
    const response = await api.get('/lobby/friend-requests/sent');
    console.log('Sent friend requests response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch sent friend requests:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function respondToFriendRequest(
  requestId: string, 
  action: 'accept' | 'decline'
): Promise<{ message: string }> {
  try {
    console.log('Responding to friend request:', requestId, 'action:', action);
    const response = await api.post(`/lobby/friend-requests/${requestId}/respond`, { 
      action 
    });
    console.log('Respond to friend request response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to respond to friend request:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function removeFriend(friendshipId: string): Promise<{ message: string }> {
  try {
    console.log('Removing friend with friendshipId:', friendshipId);
    const response = await api.delete(`/lobby/friendships/${friendshipId}`);
    console.log('Remove friend response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove friend:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

export async function getEnhancedFriends(): Promise<Friend[]> {
  try {
    console.log('Fetching enhanced friends');
    const response = await api.get('/lobby/friends/enhanced');
    console.log('Enhanced friends response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch enhanced friends:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

// Composite function for Rally Squad data
export async function getRallySquadData(): Promise<RallySquadData> {
  try {
    console.log('Loading rally squad data...');
    const [friends, friendRequests, sentRequests] = await Promise.all([
      getEnhancedFriends(),
      getFriendRequests(),
      getSentFriendRequests()
    ]);
    
    const onlineCount = friends.filter(f => f.status === 'online').length;
    
    const result = {
      friends,
      friendRequests,
      sentRequests,
      onlineCount
    };
    
    console.log('Rally squad data loaded:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to fetch rally squad data:', error);
    throw error;
  }
}

// API object for backward compatibility
export const lobbyApi = {
  getStats: getLobbyStats,
  getFriends: getLobbyFriends,
  getRecentMatches: getLobbyRecentMatches,
  getProfile: getLobbyProfile,
  updateProfile: updateLobbyProfile,
  getAvatars: getAvatars,
  searchUsers: searchUsers,
  sendFriendRequest: sendFriendRequest,
  getFriendRequests: getFriendRequests,
  getSentFriendRequests: getSentFriendRequests,
  respondToFriendRequest: respondToFriendRequest,
  removeFriend: removeFriend,
  getEnhancedFriends: getEnhancedFriends,
  getRallySquad: getRallySquadData
};

// Custom hook for data fetching with error handling
export const useLobbyData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithErrorHandling = async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Lobby API Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    fetchWithErrorHandling
  };
};



// GAME API
// frontend/src/utils/lobbyApi.ts - Add these functions to your existing lobbyApi.ts

// Enhanced Match interface for detailed match data
export interface EnhancedMatch extends Match {
  rounds_json?: any;
  gameStats?: {
    totalRounds: number;
    userScore: number;
    opponentScore: number;
    duration: string;
  };
}

export interface DetailedMatchStats {
  matchId: number;
  gameType: string;
  date: string;
  detailedStats: {
    totalMoves: number;
    accuracy: number;
    averageResponseTime: number;
    bestStreak: number;
    roundsWon: number;
    roundsLost: number;
  };
}

// Get detailed matches with rounds_json (similar to GameStats)
export async function getDetailedMatches(): Promise<EnhancedMatch[]> {
  try {
    const response = await api.get('/lobby/detailed-matches');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch detailed matches:', error);
    throw error;
  }
}

// Get enhanced recent matches with optional rounds data
export async function getEnhancedRecentMatches(
  limit: number = 10, 
  includeRounds: boolean = false
): Promise<EnhancedMatch[]> {
  try {
    const response = await api.get('/lobby/recent-matches-enhanced', {
      params: { limit, includeRounds }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch enhanced recent matches:', error);
    throw error;
  }
}

// Get detailed statistics for a specific match
export async function getMatchStats(matchId: string): Promise<DetailedMatchStats> {
  try {
    const response = await api.get(`/lobby/match-stats/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch match statistics:', error);
    throw error;
  }
}

// Updated getLobbyRecentMatches to use enhanced version
export async function getLobbyRecentMatchesEnhanced(): Promise<EnhancedMatch[]> {
  try {
    // Try enhanced version first, fallback to basic version
    return await getEnhancedRecentMatches(10, true);
  } catch (error) {
    console.warn('Enhanced matches not available, falling back to basic matches');
    return await getLobbyRecentMatches() as EnhancedMatch[];
  }
}

// Add these to your existing lobbyApi object
export const enhancedLobbyApi = {
  ...lobbyApi, // Spread existing functions
  getDetailedMatches,
  getEnhancedRecentMatches,
  getMatchStats,
  getLobbyRecentMatchesEnhanced
};