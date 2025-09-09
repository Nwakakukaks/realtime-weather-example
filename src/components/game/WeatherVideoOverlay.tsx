import { useEffect, useState, useRef, memo } from "react";
import type { WeatherData, City } from "@/lib/weather";

interface WeatherVideoOverlayProps {
  weather: WeatherData;
  currentCity: City;
  isEnabled: boolean;
  onStreamStateChange?: (isLoading: boolean, isLive: boolean) => void;
  streamData?: {
    playbackId: string;
    whipUrl: string;
  } | null;
  actualPlaybackUrl?: string | null;
  isWHIPStreaming?: boolean;
}

const WeatherVideoOverlayComponent = ({
  weather,
  currentCity,
  isEnabled,
  onStreamStateChange,
  streamData,
}: WeatherVideoOverlayProps) => {
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const lastRenderedPlaybackId = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  // Initialize stream - single source of truth
  useEffect(() => {
    if (isEnabled && streamData) {
      const { playbackId: dynamicPlaybackId } = streamData;
      
      console.log("🎬 WeatherVideoOverlay: Received streamData:", streamData);
      console.log("🎬 WeatherVideoOverlay: Using playbackId:", dynamicPlaybackId);

      setPlaybackId(dynamicPlaybackId);
      setError(null);
      setIsStreamLoading(true);
      setIsStreamLive(false);

      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        console.log("⚠️ Stream loading timeout - marking as ready");
        setIsStreamLoading(false);
        setIsStreamLive(true);
        onStreamStateChange?.(false, true);
      }, 10000); // 10 second timeout

      console.log("🎬 Stream ready for weather overlay");
      console.log(`🌤️ Using stream for ${currentCity.name}, ${currentCity.country}...`);
    } else if (!isEnabled) {
      // Reset state when disabled
      setPlaybackId(null);
      setIsStreamLoading(false);
      setIsStreamLive(false);
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [isEnabled, streamData, currentCity]);

  // Handle weather changes gracefully - preserve current stream
  useEffect(() => {
    if (!isEnabled || !playbackId) {
      return;
    }

    console.log(
      "🌤️ Weather change detected:",
      weather.condition,
      "in",
      currentCity.name,
      "- preserving current stream"
    );

    // Show a brief visual indicator that weather change was detected
    // The stream will continue with the current AI processing
    console.log(
      "🎬 Stream preserved - AI effects will continue with current parameters"
    );
  }, [weather, isEnabled, playbackId, currentCity]);

  // Notify parent component of stream state changes
  useEffect(() => {
    if (onStreamStateChange) {
      onStreamStateChange(isStreamLoading, isStreamLive);
    }
  }, [isStreamLoading, isStreamLive]); // Removed onStreamStateChange from dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!isEnabled) return null;

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div className="text-white text-center bg-red-900/50 p-4 rounded-lg">
          <p className="text-red-200">❌ Daydream API Error</p>
          <p className="text-sm text-red-300 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Show Daydream video stream - use streamData playbackId if local playbackId is not set
  const currentPlaybackId = playbackId || streamData?.playbackId;
  
  if (currentPlaybackId) {
    // Only re-render if playbackId actually changed
    if (currentPlaybackId !== lastRenderedPlaybackId.current) {
      console.log("🎬 WeatherVideoOverlay: Rendering iframe with playbackId:", currentPlaybackId);
      lastRenderedPlaybackId.current = currentPlaybackId;
    }
    
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Fallback Background - Always present to prevent white canvas */}
        <div
          className="absolute inset-0 transition-all duration-2000 ease-in-out"
          style={{
            background: isStreamLoading
              ? "linear-gradient(to bottom, rgba(31, 41, 55, 0.95) 0%, rgba(31, 41, 55, 0.9) 20%, rgba(31, 41, 55, 0.8) 40%, rgba(31, 41, 55, 0.6) 60%, rgba(31, 41, 55, 0.4) 80%, rgba(31, 41, 55, 0.2) 90%, transparent 100%)" // Pure gray-800 night storm loading background
              : isStreamLive
              ? "linear-gradient(to bottom, rgba(135, 206, 235, 0.2) 0%, rgba(152, 216, 232, 0.15) 30%, rgba(176, 224, 230, 0.1) 60%, transparent 100%)" // Light sky gradient
              : "linear-gradient(to bottom, rgba(26, 26, 46, 0.3) 0%, rgba(22, 33, 62, 0.2) 30%, rgba(15, 52, 96, 0.1) 60%, transparent 100%)", // Default subtle
          }}
        />

        {/* Additional fallback for when stream fails */}
        {!isStreamLive && !isStreamLoading && (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.05) 50%, transparent 100%)",
            }}
          />
        )}

        {/* Loading State - Positioned to not block city view */}
        {isStreamLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white/90 bg-black/30 backdrop-blur-md rounded-xl px-8 py-6 max-w-md mx-4">
              <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold mb-2">
                Loading Game Environment
              </p>
              <p className="text-sm text-white/70">
                Fetching live weather conditions in {currentCity.name}..
              </p>
            </div>
          </div>
        )}

        {/* Live Stream Container */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100vw",
            height: "100vh",
            transform: "translate(-50%, -50%) scale(1.8)",
            transformOrigin: "center center",
          }}
        >
          <iframe
            src={`https://lvpr.tv/?v=${currentPlaybackId}&lowLatency=force`}
            className="w-full h-full border-0"
            style={{
              opacity: isStreamLive ? 0.6 : 0,
              mixBlendMode: "multiply",
              transition: "opacity 2s ease-in-out",
            }}
            allow="camera; microphone; autoplay; fullscreen"
            onLoad={() => {
              console.log("✅ Daydream stream iframe loaded");
              console.log(
                "🎬 Iframe src:",
                `https://lvpr.tv/?v=${currentPlaybackId}&lowLatency=force`
              );
              
              // Clear the loading timeout
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
              
              // Add a small delay to ensure the stream is actually ready
              setTimeout(() => {
                setIsStreamLoading(false);
                setIsStreamLive(true);
                onStreamStateChange?.(false, true);
                console.log("🎬 Stream is now live and generating background!");
              }, 1000);
            }}
            onError={(e) => {
              console.error("❌ Iframe failed to load:", e);
              setError(
                "Failed to load Daydream stream - stream may be starting up"
              );
              // Reset to loading state to allow retry
              setIsStreamLoading(true);
              setIsStreamLive(false);
              console.log("⚠️ Iframe error - will retry on next render");
            }}
          />
        </div>

        {/* Enhanced Visual Overlay for Live Stream */}
        {isStreamLive && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle atmospheric overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            {/* Weather-specific color enhancement */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: weather.condition.toLowerCase().includes("rain")
                  ? "linear-gradient(135deg, rgba(100, 149, 237, 0.1) 0%, rgba(70, 130, 180, 0.1) 100%)"
                  : weather.condition.toLowerCase().includes("clear")
                  ? "linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%)"
                  : weather.condition.toLowerCase().includes("storm")
                  ? "linear-gradient(135deg, rgba(72, 61, 139, 0.1) 0%, rgba(25, 25, 112, 0.1) 100%)"
                  : "linear-gradient(135deg, rgba(135, 206, 235, 0.05) 0%, rgba(176, 224, 230, 0.05) 100%)",
              }}
            />
          </div>
        )}

        {/* Loading State Overlay - Subtle bottom gradient */}
        {isStreamLoading && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
        )}
      </div>
    );
  }

  return null;
};

// Memoize the component to prevent unnecessary re-renders
export const WeatherVideoOverlay = memo(WeatherVideoOverlayComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.isEnabled === nextProps.isEnabled &&
    prevProps.streamData?.playbackId === nextProps.streamData?.playbackId &&
    prevProps.isWHIPStreaming === nextProps.isWHIPStreaming &&
    prevProps.weather.condition === nextProps.weather.condition &&
    prevProps.currentCity.name === nextProps.currentCity.name
  );
});
