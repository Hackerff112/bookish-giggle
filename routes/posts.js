const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { postSchema } = require('../schemas');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const posts = db.prepare(`
      SELECT p.id, p.title, p.content, p.created_at,
             u.username as author
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, validate(postSchema), (req, res, next) => {
  try {
    const { title, content } = req.validatedBody;
    const result = db.prepare(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
    ).run(title, content, req.userId);

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
