'use client'
import { LogOut } from 'lucide-react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FiUser, FiMail, FiClock, FiCheckCircle, FiXCircle, FiWifi, FiWifiOff } from 'react-icons/fi'; // Example icons

// Define the structure of the profile data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  avatar: string | null;
}

// A helper function to format the date (optional, but good for UX)
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleString(undefined, options);
};

const ProfilePage: NextPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://127.0.0.1:8000/api/accounts/profile/';
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage on mount
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setAuthToken(token);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authToken) {
        setLoading(false);
        setError('No authentication token found. Please log in.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': `Token ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data: UserProfile = await response.json();
        setProfile(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (authToken !== null) {
      fetchProfile();
    }
  }, [authToken]); // Add authToken as a dependency



  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Logout function
  const handleLogout = async () => {
    if (!authToken) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/accounts/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      localStorage.removeItem('token');
      setAuthToken(null);
      window.location.href = '/account/login'; // Redirect to login page
    } catch (err) {
      alert('Logout failed. Please try again.');
    }
  };


  return (
    <>
      <Head>
        <title>{profile ? `${profile.username}'s Profile` : 'Profile'} | Video Call App</title>
        <meta name="description" content="User profile page" />
      </Head>

      {/* Background Image Container */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/background.jpg" // Replace with your image path in /public
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          quality={85}
          className="filter blur-lg scale-105" // Blur and slight zoom to avoid edge artifacts
        />
        <div className="absolute inset-0 bg-black/30"></div> {/* Optional overlay for better text contrast */}
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Loading Profile...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-lg max-w-md w-full" role="alert">
            <p className="font-bold text-xl mb-2">Error Fetching Profile</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">Please check the API endpoint and token, or try again later.</p>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105 duration-300">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative mb-6">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={`${profile.username}'s avatar`}
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-blue-500 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-5xl font-bold text-white border-4 border-blue-400 shadow-lg">
                    {getInitials(profile.username)}
                  </div>
                )}

                {/* Logout Button */}
                <div className="absolute top-0 left-36 p-4 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition duration-150">
                  <button onClick={handleLogout}><LogOut /></button>
                </div>

                {/* Online Status Badge */}
                <span
                  className={`absolute bottom-1 right-1 block h-6 w-6 rounded-full border-2 border-gray-800
                              ${profile.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
                  title={profile.is_online ? 'Online' : 'Offline'}
                ></span>
              </div>

              {/* Username */}
              <h1 className="text-4xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {profile.username}
              </h1>

              {/* Email */}
              <p className="text-gray-300 text-lg mb-6 flex items-center">
                <FiMail className="mr-2 text-blue-400" /> {profile.email}
              </p>

              {/* Details Section */}
              <div className="w-full space-y-4 text-gray-200">
                <div className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                  {profile.is_online ? (
                    <>
                      <FiWifi className="mr-3 text-green-400 text-2xl" />
                      <span className="font-semibold">Status:</span>
                      <span className="ml-2 text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <FiWifiOff className="mr-3 text-red-400 text-2xl" />
                      <span className="font-semibold">Status:</span>
                      <span className="ml-2 text-red-400">Offline</span>
                    </>
                  )}
                </div>

                {!profile.is_online && profile.last_seen && (
                  <div className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                    <FiClock className="mr-3 text-yellow-400 text-2xl" />
                    <span className="font-semibold">Last Seen:</span>
                    <span className="ml-2">{formatDate(profile.last_seen)}</span>
                  </div>
                )}

                <div className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                  <FiUser className="mr-3 text-purple-400 text-2xl" />
                  <span className="font-semibold">User ID:</span>
                  <span className="ml-2">{profile.id}</span>
                </div>
              </div>

              {/* Example Actions (Optional) */}
              <div className="mt-8 w-full flex space-x-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105">
                  Edit Profile
                </button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105">
                  Settings
                </button>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && !profile && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-md shadow-lg max-w-md w-full" role="alert">
            <p className="font-bold text-xl mb-2">No Profile Data</p>
            <p>The profile data could not be loaded or is empty.</p>
          </div>
        )}
      </main>
    </>
  );
};

export default ProfilePage;