const test = require('node:test');
const assert = require('node:assert');
const { diagnose } = require('../server/services/diagnosisEngine');
const { FAULT_CATEGORIES, SEVERITY, CONFIDENCE } = require('../shared/constants');

test('Diagnosis Engine - Battery Failure', () => {
  const result = diagnose({ batteryVoltage: 10.2 }, ['battery'], ['wont_start']);
  assert.strictEqual(result.faultCategory, FAULT_CATEGORIES.BATTERY);
  assert.strictEqual(result.severity, SEVERITY.RED);
  assert.strictEqual(result.confidence, CONFIDENCE.HIGH);
  assert.ok(result.checklist.tools.length > 0);
});

test('Diagnosis Engine - Overheating', () => {
  const result = diagnose({ coolantTemp: 114 }, ['temperature'], ['smoke']);
  assert.strictEqual(result.faultCategory, FAULT_CATEGORIES.OVERHEATING);
  assert.strictEqual(result.severity, SEVERITY.RED);
  assert.strictEqual(result.confidence, CONFIDENCE.HIGH);
  assert.ok(result.reason.includes('Coolant temperature'));
});

test('Diagnosis Engine - Low Tyre', () => {
  const result = diagnose({ tyrePressure: { fl: 16, fr: 32, rl: 30, rr: 30 } }, ['tyre_pressure'], ['vibration']);
  assert.strictEqual(result.faultCategory, FAULT_CATEGORIES.TYRE);
  assert.strictEqual(result.severity, SEVERITY.RED);
  assert.strictEqual(result.confidence, CONFIDENCE.HIGH);
});

test('Diagnosis Engine - Fuel Empty', () => {
  const result = diagnose({ fuelLevel: 1 }, ['fuel'], ['stalling']);
  assert.strictEqual(result.faultCategory, FAULT_CATEGORIES.FUEL);
  assert.strictEqual(result.severity, SEVERITY.RED);
  assert.strictEqual(result.confidence, CONFIDENCE.HIGH);
});

test('Diagnosis Engine - Brake Issue (Safety-Critical)', () => {
  const result = diagnose({}, ['brake'], ['strange_noise']);
  assert.strictEqual(result.faultCategory, FAULT_CATEGORIES.BRAKE);
  assert.strictEqual(result.severity, SEVERITY.RED);
  assert.strictEqual(result.confidence, CONFIDENCE.HIGH);
});
