import * as THREE from "three";

// Shared global state for the plane (in units, where 1 unit = 100 meters)
let planePosition = new THREE.Vector3(0, 40, 0); // 40 units = 4000 meters (New York default)
let controls: Record<string, boolean> = {};
let maxVelocity = 0.04;
let jawVelocity = 0;
let pitchVelocity = 0;
let rollVelocity = 0;
let planeSpeed = 0.006;
let turbo = 0;

// Getter functions
export function getPlanePosition() { return planePosition; }
export function getControls() { return controls; }
export function getMaxVelocity() { return maxVelocity; }
export function getJawVelocity() { return jawVelocity; }
export function getPitchVelocity() { return pitchVelocity; }
export function getRollVelocity() { return rollVelocity; }
export function getPlaneSpeed() { return planeSpeed; }
export function getTurbo() { return turbo; }

// Setter functions
export function setJawVelocity(value: number) { jawVelocity = value; }
export function setPitchVelocity(value: number) { pitchVelocity = value; }
export function setRollVelocity(value: number) { rollVelocity = value; }
export function setTurbo(value: number) { turbo = value; }

// Global flag to prevent multiple event listeners
let controlsInitialized = false;

// Function to initialize controls
export function initializeControls() {
  if (typeof window !== "undefined" && !controlsInitialized) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        return;
      }
      controls[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      controls[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    controlsInitialized = true;
  }
}

// Function to reset plane position with custom altitude and position (in meters)
export function resetPlanePosition(altitudeMeters: number = 4000, xOffset: number = 0, zOffset: number = 0) {
  // Convert meters to units (1 unit = 100 meters)
  const altitudeUnits = altitudeMeters / 100;
  planePosition.set(xOffset, altitudeUnits, zOffset);
  jawVelocity = 0;
  pitchVelocity = 0;
  rollVelocity = 0;
  turbo = 0;
}
