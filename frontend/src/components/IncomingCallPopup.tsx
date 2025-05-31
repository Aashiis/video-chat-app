import React from 'react';
// Import icons from react-icons
import { FaPhoneAlt, FaVideo, FaUserCircle } from 'react-icons/fa';
import { MdCallEnd, MdClose } from 'react-icons/md';

interface IncomingCallPopupProps {
  isVisible: boolean; // Controls whether the popup is rendered
  callerName: string;
  callerAvatarUrl?: string; // Optional URL for caller's avatar
  callType?: 'audio' | 'video'; // Defaults to 'audio'
  onAccept: () => void; // Function to call when 'Accept' is clicked
  onDecline: () => void; // Function to call when 'Decline' is clicked
  onClosePopup?: () => void; // Optional: Function for a dedicated close 'X' button
}

const IncomingCallPopup: React.FC<IncomingCallPopupProps> = ({
  isVisible,
  callerName,
  callerAvatarUrl,
  callType = 'audio',
  onAccept,
  onDecline,
  onClosePopup,
}) => {
  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  const CallTypeDisplayIcon = callType === 'video' ? FaVideo : FaPhoneAlt;

  return (
    // Backdrop: covers the entire screen, semi-transparent with blur
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-out"
      aria-modal="true"
      role="dialog"
      aria-labelledby="call-popup-title"
      // Optional: onClick={onClosePopup || onDecline} // To close/decline on backdrop click
    >
      {/* Popup Content Container */}
      <div
        className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm p-6 sm:p-8 transform transition-all duration-300 ease-out"
        // Prevent click events on the popup from bubbling to the backdrop
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional Close 'X' Button (Top Right) */}
        {onClosePopup && (
          <button
            onClick={onClosePopup}
            className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white transition-colors z-10 p-1"
            aria-label="Close popup"
          >
            <MdClose size={24} />
          </button>
        )}

        {/* Caller Information Section */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-700 bg-slate-600 flex items-center justify-center overflow-hidden shadow-lg mb-4">
            {callerAvatarUrl ? (
              <img
                src={callerAvatarUrl}
                alt={`${callerName} avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle size={70} className="text-slate-400" />
            )}
          </div>

          {/* Caller Name */}
          <h2 id="call-popup-title" className="text-xl sm:text-2xl font-bold text-center mb-1">
            {callerName}
          </h2>

          {/* Call Type Indication */}
          <p className="text-sm text-slate-400 flex items-center justify-center">
            <CallTypeDisplayIcon size={16} className="mr-2 text-purple-400" />
            Incoming {callType} call
          </p>
        </div>

        {/* Action Buttons Section */}
        <div className="flex justify-around space-x-3 sm:space-x-4">
          {/* Decline Button */}
          <button
            onClick={onDecline}
            className="group flex-1 flex flex-col items-center justify-center py-3 px-4 bg-red-600/90 hover:bg-red-500 active:bg-red-700 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 shadow-md hover:shadow-lg"
            aria-label="Decline call"
          >
            <MdCallEnd size={28} className="mb-1 text-white transition-transform duration-200 group-hover:rotate-[-12deg]" />
            <span className="text-sm font-medium text-white">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="group flex-1 flex flex-col items-center justify-center py-3 px-4 bg-green-600/90 hover:bg-green-500 active:bg-green-700 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 shadow-md hover:shadow-lg"
            aria-label="Accept call"
          >
            <FaPhoneAlt size={24} className="mb-1.5 text-white transition-transform duration-200 group-hover:animate-pulse" /> {/* animate-pulse is a default tailwind animation */}
            <span className="text-sm font-medium text-white">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;