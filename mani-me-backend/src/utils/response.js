// ======================
// API Response Utilities
// ======================
// Standardized response formats for consistent API output

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 */
const created = (res, data, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * No content response (204)
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasMore: pagination.page * pagination.limit < pagination.total,
    },
  });
};

/**
 * Response with metadata
 */
const withMeta = (res, data, meta, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};

/**
 * Stream/file response headers
 */
const setFileHeaders = (res, filename, contentType = 'application/octet-stream') => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res;
};

/**
 * Cache control headers
 */
const setCacheHeaders = (res, maxAge = 3600, isPrivate = true) => {
  const cacheControl = isPrivate 
    ? `private, max-age=${maxAge}` 
    : `public, max-age=${maxAge}`;
  res.setHeader('Cache-Control', cacheControl);
  return res;
};

module.exports = {
  success,
  created,
  noContent,
  paginated,
  withMeta,
  setFileHeaders,
  setCacheHeaders,
};
