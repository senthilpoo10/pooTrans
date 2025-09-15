// frontend/src/components/lobby/MyLockerTab.tsx
// User profile editor component for the lobby
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateLobbyProfile, getAvatars } from "../../utils/lobbyApi";
import { useAuth } from "../../contexts/AuthContext";

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
}

interface Profile {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  favAvatar?: string;
  profilePic?: string;
  wins?: number;
  losses?: number;
}

interface MyLockerTabProps {
  profile: Profile;
}

export const MyLockerTab = ({ profile }: MyLockerTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store original values to compare for changes
  const [originalForm, setOriginalForm] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : "",
    gender: profile?.gender || "",
    favAvatar: profile?.favAvatar || "",
    profilePic: profile?.profilePic || "",
  });

  const [form, setForm] = useState(originalForm);
  const [profileImage, setProfileImage] = useState(form.profilePic);
  const [message, setMessage] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [favoriteAvatar, setFavoriteAvatar] = useState<Avatar | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load avatars from backend
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const avatarsData = await getAvatars();
        setAvatars(avatarsData);

        if (form.favAvatar) {
          const currentFav = avatarsData.find((avatar: Avatar) => avatar.id === form.favAvatar);
          if (currentFav) {
            setFavoriteAvatar(currentFav);
          }
        }
      } catch (error) {
        console.error("Failed to load avatars:", error);
      }
    };

    loadAvatars();
  }, [form.favAvatar]);

  // Check for changes
  useEffect(() => {
    const changesDetected = 
      form.firstName !== originalForm.firstName ||
      form.lastName !== originalForm.lastName ||
      form.dateOfBirth !== originalForm.dateOfBirth ||
      form.gender !== originalForm.gender ||
      form.favAvatar !== originalForm.favAvatar ||
      form.profilePic !== originalForm.profilePic;
    
    setHasChanges(changesDetected);
  }, [form, originalForm]);

  // Function to clear message when any field changes
  const clearMessage = () => {
    if (message) {
      setMessage("");
    }
  };

  // Cancel changes and reset to original values
  const handleCancel = () => {
    setForm(originalForm);
    setProfileImage(originalForm.profilePic);
    
    // Reset favorite avatar if needed
    if (originalForm.favAvatar) {
      const originalFav = avatars.find(a => a.id === originalForm.favAvatar);
      setFavoriteAvatar(originalFav || null);
    } else {
      setFavoriteAvatar(null);
    }
    
    setMessage("Changes cancelled");
    setTimeout(() => setMessage(""), 2000); // Clear message after 2 seconds
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    clearMessage();
    setForm({ ...form, [e.target.name]: e.target.value });
  }

function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  clearMessage();
  const file = e.target.files && e.target.files[0];
  
  if (!file) return;

  // Validate file type
  const allowedExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedExtensions.includes(file.type)) {
    setMessage("Invalid file type. Please upload JPEG, PNG, GIF, or WebP image.");
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    return;
  }

  // Validate file size (1MB limit)
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    setMessage("File size exceeds the limit of 1 MB.");
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    return;
  }

  // If validation passes, process the file
  const reader = new FileReader();
  reader.onloadend = () => {
    setProfileImage(reader.result as string);
    setForm((prev) => ({ ...prev, profilePic: reader.result as string }));
  };
  reader.readAsDataURL(file);
}

function handleImageEdit(e: React.MouseEvent) {
  clearMessage();
  e.preventDefault();
  fileInputRef.current?.click();
}

  function handleAvatarSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    clearMessage();
    const avatarId = e.target.value;
    setForm((prev) => ({ ...prev, favAvatar: avatarId }));
    const avatar = avatars.find(a => a.id === avatarId);
    setFavoriteAvatar(avatar || null);
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  try {
    // Only validate if user actually entered something in name fields
    if (form.firstName && !form.firstName.trim()) {
      setMessage("Update failed! First name cannot be only spaces");
      return;
    }
    
    if (form.lastName && !form.lastName.trim()) {
      setMessage("Update failed! Last name cannot be only spaces");
      return;
    }

    if (form.dateOfBirth) {
      const date = new Date(form.dateOfBirth);
      if (isNaN(date.getTime())) {
        setMessage("Update failed! Please provide a valid date of birth");
        return;
      }
    }

    await updateLobbyProfile({
      ...form,
      favAvatar: favoriteAvatar?.id || "",
    });
    
    setMessage("Profile updated successfully!");
    
  } catch (err: any) {
    // Check if it's a 413 Payload Too Large error
    if (err?.response?.status === 413) {
      setMessage("Image file is too large after processing. Please choose a smaller image.");
    } else {
      setMessage("Update failed! May be wrong info given");
    }
  }
}


  return (
    <div className="max-w-4xl mx-auto">
      <form className="bg-gray-800 rounded-xl p-8 relative" onSubmit={handleSubmit}>
        {/* Cancel Button - Top Right Corner */}
        {hasChanges && (
          <button
            type="button"
            onClick={handleCancel}
            className="absolute top-4 right-4 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
            title="Cancel changes"
          >
            <span className="text-lg">✕</span>
          </button>
        )}
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-300">🧳 My Locker</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-4xl">👤</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={profileImage ? handleImageEdit : () => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors"
                  title={profileImage ? "Edit profile picture" : "Add profile picture"}
                >
                  {profileImage ? (
                    <span className="text-white text-lg">✏️</span>
                  ) : (
                    <span className="text-white text-lg">📷</span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="space-y-3 text-lg text-left">
              <div><span className="text-gray-400">Username:</span> <span className="font-bold">{user?.name}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="font-bold">{user?.email}</span></div>
              <div><span className="text-gray-400">Wins:</span> <span className="font-bold text-green-400">{profile?.wins ?? 0}</span></div>
              <div><span className="text-gray-400">Losses:</span> <span className="font-bold text-red-400">{profile?.losses ?? 0}</span></div>
            </div>
          </div>
        </div>
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="mb-3">
            <input
              placeholder="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 placeholder-gray-400 bg-white text-black focus:ring-blue-200 transition"
            />
          </div>
          <div className="mb-3">
            <input
              placeholder="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 placeholder-gray-400 text-black bg-white border-gray-300 focus:ring-blue-200 transition"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-left mb-1">Date of Birth:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 placeholder-gray-400 text-black bg-white border-gray-300 focus:ring-blue-200 transition"
            />
          </div>
          <div className="mt-6 mb-3">
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 placeholder-gray-400 text-black bg-white border-gray-300 focus:ring-blue-200 transition"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
        {/* Avatar selection row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {favoriteAvatar ? (
                  <img
                    src={favoriteAvatar.imageUrl}
                    alt={favoriteAvatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-2xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <select
                  value={favoriteAvatar?.id || ""}
                  onChange={handleAvatarSelect}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black bg-white border-gray-300 focus:ring-purple-300 transition"
                >
                  <option value="">Choose Favorite Avatar</option>
                  {avatars.map((avatar) => (
                    <option key={avatar.id} value={avatar.id}>
                      {avatar.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
              disabled={!favoriteAvatar}
            >
              ✏️ Save
            </button>
          </div>
        </div>
            {message && (
          <div className={`mt-3 text-center ${
            message.includes("successfully") || message.includes("cancelled") 
              ? "text-green-400" 
              : "text-red-400"
          }`}>
            {message}
          </div>
        )}
        {/* {message && <div className="mt-3 text-yellow-400 text-center">{message}</div>} */}
      </form>
    </div>
  );
};
