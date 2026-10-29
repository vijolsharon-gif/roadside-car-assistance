/**
 * Notification service - wraps Socket.io event emission
 */

function notifyMechanicNewRequest(io, mechanicUserId, requestData) {
  io.to(`user:${mechanicUserId}`).emit('request:new', requestData);
}

function notifyDriverRequestAccepted(io, driverUserId, data) {
  io.to(`user:${driverUserId}`).emit('request:accepted', data);
}

function notifyRequestStatusUpdate(io, requestId, data) {
  io.to(`request:${requestId}`).emit('request:status', data);
}

function notifyMechanicLocation(io, requestId, locationData) {
  io.to(`request:${requestId}`).emit('mechanic:location', locationData);
}

function notifyDriverLocation(io, requestId, locationData) {
  io.to(`request:${requestId}`).emit('driver:location', locationData);
}

module.exports = {
  notifyMechanicNewRequest,
  notifyDriverRequestAccepted,
  notifyRequestStatusUpdate,
  notifyMechanicLocation,
  notifyDriverLocation,
};
