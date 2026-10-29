const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { rankMechanics } = require('../services/dispatchScoring');
const { diagnose } = require('../services/diagnosisEngine');
const { CASCADE_TIMEOUT_MS } = require('../../shared/constants');
const {
  notifyMechanicNewRequest,
  notifyDriverRequestAccepted,
  notifyRequestStatusUpdate,
} = require('../services/notificationService');

// Active cascade timers
const cascadeTimers = new Map();

// POST /api/requests - Create a new assistance request
router.post('/', authenticate, authorize('driver'), (req, res) => {
  const {
    lat, lng, vehicleId,
    readings, warningLights, symptoms,
    trendData, notes,
  } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Location (lat, lng) is required' });
  }

  // Run diagnosis
  const diagnosisResult = diagnose(readings || {}, warningLights || [], symptoms || []);

  // Create request
  const result = dbRun(
    `INSERT INTO requests (driver_id, vehicle_id, fault_category, severity, confidence, status, lat, lng,
      readings_json, diagnosis_json, checklist_json, trend_data_json, warning_lights_json, symptoms_json, notes)
     VALUES (?, ?, ?, ?, ?, 'requested', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      vehicleId || null,
      diagnosisResult.faultCategory,
      diagnosisResult.severity,
      diagnosisResult.confidence,
      lat, lng,
      JSON.stringify(readings || {}),
      JSON.stringify(diagnosisResult),
      JSON.stringify(diagnosisResult.checklist),
      JSON.stringify(trendData || []),
      JSON.stringify(warningLights || []),
      JSON.stringify(symptoms || []),
      notes || null,
    ]
  );

  const requestId = result.lastInsertRowid;

  // Add initial event
  dbRun(
    'INSERT INTO request_events (request_id, status, message, lat, lng) VALUES (?, ?, ?, ?, ?)',
    [requestId, 'requested', 'Assistance requested', lat, lng]
  );

  // Get nearby mechanics and rank them
  const mechanics = dbAll(
    `SELECT m.*, u.name, u.phone FROM mechanics m JOIN users u ON m.user_id = u.id
     WHERE m.is_available = 1 AND m.lat IS NOT NULL AND m.lng IS NOT NULL`
  );

  const rankedMechanics = rankMechanics(mechanics, {
    lat, lng,
    faultCategory: diagnosisResult.faultCategory,
  });

  // Store dispatch scores
  dbRun(
    'UPDATE requests SET dispatch_scores_json = ? WHERE id = ?',
    [JSON.stringify(rankedMechanics.slice(0, 5)), requestId]
  );

  // Start cascade dispatch
  const io = req.app.get('io');
  if (rankedMechanics.length > 0) {
    startCascadeDispatch(io, requestId, rankedMechanics, 0);
  }

  // Get the full request
  const request = dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);

  res.status(201).json({
    request: formatRequest(request),
    diagnosis: diagnosisResult,
    nearbyMechanics: rankedMechanics.slice(0, 3),
  });
});

// GET /api/requests/:id
router.get('/:id', authenticate, (req, res) => {
  const request = dbGet('SELECT * FROM requests WHERE id = ?', [parseInt(req.params.id)]);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Get events timeline
  const events = dbAll(
    'SELECT * FROM request_events WHERE request_id = ? ORDER BY created_at ASC',
    [request.id]
  );

  // Get mechanic info if assigned
  let mechanic = null;
  if (request.mechanic_id) {
    mechanic = dbGet(
      'SELECT m.*, u.name, u.phone, u.email FROM mechanics m JOIN users u ON m.user_id = u.id WHERE m.user_id = ?',
      [request.mechanic_id]
    );
    if (mechanic) mechanic.skills = JSON.parse(mechanic.skills || '[]');
  }

  // Get driver info
  const driver = dbGet('SELECT id, name, phone, email FROM users WHERE id = ?', [request.driver_id]);

  // Get vehicle info
  let vehicle = null;
  if (request.vehicle_id) {
    vehicle = dbGet('SELECT * FROM vehicles WHERE id = ?', [request.vehicle_id]);
  }

  // Get rating if completed
  let rating = null;
  if (request.status === 'completed') {
    rating = dbGet('SELECT * FROM ratings WHERE request_id = ?', [request.id]);
  }

  res.json({
    request: formatRequest(request),
    events,
    mechanic,
    driver,
    vehicle,
    rating,
  });
});

// GET /api/requests - List requests (filtered by role)
router.get('/', authenticate, (req, res) => {
  let requests;
  if (req.user.role === 'driver') {
    requests = dbAll(
      'SELECT * FROM requests WHERE driver_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
  } else if (req.user.role === 'mechanic') {
    // Mechanics see: their assigned requests + all 'requested' ones
    requests = dbAll(
      `SELECT * FROM requests 
       WHERE mechanic_id = ? OR status = 'requested'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
  } else {
    // Admin sees all
    requests = dbAll('SELECT * FROM requests ORDER BY created_at DESC');
  }

  res.json({ requests: requests.map(formatRequest) });
});

