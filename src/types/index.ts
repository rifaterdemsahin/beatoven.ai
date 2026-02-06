export interface MusicGenerationRequest {
  title: string;
  duration: number; // in seconds
  mood?: string;
  genre?: string;
  tempo?: string;
  videoId?: string;
}

export interface MusicGenerationJob {
  id: string;
  request: MusicGenerationRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  result?: {
    audioUrl?: string;
    trackId?: string;
  };
  error?: string;
}

export interface BulkJobRequest {
  jobs: MusicGenerationRequest[];
}

export interface BulkJobResponse {
  bulkJobId: string;
  totalJobs: number;
  status: string;
}

export interface JobStatusResponse {
  bulkJobId: string;
  totalJobs: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  jobs: MusicGenerationJob[];
}

export interface BeatsOvenAPIResponse {
  success: boolean;
  data?: {
    trackId: string;
    audioUrl: string;
    status: string;
  };
  error?: string;
}
