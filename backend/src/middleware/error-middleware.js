export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
};

export const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  if (err.name === 'ValidationError')
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });

  if (err.name === 'CastError')
    return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid resource identifier' } });

  if (err.code === 11000)
    return res.status(409).json({ success: false, error: { code: 'DUPLICATE_KEY', message: 'Resource already exists' } });

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });

  return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } });
};
