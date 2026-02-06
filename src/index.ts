import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BeatovenService } from './services/beatoven.service';
import { JobQueueService } from './services/queue.service';
import { createJobRoutes } from './routes/jobs';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const BEATOVEN_API_URL = process.env.BEATOVEN_API_URL || 'https://sync.beatoven.ai/api';
const BEATOVEN_API_KEY = process.env.BEATOVEN_API_KEY || '';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');

class BeatovenBulkGenerator {
  private app: Application;
  private beatovenService: BeatovenService;
  private queueService: JobQueueService;

  constructor() {
    this.app = express();
    this.beatovenService = new BeatovenService(BEATOVEN_API_URL, BEATOVEN_API_KEY);
    this.queueService = new JobQueueService(
      REDIS_HOST,
      REDIS_PORT,
      this.beatovenService,
      MAX_CONCURRENT_JOBS
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Enable CORS
    this.app.use(cors());

    // Parse JSON bodies
    this.app.use(express.json());

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Beatoven Bulk Music Generator',
        version: '1.0.0',
        endpoints: {
          'POST /api/jobs/single': 'Generate music for a single request',
          'POST /api/jobs/bulk': 'Generate music for multiple requests',
          'POST /api/jobs/upload-csv': 'Upload CSV file for bulk generation',
          'GET /api/jobs/status/:bulkJobId': 'Get status of a bulk job',
          'GET /api/jobs/queue-stats': 'Get queue statistics'
        }
      });
    });

    // Job routes
    this.app.use('/api/jobs', createJobRoutes(this.queueService));
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`🎵 Beatoven Bulk Generator running on port ${PORT}`);
      console.log(`📡 API URL: ${BEATOVEN_API_URL}`);
      console.log(`🔧 Redis: ${REDIS_HOST}:${REDIS_PORT}`);
      console.log(`⚡ Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
      console.log(`\n✅ Server ready! Visit http://localhost:${PORT}/api for endpoint info`);
    });
  }
}

// Start the application
const app = new BeatovenBulkGenerator();
app.start();
