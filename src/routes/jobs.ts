import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { MusicGenerationRequest, BulkJobRequest } from '../types';
import { JobQueueService } from '../services/queue.service';

const router = Router();
const upload = multer({ dest: 'uploads/' });

export function createJobRoutes(queueService: JobQueueService) {
  /**
   * POST /api/jobs/single
   * Generate music for a single request
   */
  router.post('/single', async (req: Request, res: Response) => {
    try {
      const request: MusicGenerationRequest = req.body;

      // Validate request
      if (!request.title || !request.duration) {
        return res.status(400).json({
          success: false,
          error: 'Title and duration are required'
        });
      }

      // Create a bulk job with single item
      const bulkJobId = `single-${Date.now()}`;
      await queueService.addBulkJobs(bulkJobId, [request]);

      res.json({
        success: true,
        bulkJobId,
        totalJobs: 1,
        message: 'Job queued successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/jobs/bulk
   * Generate music for multiple requests
   */
  router.post('/bulk', async (req: Request, res: Response) => {
    try {
      const { jobs }: BulkJobRequest = req.body;

      if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Jobs array is required and must not be empty'
        });
      }

      // Validate all jobs
      for (const job of jobs) {
        if (!job.title || !job.duration) {
          return res.status(400).json({
            success: false,
            error: 'Each job must have title and duration'
          });
        }
      }

      const bulkJobId = `bulk-${Date.now()}`;
      await queueService.addBulkJobs(bulkJobId, jobs);

      res.json({
        success: true,
        bulkJobId,
        totalJobs: jobs.length,
        message: `${jobs.length} jobs queued successfully`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/jobs/upload-csv
   * Upload CSV file for bulk music generation
   */
  router.post('/upload-csv', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Read and parse CSV file
      const fs = require('fs');
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      // Convert CSV records to MusicGenerationRequest
      const jobs: MusicGenerationRequest[] = records.map((record: any) => ({
        title: record.title || record.Title,
        duration: parseInt(record.duration || record.Duration),
        mood: record.mood || record.Mood,
        genre: record.genre || record.Genre,
        tempo: record.tempo || record.Tempo,
        videoId: record.videoId || record.VideoId || record.video_id
      }));

      // Validate parsed jobs
      if (jobs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid jobs found in CSV file'
        });
      }

      const bulkJobId = `csv-${Date.now()}`;
      await queueService.addBulkJobs(bulkJobId, jobs);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        bulkJobId,
        totalJobs: jobs.length,
        message: `${jobs.length} jobs queued from CSV`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/jobs/status/:bulkJobId
   * Get status of a bulk job
   */
  router.get('/status/:bulkJobId', async (req: Request, res: Response) => {
    try {
      const { bulkJobId } = req.params;
      const jobs = queueService.getJobStatus(bulkJobId);

      if (!jobs) {
        return res.status(404).json({
          success: false,
          error: 'Bulk job not found'
        });
      }

      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const processing = jobs.filter(j => j.status === 'processing').length;
      const pending = jobs.filter(j => j.status === 'pending').length;

      res.json({
        success: true,
        bulkJobId,
        totalJobs: jobs.length,
        completed,
        failed,
        processing,
        pending,
        jobs: jobs.map(j => ({
          id: j.id,
          title: j.request.title,
          status: j.status,
          result: j.result,
          error: j.error,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/jobs/queue-stats
   * Get queue statistics
   */
  router.get('/queue-stats', async (req: Request, res: Response) => {
    try {
      const stats = await queueService.getQueueStats();

      res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
