const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', validate({
  email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
  password: { required: true, type: 'string', minLength: 6, message: 'Password must be at least 6 characters' },
  name: { required: true, type: 'string', minLength: 2 },
  role: { required: true, type: 'string', enum: ['driver', 'mechanic'] },
}), (req, res) => {
  const { email, password, name, phone, role } = req.body;

  // Check if user exists
  const existing = dbGet('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = dbRun(
    'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, name, phone || null, role]
  );
  const userId = result.lastInsertRowid;

  // If mechanic, create mechanic profile
  if (role === 'mechanic') {
    const skills = req.body.skills || [];
    dbRun(
      'INSERT INTO mechanics (user_id, skills) VALUES (?, ?)',
      [userId, JSON.stringify(skills)]
    );
  }

  const token = jwt.sign(
    { id: userId, email, name, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: { id: userId, email, name, role },
  });
});

// POST /api/auth/login
router.post('/login', validate({
  email: { required: true, type: 'string' },
  password: { required: true, type: 'string' },
}), (req, res) => {
  const { email, password } = req.body;

  const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Get mechanic info if applicable
  let mechanicInfo = null;
  if (user.role === 'mechanic') {
    mechanicInfo = dbGet('SELECT * FROM mechanics WHERE user_id = ?', [user.id]);
    if (mechanicInfo) {
      mechanicInfo.skills = JSON.parse(mechanicInfo.skills || '[]');
    }
  }

  // Get vehicles if driver
  let vehicles = [];
  if (user.role === 'driver') {
    vehicles = dbAll('SELECT * FROM vehicles WHERE user_id = ?', [user.id]);
  }

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mechanic: mechanicInfo,
      vehicles,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = dbGet('SELECT id, email, name, phone, role FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let mechanicInfo = null;
  if (user.role === 'mechanic') {
    mechanicInfo = dbGet('SELECT * FROM mechanics WHERE user_id = ?', [user.id]);
    if (mechanicInfo) mechanicInfo.skills = JSON.parse(mechanicInfo.skills || '[]');
  }

  let vehicles = [];
  if (user.role === 'driver') {
    vehicles = dbAll('SELECT * FROM vehicles WHERE user_id = ?', [user.id]);
  }

  res.json({ user: { ...user, mechanic: mechanicInfo, vehicles } });
});

module.exports = router;
