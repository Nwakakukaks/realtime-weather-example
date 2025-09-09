import { useState, useEffect } from "react";
import { X, MapPin, Plane, Trophy, Compass, Globe, Cloud } from "lucide-react";
import type { City, WeatherData } from "@/lib/weather";
import { CITIES, COMING_SOON_CITIES, WeatherAPI } from "@/lib/weather";
import { DaydreamIntegration } from "@/lib/api";

// Combine all cities for display
const ALL_CITIES = [...CITIES, ...COMING_SOON_CITIES];

// Mapping city names to image files
const CITY_IMAGES: Record<string, string> = {
  "New York": "/cities/paris.jpeg", // Using paris as fallback for New York
  Matera: "/cities/italy.jpeg", // Using italy as fallback for Matera
  Sydney: "/cities/london.jpeg", // Using london as fallback for Sydney
  // Coming soon cities
  Berlin: "/cities/berlin.jpeg",
  Budapest: "/cities/budapest.jpeg",
  "Hong Kong": "/cities/paris.jpeg", // Using paris as fallback for Hong Kong
  London: "/cities/london.jpeg",
  Seoul: "/cities/paris.jpeg", // Using paris as fallback for Seoul
  Vatican: "/cities/italy.jpeg", // Using italy as fallback for Vatican
  Venice: "/cities/italy.jpeg", // Using italy as fallback for Venice
};

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChange: (city: City) => void;
  currentCity: City;
  gameMode: "free" | "challenge";
  onStartGame?: () => void;
  onGameModeChange: (mode: "free" | "challenge") => void;
  onWeatherChange?: (weather: string) => void;
  currentWeather?: string;
}

