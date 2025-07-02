import request from 'supertest';
import { testApp } from '../setup';

describe('Status API', () => {
  describe('GET /api/v1/status', () => {
    it('should return 200 OK', async () => {
      const response = await request(testApp)
        .get('/api/v1/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
    });
  });
}); 