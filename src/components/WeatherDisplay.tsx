import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  Sun,
  Wind,
  Thermometer,
  Eye,
  Droplets,
  MapPin,
} from "lucide-react";
import type { WeatherData } from "@/lib/weather";

interface WeatherDisplayProps {
  weather: WeatherData;
}

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case "clear":
      return <Sun className="h-8 w-8 text-yellow-400" />;
    case "clouds":
      return <Cloud className="h-8 w-8 text-gray-400" />;
    case "rain":
      return <CloudRain className="h-8 w-8 text-blue-400" />;
    case "snow":
      return <CloudSnow className="h-8 w-8 text-blue-200" />;
    case "thunderstorm":
      return <Zap className="h-8 w-8 text-yellow-500" />;
    case "drizzle":
      return <Droplets className="h-8 w-8 text-blue-300" />;
    case "mist":
      return <Cloud className="h-8 w-8 text-gray-300" />;
    default:
      return <Sun className="h-8 w-8 text-yellow-400" />;
  }
};

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather }) => {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <MapPin className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            {weather.location}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Weather Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getWeatherIcon(weather.condition)}
                <div>
                  <h4 className="text-xl font-bold text-white capitalize">
                    {weather.condition}
                  </h4>
                  <p className="text-sm text-gray-400 capitalize">
                    {weather.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {weather.temperature}°C
                </div>
              </div>
            </div>

            {/* Weather Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Wind Speed</div>
                  <div className="text-white font-semibold">
                    {weather.windSpeed} km/h
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Humidity</div>
                  <div className="text-white font-semibold">
                    {weather.humidity}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Visibility</div>
                  <div className="text-white font-semibold">
                    {weather.visibility} km
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Feels Like</div>
                  <div className="text-white font-semibold">
                    {weather.temperature}°C
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Effects */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Flight Conditions
            </h4>

            <div className="space-y-4">
              {/* Wind Effect */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Wind Impact</span>
                  <span className="text-white">
                    {weather.windSpeed > 15
                      ? "High"
                      : weather.windSpeed > 10
                      ? "Medium"
                      : "Low"}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      weather.windSpeed > 15
                        ? "bg-red-500"
                        : weather.windSpeed > 10
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (weather.windSpeed / 25) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Visibility Effect */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Visibility</span>
                  <span className="text-white">
                    {weather.visibility < 3
                      ? "Poor"
                      : weather.visibility < 6
                      ? "Fair"
                      : "Good"}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      weather.visibility < 3
                        ? "bg-red-500"
                        : weather.visibility < 6
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (weather.visibility / 10) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Temperature Effect */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Temperature</span>
                  <span className="text-white">
                    {weather.temperature < 5
                      ? "Cold"
                      : weather.temperature > 25
                      ? "Hot"
                      : "Mild"}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      weather.temperature < 5
                        ? "bg-blue-500"
                        : weather.temperature > 25
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.max(((weather.temperature - 5) / 30) * 100, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Flight Recommendation */}
            <div className="mt-4 p-3 rounded-lg bg-gray-700">
              <div className="text-sm text-gray-300">
                <strong>Flight Recommendation:</strong>
                <div className="mt-1">
                  {weather.windSpeed > 15 || weather.visibility < 3
                    ? "⚠️ Challenging conditions - extra caution required"
                    : weather.windSpeed > 10 || weather.visibility < 6
                    ? "⚠️ Moderate conditions - standard flight procedures"
                    : "✅ Good conditions - smooth flight expected"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
