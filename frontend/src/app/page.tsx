// For App Router: app/page.tsx
// For Pages Router: pages/index.tsx
'use client'; // Required for App Router if using client-side hooks like useState

import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Phone, Video, Search, Send, Paperclip, UserCircle2, MoreVertical, ChevronDown } from 'lucide-react';

// --- Types ---
interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  online?: boolean;
}

interface Message {
  id: string;
  senderId: string; // 'me' or friend's id
  text: string;
  timestamp: string;
}

// --- Dummy Data ---
const dummyFriends: Friend[] = [
  { id: '1', name: 'Alice Wonderland', lastMessage: 'Hey, are you free later?', lastMessageTime: '10:30 AM', online: true },
  { id: '2', name: 'Bob The Builder', lastMessage: 'Can we build it? Yes we can!', lastMessageTime: 'Yesterday', online: false },
  { id: '3', name: 'Charlie Chaplin', lastMessage: '...', lastMessageTime: 'Mon', online: true },
  { id: '4', name: 'Diana Prince', avatarUrl: '/avatars/diana.png', lastMessage: 'See you at the gala.', lastMessageTime: 'Sun', online: true },
  { id: '5', name: 'Edward Scissorhands', lastMessage: 'Just trimming the hedges.', lastMessageTime: '12/05/2023', online: false },
];

const dummyMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', senderId: '1', text: 'Hey, are you free later?', timestamp: '10:30 AM' },
    { id: 'm2', senderId: 'me', text: 'Yeah, what\'s up?', timestamp: '10:31 AM' },
    { id: 'm3', senderId: '1', text: 'Wanted to discuss the project. Video call?', timestamp: '10:32 AM' },
  ],
  '2': [
    { id: 'm4', senderId: '2', text: 'Can we build it? Yes we can!', timestamp: 'Yesterday' },
  ],
  // Add more messages for other friends if needed
};

// --- Main Component ---
const VideoChatHomePage: NextPage = () => {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(dummyFriends[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const selectedFriend = useMemo(() => {
    return dummyFriends.find(friend => friend.id === selectedFriendId);
  }, [selectedFriendId]);

  const currentChatMessages = useMemo(() => {
    return selectedFriendId ? (dummyMessages[selectedFriendId] || []) : [];
  }, [selectedFriendId]);

  const filteredFriends = useMemo(() => {
    return dummyFriends.filter(friend =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSendMessage = () => {
    if (messageInput.trim() === '' || !selectedFriendId) return;
    // In a real app, you'd send this message to a backend
    // and update the local state optimistically or after confirmation.
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    // This is a simplified update. In reality, you'd update dummyMessages state.
    // For now, we'll just log it and clear input.
    console.log(`Sending to ${selectedFriend?.name}:`, newMessage);
    dummyMessages[selectedFriendId]?.push(newMessage); // Note: This mutates dummy data, not ideal for React state.
    setMessageInput('');
  };

  return (
    <>
      <Head>
        <title>Video Chat Home</title>
        <meta name="description" content="Modern Video Chat Application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Background with blur */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/bg/bg.jpg" // Replace with your desired background image
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="filter blur-lg scale-110" // scale-110 to avoid edge artifacts from blur
        />
        <div className="absolute inset-0 bg-black/30"></div> {/* Optional overlay */}
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex h-screen items-center justify-center p-4 md:p-8">
        <div className="flex h-[99vh] w-full  rounded-xl bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden border border-white/20">
          {/* Left Pane: Friend List */}
          <div className="w-1/3 min-w-[280px] md:min-w-[320px] flex flex-col bg-black/20 border-r border-white/10">
            {/* Left Pane Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              {/* User Profile Mini */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <UserCircle2 size={24} className="text-white/80" />
                </div>
                <h2 className="text-lg font-semibold text-white/90">My Chats</h2>
              </div>
              <button className="text-white/70 hover:text-white">
                <MoreVertical size={22} />
              </button>
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
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-l-4 transition-all duration-200 ease-in-out
                    ${selectedFriendId === friend.id ? 'bg-white/10 border-purple-500' : 'border-transparent hover:bg-white/5'}`}
                >
                  <div className="relative">
                    {friend.avatarUrl ? (
                      <Image src={friend.avatarUrl} alt={friend.name} width={48} height={48} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {friend.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black/30"></span>}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-medium text-white/90 truncate">{friend.name}</h3>
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
          <div className="w-2/3 flex flex-col bg-black/10">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10 shadow-sm">
                  <div className="flex items-center gap-3">
                    {selectedFriend.avatarUrl ? (
                      <Image src={selectedFriend.avatarUrl} alt={selectedFriend.name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                        {selectedFriend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white/90">{selectedFriend.name}</h3>
                      <p className="text-xs text-green-400">{selectedFriend.online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <Video size={20} />
                    </button>
                    <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Message List */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {currentChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-xl shadow
                          ${msg.senderId === 'me'
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white/10 text-white/90 rounded-bl-none'
                          }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.senderId === 'me' ? 'text-purple-200 text-right' : 'text-white/50 text-left'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  {currentChatMessages.length === 0 && (
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
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
          </div>
        </div>
      </main>

      {/* Custom Scrollbar (Tailwind Plugin might be needed for more advanced styling) */}
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