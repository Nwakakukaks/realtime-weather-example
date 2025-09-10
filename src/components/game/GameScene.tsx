import React from "react";
import {
  Sky,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { WeatherData, City } from "@/lib/weather";
import { Airplane } from "./Airplane";
import { Landscape } from "./Landscape";
import { getTextureUrl } from "@/lib/assets";

import { CameraController } from "./CameraController";


interface GameSceneProps {
  weather: WeatherData;
  setFlightData: React.Dispatch<React.SetStateAction<{
    altitude: number;
    speed: number;
    fuel: number;
    score: number;
    position: [number, number, number];
    rotation: [number, number, number];
  }>>;
  setGameState: React.Dispatch<
    React.SetStateAction<"waiting" | "flying" | "landed" | "crashed">
  >;
  gameState: "waiting" | "flying" | "landed" | "crashed";
  isPaused: boolean;
  gameMode: "free" | "challenge";
  currentCity: City;
  isStreamLoading?: boolean;
  isStreamLive?: boolean;
  onHealthIncrease?: (amount: number) => void;
  currentHealth?: number;
}

export function GameScene({
  weather,
  setFlightData,
  setGameState,
  isPaused,
  gameMode,
  currentCity,
  isStreamLoading = false,
  isStreamLive = false,
}: GameSceneProps) {
  // Environment texture always uses local file
  const envTextureUrl = getTextureUrl("envmapHdr");

  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-10, 5, -5]}
        intensity={0.5}
        color="#ffffff"
      />
      <hemisphereLight
        color="#87CEEB"
        groundColor="#8B4513"
        intensity={0.3}
      />

      {/* Sky and environment - Keep city visible during loading */}
      <Sky 
        sunPosition={[100, 20, 100]} 
        turbidity={isStreamLoading ? 8 : isStreamLive ? 5 : 10}
        rayleigh={isStreamLoading ? 1.5 : isStreamLive ? 2 : 1}
        mieCoefficient={isStreamLoading ? 0.01 : isStreamLive ? 0.005 : 0.01}
        mieDirectionalG={isStreamLoading ? 0.7 : isStreamLive ? 0.8 : 0.5}
      />
      <Environment 
        background={false} 
        files={envTextureUrl}
      />

      {/* Landscape */}
      <Landscape selectedCity={currentCity} />



      {/* Airplane */}
      <Airplane
        weather={weather}
        setFlightData={setFlightData}
        setGameState={setGameState}
        isPaused={isPaused}
        gameMode={gameMode}
      />

      {/* Heart Collectibles for Free Flight Mode - Removed HeartManager component */}

      {/* Targets - commented out to remove red rings from sky */}
      {/* <Targets /> */}

      {/* Camera Controller */}
      <CameraController selectedCity={currentCity} />

      {/* Debug camera controls - you can remove this later */}
      <OrbitControls
        target={new THREE.Vector3(0, 200, 0)}
        maxDistance={1000}
        minDistance={50}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />

      <EffectComposer>
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={-0.15}
          saturation={0.1}
        />
      </EffectComposer>
    </>
  );
}
