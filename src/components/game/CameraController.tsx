import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getPlanePosition } from "./planeState";
import type { City } from "@/lib/weather";

interface CameraControllerProps {
  selectedCity?: City;
}

export function CameraController({ selectedCity }: CameraControllerProps) {
  const { camera } = useThree();

  useFrame(() => {
    const currentPlanePosition = getPlanePosition();

    // Dynamic camera positioning based on city
    let cameraOffset: THREE.Vector3;

    if (selectedCity) {
      // Adjust camera based on city characteristics
      switch (selectedCity.name) {
        case "New York":
          cameraOffset = new THREE.Vector3(-5, 3, 6);
          break;
        default:
          // Default positioning
          cameraOffset = new THREE.Vector3(-3, 2, 4);
      }
    } else {
      // Default positioning
      cameraOffset = new THREE.Vector3(-5, 2, 5);
    }

    // Position camera relative to plane
    camera.position.copy(currentPlanePosition).add(cameraOffset);

    // Look at the plane with slight downward angle for better city view
    const lookAtTarget = currentPlanePosition.clone();
    lookAtTarget.y -= 2; // Look slightly down to see the city better
    camera.lookAt(lookAtTarget);
  });

  return null;
}
