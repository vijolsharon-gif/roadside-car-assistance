/**
 * RoadRescue Diagnosis Engine
 * Rule-based vehicle fault diagnosis with 5 categories
 */
const {
  FAULT_CATEGORIES, FAULT_LABELS,
  SEVERITY, SEVERITY_LABELS,
  CONFIDENCE,
} = require('../../shared/constants');

/**
 * Diagnose vehicle fault based on readings, warning lights, and symptoms
 * @param {Object} readings - Vehicle parameter readings
 * @param {string[]} warningLights - Active warning light IDs
 * @param {string[]} symptoms - Reported symptom IDs
 * @returns {Object} Diagnosis result
 */
function diagnose(readings, warningLights = [], symptoms = []) {
  const results = [];

  // Run each fault category check
  results.push(checkBattery(readings, warningLights, symptoms));
  results.push(checkOverheating(readings, warningLights, symptoms));
  results.push(checkTyre(readings, warningLights, symptoms));
  results.push(checkFuel(readings, warningLights, symptoms));
  results.push(checkBrake(readings, warningLights, symptoms));

  // Filter out null results and sort by confidence weight
  const positiveResults = results.filter(r => r !== null);

  if (positiveResults.length === 0) {
    return {
      faultCategory: FAULT_CATEGORIES.BRAKE,
      faultLabel: FAULT_LABELS[FAULT_CATEGORIES.BRAKE],
      confidence: CONFIDENCE.LOW,
      severity: SEVERITY.ORANGE,
      severityLabel: SEVERITY_LABELS[SEVERITY.ORANGE],
      reason: 'No specific fault pattern detected. The vehicle may need a general inspection.',
      advice: 'If you feel unsafe, stop the vehicle and request assistance. A mechanic should inspect the vehicle.',
      checklist: generateChecklist(FAULT_CATEGORIES.BRAKE),
      allFindings: [],
    };
  }

  // Sort by confidence weight (High=3, Medium=2, Low=1)
  const confidenceWeight = { [CONFIDENCE.HIGH]: 3, [CONFIDENCE.MEDIUM]: 2, [CONFIDENCE.LOW]: 1 };
  positiveResults.sort((a, b) => confidenceWeight[b.confidence] - confidenceWeight[a.confidence]);

  const primary = positiveResults[0];

  // Determine overall severity (worst case from all findings)
  const severityWeight = { [SEVERITY.RED]: 3, [SEVERITY.ORANGE]: 2, [SEVERITY.GREEN]: 1 };
  const worstSeverity = positiveResults.reduce((worst, r) => {
    return severityWeight[r.severity] > severityWeight[worst] ? r.severity : worst;
  }, SEVERITY.GREEN);

  return {
    faultCategory: primary.faultCategory,
    faultLabel: FAULT_LABELS[primary.faultCategory],
    confidence: primary.confidence,
    severity: worstSeverity,
    severityLabel: SEVERITY_LABELS[worstSeverity],
    reason: primary.reason,
    advice: generateAdvice(primary.faultCategory, worstSeverity),
    checklist: generateChecklist(primary.faultCategory),
    allFindings: positiveResults,
  };
}

// ─── BATTERY / ELECTRICAL ───────────────────────────────
function checkBattery(readings, warningLights, symptoms) {
  const voltage = readings.batteryVoltage;
  if (voltage === undefined && !warningLights.includes('battery') && !symptoms.includes('wont_start')) {
    return null;
  }

  let confidence = CONFIDENCE.LOW;
  let severity = SEVERITY.GREEN;
  const reasons = [];

  // Voltage checks
  if (voltage !== undefined) {
    if (voltage < 10.0) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push(`Battery voltage critically low at ${voltage}V (normal: 12.4-14.5V)`);
    } else if (voltage < 11.0) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push(`Battery voltage very low at ${voltage}V — unlikely to restart`);
    } else if (voltage < 11.8) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.ORANGE;
      reasons.push(`Battery voltage low at ${voltage}V (normal: 12.4-14.5V)`);
    } else if (voltage < 12.4) {
      confidence = CONFIDENCE.MEDIUM;
      severity = SEVERITY.GREEN;
      reasons.push(`Battery voltage slightly below normal at ${voltage}V`);
    }
  }

  // Warning light
  if (warningLights.includes('battery')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    reasons.push('Battery warning light is on');
  }

  // Symptoms
  if (symptoms.includes('wont_start')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push("Vehicle won't start — possible dead battery");
  }

  if (reasons.length === 0) return null;

  return {
    faultCategory: FAULT_CATEGORIES.BATTERY,
    confidence,
    severity,
    reason: reasons.join('. ') + '.',
  };
}

