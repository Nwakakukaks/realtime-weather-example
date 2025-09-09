import { useState, useEffect } from "react";
import { PlaneGame } from "@/components/PlaneGame";
import { WeatherAPI, CITIES, type WeatherData, type City } from "@/lib/weather";

function App() {
  const [selectedCity] = useState<City>(CITIES[0]); // Default to first city
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // Load weather data on component mount
  useEffect(() => {
    const loadWeather = async () => {
      try {
        const weather = await WeatherAPI.getWeather(selectedCity);
        setWeatherData(weather);
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        // Set default weather data if API fails
        setWeatherData({
          condition: 'Clear',
          temperature: 20,
          humidity: 60,
          windSpeed: 10,
          visibility: 10,
          description: 'Clear skies',
          location: selectedCity.name,
          icon: '01d'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, [selectedCity]);

  // Stream initialization is now handled by GameLoader

  const handleGameComplete = (score: number) => {
    // Could add more game completion logic here
    console.log('Game completed with score:', score);
  };

  // Show loading screen briefly
  if (isLoading || !weatherData) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading Flight Simulator...</p>
        </div>
      </div>
    );
  }

  // Full-screen game
  return (
    <div className="w-full h-screen overflow-hidden">
      <PlaneGame
        weather={weatherData}
        city={selectedCity}
        onGameComplete={handleGameComplete}
      />
    </div>
  );
}

export default App;
