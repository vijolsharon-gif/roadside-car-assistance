import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LeafletMap from '../../components/map/LeafletMap';
import { REQUEST_STATUS_LABELS, STATUS_FLOW, SEVERITY_LABELS } from '../../../../shared/constants';

export default function ShareTracker() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/share/track/${token}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Link expired or invalid'));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-rose-500/30 text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-xl font-bold">Invalid Tracking Link</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400" />
      </div>
    );
  }

  const { request, driverName, mechanic } = data;
  const currentStepIdx = STATUS_FLOW.indexOf(request.status);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center space-x-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">RoadRescue Public Safety Tracker</h1>
            <p className="text-xs text-slate-400">Live monitoring for friends and family</p>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Driver in Need
              </span>
              <h2 className="text-xl font-black text-white">{driverName}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {REQUEST_STATUS_LABELS[request.status] || request.status}
            </span>
          </div>

          <div className="flex items-center justify-between relative pt-4">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-700 z-0" />
            {STATUS_FLOW.map((s, idx) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStepIdx >= idx ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStepIdx >= idx ? '✓' : idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <LeafletMap
            center={[request.lat, request.lng]}
            driverLocation={{ lat: request.lat, lng: request.lng }}
            mechanicLocation={mechanic?.lat && mechanic?.lng ? { lat: mechanic.lat, lng: mechanic.lng } : null}
            className="h-80 w-full rounded-xl overflow-hidden border border-slate-700"
          />
        </div>

        {mechanic && (
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Dispatched Mechanic</div>
              <div className="text-sm font-bold text-white">{mechanic.name} (⭐ {mechanic.rating})</div>
            </div>
            {mechanic.phone && (
              <a
                href={`tel:${mechanic.phone}`}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950"
              >
                📞 Contact
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