export function CitySelectionModal({
  isOpen,
  onClose,
  onLocationChange,
  currentCity,
  gameMode,
  onStartGame,
  onGameModeChange,
  onWeatherChange,
  currentWeather = "Clear",
}: CitySelectionModalProps) {
  const [selectedMode, setSelectedMode] = useState(gameMode);
  const [selectedWeather, setSelectedWeather] = useState(currentWeather);

  // Update selectedWeather when currentWeather prop changes
  useEffect(() => {
    setSelectedWeather(currentWeather);
  }, [currentWeather]);
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(
    new Map()
  );
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isApplyingWeather, setIsApplyingWeather] = useState(false);
  const [isApplyingCity, setIsApplyingCity] = useState(false);

  // Weather condition options (5 core conditions with detailed descriptions)
  const weatherOptions = [
    {
      value: "Clear",
      label: "Clear Sky",
      icon: "☀️",
      description: "Bright blue sky with white fluffy clouds and golden sunlight",
    },
    {
      value: "Wind",
      label: "Windy",
      icon: "💨",
      description: "Strong wind motion with rapidly moving white clouds",
    },
    {
      value: "Rain",
      label: "Rainy",
      icon: "🌧️",
      description: "Heavy rain fall motion with water droplets and dark clouds",
    },
    {
      value: "Thunderstorm",
      label: "Storm",
      icon: "⛈️",
      description: "Dark storm clouds with thunder strikes and lightning flashes",
    },
    {
      value: "Fog",
      label: "Foggy",
      icon: "🌫️",
      description: "Thick fog everywhere with extremely low visibility",
    },
  ];

  const handleModeChange = (mode: "free" | "challenge") => {
    setSelectedMode(mode);
    onGameModeChange(mode);
  };

  const handleWeatherChange = async (weather: string) => {
    console.log(`🌤️ CITY SELECTION MODAL - WEATHER SELECTED:`, {
      from: selectedWeather,
      to: weather,
      timestamp: new Date().toISOString(),
    });

    setSelectedWeather(weather);
    setIsApplyingWeather(true);

    if (onWeatherChange) {
      onWeatherChange(weather);
    }

    try {
      // Use the current city from props
      const cityForWeather = currentCity;

      // Update Daydream stream with the manually selected weather condition
      DaydreamIntegration.updateWeatherEffectsManual(
        weather,
        cityForWeather,
        1000
      );

      // Manual weather override applied

      console.log(`✅ Manual weather change applied successfully: ${weather}`);
    } catch (error) {
      console.error("❌ Failed to update manual weather effects:", error);
    }

    // Simulate API processing time (7 seconds as mentioned)
    setTimeout(() => {
      setIsApplyingWeather(false);
    }, 7000);
  };

  const handleCitySelect = async (city: City) => {
    // Check if city is coming soon
    const isComingSoon = COMING_SOON_CITIES.some((c) => c.name === city.name);
    if (isComingSoon) {
      return; // Don't allow selection of coming soon cities
    }

    setIsApplyingCity(true);

    // Play city change sound
    if ((window as any).playGameSound) {
      (window as any).playGameSound("city-change");
    }

    try {
      console.log(
        `🌍 CITY SELECTION MODAL - CITY SELECTED: ${city.name}, ${city.country}`
      );

      // Update the location in the parent component first
      onLocationChange(city);

      // Reset weather selection to match the live weather for the new city
      // This ensures the modal shows the actual weather being rendered
      const cityWeather = weatherData.get(city.name);
      if (cityWeather) {
        setSelectedWeather(cityWeather.condition);
        if (onWeatherChange) {
          onWeatherChange(cityWeather.condition);
        }
      }

      // Live weather will be applied for the new city

      // Note: Weather update will be handled by WeatherVideoOverlay initialization
      // when the currentCity prop changes, so we don't need to call it here
      console.log(`✅ City change applied successfully: ${city.name}`);
    } catch (error) {
      console.error("❌ Failed to update city:", error);
      // Still update location even if other operations fail
      onLocationChange(city);
    }

    // Simulate city change processing time
    setTimeout(() => {
      setIsApplyingCity(false);
      onClose();
    }, 3000);
  };

  // Fetch weather data when modal opens
  useEffect(() => {
    if (isOpen && weatherData.size === 0) {
      const fetchAllWeather = async () => {
        setIsLoadingWeather(true);
        try {
          const allWeather = await WeatherAPI.getAllCitiesWeather();
          setWeatherData(allWeather);
        } catch (error) {
          console.error("Failed to fetch weather data:", error);
        } finally {
          setIsLoadingWeather(false);
        }
      };

      fetchAllWeather();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 ">
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-2xl max-w-4xl w-full mx-4 animate-in zoom-in-95 duration-300 border border-slate-700 shadow-2xl"
        style={{
          maxHeight: "85vh",
          overflowY: "auto",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE 10+
        }}
      >
        {/* Hide scrollbars for Webkit browsers */}
        <style>
          {`
            .city-modal-hide-scrollbar::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              background: transparent !important;
            }
          `}
        </style>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Dream Flight
              </h2>
              <p className="text-slate-400 text-sm">
                Choose your destination & game mode
              </p>
              {isLoadingWeather && (
                <p className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                  <Cloud className="h-3 w-3 animate-pulse" />
                  Loading weather data...
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Play map close sound
                if ((window as any).playGameSound) {
                  (window as any).playGameSound("map-close");
                }
                onClose();
              }}
              className="p-2 hover:bg-slate-700 rounded-xl transition-colors duration-200"
            >
              <X className="h-6 w-6 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            Game Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleModeChange("free")}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                selectedMode === "free"
                  ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25"
                  : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedMode === "free" ? "bg-blue-500" : "bg-slate-600"
                  }`}
                >
                  <Compass className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-lg">Free Flight</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed text-start">
                Explore the world freely without objectives. Perfect for
                sightseeing and practicing your flying skills.
              </p>
            </button>

            <button
              onClick={() => handleModeChange("challenge")}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                selectedMode === "challenge"
                  ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25"
                  : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedMode === "challenge"
                      ? "bg-purple-500"
                      : "bg-slate-600"
                  }`}
                >
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-lg">Challenge Mode</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed text-start">
                Complete missions, manage fuel, and achieve high scores. Test
                your piloting skills under pressure.
              </p>
            </button>
          </div>
        </div>

        {/* Weather Selection */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Weather Conditions
          </h3>
          <div className="mb-2 text-sm text-slate-400 flex items-center gap-2">
            <span>Current:</span>
            <span className="text-blue-400 font-medium">{selectedWeather}</span>
          </div>
          {/* Weather options in a single horizontal row, not a grid */}
          <div
            className="flex flex-row gap-4 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE 10+
            }}
          >
            <style>
              {`
                /* Hide scrollbar for Chrome, Safari and Opera */
                .city-modal-hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div className="flex flex-row gap-4 city-modal-hide-scrollbar w-full">
              {weatherOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleWeatherChange(option.value)}
                  disabled={isApplyingWeather}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left relative min-w-[160px] ${
                    selectedWeather === option.value
                      ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25"
                      : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50"
                  } ${
                    isApplyingWeather ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isApplyingWeather && selectedWeather === option.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="text-4xl mb-3 flex justify-center">
                    {option.icon}
                  </div>
                  <div className="font-semibold text-sm mb-1 text-center">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-400 text-center">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* City Selection */}
        <div>
          <h3 className="text-xl font-semibold my-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Select Destination
          </h3>
          <div
            className="flex gap-4 overflow-x-auto pb-2 city-modal-hide-scrollbar"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE 10+
            }}
          >
            {ALL_CITIES.map((city) => {
              const cityImage = CITY_IMAGES[city.name];
              const cityWeather = weatherData.get(city.name);
              const isComingSoon = COMING_SOON_CITIES.some(
                (c) => c.name === city.name
              );
              const isCurrentCity = city.name === currentCity.name;

              return (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  disabled={isComingSoon || isApplyingCity}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 transform flex-shrink-0 w-48 ${
                    isComingSoon
                      ? "opacity-60 cursor-not-allowed border-slate-600"
                      : isCurrentCity
                      ? "border-green-500 shadow-lg shadow-green-500/25 ring-2 ring-green-500/50 hover:scale-105"
                      : "border-slate-600 hover:border-slate-400 hover:shadow-lg hover:shadow-slate-500/25 hover:scale-105"
                  } ${isApplyingCity ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {/* City Image Background */}
                  <div className="relative h-32 w-full">
                    {cityImage ? (
                      <img
                        src={cityImage}
                        alt={`${city.name}, ${city.country}`}
                        className={`w-full h-full object-cover ${
                          isComingSoon ? "grayscale" : ""
                        }`}
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          e.currentTarget.style.display = "none";
                          const nextElement = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    {/* Fallback gradient background */}
                    <div
                      className={`absolute inset-0 ${
                        isComingSoon
                          ? "bg-gradient-to-br from-slate-600 to-slate-700"
                          : "bg-gradient-to-br from-blue-600 to-purple-600"
                      }`}
                      style={{ display: cityImage ? "none" : "block" }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Weather Info - Top Left (only for available cities) */}
                    {!isComingSoon && cityWeather && !isLoadingWeather && (
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 text-white">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">
                            {WeatherAPI.getWeatherIcon(cityWeather.condition)}
                          </span>
                          <span
                            className={`text-sm font-medium ${WeatherAPI.getTemperatureColor(
                              cityWeather.temperature
                            )}`}
                          >
                            {cityWeather.temperature}°C
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Loading Weather (only for available cities) */}
                    {!isComingSoon && isLoadingWeather && (
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 text-white">
                        <div className="flex items-center gap-1">
                          <Cloud className="h-3 w-3 animate-pulse" />
                          <span className="text-xs">...</span>
                        </div>
                      </div>
                    )}

                    {/* Coming Soon Badge */}
                    {isComingSoon && (
                      <div className="absolute top-2 left-2 bg-yellow-600/90 backdrop-blur-sm rounded-lg px-2 py-1 text-white">
                        <span className="text-xs font-medium">Coming Soon</span>
                      </div>
                    )}

                    {/* Current location indicator */}
                    {isCurrentCity && !isComingSoon && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-green-500 rounded-full p-1.5">
                          <Plane className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* City Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="font-semibold text-sm mb-1 text-left">
                      {city.name}
                    </div>
                    <div className="text-xs text-slate-300 text-left flex items-center gap-2">
                      <span>{city.country}</span>
                    </div>
                    {isCurrentCity && !isComingSoon && (
                      <div className="mt-1 text-xs text-green-400 font-medium text-left">
                        ✈️ Current Location
                      </div>
                    )}
                  </div>

                  {/* Hover effect overlay (only for available cities) */}
                  {!isComingSoon && (
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-300" />
                  )}

                  {/* Disabled overlay for coming soon cities */}
                  {isComingSoon && (
                    <div className="absolute inset-0 bg-slate-800/5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-center">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200"
                disabled={isApplyingWeather || isApplyingCity}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onStartGame && !isApplyingWeather && !isApplyingCity) {
                    onStartGame();
                  }
                }}
                className={`px-6 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2 ${
                  isApplyingWeather || isApplyingCity
                    ? "bg-slate-600 cursor-not-allowed opacity-50"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isApplyingWeather || isApplyingCity}
              >
                {isApplyingWeather || isApplyingCity ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading Gameplay..
                  </>
                ) : (
                  "Let's Fly"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
