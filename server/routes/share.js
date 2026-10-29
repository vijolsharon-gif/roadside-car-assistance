const router = require('express').Router();
const crypto = require('crypto');
const config = require('../config');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/share/:requestId - Generate shareable tracking link
router.post('/:requestId', authenticate, authorize('driver'), (req, res) => {
  const requestId = parseInt(req.params.requestId);

  const request = dbGet('SELECT * FROM requests WHERE id = ? AND driver_id = ?', [requestId, req.user.id]);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Check if active share token already exists
  const existing = dbGet(
    'SELECT token, expires_at FROM share_tokens WHERE request_id = ? AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
    [requestId]
  );

  if (existing) {
    const shareUrl = `${config.share.publicUrl}/track/${existing.token}`;
    return res.json({
      token: existing.token,
      shareUrl,
      expiresAt: existing.expires_at,
    });
  }

  // Generate a random token
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + config.share.tokenExpiryHours * 60 * 60 * 1000).toISOString();

  dbRun(
    'INSERT INTO share_tokens (request_id, token, expires_at) VALUES (?, ?, ?)',
    [requestId, token, expiresAt]
  );

  const shareUrl = `${config.share.publicUrl}/track/${token}`;

  res.status(201).json({
    token,
    shareUrl,
    expiresAt,
  });
});

// GET /api/share/track/:token - Public tracking data (no login required)
router.get('/track/:token', (req, res) => {
  const { token } = req.params;

  const shareRecord = dbGet(
    'SELECT * FROM share_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP',
    [token]
  );

  if (!shareRecord) {
    return res.status(404).json({ error: 'Tracking link expired or invalid' });
  }

  const request = dbGet('SELECT * FROM requests WHERE id = ?', [shareRecord.request_id]);
  if (!request) {
    return res.status(404).json({ error: 'Associated breakdown request not found' });
  }

  let mechanic = null;
  if (request.mechanic_id) {
    mechanic = dbGet(
      'SELECT m.lat, m.lng, m.rating, u.name, u.phone FROM mechanics m JOIN users u ON m.user_id = u.id WHERE m.user_id = ?',
      [request.mechanic_id]
    );
  }

  const events = dbAll(
    'SELECT status, message, created_at FROM request_events WHERE request_id = ? ORDER BY created_at ASC',
    [request.id]
  );

  const driver = dbGet('SELECT name FROM users WHERE id = ?', [request.driver_id]);

  res.json({
    request: {
      id: request.id,
      status: request.status,
      faultCategory: request.fault_category,
      severity: request.severity,
      lat: request.lat,
      lng: request.lng,
      createdAt: request.created_at,
      acceptedAt: request.accepted_at,
      completedAt: request.completed_at,
    },
    driverName: driver ? driver.name : 'Driver',
    mechanic,
    events,
  });
});

module.exports = router;
