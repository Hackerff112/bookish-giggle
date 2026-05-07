const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

module.exports = { registerSchema, loginSchema, postSchema };
