// tests/auth.test.js
// Tests for signup, signin, and authentication middleware
const request = require('supertest');
const app = require('../src/app');

// We'll store a valid token here for reuse across tests
let userToken;

describe('Auth – Signup', () => {
  // Test 1: Successful signup
  it('should create a new user and return a token', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: '123456',
      });

    // Expect 201 Created
    expect(res.statusCode).toBe(201);
    // Response must contain a success message
    expect(res.body.message).toBeDefined();
    // Must return a user object with the correct fields
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.email).toBe('test@example.com');
    // Must NOT return the password
    expect(res.body.user.password).toBeUndefined();
    // Must return a token (a long string)
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  // Test 2: Duplicate email or username
  it('should reject duplicate email or username', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        first_name: 'Another',
        last_name: 'User',
        username: 'testuser',      // same username as above
        email: 'new@example.com',
        password: '123456',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  // Test 3: Missing required fields
  it('should reject request missing first_name', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        // first_name missing
        last_name: 'User',
        username: 'someone',
        email: 'someone@example.com',
        password: '123456',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});

describe('Auth – Signin', () => {
  // Test 4: Successful signin with email
  it('should sign in with correct email and password', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: '123456',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.token).toBeDefined();

    // Save the token for later protected‑route tests
    userToken = res.body.token;
  });

  // Test 5: Successful signin with username
  it('should sign in with correct username and password', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({
        username: 'testuser',
        password: '123456',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // Test 6: Wrong password
  it('should reject incorrect password', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  // Test 7: Non‑existent user
  it('should reject non‑existent email', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'ghost@example.com',
        password: '123456',
      });

    expect(res.statusCode).toBe(401);
  });
});

describe('Auth – Token Protection', () => {
  // Test 8: Access protected route without token
  it('should deny access to /me/posts without a token', async () => {
    const res = await request(app).get('/me/posts');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token/i);
  });

  // Test 9: Access with an invalid token
  it('should deny access with a malformed token', async () => {
    const res = await request(app)
      .get('/me/posts')
      .set('Authorization', 'Bearer thisisnotavalidtoken');
    expect(res.statusCode).toBe(401);
  });

  // Test 10: Access with a valid token
  it('should allow access to /me/posts with a valid token', async () => {
    // userToken was saved from the successful signin test
    const res = await request(app)
      .get('/me/posts')
      .set('Authorization', `Bearer ${userToken}`);
    // Should not be 401; it should be 200 or possibly 404 if no posts, but 200 with empty list
    expect(res.statusCode).toBe(200);
    // The response body should contain the paginated structure
    expect(res.body.posts).toBeDefined();
    expect(res.body.page).toBe(1);
  });
});