// pong-app/frontend/src/components/MyLockerTab.tsx
import React, { useEffect, useState } from 'react';
import { lobbyApi, ProfileData, useLobbyData } from '../utils/lobbyApi';
import { LoadingSpinner } from './general/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const MyLockerTab: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isLoading, error, fetchWithErrorHandling } = useLobbyData();
  const { user } = useAuth();

  useEffect(() => {
    const loadProfileData = async () => {
      const data = await fetchWithErrorHandling(() => lobbyApi.getProfile());
      if (data) {
        setProfileData(data);
      }
    };

    loadProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Profile</h3>
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

  if (!profileData) {
    return <div className="text-gray-400">No profile data available</div>;
  }

  const { profile } = profileData;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-800 to-pink-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.name} 
                    className="h-24 w-24 rounded-full object-cover" 
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
              <p className="text-purple-200">{profile.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded text-xs ${profile.isVerified ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
                  {profile.isVerified ? '✓ Verified' : '⚠ Unverified'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${profile.twoFactorRegistered ? 'bg-blue-600 text-blue-100' : 'bg-gray-600 text-gray-100'}`}>
                  {profile.twoFactorRegistered ? '🔒 2FA Enabled' : '🔓 2FA Disabled'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Information
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={profile.name}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue={profile.email}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Save Changes
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Username:</span>
                <span className="text-white font-medium">{profile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Email:</span>
                <span className="text-white font-medium">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Member Since:</span>
                <span className="text-white font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Account Status:</span>
                <span className={`font-medium ${profile.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {profile.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="text-white font-medium">Two-Factor Authentication</div>
                <div className="text-gray-400 text-sm">
                  {profile.twoFactorRegistered ? 'Protected with 2FA' : 'Add an extra layer of security'}
                </div>
              </div>
              <button className={`px-3 py-1 rounded text-sm ${
                profile.twoFactorRegistered 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
                {profile.twoFactorRegistered ? 'Disable' : 'Enable'}
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="text-white font-medium">Change Password</div>
                <div className="text-gray-400 text-sm">Update your account password</div>
              </div>
              <button className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="text-white font-medium">Email Verification</div>
                <div className="text-gray-400 text-sm">
                  {profile.isVerified ? 'Email verified' : 'Verify your email address'}
                </div>
              </div>
              {!profile.isVerified && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                  Verify
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Achievements & Badges
        </h3>
        
        {profileData.achievements && profileData.achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profileData.achievements.map((achievement, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-white font-medium text-sm">{achievement.name}</div>
                <div className="text-gray-400 text-xs">{achievement.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h4 className="text-xl font-semibold text-white mb-2">No Achievements Yet</h4>
            <p className="text-gray-400">Start playing to unlock achievements and badges!</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {/* Example locked achievements */}
              <div className="bg-gray-700 p-4 rounded-lg text-center opacity-50">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-white font-medium text-sm">First Win</div>
                <div className="text-gray-400 text-xs">Win your first match</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center opacity-50">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-white font-medium text-sm">Win Streak</div>
                <div className="text-gray-400 text-xs">Win 5 matches in a row</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center opacity-50">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-white font-medium text-sm">Social Player</div>
                <div className="text-gray-400 text-xs">Add 10 friends</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center opacity-50">
                <div className="text-3xl mb-2">💯</div>
                <div className="text-white font-medium text-sm">Century</div>
                <div className="text-gray-400 text-xs">Play 100 matches</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Preferences
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Sound Effects</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto-match Finding</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Show Online Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};