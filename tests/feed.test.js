// tests/feed.test.js
const request = require('supertest');
const app = require('../src/app');

let johnToken, janeToken;
let johnPostId, janePostId;

beforeAll(async () => {
  // Create John
  const johnRes = await request(app)
    .post('/auth/signup')
    .send({ first_name:'John', last_name:'Feed', username:'john_feed', email:'john.feed@test.com', password:'johnpass' });
  johnToken = johnRes.body.token;
  const johnId = johnRes.body.user.id;

  // Create Jane
  const janeRes = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Jane', last_name:'Doe', username:'jane_doe', email:'jane.doe@test.com', password:'janepass' });
  janeToken = janeRes.body.token;
  const janeId = janeRes.body.user.id;

  // John creates and publishes a post
  const johnPostRes = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${johnToken}`)
    .send({ title:'John public', content:'John is here' });
  johnPostId = johnPostRes.body.post._id;
  await request(app)
    .put(`/posts/${johnPostId}/publish`)
    .set('Authorization', `Bearer ${johnToken}`);

  // Jane creates and publishes a post
  const janePostRes = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${janeToken}`)
    .send({ title:'Jane public', content:'Jane is here' });
  janePostId = janePostRes.body.post._id;
  await request(app)
    .put(`/posts/${janePostId}/publish`)
    .set('Authorization', `Bearer ${janeToken}`);

  // John follows Jane
  await request(app)
    .post(`/me/follow/${janeId}`)
    .set('Authorization', `Bearer ${johnToken}`);
});

describe('GET /feed', () => {
  it('should return only published posts from self and followed users', async () => {
    const res = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${johnToken}`);
    expect(res.statusCode).toBe(200);
    const posts = res.body.posts;
    // John's own post should be present
    expect(posts.some(p => p._id === johnPostId)).toBe(true);
    // Jane's post (followed) should be present
    expect(posts.some(p => p._id === janePostId)).toBe(true);
    // No other posts should appear
    expect(posts.length).toBe(2);
  });

  it('should not show drafts from followed users', async () => {
    // Jane creates a draft
    const draftRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${janeToken}`)
      .send({ title:'Jane draft', content:'secret' });
    const draftId = draftRes.body.post._id;

    const res = await request(app)
      .get('/feed')
      .set('Authorization', `Bearer ${johnToken}`);
    expect(res.statusCode).toBe(200);
    const posts = res.body.posts;
    expect(posts.some(p => p._id === draftId)).toBe(false);
  });

  it('should require authentication', async () => {
    const res = await request(app).get('/feed');
    expect(res.statusCode).toBe(401);
  });

  it('should be paginated', async () => {
    const res = await request(app)
      .get('/feed?limit=1&page=1')
      .set('Authorization', `Bearer ${johnToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });
});