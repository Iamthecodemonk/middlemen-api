function getRequestMetadata(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null,
    userAgent: req.headers["user-agent"] || null
  };
}

module.exports = { getRequestMetadata };
