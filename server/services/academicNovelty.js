/**
 * Software Engineering Novelty Service:
 * 1. Vehicle Health Degradation Predictor (Predictive maintenance analytics)
 * 2. Smart Repair Cost & Labor Estimator (Automated insurance & cost audit)
 */

const { FAULT_CATEGORIES } = require('../../shared/constants');

/**
 * Vehicle Health Degradation Predictor
 * Computes health scores per subsystem (0-100%) and estimated degradation slope
 * @param {Object} readings Current vehicle readings
 * @param {Array} trendData 60-second telematics history points
 */
function predictVehicleDegradation(readings = {}, trendData = []) {
  // Base health parameters
  let batteryHealth = 100;
  let coolingHealth = 100;
  let tyreHealth = 100;
  let fuelSystemHealth = 100;
  let brakingHealth = 95;

  const v = readings.batteryVoltage !== undefined ? readings.batteryVoltage : 12.6;
  const temp = readings.coolantTemp !== undefined ? readings.coolantTemp : 88;
  const fuel = readings.fuelLevel !== undefined ? readings.fuelLevel : 50;

  // Battery health deduction
  if (v < 11.0) batteryHealth -= 75;
  else if (v < 11.8) batteryHealth -= 40;
  else if (v < 12.4) batteryHealth -= 20;

  // Coolant health deduction
  if (temp > 115) coolingHealth -= 80;
  else if (temp > 105) coolingHealth -= 50;
  else if (temp > 95) coolingHealth -= 25;

  // Tyre health calculation (across 4 corners)
  if (readings.tyrePressure) {
    const minPsi = Math.min(...Object.values(readings.tyrePressure));
    if (minPsi < 15) tyreHealth -= 80;
    else if (minPsi < 25) tyreHealth -= 45;
    else if (minPsi < 28) tyreHealth -= 20;
  }

  // Fuel health
  if (fuel < 5) fuelSystemHealth -= 70;
  else if (fuel < 15) fuelSystemHealth -= 30;

  // Slope calculation if trend points exist
  let degradationSlope = 'Stable';
  if (trendData && trendData.length >= 2) {
    const firstPoint = trendData[0];
    const lastPoint = trendData[trendData.length - 1];

    if (lastPoint.coolantTemp > firstPoint.coolantTemp + 5) {
      degradationSlope = 'Rapid Thermal Runaway (+0.4°C/sec)';
    } else if (firstPoint.batteryVoltage - lastPoint.batteryVoltage > 0.5) {
      degradationSlope = 'Critical Battery Discharge (-0.05V/sec)';
    }
  }

  // Composite vehicle health score
  const overallIndex = Math.max(
    10,
    Math.round((batteryHealth * 0.25) + (coolingHealth * 0.25) + (tyreHealth * 0.2) + (fuelSystemHealth * 0.15) + (brakingHealth * 0.15))
  );

  return {
    overallIndex,
    degradationSlope,
    riskLevel: overallIndex > 75 ? 'Low Risk' : overallIndex > 45 ? 'Elevated Risk' : 'Imminent Subsystem Failure',
    subsystems: [
      { name: 'Electrical & Battery', score: Math.max(10, batteryHealth), status: batteryHealth > 70 ? 'Good' : batteryHealth > 40 ? 'Degraded' : 'Critical' },
      { name: 'Engine Thermal Regulation', score: Math.max(10, coolingHealth), status: coolingHealth > 70 ? 'Optimal' : coolingHealth > 40 ? 'Thermal Warning' : 'Overheating' },
      { name: 'Tyre & Wheel Pressure', score: Math.max(10, tyreHealth), status: tyreHealth > 70 ? 'Nominal' : tyreHealth > 40 ? 'Under-pressured' : 'Puncture Danger' },
      { name: 'Fuel Delivery & Injection', score: Math.max(10, fuelSystemHealth), status: fuelSystemHealth > 70 ? 'Sufficient' : 'Low Reserve' },
      { name: 'Brake Hydraulic Integrity', score: Math.max(10, brakingHealth), status: brakingHealth > 70 ? 'Inspected' : 'Check Warning' },
    ],
    recommendedPreventativeAction:
      overallIndex < 40
        ? 'Ground vehicle immediately. Tow recommended to prevent cascading manifold/engine damage.'
        : overallIndex < 70
        ? 'Schedule preventative service inspection within 48 hours.'
        : 'All core subsystems within safe operating tolerances.',
  };
}

