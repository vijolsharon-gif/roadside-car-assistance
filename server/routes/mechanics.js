const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { rankMechanics } = require('../services/dispatchScoring');

// GET /api/mechanics/nearby - Get nearby ranked mechanics
router.get('/nearby', authenticate, (req, res) => {
  const { lat, lng, faultCategory } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query params are required' });
  }

  const mechanics = dbAll(
    `SELECT m.*, u.name, u.phone FROM mechanics m JOIN users u ON m.user_id = u.id
     WHERE m.is_available = 1 AND m.lat IS NOT NULL AND m.lng IS NOT NULL`
  );

  const ranked = rankMechanics(mechanics, {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    faultCategory: faultCategory || 'brake_unknown',
  });

  res.json({ mechanics: ranked.slice(0, 10) });
});

// PATCH /api/mechanics/me/location - Update mechanic's live location
router.patch('/me/location', authenticate, authorize('mechanic'), (req, res) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  dbRun(
    'UPDATE mechanics SET lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [lat, lng, req.user.id]
  );

  // Broadcast to any active request rooms
  const io = req.app.get('io');
  const activeRequests = dbAll(
    `SELECT id FROM requests WHERE mechanic_id = ? AND status IN ('accepted', 'on_the_way', 'arrived')`,
    [req.user.id]
  );

  activeRequests.forEach(r => {
    io.to(`request:${r.id}`).emit('mechanic:location', {
      mechanicId: req.user.id,
      lat, lng,
      timestamp: new Date().toISOString(),
    });
  });

  res.json({ message: 'Location updated', lat, lng });
});

// PATCH /api/mechanics/me/availability - Toggle availability
router.patch('/me/availability', authenticate, authorize('mechanic'), (req, res) => {
  const { isAvailable } = req.body;

  dbRun(
    'UPDATE mechanics SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [isAvailable ? 1 : 0, req.user.id]
  );

  res.json({ message: `Now ${isAvailable ? 'available' : 'offline'}`, isAvailable });
});

// GET /api/mechanics/me/stats - Get mechanic stats
router.get('/me/stats', authenticate, authorize('mechanic'), (req, res) => {
  const mechanic = dbGet('SELECT * FROM mechanics WHERE user_id = ?', [req.user.id]);
  if (!mechanic) {
    return res.status(404).json({ error: 'Mechanic profile not found' });
  }

  const completedJobs = dbAll(
    `SELECT * FROM requests WHERE mechanic_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 20`,
    [req.user.id]
  );

  const ratings = dbAll(
    `SELECT r.* FROM ratings r JOIN requests req ON r.request_id = req.id WHERE req.mechanic_id = ? ORDER BY r.created_at DESC LIMIT 20`,
    [req.user.id]
  );

  res.json({
    stats: {
      totalJobsDone: mechanic.total_jobs_done,
      activeJobs: mechanic.active_jobs,
      rating: mechanic.rating,
      totalRatings: mechanic.total_ratings,
      avgResponseTime: mechanic.avg_response_time_min,
      isAvailable: !!mechanic.is_available,
    },
    recentJobs: completedJobs,
    recentRatings: ratings,
  });
});

// GET /api/mechanics - List all mechanics (admin)
router.get('/', authenticate, authorize('admin'), (req, res) => {
  const mechanics = dbAll(
    'SELECT m.*, u.name, u.email, u.phone FROM mechanics m JOIN users u ON m.user_id = u.id'
  );
  mechanics.forEach(m => { m.skills = JSON.parse(m.skills || '[]'); });
  res.json({ mechanics });
});

module.exports = router;
