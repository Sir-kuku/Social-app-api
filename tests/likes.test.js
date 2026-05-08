// tests/likes.test.js
const request = require('supertest');
const app = require('../src/app');

let aliceToken, bobToken;
let postId;

beforeAll(async () => {
  // Create Alice (owner of the post)
  const aliceRes = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Alice', last_name:'Liker', username:'alice_liker', email:'alice.liker@test.com', password:'alicepass' });
  aliceToken = aliceRes.body.token;

  // Create Bob (another user)
  const bobRes = await request(app)
    .post('/auth/signup')
    .send({ first_name:'Bob', last_name:'Likee', username:'bob_likee', email:'bob.likee@test.com', password:'bobpass' });
  bobToken = bobRes.body.token;

  // Alice creates a post and publishes it
  const postRes = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({ title:'Likeable Post', content:'Please like me', tags:['fun'] });
  postId = postRes.body.post._id;

  await request(app)
    .put(`/posts/${postId}/publish`)
    .set('Authorization', `Bearer ${aliceToken}`);
});

describe('Like Post', () => {
  it('should like a post and increase like_count', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/liked/i);
    expect(res.body.like_count).toBe(1);
  });

  it('should reject duplicate like', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already liked/i);
  });

  it('should verify like_count on the post', async () => {
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.post.like_count).toBe(1);
  });

  it('should allow another user to like the same post', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${aliceToken}`); // Alice liking her own post
    expect(res.statusCode).toBe(201);
    expect(res.body.like_count).toBe(2);
  });
});

describe('Unlike Post', () => {
  it('should unlike a post and decrease like_count', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/unliked/i);
    expect(res.body.like_count).toBe(1); // Alice's like remains
  });

  it('should reject unlike if not liked', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not liked/i);
  });
});