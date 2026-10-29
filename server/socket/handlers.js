/**
 * Socket.io handlers for real-time tracking and dispatch
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Join a room for a specific user (e.g., user:userId)
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join a room for a specific request (e.g., request:requestId)
    socket.on('join:request', (requestId) => {
      if (requestId) {
        socket.join(`request:${requestId}`);
      }
    });

    // Leave a request room
    socket.on('leave:request', (requestId) => {
      if (requestId) {
        socket.leave(`request:${requestId}`);
      }
    });

    // Relay driver live location update
    socket.on('driver:location_update', ({ requestId, lat, lng }) => {
      if (requestId && lat && lng) {
        io.to(`request:${requestId}`).emit('driver:location', { lat, lng });
      }
    });

    // Relay mechanic live location update
    socket.on('mechanic:location_update', ({ requestId, lat, lng, mechanicId }) => {
      if (requestId && lat && lng) {
        io.to(`request:${requestId}`).emit('mechanic:location', {
          lat,
          lng,
          mechanicId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
}

module.exports = { setupSocketHandlers };
