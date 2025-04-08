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
  
  // Task generation / Conversation endpoint
  // router.post('/generate-tasks', (req: express.Request, res: express.Response) => {
  //   taskController.generateTasks(req, res);
  // });

  // Conversation endpoint (streaming)
  router.post('/conversation', (req: express.Request, res: express.Response) => {
    taskController.handleConversationStep(req, res);
  });

  // Task creation endpoint (non-streaming, returns JSON)
  router.post('/create-tasks', (req: express.Request, res: express.Response) => {
    taskController.createTasksFromConversation(req, res);
  });

  // Suggested replies endpoint
  router.post('/generate-suggestions', (req: express.Request, res: express.Response) => {
    taskController.generateSuggestions(req, res);
  });
  
  // Project plan generation endpoint
  router.post('/generate-project-plan', (req: express.Request, res: express.Response) => {
    taskController.generateProjectPlan(req, res);
  });
  
  // Convert project plan to draft tasks endpoint
  router.post('/convert-plan-to-tasks', (req: express.Request, res: express.Response) => {
    taskController.convertPlanToTasks(req, res);
  });
  
  // Generate final project plan endpoint
  router.post('/generate-final-plan', (req: express.Request, res: express.Response) => {
    taskController.generateFinalPlan(req, res);
  });
  
  // Get project context endpoint
  router.get('/get-project-context', (req: express.Request, res: express.Response) => {
    taskController.getProjectContext(req, res);
  });
  
  return router;
}
