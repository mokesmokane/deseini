import dotenv from 'dotenv';
import { createApp } from './server/index.ts';

// Load environment variables
dotenv.config();

// Create and start the app
const app = createApp();
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
