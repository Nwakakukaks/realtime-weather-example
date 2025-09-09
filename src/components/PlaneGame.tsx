import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { WeatherData, City } from "@/lib/weather";
import { CITIES, WeatherAPI } from "@/lib/weather";
import { CitySelectionModal } from "./game/CitySelectionModal";
import { CircularMap } from "./game/CircularMap";
import { GameOverlays } from "./game/GameOverlays";
import { GameScene } from "./game/GameScene";
import { TriviaModal } from "./game/TriviaModal";
import { GameLoader } from "./game/GameLoader";
import { AudioManager } from "./game/AudioManager";
import { WeatherVideoOverlay } from "./game/WeatherVideoOverlay";
import { resetPlanePosition } from "./game/planeState";

interface PlaneGameProps {
  weather: WeatherData;
  city: City;
  onGameComplete: (score: number) => void;
  backgroundVideo?: string | null;
}

interface FlightData {
  altitude: number;
  speed: number;
  fuel: number;
  score: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export const PlaneGame: React.FC<PlaneGameProps> = ({
  weather,
  city,
  onGameComplete,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [gameState, setGameState] = useState<
    "waiting" | "flying" | "landed" | "crashed"
  >("flying");
  const [isPaused, setIsPaused] = useState(false);
  const [currentCity, setCurrentCity] = useState(city);
  const [currentWeather, setCurrentWeather] = useState(weather);
  const [gameMode, setGameMode] = useState<"free" | "challenge">("free");
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isTriviaModalOpen, setIsTriviaModalOpen] = useState(false);
  const [triviaTimer, setTriviaTimer] = useState(4000); // 60 seconds
  const [challengeHealth, setChallengeHealth] = useState(100);
  const [freeFlightHealth, setFreeFlightHealth] = useState(100);
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [streamData, setStreamData] = useState<{
    playbackId: string;
    whipUrl: string;
  } | null>(null);

  // Get city-specific altitude
  const getCityAltitude = useCallback((city: City): number => {
    const cityAltitudes: Record<string, number> = {
      "New York": 4000,
      Sydney: 200,
    };
    return cityAltitudes[city.name] || 5000; // Default to 5000m
  }, []);

  // Get city-specific position offset to center plane over the city
  const getCityPosition = useCallback(
    (city: City): [number, number, number] => {
      const cityPositions: Record<string, [number, number, number]> = {
        "New York": [0, 0, 0], // Center
        Sydney: [0, 0, 0], // Center
      };
      return cityPositions[city.name] || [0, 0, 0]; // Default to center
    },
    []
  );

  const [flightData, setFlightData] = useState<FlightData>({
    altitude: getCityAltitude(city),
    speed: 50,
    fuel: 100,
    score: 0,
    position: getCityPosition(city).map((coord, index) =>
      index === 1 ? getCityAltitude(city) : coord
    ) as [number, number, number],
    rotation: [0, 0, 0],
  });

  // Handle location change
  const handleLocationChange = useCallback(async (newCity: City) => {
    setCurrentCity(newCity);

    // Fetch weather for the new city
    try {
      const newWeather = await WeatherAPI.getWeather(newCity);
      setCurrentWeather(newWeather);
    } catch (error) {
      console.error("Failed to fetch weather for new city:", error);
      // Keep the old weather as fallback
    }

    // Get city-specific altitude and position
    const cityAltitude = getCityAltitude(newCity);
    const cityPosition = getCityPosition(newCity);

    // Reset plane position to city center when changing location
    resetPlanePosition(cityAltitude, cityPosition[0], cityPosition[2]);
    setFlightData((prev) => ({
      ...prev,
      position: [cityPosition[0], cityAltitude, cityPosition[2]],
      altitude: cityAltitude,
    }));
  }, []);

  // Handle weather condition change
  const handleWeatherChange = useCallback(
    (weatherCondition: string) => {
      // Weather changed

      // Update the weather condition while keeping other weather data
      setCurrentWeather((prev) => ({
        ...prev,
        condition: weatherCondition,
      }));
    },
    [currentWeather.condition]
  );

  // Handle game mode change
  const handleGameModeChange = useCallback((mode: "free" | "challenge") => {
    setGameMode(mode);
    // Only update mode, don't start the game yet
    // Game will start when user clicks "Let's Fly"
    // Game mode changed
  }, []);

  // Handle starting the game
  const handleStartGame = useCallback(() => {
    // Starting game
    // Initialize game state
    setGameState("flying");
    setChallengeHealth(100);
    setTriviaTimer(4000);
    setFlightData((prev) => ({
      ...prev,
      fuel: gameMode === "free" ? 100 : 100, // Free mode has unlimited fuel
      score: 0,
    }));
    // Close the modal
    setIsCityModalOpen(false);
  }, [gameMode]);

  // Note: Modal should only open when user explicitly requests it, not automatically

  // Handle stream state changes
  const handleStreamStateChange = useCallback(
    (isLoading: boolean, isLive: boolean) => {
      setIsStreamLoading(isLoading);
      setIsStreamLive(isLive);
      // Stream state changed
    },
    []
  );

  // Handle stream ready from GameLoader
  const handleStreamReady = useCallback(
    (playbackId: string, whipUrl: string) => {
      setStreamData({ playbackId, whipUrl });
    },
    []
  );

  // Trivia timer for challenge mode
  useEffect(() => {
    if (gameMode !== "challenge" || isPaused || gameState !== "flying") return;

    const interval = setInterval(() => {
      setTriviaTimer((prev) => {
        if (prev <= 1000) {
          // Time's up - open trivia modal
          setIsTriviaModalOpen(true);
          setIsPaused(true); // Pause the game
          return 4000; // Reset timer
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, isPaused, gameState]);

  // Health decrease for free flight mode
  useEffect(() => {
    if (gameMode !== "free" || isPaused || gameState !== "flying") return;

    const interval = setInterval(() => {
      setFreeFlightHealth((prev) => {
        const newHealth = Math.max(0, prev - 0.1); // Decrease by 0.1% every 100ms (3+ minutes total)
        if (newHealth <= 0) {
          setGameState("crashed");
        }
        return newHealth;
      });
    }, 100); // Update every 100ms for smooth decrease

    return () => clearInterval(interval);
  }, [gameMode, isPaused, gameState]);

  // Handle health increase from heart collection
  const handleHealthIncrease = useCallback(
    (amount: number) => {
      if (gameMode === "free") {
        setFreeFlightHealth((prev) => Math.min(100, prev + amount));
      }
    },
    [gameMode]
  );

  // Handle trivia answer submission
  const handleTriviaAnswer = useCallback(
    async (isCorrect: boolean, _reasoning: string) => {
      if (isCorrect) {
        setChallengeHealth((prev) => Math.min(100, prev + 10));
      } else {
        setChallengeHealth((prev) => Math.max(0, prev - 10));
      }

      // Check if game over - only in challenge mode
      if (gameMode === "challenge" && challengeHealth <= 10 && !isCorrect) {
        setGameState("crashed");
      }

      // Only change location in challenge mode, not in normal mode
      if (gameMode === "challenge") {
        const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
        setCurrentCity(randomCity);

        // Fetch weather for the new random city
        try {
          const newWeather = await WeatherAPI.getWeather(randomCity);
          setCurrentWeather(newWeather);
        } catch (error) {
          console.error("Failed to fetch weather for random city:", error);
        }
      }

      // Close trivia modal and resume game
      setIsTriviaModalOpen(false);
      setIsPaused(false);
    },
    [challengeHealth]
  );

  // Handle pause with Shift key
  useEffect(() => {
    const handlePause = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        const newPausedState = !isPaused;
        setIsPaused(newPausedState);

        // Play appropriate sound effect
        if ((window as any).playGameSound) {
          (window as any).playGameSound(newPausedState ? "pause" : "resume");
        }
      }
    };

    window.addEventListener("keydown", handlePause);
    return () => window.removeEventListener("keydown", handlePause);
  }, [isPaused]);

  // Handle game completion
  useEffect(() => {
    if (gameState === "landed") {
      onGameComplete(flightData.score);
    }
  }, [gameState, flightData.score]); // Removed onGameComplete from dependencies

  const resetGame = useCallback(() => {
    // Play reset sound
    if ((window as any).playGameSound) {
      (window as any).playGameSound("click");
    }

    // Get current city altitude and position (either current city or original city)
    const currentCityForReset = gameMode === "challenge" ? city : currentCity;
    const cityAltitude = getCityAltitude(currentCityForReset);
    const cityPosition = getCityPosition(currentCityForReset);

    // Reset plane position to city center
    resetPlanePosition(cityAltitude, cityPosition[0], cityPosition[2]);

    setFlightData({
      altitude: cityAltitude,
      speed: 50,
      fuel: 100,
      score: 0,
      position: [cityPosition[0], cityAltitude, cityPosition[2]],
      rotation: [0, 0, 0],
    });
    setGameState("flying");
    // Reset health for both modes
    setFreeFlightHealth(100);
    // Only reset to original city in challenge mode, keep current city in normal mode
    if (gameMode === "challenge") {
      setCurrentCity(city); // Reset to original city
      setChallengeHealth(100);
      setTriviaTimer(4000);
    }
  }, [city, gameMode, currentCity]); // Removed getCityAltitude from dependencies

  // Initialize plane position when component mounts
  useEffect(() => {
    const cityAltitude = getCityAltitude(city);
    const cityPosition = getCityPosition(city);

    // Set initial plane position to city-specific altitude
    resetPlanePosition(cityAltitude, cityPosition[0], cityPosition[2]);
  }, [city]); // Only run when city changes, removed function dependencies

  // Handle R key for reset
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [resetGame]);

  return (
    <>
      {/* Game Loader */}
      {isLoading && (
        <GameLoader
          onLoadingComplete={() => {
            setIsLoading(false);
          }}
          onAudioEnabled={() => {
            setAudioEnabled(true);
          }}
          onStreamReady={handleStreamReady}
        />
      )}

      {/* Main Game */}
      {!isLoading && (
        <div className="relative w-full h-screen">
          {/* Full-screen 3D Game Canvas */}
          <Canvas
            shadows
            camera={{ position: [0, 200, 30], fov: 75 }}
            gl={{ antialias: true }}
            className="w-full h-full"
          >
            <GameScene
              weather={currentWeather}
              setFlightData={setFlightData}
              setGameState={setGameState}
              gameState={gameState}
              isPaused={isPaused}
              gameMode={gameMode}
              currentCity={currentCity}
              isStreamLoading={isStreamLoading}
              isStreamLive={isStreamLive}
              onHealthIncrease={handleHealthIncrease}
              currentHealth={
                gameMode === "free" ? freeFlightHealth : challengeHealth
              }
            />
          </Canvas>

          {/* Daydream API Video Background */}
          <WeatherVideoOverlay
            weather={currentWeather}
            currentCity={currentCity}
            isEnabled={!isLoading && streamData !== null}
            onStreamStateChange={handleStreamStateChange}
            streamData={streamData}
          />

          {/* Game Overlays */}
          <GameOverlays
            flightData={flightData}
            weather={currentWeather}
            currentCity={currentCity}
            gameState={gameState}
            isPaused={isPaused}
            onReset={resetGame}
            gameMode={gameMode}
            challengeHealth={challengeHealth}
            freeFlightHealth={freeFlightHealth}
          />

          {/* Challenge Mode Timer */}
          {gameMode === "challenge" && gameState === "flying" && (
            <div className="absolute top-4 left-4 z-40">
              <div className="bg-purple-800/90 backdrop-blur-sm p-3 rounded-lg border border-purple-600">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-purple-200 font-medium">
                    Next Trivia in:
                  </span>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {Math.ceil(triviaTimer / 1000)}s
                </div>
              </div>
            </div>
          )}

          {/* Circular Map Overlay */}
          <CircularMap
            planePosition={flightData.position}
            onLocationChange={handleLocationChange}
            currentCity={currentCity}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            gameMode={gameMode}
          />

          {/* City Selection Modal */}
          <CitySelectionModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            onLocationChange={handleLocationChange}
            currentCity={currentCity}
            gameMode={gameMode}
            onStartGame={handleStartGame}
            onGameModeChange={handleGameModeChange}
            onWeatherChange={handleWeatherChange}
            currentWeather={currentWeather.condition}
          />

          {/* Trivia Modal for Challenge Mode */}
          <TriviaModal
            isOpen={isTriviaModalOpen}
            onClose={() => setIsTriviaModalOpen(false)}
            currentCity={currentCity}
            onAnswerSubmit={handleTriviaAnswer}
            timeRemaining={triviaTimer}
            health={challengeHealth}
          />
        </div>
      )}

      {/* Audio Manager */}
      <AudioManager
        isPaused={isPaused}
        gameState={gameState}
        isMapOpen={isCityModalOpen}
        isTriviaModalOpen={isTriviaModalOpen}
        flightData={flightData}
        onAudioReady={() => {}}
        isLoading={isLoading}
        audioEnabled={audioEnabled}
      />
    </>
  );
};
