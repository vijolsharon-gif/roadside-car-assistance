import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { REQUEST_STATUS_LABELS, SEVERITY_LABELS } from '../../../../shared/constants';

export default function DriverHome() {
  const { user } = useAuth();
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests')
      .then((res) => {
        setRecentRequests(res.data.requests || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Breakdown CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-950/70 via-slate-800 to-amber-950/40 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            24/7 Smart Assistance
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Stranded on the road? We've got your back.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Report breakdown symptoms, get rule-based diagnostic triage, and dispatch ranked nearby mechanics with the exact right tools.
          </p>

          <div className="pt-2">
            <Link
              to="/breakdown"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-base shadow-xl shadow-rose-600/30 transition-transform active:scale-95 gap-2"
            >
              <span className="text-xl">⚠️</span>
              <span>I'VE BROKEN DOWN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Driver Vehicles & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Vehicle
          </div>
          {user?.vehicles && user.vehicles.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-1">
              <div className="font-extrabold text-white text-base">
                {user.vehicles[0].make} {user.vehicles[0].model}
              </div>
              <div className="text-xs text-amber-400 font-medium">
                {user.vehicles[0].year} • {user.vehicles[0].fuel_type.toUpperCase()}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Plate: {user.vehicles[0].plate_number || 'N/A'}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No vehicle registered yet
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Breakdown History
          </div>

          {loading ? (
            <div className="text-xs text-slate-500 text-center py-6">Loading requests...</div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  to={`/tracker/${r.id}`}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700 flex items-center justify-between transition group"
                >
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      {r.diagnosis?.faultLabel || r.fault_category}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString()} at{' '}
                      {new Date(r.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {REQUEST_STATUS_LABELS[r.status] || r.status}
                    </span>
                    <span className="text-slate-500 group-hover:text-slate-300 transition">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No breakdown requests recorded yet. Safe travels!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
