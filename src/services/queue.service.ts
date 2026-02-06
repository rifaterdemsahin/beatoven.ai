import Bull, { Queue, Job } from 'bull';
import { MusicGenerationRequest, MusicGenerationJob } from '../types';
import { BeatovenService } from './beatoven.service';

export class JobQueueService {
  private queue: Queue;
  private beatovenService: BeatovenService;
  private jobs: Map<string, MusicGenerationJob[]> = new Map();

  constructor(
    redisHost: string,
    redisPort: number,
    beatovenService: BeatovenService,
    maxConcurrentJobs: number = 5
  ) {
    this.beatovenService = beatovenService;
    
    // Initialize Bull queue
    this.queue = new Bull('music-generation', {
      redis: {
        host: redisHost,
        port: redisPort
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Process jobs with concurrency
    this.queue.process(maxConcurrentJobs, this.processJob.bind(this));

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Add bulk jobs to the queue
   */
  async addBulkJobs(bulkJobId: string, requests: MusicGenerationRequest[]): Promise<void> {
    const jobs: MusicGenerationJob[] = [];

    for (const request of requests) {
      const jobId = `${bulkJobId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const job: MusicGenerationJob = {
        id: jobId,
        request,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jobs.push(job);

      // Add to Bull queue
      await this.queue.add({
        bulkJobId,
        jobId,
        request
      });
    }

    this.jobs.set(bulkJobId, jobs);
  }

  /**
   * Process individual job
   */
  private async processJob(job: Job): Promise<void> {
    const { bulkJobId, jobId, request } = job.data;
    
    console.log(`Processing job ${jobId} for bulk job ${bulkJobId}`);

    // Update job status to processing
    this.updateJobStatus(bulkJobId, jobId, 'processing');

    try {
      // Call Beatoven API
      const result = await this.beatovenService.generateMusic(request);

      if (result.success && result.data) {
        // Update job with result
        this.updateJobWithResult(bulkJobId, jobId, 'completed', result.data);
      } else {
        // Update job with error
        this.updateJobWithError(bulkJobId, jobId, 'failed', result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error(`Error processing job ${jobId}:`, error.message);
      this.updateJobWithError(bulkJobId, jobId, 'failed', error.message);
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Update job status
   */
  private updateJobStatus(
    bulkJobId: string,
    jobId: string,
    status: MusicGenerationJob['status']
  ): void {
    const jobs = this.jobs.get(bulkJobId);
    if (!jobs) return;

    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
    }
  }

  /**
   * Update job with result
   */
  private updateJobWithResult(
    bulkJobId: string,
    jobId: string,
    status: MusicGenerationJob['status'],
    result: any
  ): void {
    const jobs = this.jobs.get(bulkJobId);
    if (!jobs) return;

    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      job.result = {
        audioUrl: result.audioUrl,
        trackId: result.trackId
      };
      job.updatedAt = new Date();
    }
  }

  /**
   * Update job with error
   */
  private updateJobWithError(
    bulkJobId: string,
    jobId: string,
    status: MusicGenerationJob['status'],
    error: string
  ): void {
    const jobs = this.jobs.get(bulkJobId);
    if (!jobs) return;

    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      job.error = error;
      job.updatedAt = new Date();
    }
  }

  /**
   * Get bulk job status
   */
  getJobStatus(bulkJobId: string): MusicGenerationJob[] | undefined {
    return this.jobs.get(bulkJobId);
  }

  /**
   * Setup event listeners for the queue
   */
  private setupEventListeners(): void {
    this.queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed:`, error.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`Job ${job.id} stalled`);
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount()
    ]);

    return { waiting, active, completed, failed };
  }
}