// ─── ENGINE OVERHEATING ───────────────────────────────
function checkOverheating(readings, warningLights, symptoms) {
  const coolantTemp = readings.coolantTemp;
  if (coolantTemp === undefined && !warningLights.includes('temperature') && !symptoms.includes('smoke')) {
    return null;
  }

  let confidence = CONFIDENCE.LOW;
  let severity = SEVERITY.GREEN;
  const reasons = [];

  if (coolantTemp !== undefined) {
    if (coolantTemp > 115) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push(`Coolant temperature dangerously high at ${coolantTemp}°C (normal: 75-105°C) — STOP IMMEDIATELY`);
    } else if (coolantTemp > 110) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push(`Coolant temperature critically high at ${coolantTemp}°C — engine damage risk`);
    } else if (coolantTemp > 100) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.ORANGE;
      reasons.push(`Coolant temperature elevated at ${coolantTemp}°C (normal: 75-105°C)`);
    } else if (coolantTemp > 95) {
      confidence = CONFIDENCE.MEDIUM;
      severity = SEVERITY.GREEN;
      reasons.push(`Coolant temperature slightly high at ${coolantTemp}°C`);
    }
  }

  if (warningLights.includes('temperature')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push('Temperature warning light is on');
  }

  if (symptoms.includes('smoke')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push('Smoke detected from engine bay');
  }

  if (symptoms.includes('smell')) {
    reasons.push('Burning smell reported — possible coolant leak or overheating');
  }

  if (reasons.length === 0) return null;

  return {
    faultCategory: FAULT_CATEGORIES.OVERHEATING,
    confidence,
    severity,
    reason: reasons.join('. ') + '.',
  };
}

// ─── TYRE / PUNCTURE ───────────────────────────────
function checkTyre(readings, warningLights, symptoms) {
  const tyrePressure = readings.tyrePressure;
  if (!tyrePressure && !warningLights.includes('tyre_pressure') && !symptoms.includes('vibration')) {
    return null;
  }

  let confidence = CONFIDENCE.LOW;
  let severity = SEVERITY.GREEN;
  const reasons = [];

  if (tyrePressure) {
    const positions = { fl: 'Front Left', fr: 'Front Right', rl: 'Rear Left', rr: 'Rear Right' };
    for (const [pos, label] of Object.entries(positions)) {
      const psi = tyrePressure[pos];
      if (psi !== undefined) {
        if (psi < 10) {
          confidence = CONFIDENCE.HIGH;
          severity = SEVERITY.RED;
          reasons.push(`${label} tyre is essentially flat at ${psi} PSI — DO NOT DRIVE`);
        } else if (psi < 20) {
          confidence = CONFIDENCE.HIGH;
          severity = SEVERITY.RED;
          reasons.push(`${label} tyre critically low at ${psi} PSI (normal: 30-35 PSI)`);
        } else if (psi < 25) {
          confidence = CONFIDENCE.HIGH;
          severity = SEVERITY.ORANGE;
          reasons.push(`${label} tyre low at ${psi} PSI (normal: 30-35 PSI)`);
        } else if (psi < 28) {
          confidence = CONFIDENCE.MEDIUM;
          severity = severity === SEVERITY.GREEN ? SEVERITY.GREEN : severity;
          reasons.push(`${label} tyre slightly under-inflated at ${psi} PSI`);
        }
      }
    }
  }

  if (warningLights.includes('tyre_pressure')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    reasons.push('TPMS warning light is on');
  }

  if (symptoms.includes('vibration')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    reasons.push('Unusual vibration detected — possible tyre issue');
  }

  if (symptoms.includes('strange_noise')) {
    reasons.push('Strange noise reported — could indicate flat tyre or wheel bearing');
  }

  if (reasons.length === 0) return null;

  return {
    faultCategory: FAULT_CATEGORIES.TYRE,
    confidence,
    severity,
    reason: reasons.join('. ') + '.',
  };
}

