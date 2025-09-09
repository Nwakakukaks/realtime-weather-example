# Audio Files for DreamFlight Game

This directory should contain the following audio files for a professional gaming experience:

## Background Music
- `background-music.mp3` - Ambient, uplifting flight music (loopable)

## Flight Sounds
- `flight-engine.mp3` - Aircraft engine sound (loopable)
- `wind.mp3` - Wind rushing past the aircraft (loopable)

## Sound Effects
- `click.mp3` - General UI click sound
- `pause.mp3` - Game pause sound
- `resume.mp3` - Game resume sound
- `map-open.mp3` - Map opening sound
- `map-close.mp3` - Map closing sound
- `city-change.mp3` - City selection sound
- `trivia-open.mp3` - Trivia modal opening sound
- `trivia-correct.mp3` - Correct answer sound
- `trivia-incorrect.mp3` - Wrong answer sound
- `game-over.mp3` - Game over sound
- `landing.mp3` - Successful landing sound
- `crash.mp3` - Crash sound

## Audio Requirements
- **Formats Supported**: MP3, WAV, OGG, M4A (in order of preference)
- **Quality**: 128-320 kbps for compressed formats, 16-bit/44.1kHz for WAV
- **Duration**: 
  - Background music: 2-5 minutes (loopable)
  - Flight sounds: 10-30 seconds (loopable)
  - Sound effects: 0.5-3 seconds
- **Volume**: Normalized to -16 to -12 dB LUFS

## Quick Start - Create Test Audio Files

If you don't have audio files yet, here are some quick options:

### Option 1: Download Free Audio
```bash
# Create the audio directory
mkdir -p public/audio

# Download some free audio files (replace URLs with actual free audio sources)
# You can find free audio at: freesound.org, pixabay.com, zapsplat.com
```

### Option 2: Create Simple Test Files
```bash
# For testing, you can create simple audio files using online tools:
# - Online Tone Generator: https://www.szynalski.com/tone-generator/
# - Generate a 440Hz tone for 10 seconds, save as MP3
# - Use this for all sound effects temporarily
```

### Option 3: Use Placeholder Audio
```bash
# Copy any existing audio files and rename them:
cp /path/to/any/audio.mp3 public/audio/background-music.mp3
cp /path/to/any/audio.mp3 public/audio/flight-engine.mp3
cp /path/to/any/audio.mp3 public/audio/click.mp3
# etc...
```

## Recommended Sources
- **Free**: Freesound.org, Zapsplat, Pixabay
- **Premium**: AudioJungle, Pond5, PremiumBeat
- **Royalty-Free**: Epidemic Sound, Artlist, Musicbed

## Installation
1. Download or create the audio files
2. Rename them exactly as listed above (without extension)
3. Place them in this `public/audio/` directory
4. The game will automatically detect and use the best available format
5. **Supported formats**: MP3, WAV, OGG, M4A (the system will try each format automatically)

## Troubleshooting

### Common Issues:
1. **"No supported source found"**: Audio file doesn't exist or wrong format
2. **AudioContext errors**: Browser audio system issues (usually fixed by user interaction)
3. **Files not loading**: Check file names and locations exactly

### Debug Steps:
1. Use the AudioTest tool in the game (bottom-left corner)
2. Check browser console for error messages
3. Verify files exist in `public/audio/` directory
4. Test with the "Test Basic Audio" button

## Notes
- The game includes volume controls for master, music, and SFX
- Audio automatically pauses when the game is paused
- Flight sounds dynamically adjust based on speed and altitude
- All sounds respect the mute setting
- **Format Detection**: The system automatically tries MP3, WAV, OGG, and M4A formats in order
- **Fallback System**: If one format fails, it automatically tries the next available format
- **Error Handling**: Missing audio files won't crash the game, they'll just be skipped with a console warning
