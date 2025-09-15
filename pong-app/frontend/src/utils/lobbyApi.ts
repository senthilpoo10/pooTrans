// ===== FRONTEND: utils/lobbyApi.ts =====
import { useState } from 'react';
import api from './api';

// Types based on your existing UI components
export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince?: string;
}

export interface UserStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentWinStreak: number;
  monthlyWins: number;
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

export interface OverviewData {
  user: User;
  stats: UserStats;
  recentMatches: Match[];
  friendsCount: number;
}

export interface ProfileData {
  name: string;
  email: string;
  profilePic?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  favAvatar: string;
  wins: number;
  losses: number;
  isVerified: boolean;
  twoFactorRegistered: boolean;
  createdAt: string;
}

export interface Friend {
  id: number;
  name: string;
  status: string;
  rank: number;
  lastActive: string;
}

export interface RallySquadData {
  friends: Array<{
    id: number;
    name: string;
    avatarUrl?: string;
    createdAt: string;
  }>;
  friendRequests: any[];
  recentOpponents: Array<{
    id: number;
    name: string;
    avatarUrl?: string;
    createdAt: string;
  }>;
  onlineCount: number;
}

export interface LeaderboardData {
  leaderboard: Array<{
    id: number;
    name: string;
    avatarUrl?: string;
    wins: number;
    totalMatches: number;
    winRate: number;
  }>;
}

export interface MatchHistoryResponse {
  matches: Array<{
    id: string;
    opponent: string;
    result: string;
    score: string;
    playedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API functions that match your existing UI calls
export const lobbyApi = {
  getOverview: async (): Promise<OverviewData> => {
    const response = await api.get('/lobby/overview');
    return response.data;
  },

  getProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/lobby/profile');
    return response.data;
  },

  getRallySquad: async (): Promise<RallySquadData> => {
    const response = await api.get('/lobby/rally-squad');
    return response.data;
  },

  getLeaderboard: async (): Promise<LeaderboardData> => {
    const response = await api.get('/lobby/leaderboard');
    return response.data;
  },

  getMatchHistory: async (page: number = 1, limit: number = 10): Promise<MatchHistoryResponse> => {
    const response = await api.get(`/lobby/match-history?page=${page}&limit=${limit}`);
    return response.data;
  },

  addFriend: async (friendId: number): Promise<{ message: string }> => {
    const response = await api.post('/lobby/friends/add', { friendId });
    return response.data;
  },

  removeFriend: async (friendId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/lobby/friends/${friendId}`);
    return response.data;
  }
};

// Functions that your lobby.tsx expects
export async function getLobbyStats() {
  const response = await api.get('/lobby/stats');
  return response.data;
}

export async function getLobbyFriends() {
  const response = await api.get('/lobby/friends');
  return response.data;
}

export async function getLobbyRecentMatches() {
  const response = await api.get('/lobby/recent-matches');
  return response.data;
}

export async function getLobbyProfile() {
  const response = await api.get('/lobby/profile');
  return response.data;
}

// Custom hook for error handling
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