// ─── FUEL / FUEL SYSTEM ───────────────────────────────
function checkFuel(readings, warningLights, symptoms) {
  const fuelLevel = readings.fuelLevel;
  if (fuelLevel === undefined && !warningLights.includes('fuel') && !symptoms.includes('stalling')) {
    return null;
  }

  let confidence = CONFIDENCE.LOW;
  let severity = SEVERITY.GREEN;
  const reasons = [];

  if (fuelLevel !== undefined) {
    if (fuelLevel <= 0) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push('Fuel tank is empty — vehicle cannot run');
    } else if (fuelLevel < 3) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.RED;
      reasons.push(`Fuel level critically low at ${fuelLevel}% — engine will stall`);
    } else if (fuelLevel < 5) {
      confidence = CONFIDENCE.HIGH;
      severity = SEVERITY.ORANGE;
      reasons.push(`Fuel level very low at ${fuelLevel}%`);
    } else if (fuelLevel < 10) {
      confidence = CONFIDENCE.MEDIUM;
      severity = SEVERITY.GREEN;
      reasons.push(`Fuel level low at ${fuelLevel}% — find a fuel station`);
    }
  }

  if (warningLights.includes('fuel')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    reasons.push('Low fuel warning light is on');
  }

  if (symptoms.includes('stalling')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push('Engine stalling — could indicate fuel delivery issue');
  }

  if (symptoms.includes('wont_start') && fuelLevel !== undefined && fuelLevel < 5) {
    reasons.push("Vehicle won't start — likely out of fuel");
  }

  if (reasons.length === 0) return null;

  return {
    faultCategory: FAULT_CATEGORIES.FUEL,
    confidence,
    severity,
    reason: reasons.join('. ') + '.',
  };
}

// ─── BRAKE / UNKNOWN NOISE ───────────────────────────────
function checkBrake(readings, warningLights, symptoms) {
  let confidence = CONFIDENCE.LOW;
  let severity = SEVERITY.GREEN;
  const reasons = [];

  if (warningLights.includes('brake')) {
    confidence = CONFIDENCE.HIGH;
    severity = SEVERITY.RED;
    reasons.push('Brake warning light is on — STOP DRIVING for safety');
  }

  if (warningLights.includes('abs')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push('ABS warning light is on — anti-lock braking may be impaired');
  }

  if (symptoms.includes('strange_noise') && (warningLights.includes('brake') || warningLights.includes('abs'))) {
    confidence = CONFIDENCE.HIGH;
    reasons.push('Strange noise with brake warning — possible brake pad wear or rotor damage');
  }

  if (symptoms.includes('steering_hard')) {
    if (confidence === CONFIDENCE.LOW) confidence = CONFIDENCE.MEDIUM;
    if (severity === SEVERITY.GREEN) severity = SEVERITY.ORANGE;
    reasons.push('Steering difficulty reported — could be power steering or brake related');
  }

  if (reasons.length === 0) return null;

  return {
    faultCategory: FAULT_CATEGORIES.BRAKE,
    confidence,
    severity,
    reason: reasons.join('. ') + '.',
  };
}

