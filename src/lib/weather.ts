import axios from 'axios';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

export interface City {
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}



export const CITIES: City[] = [
  { name: "New York", country: "USA", coordinates: { lat: 40.7128, lon: -74.0060 } },
  { name: "Sydney", country: "Australia", coordinates: { lat: -33.8688, lon: 151.2093 } },
];

export const COMING_SOON_CITIES: City[] = [
  { name: "Berlin", country: "Germany", coordinates: { lat: 52.5200, lon: 13.4050 } },
  { name: "Budapest", country: "Hungary", coordinates: { lat: 47.4979, lon: 19.0402 } },
  { name: "Hong Kong", country: "China", coordinates: { lat: 22.3193, lon: 114.1694 } },
  { name: "London", country: "UK", coordinates: { lat: 51.5074, lon: -0.1278 } },
  { name: "Matera", country: "Italy", coordinates: { lat: 40.6667, lon: 16.6000 } },
  { name: "Seoul", country: "South Korea", coordinates: { lat: 37.5665, lon: 126.9780 } },
 
  { name: "Vatican", country: "Vatican City", coordinates: { lat: 41.9029, lon: 12.4534 } },
  { name: "Venice", country: "Italy", coordinates: { lat: 45.4408, lon: 12.3155 } },
];



export class WeatherAPI {
  private static API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  private static BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

  static async getWeather(city: City): Promise<WeatherData> {
    // Check cache first
    const cacheKey = `${city.name}-${city.country}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    if (!this.API_KEY) {
      // Fallback to mock data if no API key
      const mockData = this.getMockWeather(city);
      this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return mockData;
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat: city.coordinates.lat,
          lon: city.coordinates.lon,
          appid: this.API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;
      const weatherData: WeatherData = {
        location: `${city.name}, ${city.country}`,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        visibility: Math.round(data.visibility / 1000), // Convert m to km
        icon: data.weather[0].icon,
      };

      // Cache the result
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      const mockData = this.getMockWeather(city);
      this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return mockData;
    }
  }

  static async getAllCitiesWeather(): Promise<Map<string, WeatherData>> {
    const weatherPromises = CITIES.map(async (city) => {
      try {
        const weather = await this.getWeather(city);
        return [city.name, weather] as [string, WeatherData];
      } catch (error) {
        console.error(`Failed to get weather for ${city.name}:`, error);
        return [city.name, this.getMockWeather(city)] as [string, WeatherData];
      }
    });

    const results = await Promise.allSettled(weatherPromises);
    const weatherMap = new Map<string, WeatherData>();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const [cityName, weatherData] = result.value;
        weatherMap.set(cityName, weatherData);
      } else {
        // Fallback to mock data for failed requests
        const city = CITIES[index];
        weatherMap.set(city.name, this.getMockWeather(city));
      }
    });

    return weatherMap;
  }

  static getWeatherIcon(condition: string): string {
    // Map weather conditions to emoji icons as fallback
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
    };

    return iconMap[condition] || '🌤️';
  }

  static getTemperatureColor(temp: number): string {
    if (temp <= 0) return 'text-blue-300';
    if (temp <= 10) return 'text-blue-200';
    if (temp <= 20) return 'text-green-200';
    if (temp <= 30) return 'text-yellow-200';
    return 'text-red-200';
  }

  private static getMockWeather(city: City): WeatherData {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Drizzle', 'Mist'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      location: `${city.name}, ${city.country}`,
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
      condition: randomCondition,
      description: `${randomCondition.toLowerCase()} weather`,
      humidity: Math.floor(Math.random() * 60) + 30, // 30-90%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      visibility: Math.floor(Math.random() * 8) + 2, // 2-10 km
      icon: '01d', // Default sunny icon
    };
  }

  
}
