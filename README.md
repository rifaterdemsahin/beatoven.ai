# Beatoven.ai Bulk Music Generator

A Node.js/TypeScript application for generating bulk music for YouTube videos using the [Beatoven.ai API](https://sync.beatoven.ai/api).

## Features

- 🎵 **Single Music Generation**: Generate music for individual videos
- 📦 **Bulk Music Generation**: Generate music for multiple videos at once
- 📊 **CSV Upload**: Upload a CSV file to generate music for many videos
- 🔄 **Job Queue Management**: Uses Redis and Bull for efficient job processing
- 📈 **Progress Tracking**: Track the status of all your music generation jobs
- ⚡ **Concurrent Processing**: Process multiple generation requests simultaneously
- 🔁 **Auto Retry**: Automatically retry failed jobs with exponential backoff

## Prerequisites

- Node.js 18+ 
- Redis (for job queue)
- Beatoven.ai API key

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/rifaterdemsahin/beatoven.ai.git
cd beatoven.ai
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Beatoven.ai API key:
```
BEATOVEN_API_KEY=your_api_key_here
```

4. Start the application with Docker Compose:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/rifaterdemsahin/beatoven.ai.git
cd beatoven.ai
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Redis is running:
```bash
redis-server
```

4. Create a `.env` file and configure:
```bash
cp .env.example .env
# Edit .env and add your API key
```

5. Build the TypeScript code:
```bash
npm run build
```

6. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### API Information
```
GET /api
```

### Generate Single Music Track
```
POST /api/jobs/single
Content-Type: application/json

{
  "title": "Morning Vlog Background",
  "duration": 120,
  "mood": "happy",
  "genre": "pop",
  "tempo": "medium",
  "videoId": "optional_video_id"
}
```

### Generate Bulk Music Tracks
```
POST /api/jobs/bulk
Content-Type: application/json

{
  "jobs": [
    {
      "title": "Video 1 Music",
      "duration": 120,
      "mood": "happy",
      "genre": "pop"
    },
    {
      "title": "Video 2 Music",
      "duration": 180,
      "mood": "energetic",
      "genre": "electronic"
    }
  ]
}
```

### Upload CSV for Bulk Generation
```
POST /api/jobs/upload-csv
Content-Type: multipart/form-data

file: [CSV file]
```

**CSV Format:**
```csv
title,duration,mood,genre,tempo,videoId
"Morning Vlog",120,happy,pop,medium,vid123
"Product Review",30,energetic,electronic,fast,vid124
```

See [example.csv](example.csv) for a complete example.

### Check Job Status
```
GET /api/jobs/status/:bulkJobId
```

### Get Queue Statistics
```
GET /api/jobs/queue-stats
```

## Usage Examples

### Using curl

**Single generation:**
```bash
curl -X POST http://localhost:3000/api/jobs/single \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Video Music",
    "duration": 120,
    "mood": "happy",
    "genre": "pop"
  }'
```

**CSV upload:**
```bash
curl -X POST http://localhost:3000/api/jobs/upload-csv \
  -F "file=@example.csv"
```

**Check status:**
```bash
curl http://localhost:3000/api/jobs/status/bulk-1234567890
```

### Using JavaScript/TypeScript

```typescript
// Single generation
const response = await fetch('http://localhost:3000/api/jobs/single', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Video Music',
    duration: 120,
    mood: 'happy',
    genre: 'pop'
  })
});

const result = await response.json();
console.log('Bulk Job ID:', result.bulkJobId);

// Check status
const statusResponse = await fetch(
  `http://localhost:3000/api/jobs/status/${result.bulkJobId}`
);
const status = await statusResponse.json();
console.log('Progress:', `${status.completed}/${status.totalJobs}`);
```

## Configuration

All configuration is done through environment variables. See `.env.example` for all available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `BEATOVEN_API_URL` | Beatoven.ai API URL | https://sync.beatoven.ai/api |
| `BEATOVEN_API_KEY` | Your API key | (required) |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `MAX_CONCURRENT_JOBS` | Max simultaneous jobs | 5 |
| `JOB_RETRY_ATTEMPTS` | Number of retries | 3 |
| `JOB_RETRY_DELAY` | Retry delay (ms) | 5000 |

## Project Structure

```
beatoven.ai/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── services/
│   │   ├── beatoven.service.ts  # Beatoven.ai API client
│   │   └── queue.service.ts     # Job queue management
│   ├── routes/
│   │   └── jobs.ts              # API route handlers
│   └── middleware/
│       └── errorHandler.ts      # Error handling middleware
├── dist/                        # Compiled JavaScript (generated)
├── uploads/                     # Temporary CSV upload directory
├── package.json                 # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Docker Compose configuration
├── .env.example                # Example environment variables
└── example.csv                 # Example CSV template
```

## Development

### Running Tests
```bash
npm test
```

### Building
```bash
npm run build
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

## Troubleshooting

### Redis Connection Error
Make sure Redis is running:
```bash
# Check if Redis is running
redis-cli ping
# Should return "PONG"
```

### Job Processing Issues
Check the queue statistics:
```bash
curl http://localhost:3000/api/jobs/queue-stats
```

### View Logs (Docker)
```bash
docker-compose logs -f app
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
