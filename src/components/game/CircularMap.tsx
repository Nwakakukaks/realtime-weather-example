import { useMemo } from "react";
import type { City } from "@/lib/weather";

interface CircularMapProps {
  planePosition: [number, number, number];
  onLocationChange: (city: City) => void;
  currentCity: City;
  onOpenCityModal: () => void;
  gameMode: "free" | "challenge";
}

export function CircularMap({
  planePosition,
  onLocationChange: _onLocationChange,
  currentCity,
  onOpenCityModal,
  gameMode,
}: CircularMapProps) {
  // Convert 3D position to 2D map coordinates
  const mapPosition = useMemo(() => {
    // Get current plane position from the global variable
    const currentX = planePosition[0];
    const currentZ = planePosition[2];

    // Map the world coordinates to map coordinates
    // World bounds are roughly -400 to 400, map is 0-100%
    // Note: Z-axis might be inverted in the game world
    const mapX = ((currentX + 400) / 800) * 100;
    const mapZ = ((currentZ + 400) / 800) * 100;

    // Ensure position stays within map bounds (0-100%)
    const clampedX = Math.max(0, Math.min(100, mapX));
    const clampedZ = Math.max(0, Math.min(100, mapZ));

  

    return { x: clampedX, z: clampedZ };
  }, [planePosition]);

  return (
    <div className="absolute bottom-4 left-6 z-40">
      <div className="relative">
        {/* Map Container - Clickable */}
        <button
          onClick={() => {
            // Play map open sound
            if ((window as any).playGameSound) {
              (window as any).playGameSound('map-open');
            }
            onOpenCityModal();
          }}
          className="w-36 h-36 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-full border-3 border-blue-400 shadow-xl relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
          title="Click to change location"
        >
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-blue-300 rounded-full"></div>
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-blue-300 rounded-full"></div>
            <div className="absolute top-2/5 left-2/5 w-1/5 h-1/5 border border-blue-300 rounded-full"></div>
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 left-0 w-full h-px bg-blue-300"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-blue-300"></div>
          </div>

          {/* Center Point Indicator */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-60"></div>

          {/* Additional Grid Lines for Better Navigation */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 w-full h-px bg-blue-300"></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-blue-300"></div>
            <div className="absolute top-0 left-1/4 w-px h-full bg-blue-300"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-blue-300"></div>
          </div>

          {/* Animated Radar Sweep Effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 w-full h-full border border-blue-400 rounded-full animate-ping"></div>
          </div>

          {/* Cardinal Directions */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-blue-200 text-xs font-bold">
            N
          </div>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-blue-200 text-xs font-bold">
            S
          </div>
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2 text-blue-200 text-xs font-bold">
            W
          </div>
          <div className="absolute top-1/2 right-1 transform -translate-y-1/2 text-blue-200 text-xs font-bold">
            E
          </div>

          {/* Plane Position Dot */}
          <div
            className="absolute w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse"
            style={{
              left: `${mapPosition.x}%`,
              top: `${mapPosition.z}%`,
              transform: "translate(-50%, -50%)",
            }}
            title={`Plane Position: X: ${Math.round(
              planePosition[0]
            )}, Z: ${Math.round(planePosition[2])}`}
          >
            {/* Direction indicator */}
            <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-2 border-red-400 rounded-full opacity-50"></div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

            {/* Movement trail - shows recent positions */}
            <div className="absolute -top-1 -left-1 w-5 h-5 border border-red-300 rounded-full opacity-30 animate-ping"></div>
          </div>

          {/* Current Location Label - Hidden in Challenge Mode */}
          {gameMode === "free" && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="text-blue-100 text-xs font-medium">
                {currentCity.name}
              </span>
            </div>
          )}

          {/* Challenge Mode Indicator */}
          {gameMode === "challenge" && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="text-purple-100 text-xs font-medium text-nowrap">
                Challenge Mode
              </span>
            </div>
          )}

          {/* Coordinates Display */}
          <div className="absolute top-2 left-2 bg-blue-800/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-blue-100">
            <span>X: {Math.round(planePosition[0])}</span>
            <br />
            <span>Z: {Math.round(planePosition[2])}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
