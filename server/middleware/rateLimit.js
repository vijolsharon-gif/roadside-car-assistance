const config = require('../config');

// Simple in-memory rate limiter
const clients = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  if (!clients.has(ip)) {
    clients.set(ip, { count: 1, windowStart: now });
    return next();
  }

  const client = clients.get(ip);

  // Reset window if expired
  if (now - client.windowStart > windowMs) {
    client.count = 1;
    client.windowStart = now;
    return next();
  }

  client.count++;

  if (client.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((client.windowStart + windowMs - now) / 1000),
    });
  }

  next();
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, client] of clients) {
    if (now - client.windowStart > config.rateLimit.windowMs * 2) {
      clients.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = { rateLimiter };
