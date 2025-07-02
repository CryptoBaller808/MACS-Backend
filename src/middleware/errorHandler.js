module.exports = (err, req, res, next) => {
  console.error('🔥 ErrorHandler:', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
