// app/page.tsx or pages/index.tsx
'use client';

import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef, use } from 'react';
import { Phone, Video, Search, Send, Paperclip, UserCircle2, MoreVertical } from 'lucide-react';
import { headers } from 'next/headers';
import ThreeDotMenu from '@/components/ThreeDotMenu';
import ErrorToast from '@/components/ErrorToast';
import IncomingCallPopup from '@/components/IncomingCallPopup';

// --- Types ---
export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  email: string;
  is_online?: boolean;
  username: string; // Added for backend integration
}
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  sender: string; // Changed from senderId to match backend
  content: string; // Changed from text to match backend
  timestamp: string;
  isMe?: boolean;
}

interface IncomingCall {
  isVisible: boolean;
  callerName: string;
  callerAvatarUrl: string;
  callType?: 'audio' | 'video'; // Optional, defaults to 'audio'
}

// --- Main Component ---
const VideoChatHomePage: NextPage = () => {
  // const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userToken, setUserToken] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const nsocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [usernameToAddUser, setUsernameToAddUser] = useState<string>('');

  const [addFriendPopupEnabled, setAddFriendPopupEnabled] = useState<boolean>(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);


  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetching user profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = 'http://127.0.0.1:8000/api/accounts/profile/';



  // Token check on initial load
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/account/login';
      return;
    } else setUserToken(localStorage.getItem('token'));
  }, []);



  // fetching user profiles from backend
  useEffect(() => {
    if (!userToken) setUserToken(localStorage.getItem('token'));
    // Function to fetch user profile
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Fetch user profile from the API
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': `Token ${userToken}`,
            'Content-Type': 'application/json',
          },
        });
        // Step 2: Check if the response is ok
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        // Step 3: Parse the JSON response
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

    if (userToken !== null) {
      fetchProfile();
    }
  }, [userToken]); // Add userToken as a dependency



  // Token check and scroll to bottom on message change
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUserToken(token);
    }
    if (!token) {
      window.location.href = '/account/login';
      return;
    }
    scrollToBottom();
  }, [messages]);



  // Gets the list of available friends/users
  useEffect(() => {
    const initializeChat = async () => {
      if (!userToken) return;
      // Load friends list from your Django API
      try {
        const res = await fetch('http://127.0.0.1:8000/api/chats/myrooms/', {
          headers: {
            'Authorization': `Token ${userToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          await res.json().then((data: any) => {
            const updatedData = data.map((obj: any) => {
              const friend = obj.participants[0].username != profile?.username ? obj.participants[0] : obj.participants[1];
              const online_status = friend.is_online;
              return {
                ...obj,
                is_online: online_status,
              }
            });
            setFriends(updatedData);

            if (data.length > 0) setSelectedFriend(updatedData[0]);
          });
        }
      } catch (error) {
        console.error('Failed to load friends:', error);
      }

    };

    initializeChat();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userToken]);




  // Loading Messages With Selected Friend
  useEffect(() => {
    if (!selectedFriend || !userToken) return;
    loadMessageHistory(selectedFriend, userToken);
  }, [selectedFriend, userToken]);
  const loadMessageHistory = async (selectedFriend: Friend, userToken: string) => {
    try {
      // Step 1: Fetch message history from the API
      const res = await fetch(
        `http://127.0.0.1:8000/api/chats/rooms/${selectedFriend.name}/messages/`, {
        headers: {
          'Authorization': `Token ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      // Step 2: Check if the response is ok
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender.username,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: msg.sender.username === profile?.username
        })));
      }
      // Step 3: Handle errors
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  };



  // Handle WebSocket connection when friend is selected
  useEffect(() => {
    if (!selectedFriend || !userToken || !profile) return;
    handleWebSocketConnection(selectedFriend, userToken, profile, 0);
  }, [selectedFriend, userToken, profile]);
  const handleWebSocketConnection = (selectedFriend: Friend, userToken: string, profile: UserProfile, tryCount: number) => {
    if (!selectedFriend || !userToken || !profile || tryCount > 10) return;

    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Connect to WebSocket -- create a new web socket connection
    const selectedFriendName = encodeURIComponent(selectedFriend.name);
    ws.current = new WebSocket(
      `ws://localhost:8000/ws/chat/${selectedFriendName}/?token=${userToken}`
    );

    // ---------------------CONNECTION OPEN---------------------
    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };




    // ---------------------ON RECEIVING MESSAGE---------------------
    ws.current.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        // Check if it's a chat message (commonly by a "type" field or presence of "message")
        if (data.type === 'chat_message' && data.message !== undefined) {
          setMessages(prev => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: data.sender,
              content: data.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: data.sender === profile?.username,
            },
          ]);
        } else { handleOtherTypeMessageRequestAndResponse(data); }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };



    // ---------------------ON CLOSE---------------------
    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      // Attempt to reconnect after a delay
    };



    // ---------------------ON ERROR---------------------
    ws.current.onerror = (error: Event) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }


  const handleOtherTypeMessageRequestAndResponse = (data: any) => {
    switch (data.type) {
      case 'call_request':
        if (data.message !== undefined) {
          // Handle direct messages
          setMessages(prev => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: data.sender,
              content: 'Call from ' + data.sender,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: data.sender === profile?.username,
            },
          ]);

          setIncomingCall({
            isVisible: true,
            callerName: data.sender,
            callerAvatarUrl: data.callerAvatarUrl || '',
            callType: data.callType || 'audio',
          });

          setTimeout(() => { setIncomingCall(null); }, 120 * 1000)

        }
        break;

      default:
        break;
    }
  }



  // Filter friends based on search term
  const filteredFriends = useMemo(() => {
    return friends.filter(friend =>
      removeNameFromList(friend.name).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, friends]);



  // Handle sending messages
  const handleSendMessage = () => {
    if (messageInput.trim() === '' || !selectedFriend?.id || !ws.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'chat_message',
        message: messageInput
      }));
      if (!profile?.username) return;
      // Optimistic update
      // setMessages(prev => [...prev, {
      //   id: `msg-${Date.now()}`,
      //   sender: profile?.username,
      //   content: messageInput,
      //   timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      //   isMe: true
      // }]);

      setMessageInput('');
    }
  };


  // Enter key event listener for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  // Removing username from chatroom name to avoid showing both usernrames
  function removeNameFromList(list: string): string {
    const nameToRemove = profile?.username || '';
    const names = list.split('_').map(n => n.trim());
    const filtered = names.filter(n => n !== nameToRemove);
    return filtered.join(', ');
  }


  // Handle creating room 
  async function handleCreateRoom(usernameOfFriend: string, userToken: string) {
    const res = await fetch('http://127.0.0.1:8000/api/chats/myrooms/create', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username2: usernameOfFriend })
    });
    if (res.ok) {
      setUsernameToAddUser('')
      // Room created successfully, you can handle the response if needed
      const data = await res.json();
      console.log('Room created:', data);
      // Optionally, you can update the friends list or selected friend here
      // Upadting friends list and message history 
      const friend = data.participants[0].username !== profile?.username ? data.participants[0] : data.participants[1];
      const thisFriend = {
        id: data.id,
        name: data.name,
        avatarUrl: data.avatarUrl || null,
        lastMessage: '',
        lastMessageTime: '',
        email: '',
        is_online: friend.is_online,
        username: usernameOfFriend // Assuming the backend returns this
      }
      console.log('thisFriend:', thisFriend);
      setSelectedFriend(thisFriend);
      setFriends(prev => [...prev, thisFriend]);

      loadMessageHistory(thisFriend, userToken)


      setAddFriendPopupEnabled(false);
    } else {
      // Handle error
      const errorData = await res.json();
      console.log('Error creating room:', errorData);
      setError(`Failed to create room: ${errorData.detail || 'Unknown error'}`);
    }
  }


  // Handle call button click
  const handleCall = (videoEnabled: boolean, iamcaller: boolean) => {
    if (!selectedFriend || !userToken) {
      setError('Please select a friend to call.');
      return;
    }
    window.location.href = `/videocall?roomname=${selectedFriend.name}&token=${userToken}&videoenable=${videoEnabled}&iamcaller=${iamcaller}`;
  }

  return (
    <>
      <Head>
        <title>Video Chat Home</title>
        <meta name="description" content="Modern Video Chat Application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Showing Error Message If Any */}
      <ErrorToast
        message={error}
        duration={5000}
        onClose={() => setError(null)}
      />

      {/* Background with blur */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/bg/bg.jpg"
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="filter blur-lg scale-110"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Incoming Call Area Popup */}
      {incomingCall && (<IncomingCallPopup isVisible={incomingCall.isVisible} callType={incomingCall.callType} callerName={incomingCall.callerName} callerAvatarUrl={incomingCall.callerAvatarUrl}
        onDecline={() => {
          if (ws.current) {
            ws.current.send(JSON.stringify({ type: 'call_rejected', sender: profile?.username, message: 'Rejecting Call' }));
          }
          setIncomingCall(null);
        }}
        onAccept={() => { }} />)}

      {/* Main Content Area */}
      <main className="relative z-10 flex h-screen items-center justify-center p-4 md:p-8">
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Loading Profile...</p>
          </div>
        )}

        {!loading && (<div className="flex h-[99vh] w-full rounded-xl bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden border border-white/20">
          {/* Left Pane: Friend List */}
          <div className="w-1/3 min-w-[280px] md:min-w-[320px] flex flex-col bg-black/20 border-r border-white/10">
            {/* Left Pane Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <UserCircle2 size={24} className="text-white/80" />
                </div>
                <h2 className="text-lg font-semibold text-white/90">{profile?.username}</h2>
              </div>
              <ThreeDotMenu onAddUserClick={() => setAddFriendPopupEnabled(!addFriendPopupEnabled)} />

            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-white/5 py-2 pl-10 pr-3 text-sm text-white/80 placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              </div>
            </div>

            {/* Friend List */}
            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {filteredFriends.map((friend, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-l-4 transition-all duration-200 ease-in-out
                    ${selectedFriend === friend ? 'bg-white/10 border-purple-500' : 'border-transparent hover:bg-white/5'}`}
                >
                  <div className="relative">
                    {friend.avatarUrl ? (
                      <Image
                        src={friend.avatarUrl}
                        alt={friend.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-lg">
                        {removeNameFromList(friend.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    {friend.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black/30"></span>}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-medium text-white/90 truncate">{removeNameFromList(friend.name)}</h3>
                    <p className="text-xs text-white/60 truncate">{friend.lastMessage}</p>
                  </div>
                  <span className="text-xs text-white/50 self-start pt-1">{friend.lastMessageTime}</span>
                </div>
              ))}
              {filteredFriends.length === 0 && (
                <p className="p-4 text-center text-white/60">No friends found.</p>
              )}
            </div>
          </div>

          {/* Right Pane: Chat Area */}
          {!addFriendPopupEnabled && (<div className="w-2/3 flex flex-col bg-black/10">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10 shadow-sm">
                  <div className="flex items-center gap-3">
                    {selectedFriend.avatarUrl ? (
                      <Image
                        src={selectedFriend.avatarUrl}
                        alt={selectedFriend.username}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                        {removeNameFromList(selectedFriend.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white/90">{removeNameFromList(selectedFriend.name)}</h3>
                      <p className="text-xs text-green-400">{selectedFriend.is_online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleCall(false, true)} className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <Phone size={20} />
                    </button>
                    <button onClick={() => handleCall(true, true)} className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <Video size={20} />
                    </button>
                    <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Message List */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-xl shadow
                          ${msg.isMe
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white/10 text-white/90 rounded-bl-none'
                          }`}
                      >
                        {/* {!msg.isMe && (
                          <div className="text-xs font-semibold mb-1">{msg.sender}</div>
                        )} */}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.isMe ? 'text-purple-200 text-right' : 'text-white/50 text-left'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                  {messages.length === 0 && (
                    <p className="text-center text-white/60 pt-10">No messages yet. Say hi!</p>
                  )}
                </div>

                {/* Message Input Area */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                    <button className="p-2 text-white/70 hover:text-purple-400 transition-colors">
                      <Paperclip size={22} />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-grow bg-transparent py-2 px-3 text-sm text-white/90 placeholder-white/50 focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      disabled={messageInput.trim() === ''}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-white/70 p-8">
                <UserCircle2 size={80} className="mb-4 opacity-30" />
                <h2 className="text-2xl font-medium mb-2">Welcome to Your Chat App</h2>
                <p className="text-md opacity-80">Select a friend to start a conversation.</p>
                <p className="text-sm opacity-60 mt-4">Or, find someone new using the search bar on the left.</p>
              </div>
            )}
          </div>)}

          {addFriendPopupEnabled && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
                <input
                  type="text"
                  placeholder="Enter username of friend"
                  onChange={(e) => setUsernameToAddUser(e.target.value)}
                  value={usernameToAddUser}
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={() => { if (usernameToAddUser && userToken) handleCreateRoom(usernameToAddUser, userToken) }}
                >
                  Add Friend
                </button>
                <button
                  className="mt-4 w-full text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  onClick={() => setAddFriendPopupEnabled(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>)}
      </main>

      {/* Custom Scrollbar */}
      <style jsx global>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          border: 3px solid transparent;
        }
      `}</style>
    </>
  );
};
export default VideoChatHomePage;