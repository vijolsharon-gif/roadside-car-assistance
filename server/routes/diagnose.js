const router = require('express').Router();
const { diagnose } = require('../services/diagnosisEngine');
const { predictVehicleDegradation, estimateRepairCostAndLabor } = require('../services/academicNovelty');

// POST /api/diagnose
router.post('/', (req, res) => {
  try {
    const { readings, warningLights, symptoms, trendData } = req.body;

    if (!readings || typeof readings !== 'object') {
      return res.status(400).json({ error: 'Vehicle readings are required' });
    }

    const result = diagnose(readings, warningLights || [], symptoms || []);

    // Academic Novelties
    const healthAnalytics = predictVehicleDegradation(readings, trendData || []);
    const costEstimate = estimateRepairCostAndLabor(result.faultCategory, result.severity);

    res.json({
      ...result,
      healthAnalytics,
      costEstimate,
    });
  } catch (err) {
    console.error('Diagnosis error:', err);
    res.status(500).json({ error: 'Diagnosis failed' });
  }
});

module.exports = router;
