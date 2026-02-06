import axios, { AxiosInstance } from 'axios';
import { MusicGenerationRequest, BeatsOvenAPIResponse } from '../types';

export class BeatovenService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  /**
   * Generate music using Beatoven.ai API
   */
  async generateMusic(request: MusicGenerationRequest): Promise<BeatsOvenAPIResponse> {
    try {
      console.log(`Generating music for: ${request.title}`);
      
      // Call Beatoven.ai API endpoint
      const response = await this.client.post('/generate', {
        title: request.title,
        duration: request.duration,
        mood: request.mood || 'neutral',
        genre: request.genre || 'cinematic',
        tempo: request.tempo || 'medium',
        metadata: {
          videoId: request.videoId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error(`Failed to generate music for ${request.title}:`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Check the status of a music generation job
   */
  async checkJobStatus(trackId: string): Promise<BeatsOvenAPIResponse> {
    try {
      const response = await this.client.get(`/status/${trackId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}