// ─── SAFETY ADVICE ───────────────────────────────
function generateAdvice(faultCategory, severity) {
  const generalSafety = {
    [SEVERITY.GREEN]: 'You can carefully drive to a nearby garage at reduced speed. Keep monitoring your dashboard.',
    [SEVERITY.ORANGE]: 'Limit driving to essential movements only. Pull over to a safe location as soon as possible.',
    [SEVERITY.RED]: 'STOP the vehicle immediately in a safe location. Turn on hazard lights. Do NOT attempt to drive.',
  };

  const specificAdvice = {
    [FAULT_CATEGORIES.BATTERY]: {
      [SEVERITY.GREEN]: 'Your battery is slightly low but should be fine for a short drive. Avoid using unnecessary electrical systems.',
      [SEVERITY.ORANGE]: 'Turn off air conditioning, radio, and non-essential electrical systems. Drive directly to a garage.',
      [SEVERITY.RED]: 'Do not try to restart. The battery is too depleted. You need a jump start or replacement. Wait for a mechanic.',
    },
    [FAULT_CATEGORIES.OVERHEATING]: {
      [SEVERITY.GREEN]: 'Turn on the heater to maximum (this draws heat from the engine). Monitor the temperature gauge.',
      [SEVERITY.ORANGE]: 'Pull over, open the hood (carefully), let the engine cool for 15-20 minutes. Do NOT open the radiator cap while hot.',
      [SEVERITY.RED]: 'STOP immediately! Turn off the engine. Do NOT open the radiator cap — steam can cause severe burns. Wait for the engine to cool completely before any inspection.',
    },
    [FAULT_CATEGORIES.TYRE]: {
      [SEVERITY.GREEN]: 'Drive slowly and carefully to the nearest tyre shop. Avoid sharp turns and high speeds.',
      [SEVERITY.ORANGE]: 'Reduce speed significantly. If you have a spare tyre and know how to change it, consider doing so in a safe location.',
      [SEVERITY.RED]: 'DO NOT DRIVE on a flat tyre — it damages the wheel rim and is dangerous. Pull over completely and change the tyre or wait for help.',
    },
    [FAULT_CATEGORIES.FUEL]: {
      [SEVERITY.GREEN]: 'Drive conservatively to the nearest fuel station. Avoid heavy acceleration.',
      [SEVERITY.ORANGE]: 'You are very low on fuel. Drive slowly in a high gear to conserve fuel. Head to the nearest station.',
      [SEVERITY.RED]: 'You are out of fuel. The vehicle cannot be driven. You need fuel delivered to your location.',
    },
    [FAULT_CATEGORIES.BRAKE]: {
      [SEVERITY.GREEN]: 'Drive carefully and get the brakes inspected at the next opportunity.',
      [SEVERITY.ORANGE]: 'Reduce speed and increase following distance. The vehicle needs brake inspection soon.',
      [SEVERITY.RED]: 'STOP the vehicle immediately. Brake issues are life-threatening. Do NOT attempt to drive. Wait for a mechanic with proper tools.',
    },
  };

  return specificAdvice[faultCategory]?.[severity] || generalSafety[severity];
}

// ─── PRE-ARRIVAL CHECKLIST ───────────────────────────────
function generateChecklist(faultCategory) {
  const checklists = {
    [FAULT_CATEGORIES.BATTERY]: {
      tools: ['Jump starter / jumper cables', 'Multimeter', 'Battery terminal cleaner', 'Wrench set (10mm, 12mm)'],
      parts: ['Replacement battery (common sizes)', 'Battery terminal clamps', 'Anti-corrosion spray'],
      notes: 'Check alternator output after jump start. If voltage drops below 13V while running, alternator may be faulty.',
    },
    [FAULT_CATEGORIES.OVERHEATING]: {
      tools: ['Coolant pressure tester', 'Infrared thermometer', 'Pliers and screwdrivers', 'Drain pan'],
      parts: ['Coolant / antifreeze (2L)', 'Radiator hoses (universal)', 'Hose clamps', 'Thermostat gasket'],
      notes: 'Wait for engine to cool before opening radiator cap. Check for visible leaks, damaged hoses, and fan operation.',
    },
    [FAULT_CATEGORIES.TYRE]: {
      tools: ['Jack and wheel wrench', 'Tyre pressure gauge', 'Tyre plug kit', 'Portable air compressor'],
      parts: ['Spare tyre (if driver doesn\'t have one)', 'Tyre sealant', 'Valve stems'],
      notes: 'Inspect sidewall for damage. Plug repairs are temporary — recommend full replacement if sidewall is compromised.',
    },
    [FAULT_CATEGORIES.FUEL]: {
      tools: ['Fuel can (5L)', 'Funnel with filter', 'Siphon pump'],
      parts: ['5L of appropriate fuel (check vehicle fuel type)', 'Fuel line clamps'],
      notes: 'Verify fuel type before adding! Diesel in petrol or vice versa requires tank draining. May need to prime fuel system.',
    },
    [FAULT_CATEGORIES.BRAKE]: {
      tools: ['Jack and axle stands', 'Torque wrench', 'Brake caliper tool', 'Brake fluid tester'],
      parts: ['Brake pads (front/rear sets)', 'Brake fluid DOT 4', 'Brake cleaner spray'],
      notes: 'Full brake inspection required. Check pad thickness, rotor condition, fluid level, and line integrity. Safety-critical — do not shortcut.',
    },
  };

  return checklists[faultCategory] || checklists[FAULT_CATEGORIES.BRAKE];
}

module.exports = { diagnose, generateChecklist, generateAdvice };
