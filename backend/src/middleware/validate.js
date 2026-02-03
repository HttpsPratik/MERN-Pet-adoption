module.exports = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
  
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ message: "Validation error", errors });
    }
  
    req.body = result.data; 
    next();
  };
  