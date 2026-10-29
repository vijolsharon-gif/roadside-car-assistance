const path = require('path');
const bcrypt = require('bcryptjs');
const { initDB, getDB, closeDB, dbRun, dbExec } = require('./database');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const config = require('../config');

const CITY_LAT = config.city.lat;
const CITY_LNG = config.city.lng;

function randomOffset(maxKm = 5) {
  const latOffset = (Math.random() - 0.5) * (maxKm / 55.5);
  const lngOffset = (Math.random() - 0.5) * (maxKm / 55.5);
  return { lat: CITY_LAT + latOffset, lng: CITY_LNG + lngOffset };
}

async function seed() {
  console.log(`\n🌱 Seeding RoadRescue database for ${config.city.name}...\n`);

  await initDB();

  // Clear existing data
  dbExec(`
    DELETE FROM share_tokens;
    DELETE FROM ratings;
    DELETE FROM request_events;
    DELETE FROM requests;
    DELETE FROM mechanics;
    DELETE FROM vehicles;
    DELETE FROM users;
  `);

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // ─── MECHANICS (8) ───────────────────────────────────
  const mechanicUsers = [
    { name: 'Ravi Kumar', email: 'ravi@roadrescue.com', phone: '+91-9876543210' },
    { name: 'Priya Sharma', email: 'priya@roadrescue.com', phone: '+91-9876543211' },
    { name: 'Arjun Patel', email: 'arjun@roadrescue.com', phone: '+91-9876543212' },
    { name: 'Deepa Nair', email: 'deepa@roadrescue.com', phone: '+91-9876543213' },
    { name: 'Suresh Reddy', email: 'suresh@roadrescue.com', phone: '+91-9876543214' },
    { name: 'Anita Desai', email: 'anita@roadrescue.com', phone: '+91-9876543215' },
    { name: 'Vikram Singh', email: 'vikram@roadrescue.com', phone: '+91-9876543216' },
    { name: 'Lakshmi Iyer', email: 'lakshmi@roadrescue.com', phone: '+91-9876543217' },
  ];

  const mechanicSkills = [
    ['battery_electrical', 'engine_overheating', 'fuel_system'],
    ['tyre_puncture', 'brake_unknown', 'engine_overheating'],
    ['battery_electrical', 'tyre_puncture', 'fuel_system', 'brake_unknown'],
    ['engine_overheating', 'fuel_system'],
    ['battery_electrical', 'brake_unknown', 'tyre_puncture'],
    ['tyre_puncture', 'engine_overheating', 'fuel_system', 'battery_electrical'],
    ['brake_unknown', 'battery_electrical', 'engine_overheating'],
    ['fuel_system', 'tyre_puncture', 'brake_unknown', 'battery_electrical', 'engine_overheating'],
  ];

  const mechanicRatings = [4.5, 4.8, 4.2, 4.6, 3.9, 4.7, 4.3, 4.9];
  const mechanicTotalRatings = [45, 62, 31, 54, 28, 71, 39, 85];
  const mechanicJobsDone = [120, 185, 78, 145, 65, 198, 95, 230];
  const mechanicResponseTimes = [12, 8, 18, 10, 20, 7, 15, 6];

  mechanicUsers.forEach((user, i) => {
    const resUser = dbRun(
      'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [user.email, hashedPassword, user.name, user.phone, 'mechanic']
    );
    const userId = resUser.lastInsertRowid;
    const pos = randomOffset(4);
    dbRun(
      `INSERT INTO mechanics (user_id, skills, rating, total_ratings, is_available, lat, lng, active_jobs, avg_response_time_min, total_jobs_done)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        JSON.stringify(mechanicSkills[i]),
        mechanicRatings[i],
        mechanicTotalRatings[i],
        i < 6 ? 1 : 0,
        pos.lat,
        pos.lng,
        i === 2 ? 2 : 0,
        mechanicResponseTimes[i],
        mechanicJobsDone[i]
      ]
    );
    console.log(`  🔧 Mechanic: ${user.name} (${user.email}) [${mechanicSkills[i].length} skills, ⭐${mechanicRatings[i]}]`);
  });

  // ─── DRIVERS (3) ───────────────────────────────────
  const driverUsers = [
    { name: 'Arun Krishnan', email: 'arun@example.com', phone: '+91-9876543220' },
    { name: 'Meera Joshi', email: 'meera@example.com', phone: '+91-9876543221' },
    { name: 'Karthik Venkat', email: 'karthik@example.com', phone: '+91-9876543222' },
  ];

  const driverVehicles = [
    { make: 'Maruti Suzuki', model: 'Swift', year: 2022, fuel_type: 'petrol', color: 'White', plate: 'TN-01-AB-1234' },
    { make: 'Hyundai', model: 'Creta', year: 2023, fuel_type: 'diesel', color: 'Blue', plate: 'TN-02-CD-5678' },
    { make: 'Tata', model: 'Nexon EV', year: 2024, fuel_type: 'electric', color: 'Teal', plate: 'TN-03-EF-9012' },
  ];

  driverUsers.forEach((user, i) => {
    const resUser = dbRun(
      'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [user.email, hashedPassword, user.name, user.phone, 'driver']
    );
    const userId = resUser.lastInsertRowid;
    const v = driverVehicles[i];
    dbRun(
      'INSERT INTO vehicles (user_id, make, model, year, fuel_type, color, plate_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, v.make, v.model, v.year, v.fuel_type, v.color, v.plate]
    );
    console.log(`  🚗 Driver: ${user.name} (${user.email}) — ${v.make} ${v.model} ${v.year}`);
  });

  // ─── ADMIN ───────────────────────────────────
  dbRun(
    'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
    ['admin@roadrescue.com', hashedPassword, 'Admin', '+91-9876543200', 'admin']
  );
  console.log(`  👑 Admin: admin@roadrescue.com`);

  console.log(`\n✅ Seeded successfully!`);
  closeDB();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
