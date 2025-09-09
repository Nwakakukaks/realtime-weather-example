# Weather Arcade - Flight Simulator

An immersive flight simulator where you can fly a plane across different cities and experience their current weather conditions. Navigate through AI-generated weather backgrounds powered by Daydream, with realistic plane controls and dynamic weather effects.

## Features

### 🎮 Interactive Flight Game
- **Real-time Weather Integration**: Fetch current weather data for cities like Paris, Brussels, Amsterdam, and more
- **Dynamic Gameplay**: Weather conditions affect flight difficulty (wind, visibility, temperature)
- **Canvas-based Graphics**: Smooth 3D plane flight simulation with weather effects
- **Keyboard Controls**: Use arrow keys to steer and control speed

### 🌤️ Weather System
- **Live Weather Data**: Real-time weather from OpenWeatherMap API
- **Weather Effects**: Different visual effects based on conditions (clouds, rain, snow, etc.)
- **Flight Conditions**: Weather impacts game difficulty and visual effects

### 🎨 AI-Generated Backgrounds
- **Weather-based Backgrounds**: Real-time AI-generated backgrounds based on current weather
- **Daydream AI Integration**: Dynamic visual environments powered by Daydream API

## Game Flow

1. **Main Menu**: Choose between starting a free flight or challenge mode
2. **City Selection**: Pick from 10 European cities with real coordinates
3. **Weather Check**: View current weather conditions and flight recommendations
4. **Flight Game**: Navigate your plane through AI-generated weather backgrounds

## Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Nwakakukaks/realtime-weather-example
cd daypaper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_DAYDREAM_API_KEY=your_daydream_api_key_here
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### API Keys

#### Daydream API
- Get your API key from [Daydream Live](https://app.daydream.live)
- Required for dynamic realtime game backgrounds

#### OpenWeather API (Optional)
- Get your API key from [OpenWeatherMap](https://openweathermap.org/api)
- If not provided, the app will use mock weather data
- Free tier available (1000 calls/day)

### Running the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.


### Weather Impact
- **Wind Speed**: Affects plane drift and control difficulty
- **Visibility**: Determines cloud density and atmospheric effects
- **Temperature**: Influences visual atmosphere and lighting
- **Conditions**: Clear, Clouds, Rain, Snow, Thunderstorm, Drizzle, Mist

## Available Cities

- Paris, France
- Brussels, Belgium
- Amsterdam, Netherlands
- Berlin, Germany
- Rome, Italy
- Madrid, Spain
- London, UK
- Vienna, Austria
- Prague, Czech Republic
- Budapest, Hungary

## Technical Details

### Built With
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Canvas API** for game graphics
- **Axios** for API requests
- **Lucide React** for icons

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Daydream Live](https://app.daydream.live) for weather visuals generation
- [OpenWeatherMap](https://openweathermap.org) for weather data
- [Livepeer](https://livepeer.com) for video streaming
