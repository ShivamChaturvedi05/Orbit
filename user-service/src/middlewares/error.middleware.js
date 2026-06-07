const globalErrorHandler = (err, req, res, next) => {
  // 1. Log the detailed error to your private backend console
  console.error('[Global Error Logger]', err);

  // 2. Send a generic, safe response to the hacker/user so they learn nothing about your database
  res.status(500).json({
    error: 'An unexpected internal server error occurred.'
  });
};

module.exports = globalErrorHandler;
