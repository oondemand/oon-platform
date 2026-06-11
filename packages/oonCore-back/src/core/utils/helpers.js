exports.sendResponse = ({ res, statusCode = 200, message = "OK", ...rest }) => {
  res.status(statusCode).send({ message, ...rest });
};

exports.sendErrorResponse = ({ res, statusCode = 500, message, error }) => {
  res.status(statusCode).json({
    message,
    ...(error ? { error } : {}),
  });
};

exports.sendPaginatedResponse = ({
  res,
  statusCode = 200,
  message = "OK",
  results,
  pagination: { currentPage, totalPages, totalItems, itemsPerPage },
}) => {
  res.status(statusCode).json({
    message,
    results,
    pagination: { currentPage, totalPages, totalItems, itemsPerPage },
  });
};

exports.asyncHandler = (callback) => {
  return (req, res, next) => {
    Promise.resolve(callback(req, res, next)).catch((error) => {
      // Erros de domínio (4xx) são esperados; só logamos os inesperados.
      const status = error?.statusCode || 500;
      if (status >= 500) console.log("🆘 [ERROR]:", error?.message || error);
      next(error);
    });
  };
};

exports.attempt = async (callback) => {
  try {
    const result = await callback();
    return [result, null];
  } catch (err) {
    return [null, err];
  }
};
