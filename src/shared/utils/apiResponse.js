function successResponse({ statusCode = 200, message = "OK", data = null, meta = undefined }) {
  const response = {
    success: true,
    statusCode,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

function errorResponse({ statusCode = 500, message = "Internal server error", requestId }) {
  const response = {
    success: false,
    statusCode,
    message
  };

  if (requestId) {
    response.requestId = requestId;
  }

  return response;
}

module.exports = { successResponse, errorResponse };
