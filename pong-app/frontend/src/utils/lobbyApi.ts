// // pong-app/frontend/src/utils/lobbyApi.ts
// import { useState } from 'react';
// import api from './api';

// // Types for API responses
// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   avatarUrl?: string;
//   memberSince?: string;
// }

// export interface MatchData {
//   id: string;
//   date: string;
//   player1: { id: string; name: string };
//   player2: { id: string; name: string };
//   winner: { id: string; name: string };
//   isUserWinner: boolean;
//   result?: 'win' | 'loss';
//   opponent?: { id: string; name: string; avatarUrl?: string };
// }

// export interface UserStats {
//   totalMatches: number;
//   wins: number;
//   losses: number;
//   winRate: number;
// }

// export interface OverviewData {
//   user: User;
//   stats: UserStats;
//   recentMatches: MatchData[];
//   friendsCount: number;
// }

// export interface ProfileData {
//   profile: User & {
//     isVerified: boolean;
//     twoFactorRegistered: boolean;
//     createdAt: string;
//   };
//   achievements: any[];
//   badges: any[];
// }

// export interface Friend {
//   id: string;
//   name: string;
//   avatarUrl?: string;
//   createdAt: string;
// }

// export interface RallySquadData {
//   friends: Friend[];
//   friendRequests: any[];
//   recentOpponents: Friend[];
//   onlineCount: number;
// }

// export interface MatchHistoryResponse {
//   matches: MatchData[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
// }

// export interface LeaderboardPlayer {
//   id: string;
//   name: string;
//   avatarUrl?: string;
//   wins: number;
//   totalMatches: number;
//   winRate: number;
// }

// export interface LeaderboardData {
//   leaderboard: LeaderboardPlayer[];
// }

// // API Functions
// export const lobbyApi = {
//   // Get user overview/stats
//   getOverview: async (): Promise<OverviewData> => {
//     const response = await api.get('/lobby/overview');
//     return response.data;
//   },

//   // Get user profile
//   getProfile: async (): Promise<ProfileData> => {
//     const response = await api.get('/lobby/profile');
//     return response.data;
//   },

//   // Get rally squad data (friends, recent opponents)
//   getRallySquad: async (): Promise<RallySquadData> => {
//     const response = await api.get('/lobby/rally-squad');
//     return response.data;
//   },

//   // Get match history with pagination
//   getMatchHistory: async (page: number = 1, limit: number = 10): Promise<MatchHistoryResponse> => {
//     const response = await api.get(`/lobby/match-history?page=${page}&limit=${limit}`);
//     return response.data;
//   },

//   // Get leaderboard
//   getLeaderboard: async (): Promise<LeaderboardData> => {
//     const response = await api.get('/lobby/leaderboard');
//     return response.data;
//   },

//   // Friend management
//   addFriend: async (friendId: string): Promise<{ message: string }> => {
//     const response = await api.post('/lobby/friends/add', { friendId });
//     return response.data;
//   },

//   removeFriend: async (friendId: string): Promise<{ message: string }> => {
//     const response = await api.delete(`/lobby/friends/${friendId}`);
//     return response.data;
//   }
// };

// // Custom hooks for data fetching
// export const useLobbyData = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchWithErrorHandling = async <T>(
//     apiCall: () => Promise<T>
//   ): Promise<T | null> => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const result = await apiCall();
//       return result;
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
//       setError(errorMessage);
//       console.error('Lobby API Error:', err);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return {
//     isLoading,
//     error,
//     fetchWithErrorHandling
//   };
// };


// frontend/src/utils/lobbyApi.ts
// frontend/src/utils/lobbyApi.ts
import api from './api';

// Main API functions that your lobby.tsx expects
export async function getLobbyStats() {
  try {
    const response = await api.get('/lobby/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lobby stats:', error);
    throw error;
  }
}

export async function getLobbyFriends() {
  try {
    const response = await api.get('/lobby/friends');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lobby friends:', error);
    throw error;
  }
}

export async function getLobbyRecentMatches() {
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

// Profile management functions for MyLockerTab
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