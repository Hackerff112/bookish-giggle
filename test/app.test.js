const request = require('supertest');
const app = require('../app');
const db = require('../database/db');

beforeAll(() => {
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM users');
  db.exec("INSERT INTO posts (title, content) VALUES ('أهلاً بكم في منصة الثانوية', 'هذا أول منشور تجريبي')");
});

afterAll(() => db.close());

describe('GET /api/posts', () => {
  it('returns all posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('content');
    expect(res.body[0]).toHaveProperty('created_at');
  });
});

describe('POST /api/posts (unauthenticated)', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test', content: 'Test content' });
    expect(res.status).toBe(401);
  });
});

describe('Auth flow', () => {
  let token;
  let userId;

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe('testuser');
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('rejects duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: '123' });
    expect(res.status).toBe(400);
  });

  it('logs in successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
    token = res.body.token;
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('rejects nonexistent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('creates a post with valid auth', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'منشور تجريبي', content: 'محتوى المنشور' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('منشور تجريبي');
    expect(res.body.author_id).toBe(userId);
  });

  it('rejects post without title', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer invalidtoken')
      .send({ title: 'Test', content: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/posts (after creating posts)', () => {
  it('returns posts ordered by created_at DESC', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(1);
  });
});
