'use client';
import Head from 'next/head';
import { useEffect, useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
  ScreenShare,
  RefreshCw, // For the switch icon
} from 'lucide-react';

const VideoCallPage = () => {
  const mainPlayerRef = useRef<HTMLVideoElement>(null);
  const pipPlayerRef = useRef<HTMLVideoElement>(null);

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [friendStream, setFriendStream] = useState<MediaStream | null>(null);

  const [isMyVideoInPiP, setIsMyVideoInPiP] = useState(true);
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 20 });
  const [isDraggingPiP, setIsDraggingPiP] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const pipContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMedia = async () => {
      setIsLoadingMedia(true);
      setMediaError(null);
      try {
        console.log("Requesting media permissions...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Media stream acquired:", stream);
        setMyStream(stream);

        if (stream.getVideoTracks().length > 0) {
            const friendVideoTrack = stream.getVideoTracks()[0].clone();
            const simulatedFriendStream = new MediaStream([friendVideoTrack]);
            setFriendStream(simulatedFriendStream);
            console.log("Simulated friend stream created.");
        } else {
            console.warn("No video tracks available to simulate friend stream.");
            // Optionally, set a placeholder if friend simulation is crucial for UI
            // For now, friendStream might remain null if no video tracks
        }

      } catch (error) {
        console.error('Error accessing media devices:', error);
        if (error instanceof DOMException) {
          if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            setMediaError("No camera/microphone found. Please connect a device.");
          } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setMediaError("Permission denied. Please allow camera/microphone access in your browser settings.");
          } else {
            setMediaError(`Error accessing media: ${error.message}`);
          }
        } else {
          setMediaError('An unknown error occurred while accessing media devices.');
        }
      } finally {
        setIsLoadingMedia(false);
      }
    };

    initMedia();

    return () => {
      myStream?.getTracks().forEach(track => track.stop());
      friendStream?.getTracks().forEach(track => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mainVideoEl = mainPlayerRef.current;
    const pipVideoEl = pipPlayerRef.current;

    if (!mainVideoEl || !pipVideoEl) return;

    const streamForMain = isMyVideoInPiP ? friendStream : myStream;
    const streamForPiP = isMyVideoInPiP ? myStream : friendStream;

    if (mainVideoEl.srcObject !== streamForMain) {
      mainVideoEl.srcObject = streamForMain;
    }
    mainVideoEl.muted = (streamForMain === myStream && myStream !== null);

    if (pipVideoEl.srcObject !== streamForPiP) {
      pipVideoEl.srcObject = streamForPiP;
    }
    // PiP video is always muted via HTML attribute

    // Attempt to play. Some browsers require user interaction for first play.
    if (streamForMain) mainVideoEl.play().catch(e => console.warn("Main video play failed:", e));
    if (streamForPiP) pipVideoEl.play().catch(e => console.warn("PiP video play failed:", e));

  }, [myStream, friendStream, isMyVideoInPiP]);

  useEffect(() => {
    if (pipContainerRef.current && typeof window !== 'undefined' && !isLoadingMedia) {
      const containerWidth = pipContainerRef.current.offsetWidth;
      setPipPosition({
        x: window.innerWidth - containerWidth - 20,
        y: 20,
      });
    }
  }, [isLoadingMedia]); // Re-run if loading changes, ensures pipContainerRef is available

  const handlePiPMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!pipContainerRef.current) return;
    setIsDraggingPiP(true);
    const rect = pipContainerRef.current.getBoundingClientRect();
    setDragStartOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  const handlePiPMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDraggingPiP || !pipContainerRef.current) return;
    const parentRect = (pipContainerRef.current.offsetParent as HTMLElement)?.getBoundingClientRect() || {top:0, left:0, width: window.innerWidth, height: window.innerHeight};

    let newX = e.clientX - dragStartOffset.x - parentRect.left;
    let newY = e.clientY - dragStartOffset.y - parentRect.top;

    const maxX = parentRect.width - pipContainerRef.current.offsetWidth;
    const maxY = parentRect.height - pipContainerRef.current.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPipPosition({ x: newX, y: newY });
  };

  const handlePiPMouseUp = () => setIsDraggingPiP(false);

  const toggleVideoFocus = () => setIsMyVideoInPiP(prev => !prev);

  const toggleMic = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMicMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
    if (myStream) {
      // Determine the new state for the tracks (if currently off, new state is ON, and vice-versa)
      const newEnabledState = isCameraOff; // If camera is off (isCameraOff=true), newEnabledState will be true (turn ON)

      myStream.getVideoTracks().forEach(track => {
        track.enabled = newEnabledState;
      });
      setIsCameraOff(!newEnabledState); // Update the UI state

      // If camera was just turned ON, try to play the video elements if they show myStream
      if (newEnabledState) {
        if (pipPlayerRef.current && pipPlayerRef.current.srcObject === myStream) {
          pipPlayerRef.current.play().catch(e => console.warn("PiP video play after toggle ON failed:", e));
        }
        if (mainPlayerRef.current && mainPlayerRef.current.srcObject === myStream) {
          mainPlayerRef.current.play().catch(e => console.warn("Main video play after toggle ON failed:", e));
        }
      }
    }
  };

  const handleEndCall = () => {
    myStream?.getTracks().forEach(track => track.stop());
    friendStream?.getTracks().forEach(track => track.stop());
    setMyStream(null); // Clear streams
    setFriendStream(null);
    alert('Call Ended');
  };

  if (isLoadingMedia) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-xl">Initializing call...</p>
      </div>
    );
  }

  if (mediaError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-8">
        <VideoOff size={64} className="mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Media Error</h2>
        <p className="text-center">{mediaError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const mainDisplayName = isMyVideoInPiP ? "Friend's Name" : "You";
  const pipDisplayName = isMyVideoInPiP ? "You" : "Friend's Name";
  const mainStreamToDisplay = isMyVideoInPiP ? friendStream : myStream;
  const pipStreamToDisplay = isMyVideoInPiP ? myStream : friendStream;

  return (
    <>
      <Head>
        <title>Video Call | Clean UI</title>
      </Head>
      <div
        className="relative flex flex-col h-screen w-screen bg-gray-100 text-gray-800 overflow-hidden"
        onMouseMove={isDraggingPiP ? handlePiPMouseMove : undefined}
        onMouseUp={isDraggingPiP ? handlePiPMouseUp : undefined}
        onMouseLeave={isDraggingPiP ? handlePiPMouseUp : undefined}
      >
        <div className="flex-grow relative bg-gray-900 flex items-center justify-center">
          {mainStreamToDisplay && ! (isMyVideoInPiP ? false : isCameraOff) ? ( // Also check if camera is off for "You" in main
            <video
              ref={mainPlayerRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <User size={80} />
              <p className="mt-3 text-lg">
                {mainStreamToDisplay ? (isMyVideoInPiP ? "Friend's video unavailable" : "Your camera is off") : (isMyVideoInPiP ? "Waiting for friend..." : "Camera not available")}
              </p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-40 text-white px-3 py-1 rounded-md text-sm shadow">
            {mainDisplayName}
          </div>
        </div>

        {pipStreamToDisplay && ! (isMyVideoInPiP && isCameraOff) && ( // Also check if camera is off for "You" in PiP
          <div
            ref={pipContainerRef}
            className="absolute w-48 h-36 md:w-60 md:h-44 bg-gray-700 border-2 border-gray-400 rounded-lg shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              left: `${pipPosition.x}px`,
              top: `${pipPosition.y}px`,
              zIndex: 50,
            }}
            onMouseDown={handlePiPMouseDown}
          >
            <video
              ref={pipPlayerRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <button
              onClick={toggleVideoFocus}
              className="absolute top-1.5 right-1.5 p-1.5 bg-black bg-opacity-40 text-white rounded-full hover:bg-opacity-60 transition-opacity"
              title="Switch video focus"
            >
              <RefreshCw size={16} />
            </button>
            <div className="absolute bottom-1.5 left-1.5 bg-black bg-opacity-30 text-white px-2 py-0.5 rounded text-xs shadow">
              {pipDisplayName}
            </div>
          </div>
        )}
         {/* Placeholder if PiP is "You" and camera is off */}
         {isMyVideoInPiP && isCameraOff && pipStreamToDisplay && (
             <div
                ref={pipContainerRef} // Keep ref for positioning
                className="absolute w-48 h-36 md:w-60 md:h-44 bg-gray-700 border-2 border-gray-400 rounded-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center text-gray-300"
                style={{
                    left: `${pipPosition.x}px`,
                    top: `${pipPosition.y}px`,
                    zIndex: 50,
                    cursor: 'grab' // Keep draggable feel
                }}
                onMouseDown={handlePiPMouseDown} // Still allow dragging
            >
                <VideoOff size={32} className="mb-2"/>
                <p className="text-sm">Camera Off</p>
                <button
                    onClick={toggleVideoFocus}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black bg-opacity-40 text-white rounded-full hover:bg-opacity-60 transition-opacity"
                    title="Switch video focus"
                    >
                    <RefreshCw size={16} />
                </button>
            </div>
         )}


        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm p-3 sm:p-4 flex justify-center items-center space-x-3 sm:space-x-4 z-40 shadow-t-lg border-t border-gray-200">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition-colors ${
              isMicMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition-colors ${
              isCameraOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={() => alert('Screen sharing: Integrate with navigator.mediaDevices.getDisplayMedia()')}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            title="Share Screen"
          >
            <ScreenShare size={24} />
          </button>

          <button
            onClick={handleEndCall}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

export default VideoCallPage;