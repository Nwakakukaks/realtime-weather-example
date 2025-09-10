// Simplified asset URLs - always external for specified assets
export const EXTERNAL_ASSET_URLS = {
  models: {
    newYork: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3ru3x4ds6An6gRGyK1t9mT720wvOWhJqDdIec",
    sydney: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3QJl6abMB4oh9KpZbJwuajRl6c2XWTSfEVm85"
  },
  textures: {
    sydneyCityPart1: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3Rnkaiv7ezZopn3PXENHh2IWTs8LweVu5ltOA",
    sydneyCityPart2: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3fB9hwC2Bzb0DmVRYarsltkZO84wvepWFinHG",
    sydneyCityPart3: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3c4redUJnrjPmytFlpWZ2Y3gkRdK087boqXfG"
  }
};

// Local asset URLs for non-external assets
export const LOCAL_ASSET_URLS = {
  models: {
    airplane: "/assets/models/airplane.glb",
  },
  textures: {
    envmapHdr: "/assets/textures/envmap.hdr",
    envmapJpg: "/assets/textures/envmap.jpg",
  },
};

// Helper function to get model URL
export const getModelUrl = (modelName: string): string => {
  // External models
  if (modelName === 'newYork') return EXTERNAL_ASSET_URLS.models.newYork;
  if (modelName === 'sydney') return EXTERNAL_ASSET_URLS.models.sydney;
  
  // Local models
  if (modelName === 'airplane') return LOCAL_ASSET_URLS.models.airplane;
  
  // Default fallback to New York external model
  return EXTERNAL_ASSET_URLS.models.newYork;
};

// Helper function to get texture URL
export const getTextureUrl = (textureName: string): string => {
  // External textures
  if (textureName === 'sydneyCityPart1') return EXTERNAL_ASSET_URLS.textures.sydneyCityPart1;
  if (textureName === 'sydneyCityPart2') return EXTERNAL_ASSET_URLS.textures.sydneyCityPart2;
  if (textureName === 'sydneyCityPart3') return EXTERNAL_ASSET_URLS.textures.sydneyCityPart3;
  
  // Local textures
  if (textureName === 'envmapHdr') return LOCAL_ASSET_URLS.textures.envmapHdr;
  if (textureName === 'envmapJpg') return LOCAL_ASSET_URLS.textures.envmapJpg;
  
  // Default fallback
  return "/assets/textures/envmap.hdr";
};

// City to model mapping
export const CITY_MODEL_MAP: Record<string, string> = {
  "New York": "newYork",
  "Sydney": "sydney",
  "Matera": "matera",
};
