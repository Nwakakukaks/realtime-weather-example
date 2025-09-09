import type { City, WeatherData } from "./weather";
import { WeatherAPI } from "./weather";
import type { StreamData, AlertState } from "../types/stream";

// Constants following the daydream-movies pattern
const API_KEY = import.meta.env.VITE_DAYDREAM_API_KEY;
const PIPELINE_ID = import.meta.env.VITE_PIPELINE_ID || "pip_qpUgXycjWF6YMeSL";
const API_BASE_URL = "https://api.daydream.live";

// Re-export types for easier importing
export type { StreamData, AlertState };

/**
 * Daydream API Integration for Weather Effects
 * Following the daydream-movies pattern for proper stream initialization
 */
export class DaydreamIntegration {
  private static currentStream: StreamData | null = null;
  private static updateTimeout: number | null = null;

  /**
   * Create a new Daydream stream for weather effects
   */
  static async createStream(): Promise<StreamData> {
    if (!API_KEY || API_KEY === "REPLACE_WITH_YOUR_API_KEY") {
      throw new Error("Please set your API key in the .env file first");
    }

    try {
      const requestBody = {
        pipeline_id: PIPELINE_ID,
      };

      const response = await fetch(`${API_BASE_URL}/v1/streams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error(
            `Authentication failed (401). Please check your API key. Response: ${errorText}`
          );
        } else {
          throw new Error(
            `HTTP error! status: ${response.status}. Response: ${errorText}`
          );
        }
      }

      const data = await response.json();
      this.currentStream = data;

      return data;
    } catch (error) {
      console.error("Failed to create Daydream stream:", error);
      throw error;
    }
  }

  /**
   * Start WebRTC stream using the WHIP URL
   */
  static async startWebRTCStream(
    localStream: MediaStream
  ): Promise<RTCPeerConnection> {
    if (!this.currentStream || !this.currentStream.whip_url || !localStream) {
      throw new Error("No stream available. Create a stream first.");
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(this.currentStream.whip_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP request failed: ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.log("✅ WebRTC stream started successfully!");
      return pc;
    } catch (error) {
      console.error("Error starting WebRTC stream:", error);
      throw error;
    }
  }

  /**
   * Update stream parameters for weather effects
   */
  static async updateParameters(params: any): Promise<void> {
    if (!this.currentStream) {
      throw new Error("No stream available. Create a stream first.");
    }

    if (!API_KEY || API_KEY === "REPLACE_WITH_YOUR_API_KEY") {
      throw new Error("Please set your API key in the .env file first");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/beta/streams/${this.currentStream.id}/prompts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

    
    } catch (error) {
      console.error("Error updating parameters:", error);
      throw error;
    }
  }

  /**
   * Fetch real weather data for a city and update Daydream effects
   */
  static async updateWeatherForCity(
    city: City,
    delay: number = 2000
  ): Promise<void> {
    try {
      // Fetch real weather data
      const weatherData = await WeatherAPI.getWeather(city);

      // Update Daydream effects with real weather data
      this.updateWeatherEffectsDebounced(weatherData, city, delay);
    } catch (error) {
      console.error("❌ Failed to fetch real weather data:", error);
      // Fallback to default weather
      const fallbackWeather: WeatherData = {
        location: `${city.name}, ${city.country}`,
        temperature: 20,
        condition: "Clear",
        description: "Clear sky",
        humidity: 60,
        windSpeed: 10,
        visibility: 10,
        icon: "01d",
      };

      this.updateWeatherEffectsDebounced(fallbackWeather, city, delay);
    }
  }

  /**
   * Update weather effects with debouncing for real-time responsiveness
   */
  static updateWeatherEffectsDebounced(
    weather: WeatherData,
    city: City,
    delay: number = 2000
  ): void {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Set new timeout for debounced update
    this.updateTimeout = setTimeout(async () => {
      try {
        await this.updateWeatherEffects(weather, city);
      } catch (error) {
        console.error("❌ Failed to update weather effects:", error);
      }
    }, delay);

    console.log(
      `⏱️ Weather update scheduled in ${delay}ms: ${weather.condition} in ${city.name}`
    );
  }

  /**
   * Update weather effects with manual weather condition (from modal selection)
   */
  static updateWeatherEffectsManual(
    weatherCondition: string,
    city: City,
    delay: number = 3000
  ): void {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Set new timeout for debounced update
    this.updateTimeout = setTimeout(async () => {
      try {
        const manualWeather: WeatherData = {
          location: `${city.name}, ${city.country}`,
          temperature: 20,
          condition: weatherCondition,
          description: `${weatherCondition.toLowerCase()} weather`,
          humidity: 60,
          windSpeed: 10,
          visibility: 10,
          icon: "01d",
        };

        await this.updateWeatherEffects(manualWeather, city);
      } catch (error) {
        console.error("❌ Failed to update manual weather effects:", error);
      }
    }, delay);
  }

  /**
   * Update stream parameters for weather effects
   */
  static async updateWeatherEffects(
    weather: WeatherData,
    city: City
  ): Promise<void> {
    if (!this.currentStream) {
      console.warn("No active stream available for weather effects update");
      return;
    }

    const prompt = this.generateWeatherPrompt(weather, city);
    const seed = this.generateSeed(weather, city);

    const params = {
      model_id: "streamdiffusion",
      pipeline: "live-video-to-video",
      params: {
        model_id: "stabilityai/sd-turbo",
        prompt: prompt,
        prompt_interpolation_method: "slerp",
        normalize_prompt_weights: true,
        normalize_seed_weights: true,
        negative_prompt:
          "buildings, towers, structures, human, girl, people, anime, ground, landscape, blurry, low quality, flat, 2d",
        num_inference_steps: 50,
        seed: seed,
        t_index_list: [0, 8, 17],
        controlnets: [
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-openpose-diffusers",
            preprocessor: "pose_tensorrt",
            preprocessor_params: {},
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-hed-diffusers",
            preprocessor: "soft_edge",
            preprocessor_params: {},
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-canny-diffusers",
            preprocessor: "canny",
            preprocessor_params: {
              high_threshold: 200,
              low_threshold: 100,
            },
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-depth-diffusers",
            preprocessor: "depth_tensorrt",
            preprocessor_params: {},
          },
          {
            conditioning_scale: 0.2,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-color-diffusers",
            preprocessor: "passthrough",
            preprocessor_params: {},
          },
        ],
      },
    };

    await this.updateParameters(params);
  }

  /**
   * Generate concise weather-specific prompts for Daydream
   */

  private static generateWeatherPrompt(
    weather: WeatherData,
    _city: City
  ): string {
    const basePrompt = `Aerial sky view, no buildings, photorealistic, cinematic realism, ultra high detail`;

    let conditionPrompt = "";
    switch (weather.condition.toLowerCase()) {
      case "clear":
        conditionPrompt = `(deep vibrant blue sky), (radiant golden sunlight), (scattered fluffy cumulus clouds), (crystal clear atmosphere), (bright cheerful tones), (calm serene weather), (high visibility)`;
        break;

      case "wind":
        conditionPrompt = `(turbulent atmosphere), (fast-moving cloud streaks), (visible swirling air currents), (motion-blurred wisps in the sky), (chaotic shifting formations), (dynamic wind-swept patterns), (restless stormy energy)`;
        break;

      case "rain":
        conditionPrompt = `(dense dark gray rain clouds), (continuous rainfall in motion), (droplets streaking down), (misty wet haze filling the air), (cold muted tones), (sheets of rain across the scene), (stormy atmosphere)`;
        break;

      case "thunderstorm":
        conditionPrompt = `(towering black thunderclouds), (dramatic lightning bolts illuminating sky), (violent flashes of light), (torrential rainfall), (ominous dark mood), (electrical storm atmosphere), (severe cinematic weather)`;
        break;

      case "fog":
        conditionPrompt = `(ominous storm clouds), (hailstones falling rapidly), (sharp icy white particles streaking), (violent precipitation motion), (dark storm-filled atmosphere), (chaotic icy downpour), (cold cinematic storm mood)`;
        break;

      default:
        conditionPrompt = `${weather.condition.toLowerCase()} weather sky, realistic atmospheric details`;
    }

    return `${basePrompt}, ${conditionPrompt}, hyper-realistic, ultra-detailed`;
  }

  /**
   * Generate consistent seed based on weather and city
   */
  private static generateSeed(weather: WeatherData, city: City): number {
    const str = `${city.name}-${weather.condition}-${weather.temperature}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get the current stream's playback URL for iframe embedding
   */
  static getPlaybackUrl(): string | null {
    if (!this.currentStream) {
      return null;
    }
    return `https://lvpr.tv/?v=${this.currentStream.output_playback_id}&lowLatency=force`;
  }

  /**
   * Get the playback ID for custom player integration
   */
  static getPlaybackId(): string | null {
    return this.currentStream?.output_playback_id || null;
  }

  static getStreamId(): string | null {
    return this.currentStream?.id || null;
  }

  /**
   * Get the WHIP URL for OBS streaming
   */
  static getWhipUrl(): string | null {
    return this.currentStream?.whip_url || null;
  }

  /**
   * Get the Livepeer TV URL for playback
   */
  static getLivepeerTvUrl(): string | null {
    if (!this.currentStream) {
      return null;
    }
    return `https://lvpr.tv/?v=${this.currentStream.output_playback_id}&lowLatency=force`;
  }

  /**
   * Check if Daydream is available and configured
   */
  static isAvailable(): boolean {
    return !!API_KEY && API_KEY !== "REPLACE_WITH_YOUR_API_KEY";
  }

  /**
   * Clean up resources
   */
  static cleanup(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.currentStream = null;
  }
}
