// frontend/src/utils/friendApi.ts
import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  online_status?: string;
  createdAt?: string;
}

export interface Friend {
  id: number;
  name: string;
  status: string;
  rank: number;
  lastActive: string;
  friendshipId?: string;
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

// Search users (used by RallySquadTab for live search)
export async function searchUsers(query: string = ''): Promise<User[]> {
  try {
    const response = await api.get(`/lobby/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
}

// Send friend request
export async function sendFriendRequest(userId: string): Promise<{ message: string }> {
  try {
    const response = await api.post('/lobby/friend-requests/send', { 
      receiverId: parseInt(userId) 
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send friend request:', error);
    throw error;
  }
}

// Respond to friend request (accept/decline)
export async function respondToFriendRequest(
  requestId: string, 
  action: 'accept' | 'decline'
): Promise<{ message: string }> {
  try {
    const response = await api.post(`/lobby/friend-requests/${requestId}/respond`, { 
      action 
    });
    return response.data;
  } catch (error) {
    console.error('Failed to respond to friend request:', error);
    throw error;
  }
}

// Remove friend
export async function removeFriend(friendshipId: string): Promise<{ message: string }> {
  try {
    const response = await api.delete(`/lobby/friendships/${friendshipId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to remove friend:', error);
    throw error;
  }
}

// Get friend requests (incoming)
export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    const response = await api.get('/lobby/friend-requests');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch friend requests:', error);
    throw error;
  }
}

// Get friends list (enhanced version with friendshipId for RallySquadTab)
export async function getFriends(): Promise<Friend[]> {
  try {
    const response = await api.get('/lobby/friends/enhanced');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    throw error;
  }
}

// Export all functions as default object
export default {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getFriendRequests,
  getFriends
};