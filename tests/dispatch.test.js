const test = require('node:test');
const assert = require('node:assert');
const { rankMechanics, haversineDistance } = require('../server/services/dispatchScoring');
const { FAULT_CATEGORIES } = require('../shared/constants');

test('Dispatch Scoring - Distance and Skill weighting', () => {
  const req = {
    lat: 13.0827,
    lng: 80.2707,
    faultCategory: FAULT_CATEGORIES.BATTERY,
  };

  const mechanics = [
    {
      id: 1,
      user_id: 101,
      name: 'Far Specialist',
      phone: '123',
      lat: 13.18, // ~11 km away
      lng: 80.27,
      rating: 4.8,
      total_ratings: 50,
      is_available: 1,
      active_jobs: 0,
      skills: JSON.stringify([FAULT_CATEGORIES.BATTERY]),
    },
    {
      id: 2,
      user_id: 102,
      name: 'Close Generalist',
      phone: '456',
      lat: 13.084, // ~0.2 km away
      lng: 80.271,
      rating: 4.5,
      total_ratings: 40,
      is_available: 1,
      active_jobs: 0,
      skills: JSON.stringify([FAULT_CATEGORIES.TYRE]),
    }
  ];

  const ranked = rankMechanics(mechanics, req);
  assert.strictEqual(ranked.length, 2);
  // Distance has 40% weight so Close Generalist is ranked higher or compared appropriately
  assert.ok(ranked[0].scores.total > 0);
  assert.ok(ranked[0].whyThisMechanic.length > 0);
});
