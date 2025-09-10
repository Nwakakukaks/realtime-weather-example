import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AudioManagerProps {
  isPaused: boolean;
  gameState: 'waiting' | 'flying' | 'landed' | 'crashed';
  isMapOpen?: boolean; // New prop to track map state
  isTriviaModalOpen?: boolean; // New prop to track trivia modal state
  isLoading?: boolean; // New prop to track loading state
  audioEnabled?: boolean; // New prop to track if audio is enabled
  flightData: {
    altitude: number;
    speed: number;
    fuel: number;
  };
  onAudioReady: () => void;
}

interface SoundEffect {
  name: string;
  audio: HTMLAudioElement;
  volume: number;
  loop: boolean;
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  isPaused,
  gameState,
  isMapOpen = false, // Default to false if not provided
  isTriviaModalOpen = false, // Default to false if not provided
  isLoading = false, // Default to false if not provided
  audioEnabled = false, // Default to false if not provided
  flightData,
  onAudioReady,
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [musicVolume, setMusicVolume] = useState(0.6);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // User gesture handler for audio initialization
  const handleUserInteraction = useCallback(() => {
    if (!audioInitialized) {
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  // Helper function to safely set volume with bounds checking
  const setSafeVolume = (audio: HTMLAudioElement, volume: number) => {
    try {
      const safeVolume = Math.max(0, Math.min(1, volume));
      if (isNaN(safeVolume) || !isFinite(safeVolume)) {
        audio.volume = 0.5;
      } else {
        audio.volume = safeVolume;
      }
    } catch (error) {
      audio.volume = 0.5;
    }
  };

  // Helper function to create audio with fallback formats
  const createAudioWithFallback = (baseName: string, formats: string[] = ['mp3', 'wav', 'ogg', 'm4a']) => {
    return new Promise<HTMLAudioElement | null>((resolve) => {
      const audio = new Audio();
      // let loaded = false;
      
      // Try to load the first available format
      const tryFormat = (index: number) => {
        if (index >= formats.length) {
          resolve(null);
          return;
        }
        
        const format = formats[index];
        const url = `/audio/${baseName}.${format}`;
        
        audio.src = url;
        audio.load();
        
        audio.oncanplaythrough = () => {
          // loaded = true;
          resolve(audio);
        };
        
        audio.onerror = () => {
          // Try next format on error
          tryFormat(index + 1);
        };
      };
      
      tryFormat(0);
    });
  };

  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const flightEngineRef = useRef<HTMLAudioElement | null>(null);
  const windRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<Map<string, SoundEffect>>(new Map());

  // Initialize audio context only after user interaction
  useEffect(() => {
    if (!audioInitialized) return;

    const initAudio = async () => {
      try {
        // Check if we already have an audio context
        if (audioContext && audioContext.state !== 'closed') {
          setIsAudioReady(true);
          onAudioReady();
          return;
        }

        // Create new audio context only if needed
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended (requires user gesture)
        if (context.state === 'suspended') {
          try {
            await context.resume();
          } catch (error) {
            console.warn('AudioContext resume failed (user gesture required):', error);
            // Don't fail completely, just warn and continue
          }
        }
        
        setAudioContext(context);
        setIsAudioReady(true);
        onAudioReady();
        
        // Add error handling for audio context
        context.onstatechange = () => {
          // Monitor audio context state changes
        };
        
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        // Try to continue without audio context
        setIsAudioReady(true);
        onAudioReady();
      }
    };

    initAudio();
    
    // Cleanup function
    return () => {
      try {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch((error) => {
            console.warn('AudioContext close error (this is usually harmless):', error);
          });
        }
      } catch (error) {
        console.warn('AudioContext cleanup error (this is usually harmless):', error);
      }
    };
  }, [audioInitialized, onAudioReady]); // Added audioInitialized dependency

  // Add user interaction listeners
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [handleUserInteraction]);

      // Initialize audio elements
  useEffect(() => {
    if (!isAudioReady || !audioEnabled) return;

    // Load all audio files asynchronously
    const loadAudioFiles = async () => {
      try {
        // Background music
        const bgMusic = await createAudioWithFallback('background-music');
        if (bgMusic) {
          bgMusic.loop = true;
          setSafeVolume(bgMusic, musicVolume * masterVolume);
          backgroundMusicRef.current = bgMusic;
          // Background music will only play when paused or during loading
        }

        // Flight engine sound
        const engineSound = await createAudioWithFallback('flight-engine');
        if (engineSound) {
          engineSound.loop = true;
          setSafeVolume(engineSound, sfxVolume * masterVolume * 0.7);
          flightEngineRef.current = engineSound;
        }

        // Wind sound
        const windSound = await createAudioWithFallback('wind');
        if (windSound) {
          windSound.loop = true;
          setSafeVolume(windSound, sfxVolume * masterVolume * 0.5);
          windRef.current = windSound;
        }

        // Sound effects
        const soundEffects = new Map<string, SoundEffect>();
        const effectNames = ['click', 'pause', 'resume', 'map-open', 'map-close', 'city-change', 'trivia-open', 'trivia-correct', 'trivia-incorrect', 'game-over', 'landing', 'crash'];
        
        for (const name of effectNames) {
          const effect = await createAudioWithFallback(name);
          if (effect) {
            soundEffects.set(name, { 
              name, 
              audio: effect, 
              volume: name.includes('correct') ? 0.9 : name.includes('crash') ? 1.0 : 0.8, 
              loop: false 
            });
          }
        }
        
        soundEffectsRef.current = soundEffects;
        
        // Set initial volumes
        soundEffects.forEach(effect => {
          setSafeVolume(effect.audio, effect.volume * sfxVolume * masterVolume);
        });
        
      } catch (error) {
        console.error('Error loading audio files:', error);
      }
    };

        loadAudioFiles();

    return () => {
      // Cleanup
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
      if (flightEngineRef.current) flightEngineRef.current.pause();
      if (windRef.current) windRef.current.pause();
      soundEffectsRef.current.forEach(effect => effect.audio.pause());
    };
  }, [isAudioReady, audioEnabled, musicVolume, sfxVolume, masterVolume]);

  // Handle pause/resume and ensure background music is off during active gameplay
  useEffect(() => {
    if (!backgroundMusicRef.current || !flightEngineRef.current || !windRef.current) return;

    if (isPaused) {
      // When paused: play background music, pause flight sounds
      if (backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(() => {});
      }
      flightEngineRef.current.pause();
      windRef.current.pause();
    } else {
      // When playing (active gameplay): ALWAYS stop background music, play flight sounds
      if (!backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
      }
      if (flightEngineRef.current.paused) {
        flightEngineRef.current.play().catch(() => {});
      }
      if (windRef.current.paused) {
        windRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  // Start flight sounds when game starts (loading completes and not paused)
  useEffect(() => {
    if (!flightEngineRef.current || !windRef.current) return;
    
    // When loading completes and game is not paused, start flight sounds
    if (!isLoading && !isPaused && gameState === 'flying') {
      if (flightEngineRef.current.paused) {
        flightEngineRef.current.play().catch(() => {});
      }
      if (windRef.current.paused) {
        windRef.current.play().catch(() => {});
      }
    }
  }, [isLoading, isPaused, gameState]);

  // Ensure background music is stopped when game is actively running (not paused, map closed, trivia closed)
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    // If game is actively running (not paused, map closed, trivia closed), stop background music
    if (!isPaused && !isMapOpen && !isTriviaModalOpen && gameState === 'flying') {
      if (!backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
      }
    }
  }, [isPaused, isMapOpen, isTriviaModalOpen, gameState]);

  // Force stop background music when transitioning to active gameplay
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    // When game state changes to flying and not paused, ensure background music is off
    if (gameState === 'flying' && !isPaused && !isMapOpen && !isTriviaModalOpen) {
      if (!backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
      }
    }
  }, [gameState, isPaused, isMapOpen, isTriviaModalOpen]);

  // Final safety check: ensure background music is NEVER on during active gameplay
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    // If we're actively flying (not paused, no modals open), background music must be off
    const isActivelyPlaying = gameState === 'flying' && !isPaused && !isMapOpen && !isTriviaModalOpen;
    
    if (isActivelyPlaying && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause();
    }
  }, [gameState, isPaused, isMapOpen, isTriviaModalOpen]);

  // Stop background music when loading completes
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    // When loading stops (isLoading becomes false), stop background music
    if (!isLoading && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause();
    }
  }, [isLoading]);

  // Handle game state changes
  useEffect(() => {
    if (!soundEffectsRef.current) return;

    switch (gameState) {
      case 'landed':
        playSound('landing');
        // Stop background music when landed
        if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.pause();
        }
        break;
      case 'crashed':
        playSound('crash');
        // Play background music when crashed
        if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.play().catch(() => {
            // Background music failed to start after crash
          });
        }
        break;
    }
  }, [gameState]);

  // Handle map open/close state changes
  useEffect(() => {
    if (!backgroundMusicRef.current) return;

    if (isMapOpen) {
      // When map is opened: play background music, pause flight sounds
      if (backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(() => {
          // Background music failed to start when map opened
        });
      }
      // Pause flight sounds when map is open
      if (flightEngineRef.current && !flightEngineRef.current.paused) {
        flightEngineRef.current.pause();
      }
      if (windRef.current && !windRef.current.paused) {
        windRef.current.pause();
      }
    } else {
      // When map is closed: stop background music, resume flight sounds (only if not paused and trivia modal not open)
      if (!isPaused && !isTriviaModalOpen) {
        if (!backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.pause();
        }
        if (flightEngineRef.current && flightEngineRef.current.paused) {
          flightEngineRef.current.play().catch(() => {
            // Flight engine failed to resume after map closed
          });
        }
        if (windRef.current && windRef.current.paused) {
          windRef.current.play().catch(() => {
            // Wind failed to resume after map closed
          });
        }
      }
    }
  }, [isMapOpen, isPaused]);

  // Handle trivia modal state changes
  useEffect(() => {
    if (!backgroundMusicRef.current) return;

    if (isTriviaModalOpen) {
      // When trivia modal is opened: play background music, pause flight sounds
      if (backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(() => {
          // Background music failed to start when trivia modal opened
        });
      }
      // Pause flight sounds when trivia modal is open
      if (flightEngineRef.current && !flightEngineRef.current.paused) {
        flightEngineRef.current.pause();
      }
      if (windRef.current && !windRef.current.paused) {
        windRef.current.pause();
      }
    } else {
      // When trivia modal is closed: stop background music, resume flight sounds (only if not paused and map not open)
      if (!isPaused && !isMapOpen) {
        if (!backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.pause();
        }
        if (flightEngineRef.current && flightEngineRef.current.paused) {
          flightEngineRef.current.play().catch(() => {
            // Flight engine failed to resume after trivia modal closed
          });
        }
        if (windRef.current && windRef.current.paused) {
          windRef.current.play().catch(() => {
            // Wind failed to resume after trivia modal closed
          });
        }
      }
    }
  }, [isTriviaModalOpen, isPaused, isMapOpen]);

  // Dynamic flight audio based on flight data
  useEffect(() => {
    if (!flightEngineRef.current || !windRef.current) return;

    // Adjust engine sound based on speed
    const speedFactor = Math.min(flightData.speed / 100, 1);
    const pitchShift = 0.8 + (speedFactor * 0.4); // 0.8x to 1.2x pitch
    
    if (flightEngineRef.current.playbackRate !== pitchShift) {
      flightEngineRef.current.playbackRate = pitchShift;
    }

    // Adjust wind sound based on altitude and speed
    const altitudeFactor = Math.min(flightData.altitude / Math.max(flightData.altitude * 1.2, 10000), 1);
    const windVolume = (altitudeFactor * 0.3 + speedFactor * 0.2) * sfxVolume * masterVolume;
    
    if (Math.abs(windRef.current.volume - windVolume) > 0.01) {
      setSafeVolume(windRef.current, windVolume);
    }
  }, [flightData.speed, flightData.altitude, sfxVolume, masterVolume]);

  // Play sound effect
  const playSound = useCallback((soundName: string) => {
    if (isMuted || !soundEffectsRef.current) return;
    
    const effect = soundEffectsRef.current.get(soundName);
    if (effect) {
      effect.audio.currentTime = 0;
      effect.audio.play().catch(console.error);
    }
  }, [isMuted]);

  // Volume controls
  const updateMasterVolume = useCallback((volume: number) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    setMasterVolume(safeVolume);
    if (backgroundMusicRef.current) {
      setSafeVolume(backgroundMusicRef.current, musicVolume * safeVolume);
    }
    if (flightEngineRef.current) {
      setSafeVolume(flightEngineRef.current, sfxVolume * safeVolume * 0.7);
    }
    if (windRef.current) {
      setSafeVolume(windRef.current, sfxVolume * safeVolume * 0.5);
    }
    
    soundEffectsRef.current.forEach(effect => {
      setSafeVolume(effect.audio, effect.volume * sfxVolume * safeVolume);
    });
  }, [musicVolume, sfxVolume]);

  const updateMusicVolume = useCallback((volume: number) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    setMusicVolume(safeVolume);
    if (backgroundMusicRef.current) {
      setSafeVolume(backgroundMusicRef.current, safeVolume * masterVolume);
    }
  }, [masterVolume]);

  const updateSfxVolume = useCallback((volume: number) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    setSfxVolume(safeVolume);
    if (flightEngineRef.current) {
      setSafeVolume(flightEngineRef.current, safeVolume * masterVolume * 0.7);
    }
    if (windRef.current) {
      setSafeVolume(windRef.current, safeVolume * masterVolume * 0.5);
    }
    
    soundEffectsRef.current.forEach(effect => {
      setSafeVolume(effect.audio, effect.volume * safeVolume * masterVolume);
    });
  }, [masterVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.muted = !isMuted;
    }
    if (flightEngineRef.current) {
      flightEngineRef.current.muted = !isMuted;
    }
    if (windRef.current) {
      windRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Expose audio control functions globally for other components
  useEffect(() => {
    (window as any).playGameSound = playSound;
    (window as any).audioControls = {
      masterVolume,
      musicVolume,
      sfxVolume,
      isMuted,
      updateMasterVolume,
      updateMusicVolume,
      updateSfxVolume,
      toggleMute,
      flightEngineRef,
      backgroundMusicRef,
      windRef
    };
    
    // Add function to manually start background music
    (window as any).startBackgroundMusic = () => {
      if (backgroundMusicRef.current) {
        if (backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.play().catch(() => {});
        }
      } else {
        // If background music isn't loaded yet, try to load and play it
        const tryLoadAndPlay = async () => {
          try {
            const bgMusic = await createAudioWithFallback('background-music');
            if (bgMusic) {
              bgMusic.loop = true;
              setSafeVolume(bgMusic, musicVolume * masterVolume);
              backgroundMusicRef.current = bgMusic;
              bgMusic.play().catch(() => {});
            }
          } catch (error) {
            // Silent fail
          }
        };
        tryLoadAndPlay();
      }
    };
    
    // Add function to stop background music
    (window as any).stopBackgroundMusic = () => {
      if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
      }
    };

    // Add function to force start background music (for loader)
    (window as any).forceStartBackgroundMusic = () => {
      if (backgroundMusicRef.current) {
        if (backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.play().catch(() => {});
        }
      } else {
        // Force load and play background music
        const forceLoadAndPlay = async () => {
          try {
            const bgMusic = await createAudioWithFallback('background-music');
            if (bgMusic) {
              bgMusic.loop = true;
              setSafeVolume(bgMusic, musicVolume * masterVolume);
              backgroundMusicRef.current = bgMusic;
              bgMusic.play().catch(() => {});
            }
          } catch (error) {
            // Silent fail
          }
        };
        forceLoadAndPlay();
      }
    };

    // Add function to stop all audio (for loader completion)
    (window as any).stopAllAudio = () => {
      if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
      }
      if (flightEngineRef.current && !flightEngineRef.current.paused) {
        flightEngineRef.current.pause();
      }
      if (windRef.current && !windRef.current.paused) {
        windRef.current.pause();
      }
    };

    // Add function to force stop background music (for loader completion)
    (window as any).forceStopBackgroundMusic = () => {
      // Force stop any background music that might be playing
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
      // Also try to stop any other audio elements that might be playing
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
    
    return () => {
      delete (window as any).playGameSound;
      delete (window as any).audioControls;
      delete (window as any).startBackgroundMusic;
      delete (window as any).stopBackgroundMusic;
      delete (window as any).forceStartBackgroundMusic;
      delete (window as any).stopAllAudio;
      delete (window as any).forceStopBackgroundMusic;
    };
  }, [playSound, masterVolume, musicVolume, sfxVolume, isMuted, updateMasterVolume, updateMusicVolume, updateSfxVolume, toggleMute]);

  // Audio settings UI - now integrated into pause menu
  return null;
};
