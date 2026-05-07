function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = validate;
