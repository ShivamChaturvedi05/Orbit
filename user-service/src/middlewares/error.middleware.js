const globalErrorHandler = (err, req, res, next) => {
  console.error('[Global Error Logger]', err);
  res.status(500).json({
    error: 'An unexpected internal server error occurred.'
  });
};

module.exports = globalErrorHandler;
