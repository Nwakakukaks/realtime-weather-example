import { Button } from "@/components/ui/button";
import {
  Cloud as CloudIcon,
  Wind,
  Thermometer,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { WeatherData, City } from "@/lib/weather";
import { useState, useEffect } from "react";

interface GameOverlaysProps {
  flightData: {
    altitude: number;
    speed: number;
    fuel: number;
    score: number;
    position: [number, number, number];
    rotation: [number, number, number];
  };
  weather: WeatherData;
  currentCity: City;
  gameState: "waiting" | "flying" | "landed" | "crashed";
  isPaused: boolean;
  onReset: () => void;
  gameMode: "free" | "challenge";
  challengeHealth?: number;
  freeFlightHealth?: number;
}

export function GameOverlays({
  flightData,
  weather,
  currentCity,
  gameState,
  isPaused,
  onReset,
  gameMode,
  challengeHealth,
  freeFlightHealth,
}: GameOverlaysProps) {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [showHealthIncrease, setShowHealthIncrease] = useState(false);

  const toggleOverlay = () => {
    setIsOverlayVisible(!isOverlayVisible);
  };

  // Show health increase notification when health changes
  useEffect(() => {
    const currentHealth =
      gameMode === "challenge" ? challengeHealth : freeFlightHealth;
    if (currentHealth && currentHealth > 0) {
      setShowHealthIncrease(true);
      const timer = setTimeout(() => setShowHealthIncrease(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameMode, challengeHealth, freeFlightHealth]);

  return (
    <>
      {/* Custom CSS for audio sliders */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-webkit-slider-track {
          background: #4b5563;
          border-radius: 8px;
          height: 8px;
        }
        
        .slider::-moz-range-track {
          background: #4b5563;
          border-radius: 8px;
          height: 8px;
        }
      `}</style>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-xl text-center max-w-md w-full mx-4">
            <h3 className="text-3xl font-bold mb-4">GAME PAUSED</h3>
            <p className="text-gray-300 mb-6">Press SHIFT to resume</p>

            {/* Audio Controls */}
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <div className="space-y-4">
                {/* <div>
                  <label className="text-gray-300 text-sm text-start block mb-1">Master Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(window as any).audioControls?.masterVolume || 0.7}
                    onChange={(e) => (window as any).audioControls?.updateMasterVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div> */}

                <div>
                  <label className="text-gray-300 text-sm text-start block mb-1">
                    Music Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(window as any).audioControls?.musicVolume || 0.6}
                    onChange={(e) =>
                      (window as any).audioControls?.updateMusicVolume(
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-1.5 bg-gray-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm text-start block mb-1">
                    SFX Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(window as any).audioControls?.sfxVolume || 0.8}
                    onChange={(e) =>
                      (window as any).audioControls?.updateSfxVolume(
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-1.5 bg-gray-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              <p className="mb-2">Controls:</p>
              <p>↑↓ Pitch | ←→ Turn | SPACE Turbo | R Reset</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Overlay */}
      {gameState === "landed" && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-50">
          <div className="bg-green-600 text-white p-4 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Mission Accomplished!</h3>
            <p>You successfully flew to {currentCity.name}!</p>
            <p className="text-sm mt-2">Final Score: {flightData.score}</p>
            <Button onClick={onReset} className="mt-4">
              Fly Again
            </Button>
          </div>
        </div>
      )}

      {gameState === "crashed" && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-4 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Mission Failed!</h3>
            <p>Your plane crashed. Try again!</p>
            <p className="text-sm mt-2">Score: {flightData.score}</p>
            <Button onClick={onReset} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleOverlay}
        className={`absolute top-4 z-50 transition-all duration-300 ease-in-out ${
          isOverlayVisible ? "right-80" : "right-4"
        } bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700/90 p-2 rounded-l-lg border border-gray-600 focus:outline-none focus:ring-0 active:bg-gray-800`}
        tabIndex={0}
        style={{
          outline: "none",
          boxShadow: "none",
        }}
      >
        {isOverlayVisible ? (
          <ChevronRight className="h-5 w-5 text-white" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Game Controls and Info - Overlay on top with slide animation */}
      <div
        className={`absolute top-4 right-4 w-72 space-y-3 z-40 transition-all duration-300 ease-in-out ${
          isOverlayVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        {/* Flight Status */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>❤️ Health</span>
                <span>
                  {gameMode === "challenge"
                    ? Math.round(challengeHealth || 100)
                    : Math.round(freeFlightHealth || 100)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    gameMode === "challenge"
                      ? (challengeHealth || 100) > 50
                        ? "bg-red-500"
                        : (challengeHealth || 100) > 25
                        ? "bg-orange-500"
                        : "bg-red-600"
                      : (freeFlightHealth || 100) > 50
                      ? "bg-red-500"
                      : (freeFlightHealth || 100) > 25
                      ? "bg-orange-500"
                      : "bg-red-600"
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        gameMode === "challenge"
                          ? challengeHealth || 100
                          : freeFlightHealth || 100,
                        100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>🏔️ Altitude</span>
                <span>{Math.round(flightData.altitude)}m</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (flightData.altitude /
                        Math.max(flightData.altitude * 1.2, 10000)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weather Info */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <CloudIcon className="h-4 w-4" />
            Weather in {currentCity.name}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Thermometer className="h-4 w-4" />
              <span>{weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Wind className="h-4 w-4" />
              <span>{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Eye className="h-4 w-4" />
              <span>{weather.visibility} km visibility</span>
            </div>
            <div className="text-gray-400 text-xs">{weather.description}</div>
          </div>
        </div>

        {/* Flight Controls */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">
            Flight Controls
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span>↑↓</span>
              <span>Pitch (nose down/up)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>←→</span>
              <span>Roll (bank left/right)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>N M</span>
              <span>Turn (yaw left/right)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>SPACE</span>
              <span>Turbo boost</span>
            </div>
            <div className="flex items-center gap-2">
              <span>SHIFT</span>
              <span>Pause/Resume</span>
            </div>
            <div className="flex items-center gap-2">
              <span>R</span>
              <span>Restart game</span>
            </div>
          </div>
        </div>
      </div>

  
    </>
  );
}
