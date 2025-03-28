import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiRouter } from './routes/api.ts';

// Load environment variables
dotenv.config();

// Initialize express app - following Dependency Injection principle
export function createApp() {
  const app = express();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Mount API routes
  app.use('/api', createApiRouter(apiKey));
  
  return app;
}

// Auto-start the server if this file is the main module
// ES Module version of "if (require.main === module)"
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}
