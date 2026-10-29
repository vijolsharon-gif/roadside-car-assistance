import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { REQUEST_STATUS_LABELS, SEVERITY_LABELS } from '../../../../shared/constants';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/requests'), api.get('/mechanics')])
      .then(([reqRes, mechRes]) => {
        setRequests(reqRes.data.requests || []);
        setMechanics(mechRes.data.mechanics || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-black text-white">System Admin Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Platform metrics, all breakdown calls, and fleet status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* All Requests Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-sm font-bold text-white">All Breakdown Requests ({requests.length})</div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {requests.map((r) => (
              <div key={r.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">#{r.id} • {r.fault_category}</div>
                  <div className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-[10px]">
                  {REQUEST_STATUS_LABELS[r.status] || r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* All Mechanics Fleet Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="text-sm font-bold text-white">Registered Mechanics ({mechanics.length})</div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {mechanics.map((m) => (
              <div key={m.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-slate-400">Rating: ⭐ {m.rating} • Jobs: {m.total_jobs_done}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  m.is_available ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {m.is_available ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
