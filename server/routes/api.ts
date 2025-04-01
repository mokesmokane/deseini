import express from 'express';
import { RoleController } from '../controllers/RoleController.ts';
import { TaskController } from '../controllers/TaskController.ts';

// Router factory function - following the Open/Closed Principle
export function createApiRouter(apiKey: string): express.Router {
  const router = express.Router();
  const roleController = new RoleController(apiKey);
  const taskController = new TaskController(apiKey);
  
  // Health check endpoint
  router.get('/health', (_req: express.Request, res: express.Response) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Role extraction endpoint - binding the controller method to the route
  router.post('/extract-role-info', (req: express.Request, res: express.Response) => {
    roleController.extractRoleInfo(req, res);
  });
  
  // Task generation endpoint
  router.post('/generate-tasks', (req: express.Request, res: express.Response) => {
    taskController.generateTasks(req, res);
  });
  
  return router;
}
