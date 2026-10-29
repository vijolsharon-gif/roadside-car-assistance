require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'roadrescue-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    path: process.env.DB_PATH || './db/roadrescue.db',
  },

  city: {
    lat: parseFloat(process.env.CITY_CENTER_LAT || '13.0827'),
    lng: parseFloat(process.env.CITY_CENTER_LNG || '80.2707'),
    name: process.env.CITY_NAME || 'Chennai',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  share: {
    tokenExpiryHours: parseInt(process.env.SHARE_TOKEN_EXPIRY_HOURS || '24', 10),
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:5173',
  },
};

module.exports = config;
