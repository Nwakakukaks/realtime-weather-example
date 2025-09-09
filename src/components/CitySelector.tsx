import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plane, Globe } from 'lucide-react';
import type { City } from '@/lib/weather';

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  onStartFlight: () => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  cities,
  selectedCity,
  onCitySelect,
  onStartFlight,
}) => {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Choose Your Destination</h2>
          </div>
          <p className="text-gray-400">Select a city to fly to and experience its current weather conditions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cities.map((city) => (
            <div
              key={`${city.name}-${city.country}`}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedCity?.name === city.name && selectedCity?.country === city.country
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
                  : 'hover:ring-2 hover:ring-gray-500 hover:ring-offset-2 hover:ring-offset-gray-900'
              }`}
              onClick={() => onCitySelect(city)}
            >
              <Card className={`bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors ${
                selectedCity?.name === city.name && selectedCity?.country === city.country
                  ? 'bg-blue-900/20 border-blue-600'
                  : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{city.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{city.country}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {city.coordinates.lat.toFixed(2)}°, {city.coordinates.lon.toFixed(2)}°
                      </div>
                    </div>
                    {selectedCity?.name === city.name && selectedCity?.country === city.country && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Plane className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {selectedCity && (
          <div className="text-center">
            <Button
              onClick={onStartFlight}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              <Plane className="h-5 w-5 mr-2" />
              Start Flight to {selectedCity.name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
