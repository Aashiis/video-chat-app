// components/ErrorToast.tsx
'use client'; // This is a client component

import { useState, useEffect } from 'react';

interface ErrorToastProps {
  message: string | null; // The error message to display, or null to hide
  duration?: number;     // Optional duration in milliseconds (default: 3000)
  onClose?: () => void;  // Optional callback when the toast closes
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (message) {
      setCurrentMessage(message); // Set message immediately
      setIsVisible(true);        // Start fade-in

      timer = setTimeout(() => {
        setIsVisible(false); // Start fade-out
        if (onClose) {
          onClose();
        }
        // Allow fade-out animation to complete before clearing the message
        setTimeout(() => {
          setCurrentMessage(null);
        }, 500); // This should match your transition duration
      }, duration);
    } else {
      // If message is explicitly set to null, start hiding immediately
      setIsVisible(false);
      // Allow fade-out animation to complete
      setTimeout(() => {
        setCurrentMessage(null);
      }, 500);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  // Don't render anything if there's no message to display and it's not fading out
  if (!currentMessage && !isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        fixed top-5 left-1/2 -translate-x-1/2
        z-50 p-4 min-w-[280px] max-w-md
        bg-red-500 text-white
        rounded-lg shadow-xl
        transition-all duration-500 ease-in-out
        flex items-center space-x-3
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'}
      `}
    >
      {/* Simple X Icon (you can use an SVG or icon library) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-6 h-6 flex-shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <span>{currentMessage}</span>
    </div>
  );
};

export default ErrorToast;