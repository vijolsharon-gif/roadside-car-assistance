// Shared constants used by both client and server

const FAULT_CATEGORIES = {
  BATTERY: 'battery_electrical',
  OVERHEATING: 'engine_overheating',
  TYRE: 'tyre_puncture',
  FUEL: 'fuel_system',
  BRAKE: 'brake_unknown',
};

const FAULT_LABELS = {
  [FAULT_CATEGORIES.BATTERY]: 'Battery / Electrical',
  [FAULT_CATEGORIES.OVERHEATING]: 'Engine Overheating',
  [FAULT_CATEGORIES.TYRE]: 'Tyre / Puncture',
  [FAULT_CATEGORIES.FUEL]: 'Fuel / Fuel System',
  [FAULT_CATEGORIES.BRAKE]: 'Brake / Unknown Noise',
};

const SEVERITY = {
  GREEN: 'green',   // 🟢 Safe to drive slowly to nearby garage
  ORANGE: 'orange', // 🟠 Stop soon: limited driving only
  RED: 'red',       // 🔴 Stop now: do not drive
};

const SEVERITY_LABELS = {
  [SEVERITY.GREEN]: '🟢 Safe to drive slowly',
  [SEVERITY.ORANGE]: '🟠 Stop soon — limited driving',
  [SEVERITY.RED]: '🔴 Stop NOW — do not drive',
};

const CONFIDENCE = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const REQUEST_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DECLINED: 'declined',
};

const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.REQUESTED]: 'Requested',
  [REQUEST_STATUS.ACCEPTED]: 'Accepted',
  [REQUEST_STATUS.ON_THE_WAY]: 'On the Way',
  [REQUEST_STATUS.ARRIVED]: 'Arrived',
  [REQUEST_STATUS.COMPLETED]: 'Completed',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled',
  [REQUEST_STATUS.DECLINED]: 'Declined',
};

const STATUS_FLOW = [
  REQUEST_STATUS.REQUESTED,
  REQUEST_STATUS.ACCEPTED,
  REQUEST_STATUS.ON_THE_WAY,
  REQUEST_STATUS.ARRIVED,
  REQUEST_STATUS.COMPLETED,
];

const USER_ROLES = {
  DRIVER: 'driver',
  MECHANIC: 'mechanic',
  ADMIN: 'admin',
};

const WARNING_LIGHTS = [
  { id: 'check_engine', label: 'Check Engine', icon: '🔧' },
  { id: 'battery', label: 'Battery', icon: '🔋' },
  { id: 'temperature', label: 'Temperature', icon: '🌡️' },
  { id: 'oil_pressure', label: 'Oil Pressure', icon: '🛢️' },
  { id: 'brake', label: 'Brake', icon: '🛑' },
  { id: 'tyre_pressure', label: 'Tyre Pressure (TPMS)', icon: '⚠️' },
  { id: 'fuel', label: 'Low Fuel', icon: '⛽' },
  { id: 'abs', label: 'ABS', icon: '🔘' },
];

const SYMPTOMS = [
  { id: 'smoke', label: 'Smoke from engine', icon: '💨' },
  { id: 'strange_noise', label: 'Strange noise', icon: '🔊' },
  { id: 'wont_start', label: "Won't start", icon: '🚫' },
  { id: 'stalling', label: 'Engine stalling', icon: '⏸️' },
  { id: 'vibration', label: 'Unusual vibration', icon: '📳' },
  { id: 'leaking', label: 'Fluid leaking', icon: '💧' },
  { id: 'smell', label: 'Burning smell', icon: '🔥' },
  { id: 'steering_hard', label: 'Steering difficulty', icon: '🎯' },
];

const SIMULATOR_SCENARIOS = {
  WEAK_BATTERY: {
    label: 'Weak Battery',
    icon: '🔋',
    readings: {
      batteryVoltage: 10.5,
      coolantTemp: 85,
      tyrePressure: { fl: 32, fr: 32, rl: 30, rr: 30 },
      fuelLevel: 60,
      engineRPM: 0,
    },
    warningLights: ['battery'],
    symptoms: ['wont_start'],
  },
  OVERHEATING: {
    label: 'Engine Overheating',
    icon: '🌡️',
    readings: {
      batteryVoltage: 13.8,
      coolantTemp: 118,
      tyrePressure: { fl: 32, fr: 32, rl: 30, rr: 30 },
      fuelLevel: 45,
      engineRPM: 2200,
    },
    warningLights: ['temperature', 'check_engine'],
    symptoms: ['smoke', 'smell'],
  },
  LOW_TYRE: {
    label: 'Low Tyre Pressure',
    icon: '🛞',
    readings: {
      batteryVoltage: 13.5,
      coolantTemp: 88,
      tyrePressure: { fl: 15, fr: 32, rl: 30, rr: 30 },
      fuelLevel: 70,
      engineRPM: 800,
    },
    warningLights: ['tyre_pressure'],
    symptoms: ['vibration', 'strange_noise'],
  },
  EMPTY_TANK: {
    label: 'Empty Fuel Tank',
    icon: '⛽',
    readings: {
      batteryVoltage: 13.2,
      coolantTemp: 75,
      tyrePressure: { fl: 32, fr: 31, rl: 30, rr: 30 },
      fuelLevel: 2,
      engineRPM: 0,
    },
    warningLights: ['fuel'],
    symptoms: ['stalling', 'wont_start'],
  },
};

const DISPATCH_WEIGHTS = {
  DISTANCE: 0.40,
  SKILL: 0.25,
  RATING: 0.20,
  WORKLOAD: 0.15,
};

const MAX_DISPATCH_RANGE_KM = 25;
const MAX_ACTIVE_JOBS = 5;
const CASCADE_TIMEOUT_MS = 60000; // 60 seconds

// Export for both CommonJS (server) and ES modules (client)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FAULT_CATEGORIES, FAULT_LABELS,
    SEVERITY, SEVERITY_LABELS,
    CONFIDENCE,
    REQUEST_STATUS, REQUEST_STATUS_LABELS, STATUS_FLOW,
    USER_ROLES,
    WARNING_LIGHTS, SYMPTOMS,
    SIMULATOR_SCENARIOS,
    DISPATCH_WEIGHTS, MAX_DISPATCH_RANGE_KM, MAX_ACTIVE_JOBS, CASCADE_TIMEOUT_MS,
  };
}

export {
  FAULT_CATEGORIES, FAULT_LABELS,
  SEVERITY, SEVERITY_LABELS,
  CONFIDENCE,
  REQUEST_STATUS, REQUEST_STATUS_LABELS, STATUS_FLOW,
  USER_ROLES,
  WARNING_LIGHTS, SYMPTOMS,
  SIMULATOR_SCENARIOS,
  DISPATCH_WEIGHTS, MAX_DISPATCH_RANGE_KM, MAX_ACTIVE_JOBS, CASCADE_TIMEOUT_MS,
};
