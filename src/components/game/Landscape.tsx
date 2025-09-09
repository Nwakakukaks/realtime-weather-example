import { useEffect, useMemo, memo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { City } from "@/lib/weather";

interface LandscapeProps {
  selectedCity?: City;
}

const LandscapeComponent = ({ selectedCity }: LandscapeProps) => {
  // Map city names to model file names
  const getModelPath = (city: City | undefined): string => {
    if (!city) return "/assets/models/NewYork.glb"; // Default fallback
    
    const modelMap: Record<string, string> = {
      "New York": "NewYork.glb",
      "Sydney": "Sydney.glb"
    };
    
    const modelFile = modelMap[city.name] || "NewYork.glb";
    return `/assets/models/${modelFile}`;
  };

  const modelPath = getModelPath(selectedCity);
  const { nodes, materials } = useGLTF(modelPath) as any;
  
  // Memoize the model data to prevent re-renders
  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedMaterials = useMemo(() => materials, [materials]);

  const [_lightsMaterial, _waterMaterial] = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        envMapIntensity: 0,
        color: new THREE.Color("#ea6619"),
        roughness: 0,
        metalness: 0,
        emissive: new THREE.Color("#f6390f").multiplyScalar(1),
      }),
      <meshStandardMaterial
        transparent={true}
        opacity={0.6}
        color="#23281b"
        roughness={0}
        metalness={0.5}
      />,
    ];
  }, []);

  useEffect(() => {
    // Apply material settings to any available materials
    if (memoizedMaterials) {
      // Debug: Log materials for Sydney to identify the black box
      if (selectedCity?.name === "Sydney") {
        console.log("Sydney materials:", Object.keys(memoizedMaterials));
        Object.keys(memoizedMaterials).forEach(materialKey => {
          const material = memoizedMaterials[materialKey] as any;
          if (material && material.color) {
            console.log(`${materialKey}: color=${material.color.getHex().toString(16)}`);
          }
        });
      }
      
      Object.keys(memoizedMaterials).forEach(materialKey => {
        const material = memoizedMaterials[materialKey] as any;
        if (material) {
          // Aggressively fix dark materials that might be causing black boxes
          if (material.color) {
            const currentColor = material.color.getHex();
            // Make any very dark material much lighter
            if (currentColor < 0x444444) {
              material.color.setHex(0x666666);
            }
            // Ensure no material is completely black
            if (currentColor === 0x000000) {
              material.color.setHex(0x333333);
            }
          }
          
          // Force material properties to prevent black rendering
          material.envMapIntensity = 0.75;
          material.roughness = 0.8;
          material.metalness = 0.1;
          
          // Additional properties to prevent black rendering
          if (material.emissive) {
            material.emissive.setHex(0x000000);
          }
          if (material.specular) {
            material.specular.setHex(0x111111);
          }
        }
      });
    }
  }, [memoizedMaterials, memoizedNodes, selectedCity, modelPath]);

  // Render all available meshes from the New York model
  const renderMeshes = useMemo(() => {
    if (!memoizedNodes) return null;
    
    return Object.keys(memoizedNodes).map((nodeKey, _index) => {
      const node = memoizedNodes[nodeKey];
      if (node && node.geometry) {
        return (
          <mesh
            key={nodeKey}
            geometry={node.geometry}
            material={node.material || materials[Object.keys(materials || {})[0]]}
            castShadow
            receiveShadow
          />
        );
      }
      return null;
    }).filter(Boolean);
  }, [memoizedNodes]);

  return (
    <group dispose={null}>
      {renderMeshes}
    </group>
  );
}

// Preload available city models for better performance
useGLTF.preload("/assets/models/NewYork.glb");
useGLTF.preload("/assets/models/Sydney.glb");
useGLTF.preload("/assets/models/scene.glb"); // Fallback

// Memoize the component to prevent unnecessary re-renders
export const Landscape = memo(LandscapeComponent, (prevProps, nextProps) => {
  return prevProps.selectedCity?.name === nextProps.selectedCity?.name;
});