// PATCH /api/requests/:id/status - Update request status
router.patch('/:id/status', authenticate, (req, res) => {
  const { status, lat, lng, message } = req.body;
  const requestId = parseInt(req.params.id);

  const request = dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const validTransitions = {
    requested: ['accepted', 'cancelled', 'declined'],
    accepted: ['on_the_way', 'cancelled'],
    on_the_way: ['arrived', 'cancelled'],
    arrived: ['completed', 'cancelled'],
  };

  if (!validTransitions[request.status]?.includes(status)) {
    return res.status(400).json({
      error: `Cannot transition from '${request.status}' to '${status}'`,
    });
  }

  const io = req.app.get('io');

  // Handle acceptance
  if (status === 'accepted') {
    dbRun(
      'UPDATE requests SET status = ?, mechanic_id = ?, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.user.id, requestId]
    );
    // Cancel cascade timer
    clearCascadeTimer(requestId);
    // Update mechanic active jobs
    dbRun('UPDATE mechanics SET active_jobs = active_jobs + 1 WHERE user_id = ?', [req.user.id]);
    // Notify driver
    notifyDriverRequestAccepted(io, request.driver_id, { requestId, mechanicId: req.user.id });
  } else if (status === 'completed') {
    dbRun(
      'UPDATE requests SET status = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, requestId]
    );
    // Decrease mechanic active jobs
    if (request.mechanic_id) {
      dbRun(
        'UPDATE mechanics SET active_jobs = MAX(0, active_jobs - 1), total_jobs_done = total_jobs_done + 1 WHERE user_id = ?',
        [request.mechanic_id]
      );
    }
  } else {
    dbRun(
      'UPDATE requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, requestId]
    );
  }

  // Record event
  dbRun(
    'INSERT INTO request_events (request_id, status, message, lat, lng) VALUES (?, ?, ?, ?, ?)',
    [requestId, status, message || `Status changed to ${status}`, lat || null, lng || null]
  );

  // Notify via socket
  notifyRequestStatusUpdate(io, requestId, { requestId, status, message });

  const updatedRequest = dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);
  res.json({ request: formatRequest(updatedRequest) });
});

// POST /api/requests/:id/rate - Rate a completed request
router.post('/:id/rate', authenticate, authorize('driver'), (req, res) => {
  const requestId = parseInt(req.params.id);
  const { score, feedback } = req.body;

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Score must be between 1 and 5' });
  }

  const request = dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);
  if (!request || request.driver_id !== req.user.id) {
    return res.status(404).json({ error: 'Request not found' });
  }
  if (request.status !== 'completed') {
    return res.status(400).json({ error: 'Can only rate completed requests' });
  }

  // Check if already rated
  const existing = dbGet('SELECT id FROM ratings WHERE request_id = ?', [requestId]);
  if (existing) {
    return res.status(409).json({ error: 'Already rated' });
  }

  dbRun(
    'INSERT INTO ratings (request_id, driver_id, mechanic_id, score, feedback) VALUES (?, ?, ?, ?, ?)',
    [requestId, req.user.id, request.mechanic_id, score, feedback || null]
  );

  // Update mechanic average rating
  const mechanic = dbGet('SELECT * FROM mechanics WHERE user_id = ?', [request.mechanic_id]);
  if (mechanic) {
    const newTotal = mechanic.total_ratings + 1;
    const newRating = ((mechanic.rating * mechanic.total_ratings) + score) / newTotal;
    dbRun(
      'UPDATE mechanics SET rating = ?, total_ratings = ? WHERE user_id = ?',
      [Math.round(newRating * 10) / 10, newTotal, request.mechanic_id]
    );
  }

  res.json({ message: 'Rating submitted', score, feedback });
});

// ─── CASCADE DISPATCH ───────────────────────────────
function startCascadeDispatch(io, requestId, rankedMechanics, index) {
  if (index >= rankedMechanics.length || index >= 3) {
    console.log(`⚠️ Request ${requestId}: No more mechanics to cascade to`);
    return;
  }

  const mechanic = rankedMechanics[index];
  console.log(`📡 Request ${requestId}: Notifying mechanic #${index + 1} - ${mechanic.name}`);

  // Send notification to mechanic
  notifyMechanicNewRequest(io, mechanic.userId, {
    requestId,
    cascadeIndex: index,
    timeout: CASCADE_TIMEOUT_MS,
  });

  // Set timeout for cascade
  const timer = setTimeout(() => {
    // Check if request is still unaccepted
    const request = dbGet('SELECT status FROM requests WHERE id = ?', [requestId]);
    if (request && request.status === 'requested') {
      console.log(`⏰ Request ${requestId}: Mechanic ${mechanic.name} timed out, cascading...`);
      startCascadeDispatch(io, requestId, rankedMechanics, index + 1);
    }
  }, CASCADE_TIMEOUT_MS);

  cascadeTimers.set(requestId, timer);
}

function clearCascadeTimer(requestId) {
  const timer = cascadeTimers.get(requestId);
  if (timer) {
    clearTimeout(timer);
    cascadeTimers.delete(requestId);
  }
}

// ─── HELPERS ───────────────────────────────
function formatRequest(r) {
  if (!r) return null;
  return {
    ...r,
    readings: tryParse(r.readings_json),
    diagnosis: tryParse(r.diagnosis_json),
    checklist: tryParse(r.checklist_json),
    trendData: tryParse(r.trend_data_json),
    warningLights: tryParse(r.warning_lights_json),
    symptoms: tryParse(r.symptoms_json),
    dispatchScores: tryParse(r.dispatch_scores_json),
  };
}

function tryParse(json) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

module.exports = router;