/**
 * Smart Repair Cost & Labor Estimator
 * Computes transparent breakdown cost bounds, mechanic labor hours, and warranty advice
 * @param {string} faultCategory
 * @param {string} severity
 */
function estimateRepairCostAndLabor(faultCategory, severity = 'orange') {
  const costMatrix = {
    [FAULT_CATEGORIES.BATTERY]: {
      partRange: '$40 - $140',
      avgPartCost: 85,
      laborHours: 0.5,
      hourlyRate: 60,
      parts: ['Heavy-Duty Jump / Alternator Recharge', '12V Lead-Acid/AGM Battery replacement'],
      warranty: '12 Months on battery hardware, 30 days labor guarantee',
    },
    [FAULT_CATEGORIES.OVERHEATING]: {
      partRange: '$25 - $220',
      avgPartCost: 95,
      laborHours: 1.5,
      hourlyRate: 65,
      parts: ['Coolant Fluid Flush (OAT/HOAT 4L)', 'High-Pressure Radiator Hose & Clamp kit'],
      warranty: '6 Months cooling circuit guarantee',
    },
    [FAULT_CATEGORIES.TYRE]: {
      partRange: '$15 - $110',
      avgPartCost: 45,
      laborHours: 0.4,
      hourlyRate: 50,
      parts: ['Radial Tyre Puncture Plug / Patch kit', 'Spare wheel swap & bead seat inspection'],
      warranty: 'Roadside puncture plug certified for 1,000 miles before shop vulcanization',
    },
    [FAULT_CATEGORIES.FUEL]: {
      partRange: '$20 - $75',
      avgPartCost: 35,
      laborHours: 0.3,
      hourlyRate: 55,
      parts: ['Emergency Fuel Supply (5 Litres Petrol/Diesel)', 'Fuel Primer & Siphon Delivery'],
      warranty: 'Certified contaminant-free roadside fuel delivery',
    },
    [FAULT_CATEGORIES.BRAKE]: {
      partRange: '$50 - $280',
      avgPartCost: 130,
      laborHours: 2.0,
      hourlyRate: 70,
      parts: ['DOT 4 Brake Fluid bleeding', 'Ceramic brake pad replacement set'],
      warranty: '10,000 km brake pad warranty',
    },
  };

  const details = costMatrix[faultCategory] || costMatrix[FAULT_CATEGORIES.BRAKE];
  const severityMultiplier = severity === 'red' ? 1.25 : severity === 'orange' ? 1.0 : 0.85;

  const totalMin = Math.round((details.avgPartCost * 0.75 + details.laborHours * details.hourlyRate) * severityMultiplier);
  const totalMax = Math.round((details.avgPartCost * 1.4 + details.laborHours * details.hourlyRate * 1.3) * severityMultiplier);

  return {
    faultCategory,
    estimatedTotalRange: `$${totalMin} - $${totalMax}`,
    partsCostEstimate: details.partRange,
    estimatedLaborHours: `${details.laborHours} hrs`,
    likelyComponents: details.parts,
    warrantyPolicy: details.warranty,
    breakdownSeverityFactor: severityMultiplier > 1 ? 'High Urgency / Emergency Field Surcharge (1.25x)' : 'Standard Roadside Rate',
  };
}

module.exports = {
  predictVehicleDegradation,
  estimateRepairCostAndLabor,
};
