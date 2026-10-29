import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LeafletMap from '../../components/map/LeafletMap';
import TrendChart from '../../components/diagnosis/TrendChart';
import {
  WARNING_LIGHTS,
  SYMPTOMS,
  SIMULATOR_SCENARIOS,
  SEVERITY,
  SEVERITY_LABELS,
} from '../../../../shared/constants';

export default function BreakdownFlow() {
  const navigate = useNavigate();

  // Step 1: GPS, Step 2: Readings/Sim, Step 3: Symptoms, Step 4: Diagnosis & Dispatch
  const [step, setStep] = useState(1);

  // GPS Location state
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Vehicle Parameters
  const [readings, setReadings] = useState({
    batteryVoltage: 12.6,
    coolantTemp: 88,
    tyrePressure: { fl: 32, fr: 32, rl: 30, rr: 30 },
    fuelLevel: 65,
    engineRPM: 850,
  });

  // Selected warning lights & symptoms
  const [selectedLights, setSelectedLights] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // Telemetry trend for Black Box
  const [trendData, setTrendData] = useState([]);

  // Diagnosis results & dispatched mechanics
  const [diagnosis, setDiagnosis] = useState(null);
  const [nearbyMechanics, setNearbyMechanics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Auto-detect browser GPS on load
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsLoading(false);
        },
        () => {
          setGpsLoading(false); // Fallback to city center
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Simulator scenario trigger
  const applyScenario = (scenarioKey) => {
    const scenario = SIMULATOR_SCENARIOS[scenarioKey];
    if (!scenario) return;

    setReadings(scenario.readings);
    setSelectedLights(scenario.warningLights || []);
    setSelectedSymptoms(scenario.symptoms || []);

    // Generate 60s simulated trend history (12 points, 5s steps)
    const trend = [];
    for (let i = 12; i >= 0; i--) {
      const timeOffset = `-${i * 5}s`;
      let v = scenario.readings.batteryVoltage;
      let temp = scenario.readings.coolantTemp;
      let rpm = scenario.readings.engineRPM;

      if (scenarioKey === 'OVERHEATING') {
        temp = Math.round((scenario.readings.coolantTemp - i * 2.5) * 10) / 10;
      } else if (scenarioKey === 'WEAK_BATTERY') {
        v = Math.round((scenario.readings.batteryVoltage + i * 0.15) * 10) / 10;
      }

      trend.push({
        time: timeOffset,
        batteryVoltage: v,
        coolantTemp: temp,
        engineRPM: Math.round(rpm / 100),
      });
    }
    setTrendData(trend);
  };

  const toggleLight = (id) => {
    setSelectedLights((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const runDiagnosis = async () => {
    try {
      const res = await api.post('/diagnose', {
        readings,
        warningLights: selectedLights,
        symptoms: selectedSymptoms,
        trendData,
      });
      setDiagnosis(res.data);

      // Fetch nearby mechanics
      const mechRes = await api.get('/mechanics/nearby', {
        params: {
          lat: location.lat,
          lng: location.lng,
          faultCategory: res.data.faultCategory,
        },
      });
      setNearbyMechanics(mechRes.data.mechanics || []);
      setStep(4);
    } catch (err) {
      alert('Failed to run diagnosis. Check inputs.');
    }
  };

  const submitRequest = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/requests', {
        lat: location.lat,
        lng: location.lng,
        readings,
        warningLights: selectedLights,
        symptoms: selectedSymptoms,
        trendData,
        notes,
      });
      navigate(`/tracker/${res.data.request.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request assistance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {['1. GPS Pin', '2. Telematics', '3. Symptoms', '4. Triage & Dispatch'].map((name, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step > i + 1
                  ? 'bg-emerald-500 text-white'
                  : step === i + 1
                  ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-2 hidden sm:block">
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: GPS LOCATION */}
      {step === 1 && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📍</span> Pin Breakdown Location
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Auto-captured from GPS. You can also tap anywhere on the map to fine-tune your pin.
              </p>
            </div>
            {gpsLoading && (
              <span className="text-xs text-amber-400 animate-pulse">Detecting GPS...</span>
            )}
          </div>

          <LeafletMap
            center={[location.lat, location.lng]}
            driverLocation={location}
            onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
            className="h-80 w-full rounded-xl overflow-hidden border border-slate-700"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-lg shadow-amber-400/20"
            >
              Confirm Location →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TELEMATICS & SIMULATOR */}
      {step === 2 && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡</span> Vehicle Parameters & Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manual inputs or select a quick simulated breakdown scenario
              </p>
            </div>

            {/* Quick Simulator Scenarios */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(SIMULATOR_SCENARIOS).map(([key, sc]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyScenario(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-amber-300 border border-amber-400/20 transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>{sc.icon}</span>
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                🔋 Battery Voltage (V)
              </label>
              <input
                type="number"
                step="0.1"
                value={readings.batteryVoltage}
                onChange={(e) =>
                  setReadings({ ...readings, batteryVoltage: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 12.4V - 14.5V</span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                🌡️ Coolant Temp (°C)
              </label>
              <input
                type="number"
                value={readings.coolantTemp}
                onChange={(e) =>
                  setReadings({ ...readings, coolantTemp: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 75°C - 95°C</span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                ⛽ Fuel Level (%)
              </label>
              <input
                type="number"
                value={readings.fuelLevel}
                onChange={(e) =>
                  setReadings({ ...readings, fuelLevel: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: &gt; 15%</span>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 sm:col-span-2 md:col-span-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                🛞 Tyre Pressure (PSI per wheel)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['fl', 'fr', 'rl', 'rr'].map((pos) => (
                  <div key={pos} className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{pos}:</span>
                    <input
                      type="number"
                      value={readings.tyrePressure[pos]}
                      onChange={(e) =>
                        setReadings({
                          ...readings,
                          tyrePressure: {
                            ...readings.tyrePressure,
                            [pos]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-transparent text-white font-mono text-xs outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/60">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              ← Back to GPS
            </button>
            <button
              onClick={() => setStep(3)}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-lg shadow-amber-400/20"
            >
              Next: Warning Lights →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: WARNING LIGHTS & SYMPTOMS */}
      {step === 3 && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚠️</span> Warning Lights & Observed Symptoms
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select which dashboard indicators are illuminated or noises/smoke noticed
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Dashboard Warning Lights
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {WARNING_LIGHTS.map((light) => {
                const active = selectedLights.includes(light.id);
                return (
                  <button
                    key={light.id}
                    type="button"
                    onClick={() => toggleLight(light.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                      active
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 shadow-md shadow-amber-400/10'
                        : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">{light.icon}</span>
                    <span className="text-xs font-medium">{light.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Physical Symptoms
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SYMPTOMS.map((sym) => {
                const active = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                      active
                        ? 'border-rose-400 bg-rose-400/10 text-rose-300 shadow-md shadow-rose-400/10'
                        : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">{sym.icon}</span>
                    <span className="text-xs font-medium">{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/60">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              ← Back to Telematics
            </button>
            <button
              onClick={runDiagnosis}
              className="py-2.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white transition shadow-lg shadow-rose-500/20"
            >
              Run Instant Diagnosis 🔍
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DIAGNOSIS RESULT & DISPATCH CONFIRMATION */}
      {step === 4 && diagnosis && (
        <div className="space-y-6">
          {/* Triage & Severity Banner */}
          <div
            className={`p-6 rounded-2xl border shadow-xl ${
              diagnosis.severity === SEVERITY.RED
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                : diagnosis.severity === SEVERITY.ORANGE
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/60 border border-white/10">
                  {SEVERITY_LABELS[diagnosis.severity]}
                </span>
                <h2 className="text-2xl font-black mt-2 tracking-tight">
                  {diagnosis.faultLabel}
                </h2>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 self-start sm:self-auto">
                Confidence: <span className="text-amber-400">{diagnosis.confidence}</span>
              </div>
            </div>

            <div className="text-sm font-medium leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-white/5 mb-3">
              <span className="font-bold text-amber-400">Diagnosis:</span> {diagnosis.reason}
            </div>

            <div className="text-sm leading-relaxed p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
              <span className="font-bold text-rose-400">Driver Safety Protocol:</span> {diagnosis.advice}
            </div>
          </div>

          {/* Novelty Module A: Subsystem Degradation Predictor */}
          {diagnosis.healthAnalytics && (
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <span>🔬</span>
                    <span>Subsystem Health & Degradation Analytics</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Degradation Rate: <span className="font-mono text-amber-300 font-semibold">{diagnosis.healthAnalytics.degradationSlope}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-slate-400">Overall Health Index:</span>
                  <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg border font-mono ${
                    diagnosis.healthAnalytics.overallIndex > 70
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : diagnosis.healthAnalytics.overallIndex > 40
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {diagnosis.healthAnalytics.overallIndex}%
                  </span>
                </div>
              </div>

              {/* Subsystem Health Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {diagnosis.healthAnalytics.subsystems?.map((sub, i) => (
                  <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{sub.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{sub.status} ({sub.score}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          sub.score > 70 ? 'bg-emerald-500' : sub.score > 40 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${sub.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <span className="font-bold text-slate-300">Engineering Recommendation: </span>
                {diagnosis.healthAnalytics.recommendedPreventativeAction}
              </div>
            </div>
          )}

          {/* Novelty Module B: Smart Repair Cost & Labor Estimator */}
          {diagnosis.costEstimate && (
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>💰</span>
                  <span>Smart Repair Cost & Labor Estimate</span>
                </div>
                <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {diagnosis.costEstimate.estimatedTotalRange}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Estimated Hardware</span>
                  <span className="font-bold text-slate-200">{diagnosis.costEstimate.partsCostEstimate}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Labor Time</span>
                  <span className="font-bold text-slate-200">{diagnosis.costEstimate.estimatedLaborHours}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Pricing Policy</span>
                  <span className="font-bold text-amber-300 text-[11px]">{diagnosis.costEstimate.breakdownSeverityFactor}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>🛡️ {diagnosis.costEstimate.warrantyPolicy}</span>
              </div>
            </div>
          )}

          {/* Breakdown Black Box Telemetry Trend */}
          <TrendChart data={trendData} />

          {/* Pre-Arrival Checklist Preview */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <span>🛠️</span>
              <span>Pre-Arrival Checklist (Sent to Mechanic)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-300 block mb-1">Required Tools:</span>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                  {diagnosis.checklist?.tools.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-300 block mb-1">Likely Spare Parts:</span>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                  {diagnosis.checklist?.parts.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Ranked Smart Dispatch Mechanics Preview */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Smart Dispatch Ranking (Top Matches)</span>
              </div>
              <span className="text-[11px] text-slate-400">Auto-cascading best responder first</span>
            </div>

            <div className="space-y-2">
              {nearbyMechanics.slice(0, 3).map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">#{idx + 1} {m.name}</span>
                      <span className="text-xs text-amber-400 font-semibold">⭐ {m.rating}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                        {m.distance} km away (~{m.eta} min ETA)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {m.whyThisMechanic?.join(' • ')}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
                    Score: {m.scores?.total}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes & Submit */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Additional Notes for Mechanic (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., parked near highway milestone 42, hazard lights on"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              className="py-3 px-5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              ← Back to Symptoms
            </button>

            <button
              onClick={submitRequest}
              disabled={submitting}
              className="py-3.5 px-8 rounded-xl font-bold text-base bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-600/30 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Dispatching Help...' : '🚨 Request Roadside Assistance Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
