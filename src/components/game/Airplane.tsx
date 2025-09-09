import React, { useEffect, useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { WeatherData } from "@/lib/weather";
import { 
  getPlanePosition,
  getControls, 
  getMaxVelocity, 
  getJawVelocity, 
  getPitchVelocity, 
  getRollVelocity, 
  getPlaneSpeed, 
  getTurbo,
  setJawVelocity,
  setPitchVelocity,
  setRollVelocity,
  setTurbo,
  resetPlanePosition,
  initializeControls
} from "./planeState";

interface AirplaneProps {
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
  isPaused: boolean;
  gameMode: "free" | "challenge";
}

// Global variables are now imported from planeState.ts

// Advanced flight controls system
function easeOutQuad(x: number) {
  return 1 - (1 - x) * (1 - x);
}

export function updatePlaneAxis(
  x: THREE.Vector3,
  y: THREE.Vector3,
  z: THREE.Vector3,
  weather: WeatherData,
  isPaused: boolean = false
) {
  // If paused, don't update anything
  if (isPaused) {
    return;
  }

  let currentJawVelocity = getJawVelocity() * 0.95;
  let currentPitchVelocity = getPitchVelocity() * 0.95;
  let currentRollVelocity = getRollVelocity() * 0.95;

  if (Math.abs(currentJawVelocity) > getMaxVelocity())
    currentJawVelocity = Math.sign(currentJawVelocity) * getMaxVelocity();

  if (Math.abs(currentPitchVelocity) > getMaxVelocity())
    currentPitchVelocity = Math.sign(currentPitchVelocity) * getMaxVelocity();

  if (Math.abs(currentRollVelocity) > getMaxVelocity())
    currentRollVelocity = Math.sign(currentRollVelocity) * getMaxVelocity();

  if (getControls()["arrowleft"]) {
    currentRollVelocity += 0.0025;
  }

  if (getControls()["arrowright"]) {
    currentRollVelocity -= 0.0025;
  }

  if (getControls()["arrowup"]) {
    currentPitchVelocity += 0.0025; // SWAPPED: up arrow now pitches down
  }

  if (getControls()["arrowdown"]) {
    currentPitchVelocity -= 0.0025; // SWAPPED: down arrow now pitches up
  }

  // New turning controls with N and M keys (pure yaw, no banking)
  if (getControls()["n"]) { // N key
    currentJawVelocity += 0.002; // Pure yaw left
  }

  if (getControls()["m"]) { // M key  
    currentJawVelocity -= 0.002; // Pure yaw right
  }

  if (getControls()["r"]) {
    resetPlanePosition();
    x.set(1, 0, 0);
    y.set(0, 1, 0);
    z.set(0, 0, 1);
  }

  // Update the global state
  setJawVelocity(currentJawVelocity);
  setPitchVelocity(currentPitchVelocity);
  setRollVelocity(currentRollVelocity);

  // Apply roll (banking left/right)
  x.applyAxisAngle(z, currentRollVelocity);
  y.applyAxisAngle(z, currentRollVelocity);

  // Apply pitch (nose up/down)
  y.applyAxisAngle(x, currentPitchVelocity);
  z.applyAxisAngle(x, currentPitchVelocity);

  // Apply pure yaw (turning left/right) - independent of banking
  if (Math.abs(currentJawVelocity) > 0.001) {
    x.applyAxisAngle(y, currentJawVelocity);
    z.applyAxisAngle(y, currentJawVelocity);
  }

  // Apply banking-induced yaw (turning left/right) - happens when banking
  // When you roll left, the plane naturally turns left due to lift
  if (Math.abs(currentRollVelocity) > 0.001) {
    const turnRate = currentRollVelocity * 0.5; // Banking creates turning
    x.applyAxisAngle(y, turnRate);
    z.applyAxisAngle(y, turnRate);
  }

  x.normalize();
  y.normalize();
  z.normalize();

  // Wind effect based on weather
  const windEffect = weather.windSpeed * 0.0001;
  const currentPlanePosition = getPlanePosition();
  currentPlanePosition.add(new THREE.Vector3(windEffect, 0, 0));

  // Plane position & velocity
  let currentTurbo = getTurbo();
  if (getControls()[" "]) {
    currentTurbo += 0.025;
  } else {
    currentTurbo *= 0.95;
  }
  currentTurbo = Math.min(Math.max(currentTurbo, 0), 1);
  setTurbo(currentTurbo);

  let turboSpeed = easeOutQuad(currentTurbo) * 0.02;

  currentPlanePosition.add(z.clone().multiplyScalar(-getPlaneSpeed() - turboSpeed));
}

const AirplaneComponent = ({
  weather,
  setFlightData,
  setGameState,
  isPaused,
  gameMode,
}: AirplaneProps): JSX.Element => {
  const { nodes, materials } = useGLTF("/assets/models/airplane.glb") as any;
  const groupRef = useRef<THREE.Group>(null);
  const helixMeshRef = useRef<THREE.Mesh>(null);
  const lastUpdateTime = useRef<number>(0);
  const frameCount = useRef<number>(0);

  // Check if model is loaded
  const isModelLoaded = nodes && materials && Object.keys(nodes).length > 0;

  // Initialize controls
  useEffect(() => {
    initializeControls();
  }, [nodes, materials]);

  const x = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const y = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const z = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame((state, delta) => {
    if (!groupRef.current || !helixMeshRef.current) return;

    updatePlaneAxis(x, y, z, weather, isPaused);

    const rotMatrix = new THREE.Matrix4().makeBasis(x, y, z);
    const currentPlanePosition = getPlanePosition();

    const matrix = new THREE.Matrix4()
      .multiply(
        new THREE.Matrix4().makeTranslation(
          currentPlanePosition.x,
          currentPlanePosition.y,
          currentPlanePosition.z
        )
      )
      .multiply(rotMatrix);

    groupRef.current.matrixAutoUpdate = false;
    groupRef.current.matrix.copy(matrix);
    groupRef.current.matrixWorldNeedsUpdate = true;

    // Rotate propeller
    helixMeshRef.current.rotation.z -= 1.0;

    // Throttle flight data updates to prevent infinite re-renders
    frameCount.current += 1;
    const now = state.clock.elapsedTime;
    
    // Only update flight data every 6 frames (10fps) to prevent excessive re-renders
    if (frameCount.current % 6 === 0 && !isPaused) {
      setFlightData((prev) => {
        // In free mode, fuel doesn't deplete for endless exploration
        const newFuel = gameMode === "free" ? 100 : Math.max(0, prev.fuel - 0.2); // Fuel lasts ~3 minutes in challenge mode

        // Check if fuel ran out - only crash in challenge mode
        if (newFuel <= 0 && prev.fuel > 0 && gameMode === "challenge") {
          setGameState("crashed");
        }

        return {
          ...prev,
          altitude: Math.round(currentPlanePosition.y * 100), // Convert to meters
          speed: Math.round((getPlaneSpeed() + getTurbo() * 0.02) * 1000), // Convert to km/h
          fuel: newFuel,
          score: prev.score + Math.floor((getPlaneSpeed() + getTurbo() * 0.02) * 10), // Score based on speed
          position: [currentPlanePosition.x, currentPlanePosition.y, currentPlanePosition.z],
          rotation: [0, 0, 0], // Could calculate actual rotation if needed
        };
      });
    }
  });

  return (
    <group ref={groupRef}>
      {isModelLoaded ? (
        <group dispose={null} scale={0.1} rotation-y={Math.PI}>
          <mesh
            geometry={nodes.supports.geometry}
            material={materials["Material.004"]}
          />
          <mesh
            geometry={nodes.chassis.geometry}
            material={materials["Material.005"]}
          />
          <mesh
            geometry={nodes.helix.geometry}
            material={materials["Material.005"]}
            ref={helixMeshRef}
          />
        </group>
      ) : (
        // Fallback simple plane model or loading indicator
        <group scale={2}>
          {!isModelLoaded && (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
          )}
          {/* Fuselage */}
          <mesh>
            <cylinderGeometry args={[0.5, 0.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Wings */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[6, 0.2, 12]} />
            <meshStandardMaterial color="#4a90e2" />
          </mesh>

          {/* Tail */}
          <mesh position={[-3, 0, 0]}>
            <boxGeometry args={[2, 0.2, 4]} />
            <meshStandardMaterial color="#4a90e2" />
          </mesh>

          {/* Propeller */}
          <mesh position={[-4, 0, 0]} ref={helixMeshRef}>
            <boxGeometry args={[0.1, 0.1, 2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      )}
    </group>
  );
}

useGLTF.preload("assets/models/airplane.glb");

// Memoize the component to prevent unnecessary re-renders
export const Airplane = memo(AirplaneComponent, (prevProps, nextProps) => {
  return (
    prevProps.weather.condition === nextProps.weather.condition &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.gameMode === nextProps.gameMode
  );
});
