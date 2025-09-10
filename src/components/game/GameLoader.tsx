import React, { useState, useEffect, useCallback } from "react";
import { LoaderAudioManager } from "./LoaderAudioManager";
import { DaydreamIntegration } from "@/lib/api";

interface GameLoaderProps {
  onLoadingComplete: () => void;
  onAudioEnabled?: () => void;
  onStreamReady?: (playbackId: string, whipUrl: string) => void;
}

const LOADING_MESSAGES = [
  "Initializing flight systems...",
  "Setting up weather effects stream...",
  "Preparing WebRTC streaming...",
  "Loading cloud video assets...",
  "Connecting to stream endpoint...",
  "Ready for live streaming! 🎬",
];

export const GameLoader: React.FC<GameLoaderProps> = ({
  onLoadingComplete,
  onAudioEnabled,
  onStreamReady,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [, setStreamData] = useState<{
    playbackId: string;
    whipUrl: string;
    streamId: string;
  } | null>(null);
  const [streamInitialized, setStreamInitialized] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Removed copied state - no longer needed for automatic streaming

  // Handle audio enable on user interaction
  const handleEnableAudio = async () => {
    setAudioEnabled(true);
    onAudioEnabled?.();
    console.log("🎬 Audio enabled by user interaction");
  };

  // Stable callback to prevent infinite re-renders
  const handleAudioReady = useCallback(() => {
    // Audio is ready but we don't need to do anything
  }, []);

  // Progress increases until stream is ready, then stops at 100%
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 400); // Slower message progression

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Only increase progress if stream is not initialized yet
        if (!streamInitialized && prev < 95) {
          return prev + 1;
        }
        return prev;
      });
    }, 50); // Slower progress to give stream time to initialize

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [streamInitialized]);

  // Initialize Daydream stream and WebRTC streaming
  useEffect(() => {
    const initializeStream = async () => {
      if (streamInitialized) {
        return;
      }

      try {
        // Try Daydream API first
        if (DaydreamIntegration.isAvailable()) {
          try {
            const streamData = await DaydreamIntegration.createStream();

            const playbackId = streamData.output_playback_id;
            const whipUrl = streamData.whip_url;
            const streamId = streamData.id;

            if (playbackId && whipUrl && streamId) {
              setStreamData({ playbackId, whipUrl, streamId });
              onStreamReady?.(playbackId, whipUrl);

              // Start WebRTC streaming with cloud.mp4
              await startWebRTCStream(whipUrl);

              setStreamInitialized(true);
              setProgress(100); // Complete the progress bar
              return;
            }
          } catch (error) {
            console.error("GameLoader: Daydream API error:", error);
            // Continue to fallback
          }
        }

        // Fallback: Skip streaming when no real WHIP URL is available
        console.log(
          "GameLoader: No Daydream API available, skipping streaming setup"
        );
        console.log(
          "GameLoader: Weather overlay will work without live streaming"
        );

        // Set minimal data for weather overlay without streaming
        setStreamData({
          playbackId: "fallback",
          whipUrl: "",
          streamId: "fallback",
        });
        setStreamInitialized(true);
        setProgress(100);
        console.log("🎬 Weather overlay ready (no streaming)");
      } catch (error) {
        console.error("Failed to initialize stream:", error);
        setStreamError("Failed to initialize stream");
      }
    };

    initializeStream();
  }, [streamInitialized, onStreamReady]);

  // WebRTC streaming function
  const startWebRTCStream = async (whipUrl: string) => {
    try {
      console.log("🎬 Starting WebRTC stream with cloud.mp4...");

      // Create video element for cloud.mp4
      const video = document.createElement("video");
      video.src = "/assets/cloud.mp4";
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        video.load();
      });

      // Get video stream
      const videoStream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream();

      if (!videoStream) {
        throw new Error("Failed to capture video stream");
      }

      // Create WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add video track to peer connection
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        peerConnection.addTrack(videoTrack, videoStream);
        console.log("✅ Video track added to WebRTC connection");
      }

      // Create offer and send to WHIP endpoint
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to WHIP endpoint
      const response = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (response.ok) {
        const answerSdp = await response.text();
        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });

        console.log("✅ WebRTC stream connected successfully");
        console.log("🎬 Streaming cloud.mp4 to:", whipUrl);

        // Store peer connection for cleanup
        (window as any).webrtcConnection = peerConnection;
        (window as any).streamVideo = video;
      } else {
        throw new Error(`WHIP endpoint returned ${response.status}`);
      }
    } catch (error) {
      console.error("❌ WebRTC streaming failed:", error);
      // Don't throw error, just log it - game can continue without streaming
    }
  };

  useEffect(() => {
    if (progress >= 100 && streamInitialized) {
      setReadyToStart(true);
    }
  }, [progress, streamInitialized]);

  // Stream is ready for weather overlay

  // Handle manual game start
  const handleStartGame = () => {
    // Stop the loader's background music
    if ((window as any).stopLoaderMusic) {
      (window as any).stopLoaderMusic();
    }

    onLoadingComplete();
  };

  // Cleanup WebRTC connection on unmount
  useEffect(() => {
    return () => {
      if ((window as any).webrtcConnection) {
        (window as any).webrtcConnection.close();
        console.log("🧹 WebRTC connection cleaned up");
      }
      if ((window as any).streamVideo) {
        (window as any).streamVideo.pause();
        (window as any).streamVideo.src = "";
        console.log("🧹 Stream video cleaned up");
      }
    };
  }, []);

  // Removed copy functionality - no longer needed for automatic streaming

  return (
    <>
      {/* Separate Audio Manager for Loader */}
      <LoaderAudioManager
        isEnabled={audioEnabled}
        onAudioReady={handleAudioReady}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400">
        {/* Animated clouds in background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          <div className="cloud cloud-4"></div>
          <div className="cloud cloud-5"></div>
          <div className="cloud cloud-6"></div>
          <div className="cloud cloud-7"></div>
          <div className="cloud cloud-8"></div>
        </div>

        {/* Main loader content */}
        <div className="relative z-10 text-center text-white">
          {/* Game logo/title */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2 text-shadow-lg">
              3D Flight Simulator
            </h1>
          </div>

          {/* Loading message */}
          <div className="mb-8 min-h-[60px] flex items-center justify-center">
            <p className="text-2xl font-semibold text-shadow-md">
              {streamInitialized
                ? "Stream Ready! 🎬"
                : LOADING_MESSAGES[currentMessageIndex]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-96 mx-auto mb-8">
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white/80 h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${streamInitialized ? 100 : Math.min(progress, 95)}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-lg opacity-80">
              {streamInitialized
                ? "100% - WebRTC Stream Ready!"
                : `${Math.round(
                    Math.min(progress, 95)
                  )}% - Setting up WebRTC stream...`}
            </p>
          </div>

          {/* Loading animation */}
          {!streamInitialized && (
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          )}

          {/* Stream ready for weather overlay */}

          {/* Stream Error Display */}
          {streamError && (
            <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <h4 className="text-red-200 font-semibold mb-2">Stream Error</h4>
              <p className="text-red-100 text-sm">{streamError}</p>
              <button
                onClick={() => {
                  setStreamError(null);
                  setStreamInitialized(false);
                  setProgress(0);
                }}
                className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
              >
                Retry Stream
              </button>
            </div>
          )}

          <div className="flex justify-center items-center space-x-2 mt-6">
            {/* Start Game Button */}
            {readyToStart && (
              <div>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xl rounded-lg border-2 border-green-400 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  🚀 Start Game
                </button>
              </div>
            )}

            {/* Audio enable button */}
            {!audioEnabled && (
              <div>
                <button
                  onClick={handleEnableAudio}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg border-2 border-white/30 transition-all duration-300 hover:scale-105"
                >
                  🎵 Enable Audio
                </button>
                <p className="text-sm opacity-70 mt-2 max-w-28 text-end">
                  Click to enable background music
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CSS for animated clouds */}
        <style>{`
        .cloud {
          position: absolute;
          background: white;
          border-radius: 50px;
          opacity: 0.8;
          animation: float 20s infinite linear;
        }
        
        .cloud:before,
        .cloud:after {
          content: '';
          position: absolute;
          background: white;
          border-radius: 50px;
        }
        
        .cloud-1 {
          width: 100px;
          height: 40px;
          top: 12%;
          left: -100px;
          animation-delay: 0s;
        }
        .cloud-1:before {
          width: 50px;
          height: 50px;
          top: -20px;
          left: 20px;
        }
        .cloud-1:after {
          width: 60px;
          height: 30px;
          top: -10px;
          right: 20px;
        }

        .cloud-2 {
          width: 80px;
          height: 30px;
          top: 25%;
          left: -80px;
          animation-delay: 3s;
        }
        .cloud-2:before {
          width: 40px;
          height: 40px;
          top: -15px;
          left: 15px;
        }
        .cloud-2:after {
          width: 50px;
          height: 25px;
          top: -8px;
          right: 15px;
        }

        .cloud-3 {
          width: 120px;
          height: 50px;
          top: 38%;
          left: -120px;
          animation-delay: 6s;
        }
        .cloud-3:before {
          width: 60px;
          height: 60px;
          top: -25px;
          left: 25px;
        }
        .cloud-3:after {
          width: 70px;
          height: 35px;
          top: -15px;
          right: 25px;
        }

        .cloud-4 {
          width: 90px;
          height: 35px;
          top: 52%;
          left: -90px;
          animation-delay: 9s;
        }
        .cloud-4:before {
          width: 45px;
          height: 45px;
          top: -18px;
          left: 18px;
        }
        .cloud-4:after {
          width: 55px;
          height: 28px;
          top: -12px;
          right: 18px;
        }

        .cloud-5 {
          width: 110px;
          height: 45px;
          top: 65%;
          left: -110px;
          animation-delay: 12s;
        }
        .cloud-5:before {
          width: 55px;
          height: 55px;
          top: -22px;
          left: 22px;
        }
        .cloud-5:after {
          width: 65px;
          height: 33px;
          top: -14px;
          right: 22px;
        }

        .cloud-6 {
          width: 70px;
          height: 28px;
          top: 75%;
          left: -70px;
          animation-delay: 15s;
        }
        .cloud-6:before {
          width: 35px;
          height: 35px;
          top: -12px;
          left: 12px;
        }
        .cloud-6:after {
          width: 40px;
          height: 20px;
          top: -6px;
          right: 12px;
        }

        .cloud-7 {
          width: 130px;
          height: 55px;
          top: 85%;
          left: -130px;
          animation-delay: 17s;
        }
        .cloud-7:before {
          width: 65px;
          height: 65px;
          top: -27px;
          left: 27px;
        }
        .cloud-7:after {
          width: 75px;
          height: 38px;
          top: -17px;
          right: 27px;
        }

        .cloud-8 {
          width: 60px;
          height: 24px;
          top: 92%;
          left: -60px;
          animation-delay: 19s;
        }
        .cloud-8:before {
          width: 30px;
          height: 30px;
          top: -10px;
          left: 10px;
        }
        .cloud-8:after {
          width: 35px;
          height: 16px;
          top: -4px;
          right: 10px;
        }

        @keyframes float {
          0% {
            left: -150px;
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            left: 100vw;
            opacity: 0;
          }
        }
        
        .text-shadow-lg {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .text-shadow-md {
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      </div>
    </>
  );
};
