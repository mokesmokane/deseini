import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleController } from '../controllers/RoleController';
import request from 'supertest';
import express from 'express';
import { createApiRouter } from '../routes/api';

// Mock OpenAIService
vi.mock('../services/OpenAIService', () => {
  return {
    OpenAIService: vi.fn().mockImplementation(() => {
      return {
        extractRoleInfo: vi.fn().mockImplementation((text) => {
          if (!text) {
            return Promise.resolve({ error: 'No text provided for extraction' });
          }
          return Promise.resolve({
            extraction: {
              title: 'Software Engineer',
              type: 'Full-time',
              country: 'United Kingdom',
              level: 'Senior',
              description: 'Test description'
            }
          });
        })
      };
    })
  };
});

describe('RoleController', () => {
  let controller: RoleController;
  
  beforeEach(() => {
    controller = new RoleController('fake-api-key');
  });
  
  it('should extract role information successfully', async () => {
    // Mock request and response objects
    const req = { body: { text: 'Sample job description' } } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    
    await controller.extractRoleInfo(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      extraction: {
        title: 'Software Engineer',
        type: 'Full-time',
        country: 'United Kingdom',
        level: 'Senior',
        description: 'Test description'
      }
    });
  });
  
  it('should return error when no text is provided', async () => {
    // Mock request and response objects
    const req = { body: { } } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    
    await controller.extractRoleInfo(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Text is required and must be a string' 
    });
  });
});

describe('API Router', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', createApiRouter('fake-api-key'));
  });
  
  it('should return 200 OK for health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
  
  it('should handle role extraction successfully', async () => {
    const response = await request(app)
      .post('/api/extract-role-info')
      .send({ text: 'Sample job description' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('extraction');
    expect(response.body.extraction).toHaveProperty('title', 'Software Engineer');
  });
  
  it('should return 400 error when no text is provided', async () => {
    const response = await request(app)
      .post('/api/extract-role-info')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
