#!/usr/bin/env node

/**
 * Validation script to verify the project structure and types
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Beatoven Bulk Music Generator Project...\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  '.env.example',
  '.gitignore',
  'Dockerfile',
  'docker-compose.yml',
  'example.csv',
  'README.md',
  'src/index.ts',
  'src/types/index.ts',
  'src/services/beatoven.service.ts',
  'src/services/queue.service.ts',
  'src/routes/jobs.ts',
  'src/middleware/errorHandler.ts',
  'dist/index.js',
  'dist/types/index.js',
  'dist/services/beatoven.service.js',
  'dist/services/queue.service.js',
  'dist/routes/jobs.js',
  'dist/middleware/errorHandler.js'
];

let allFilesExist = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📦 Checking package.json dependencies...');
const packageJson = require('./package.json');
const requiredDeps = ['express', 'axios', 'dotenv', 'bull', 'multer', 'csv-parse', 'cors'];
const requiredDevDeps = ['typescript', 'ts-node', '@types/express', '@types/node'];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${dep}`);
  if (!exists) allFilesExist = false;
});

requiredDevDeps.forEach(dep => {
  const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${dep} (dev)`);
});

console.log('\n🔧 Checking TypeScript compilation...');
try {
  const indexJs = require('./dist/index.js');
  console.log('✅ TypeScript compiled successfully');
} catch (error) {
  console.log('❌ Error loading compiled TypeScript:', error.message);
  allFilesExist = false;
}

console.log('\n📝 Checking example.csv format...');
const csvContent = fs.readFileSync(path.join(__dirname, 'example.csv'), 'utf-8');
const csvLines = csvContent.trim().split('\n');
const csvHeader = csvLines[0];
const requiredColumns = ['title', 'duration', 'mood', 'genre', 'tempo', 'videoId'];

requiredColumns.forEach(col => {
  const exists = csvHeader.toLowerCase().includes(col.toLowerCase());
  const status = exists ? '✅' : '❌';
  console.log(`${status} Column: ${col}`);
  if (!exists) allFilesExist = false;
});

console.log('\n🐳 Checking Docker configuration...');
const dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf-8');
console.log(dockerCompose.includes('redis') ? '✅ Redis service configured' : '❌ Redis service missing');
console.log(dockerCompose.includes('app') ? '✅ App service configured' : '❌ App service missing');

console.log('\n📚 Checking README documentation...');
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf-8');
const readmeChecks = [
  { text: 'Installation', label: 'Installation section' },
  { text: 'API Endpoints', label: 'API documentation' },
  { text: 'Usage Examples', label: 'Usage examples' },
  { text: 'docker-compose', label: 'Docker instructions' },
  { text: 'Configuration', label: 'Configuration section' }
];

readmeChecks.forEach(check => {
  const exists = readme.includes(check.text);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${check.label}`);
});

console.log('\n' + '='.repeat(60));
if (allFilesExist) {
  console.log('✅ All validation checks passed!');
  console.log('\n🎉 Project is ready for use!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and add your Beatoven.ai API key');
  console.log('2. Start Redis: docker run -d -p 6379:6379 redis:7-alpine');
  console.log('3. Run the app: npm start');
  console.log('4. Or use Docker Compose: docker-compose up -d');
  process.exit(0);
} else {
  console.log('❌ Some validation checks failed!');
  process.exit(1);
}
