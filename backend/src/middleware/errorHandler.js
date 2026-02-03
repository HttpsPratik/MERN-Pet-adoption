module.exports = (err, req, res, next) => {
    const status = err.statusCode || 500;
  
    const payload = {
      message: err.message || "Something went wrong",
    };
  
    // show details only in development
    if (process.env.NODE_ENV !== "production") {
      payload.stack = err.stack;
    }
  
    return res.status(status).json(payload);
  };
  