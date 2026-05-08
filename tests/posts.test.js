// tests/posts.test.js
// Tests for post creation, retrieval, publishing, editing, deletion, and ownership rules
const request = require('supertest');
const app = require('../src/app');

// We'll store tokens and a post ID for reuse
let ownerToken;
let otherToken;
let postId;

// -------------------------------------------------
// Before running post tests, create two users
// -------------------------------------------------
beforeAll(async () => {
  // Owner of the posts
  const ownerRes = await request(app)
    .post('/auth/signup')
    .send({
      first_name: 'Post',
      last_name: 'Owner',
      username: 'postowner',
      email: 'owner@example.com',
      password: 'ownerpass',
    });
  ownerToken = ownerRes.body.token;

  // Another user (stranger) who will try to tamper
  const otherRes = await request(app)
    .post('/auth/signup')
    .send({
      first_name: 'Other',
      last_name: 'User',
      username: 'otheruser',
      email: 'other@example.com',
      password: 'otherpass',
    });
  otherToken = otherRes.body.token;
});

// -------------------------------------------------
// 1. Create Post
// -------------------------------------------------
describe('Create Post', () => {
  it('should create a post as draft when authenticated', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'My New Post',
        content: 'Post content here',
        tags: ['tech', 'news'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/created/i);
    expect(res.body.post).toBeDefined();
    expect(res.body.post.state).toBe('draft');
    expect(res.body.post.title).toBe('My New Post');
    expect(res.body.post.author).toBeDefined();

    // Save the post ID for later tests
    postId = res.body.post._id;
  });

  it('should reject creation without a token', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ title: 'Test', content: 'Test' });

    expect(res.statusCode).toBe(401);
  });

  it('should reject creation with missing title or content', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: ['lonely'] }); // no title or content

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/title and content are required/i);
  });
});

// -------------------------------------------------
// 2. Public listing (no auth)
// -------------------------------------------------
describe('GET /posts (public list)', () => {
  it('should not show draft posts', async () => {
    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    // The post we created is a draft, so it should not appear
    const posts = res.body.posts;
    const found = posts.some((p) => p._id === postId);
    expect(found).toBe(false);
  });

  it('should show a published post', async () => {
    // First publish the post as the owner
    await request(app)
      .put(`/posts/${postId}/publish`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    const posts = res.body.posts;
    const found = posts.some((p) => p._id === postId);
    expect(found).toBe(true);
  });
});

// -------------------------------------------------
// 3. Get single post (public, only published)
// -------------------------------------------------
describe('GET /posts/:id', () => {
  it('should return 404 for a non-existent or draft post', async () => {
    // Create a new draft post and try to get it without publishing
    const draftRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Secret Draft', content: 'Hidden' });

    const draftId = draftRes.body.post._id;
    const res = await request(app).get(`/posts/${draftId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('should return a published post with author info', async () => {
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.post).toBeDefined();
    expect(res.body.post.author).toBeDefined();
    expect(res.body.post.author.username).toBe('postowner');
  });
});

// -------------------------------------------------
// 4. Edit Post (owner only)
// -------------------------------------------------
describe('PATCH /posts/:id (edit)', () => {
  it('should allow the owner to edit the post', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Updated Title' });

    expect(res.statusCode).toBe(200);
    expect(res.body.post.title).toBe('Updated Title');
  });

  it('should reject edit by another user', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked!' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not the owner/i);
  });

  it('should reject edit without a token', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .send({ title: 'No token' });

    expect(res.statusCode).toBe(401);
  });
});

// -------------------------------------------------
// 5. Publish Post (owner only)
// -------------------------------------------------
describe('PUT /posts/:id/publish', () => {
  it('should reject publishing by a non-owner', async () => {
    // We need a new draft post owned by the owner to test
    const newDraftRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Anti-hack Post', content: 'Block!' });

    const newDraftId = newDraftRes.body.post._id;

    const res = await request(app)
      .put(`/posts/${newDraftId}/publish`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not the owner/i);
  });

  it('should allow the owner to publish', async () => {
    // Use the same draft from above; publish it as owner
    const draftRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Another Draft', content: 'Will publish' });

    const draftId = draftRes.body.post._id;
    const res = await request(app)
      .put(`/posts/${draftId}/publish`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.post.state).toBe('published');
  });
});

// -------------------------------------------------
// 6. Delete Post (owner only)
// -------------------------------------------------
describe('DELETE /posts/:id', () => {
  it('should reject deletion by a non-owner', async () => {
    // Create a post to attempt deletion by other user
    const newPostRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Do Not Touch', content: 'Mine' });

    const newPostId = newPostRes.body.post._id;

    const res = await request(app)
      .delete(`/posts/${newPostId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not the owner/i);
  });

  it('should allow the owner to delete the post', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)  // the initial published post
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Verify it's gone from the public list
    const getRes = await request(app).get(`/posts/${postId}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('should reject deletion without a token', async () => {
    const res = await request(app).delete(`/posts/${postId}`);
    expect(res.statusCode).toBe(401);
  });
});