# Daydream App Setup Instructions

This app integrates with the Daydream API to create live weather effects using StreamDiffusion. Follow these steps to run it properly.

## Prerequisites

1. **Daydream API Key**: Get your API key from the [Key Generator Tool](https://app.daydream.live/beta/api-key)
2. **Node.js**: Version 18 or higher
3. **Python 3**: For local server (to avoid CORS issues)

## Environment Setup

1. Create a `.env` file in the project root:
```bash
VITE_DAYDREAM_API_KEY=your_api_key_here
```

2. Install dependencies:
```bash
npm install
```

## Development Mode

For development with hot reload:

```bash
npm run dev
```

**Note**: Development mode may have CORS issues with Livepeer TV player. For full functionality, use the production build with local server.

## Production Mode (Recommended)

1. Build the app:
```bash
npm run build
```

2. Serve locally to avoid CORS issues:
```bash
python3 serve-local.py
```

3. Open your browser to: `http://localhost:8000`

## How It Works

### 1. Stream Creation
- App creates a Daydream stream using the API
- Gets a `whip_url` for sending video input
- Gets a `playback_id` for viewing the output

### 2. Video Input
- Uses the `ImageStreamer` component to send cloud video as input
- Sends video via WHIP protocol to the `whip_url`
- Video gets processed by StreamDiffusion AI

### 3. Video Output
- Displays the AI-processed video using Livepeer TV iframe
- Uses WebRTC for low-latency streaming (`&lowLatency=force`)
- Shows weather effects as background overlay

## Key Features

- ✅ **WebRTC Only**: No HLS, only WebRTC for low latency
- ✅ **Iframe Method**: Uses `lvpr.tv/?v={playbackid}&lowLatency=force`
- ✅ **CORS Safe**: Local server prevents CORS issues
- ✅ **Weather Integration**: Real weather data affects the AI processing
- ✅ **Stream Stabilization**: Proper stream validation and error handling

## Troubleshooting

### Stream Not Loading
- Check that your API key is valid
- Ensure the stream has video input (cloud video should be playing)
- Wait for the Livepeer TV player to load (can take 10+ seconds)

### CORS Errors
- Use the production build with local server instead of dev mode
- Make sure you're accessing via `http://localhost:8000`

### 404 Errors
- The app now properly handles missing WHIP URLs
- Falls back gracefully when no Daydream API is available

## API Integration

The app follows the Daydream API pattern:

1. **Create Stream**: `POST https://api.daydream.live/v1/streams`
2. **Send Video**: WHIP protocol to `whip_url`
3. **View Output**: Livepeer TV iframe with `playback_id`

## Weather Effects

The app can update StreamDiffusion parameters based on weather:

- **Rain**: Blue/stormy effects
- **Clear**: Bright/sunny effects  
- **Clouds**: Soft/overcast effects
- **Storms**: Dark/dramatic effects

## Development Notes

- The `ImageStreamer` sends cloud video as input
- The `WeatherVideoOverlay` displays the AI output
- Stream stabilization ensures reliable video capture
- Background streaming keeps the connection active
