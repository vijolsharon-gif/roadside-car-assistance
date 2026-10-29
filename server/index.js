const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { initDB } = require('./db/database');
const { setupSocketHandlers } = require('./socket/handlers');

async function startServer() {
  // Initialize database
  await initDB();

  const app = express();
  const server = http.createServer(app);

  // Socket.io setup
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Make io accessible in routes
  app.set('io', io);

  // Middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Rate limiting
  const { rateLimiter } = require('./middleware/rateLimit');
  app.use(rateLimiter);

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/diagnose', require('./routes/diagnose'));
  app.use('/api/requests', require('./routes/requests'));
  app.use('/api/mechanics', require('./routes/mechanics'));
  app.use('/api/share', require('./routes/share'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static client assets in production
  const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });

  // Socket.io handlers
  setupSocketHandlers(io);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
  });

  server.listen(config.port, () => {
    console.log(`\n🚗 RoadRescue server running on http://localhost:${config.port}`);
    console.log(`📡 Socket.io ready for real-time connections`);
    console.log(`🗄️  Database: ${config.db.path}`);
    console.log(`🏙️  City center: ${config.city.name} (${config.city.lat}, ${config.city.lng})\n`);
  });

  return { app, server, io };
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
