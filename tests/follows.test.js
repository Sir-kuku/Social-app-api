// tests/follows.test.js
const request = require('supertest');
const app = require('../src/app');

let user1Token, user2Token, user3Token;
let user1Id, user2Id, user3Id;

beforeAll(async () => {
  // Create three users
  const res1 = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Alpha', last_name:'One', username:'alpha1', email:'alpha1@test.com', password:'pass111' });
  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  const res2 = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Beta', last_name:'Two', username:'beta2', email:'beta2@test.com', password:'pass222' });
  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  const res3 = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Gamma', last_name:'Three', username:'gamma3', email:'gamma3@test.com', password:'pass333' });
  user3Token = res3.body.token;
  user3Id = res3.body.user.id;
});

describe('Follow / Unfollow', () => {
  it('should follow another user', async () => {
    const res = await request(app)
      .post(`/me/follow/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/successfully followed/i);
  });

  it('should reject duplicate follow', async () => {
    const res = await request(app)
      .post(`/me/follow/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already following/i);
  });

  it('should reject self-follow', async () => {
    const res = await request(app)
      .post(`/me/follow/${user1Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot follow yourself/i);
  });

  it('should reject follow of non-existent user', async () => {
    const fakeId = '123456789012345678901234';
    const res = await request(app)
      .post(`/me/follow/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(404);
  });

  it('should unfollow a user', async () => {
    const res = await request(app)
      .delete(`/me/follow/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/unfollowed/i);
  });

  it('should reject unfollow if not following', async () => {
    const res = await request(app)
      .delete(`/me/follow/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not following/i);
  });
});

describe('Following / Followers lists', () => {
  // Re-follow user2 for further tests
  beforeAll(async () => {
    await request(app)
      .post(`/me/follow/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
  });

  it('should list who I follow', async () => {
    const res = await request(app)
      .get('/me/following')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.following.some(u => u._id === user2Id)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('should list my followers', async () => {
    const res = await request(app)
      .get('/me/followers')
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.followers.some(u => u._id === user1Id)).toBe(true);
  });

  it('should show empty list if no follows', async () => {
    const res = await request(app)
      .get('/me/following')
      .set('Authorization', `Bearer ${user3Token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(0);
  });
});