import React, { useEffect, useRef, useState } from 'react';

interface LoaderAudioManagerProps {
  isEnabled: boolean;
  onAudioReady: () => void;
}

export const LoaderAudioManager: React.FC<LoaderAudioManagerProps> = ({
  isEnabled,
  onAudioReady
}) => {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [_isPlaying, setIsPlaying] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Helper function to create audio with fallback formats
  const createAudioWithFallback = (baseName: string, formats: string[] = ['mp3', 'wav', 'ogg', 'm4a']) => {
    return new Promise<HTMLAudioElement | null>((resolve) => {
      const audio = new Audio();
      
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
          resolve(audio);
        };
        
        audio.onerror = () => {
          tryFormat(index + 1);
        };
      };
      
      tryFormat(0);
    });
  };

  // Load and start background music when enabled (only once)
  useEffect(() => {
    if (!isEnabled || hasLoaded) return;

    const loadAndPlayMusic = async () => {
      try {
        const bgMusic = await createAudioWithFallback('background-music');
        if (bgMusic) {
          bgMusic.loop = true;
          bgMusic.volume = 0.6;
          backgroundMusicRef.current = bgMusic;
          setHasLoaded(true);
          
          const playPromise = bgMusic.play();
          if (playPromise) {
            playPromise.then(() => {
              setIsPlaying(true);
              onAudioReady();
            }).catch(() => {
              // Failed to play
            });
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    loadAndPlayMusic();
  }, [isEnabled, hasLoaded]); // Removed onAudioReady from dependencies

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current = null;
        setIsPlaying(false);
      }
    };
  }, []);

  // Expose global function to stop loader music
  useEffect(() => {
    (window as any).stopLoaderMusic = () => {
      if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };

    return () => {
      delete (window as any).stopLoaderMusic;
    };
  }, []);

  return null;
};
