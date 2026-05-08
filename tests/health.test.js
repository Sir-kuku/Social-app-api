// tests/health.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Basic health check', () => {
  it('should return 200 and a welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Social App API is running...');
  });
});