import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';
import LeafletMap from '../../components/map/LeafletMap';
import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  SEVERITY_LABELS,
} from '../../../../shared/constants';

export default function MechanicDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    socket.on('request:new', (payload) => {
      fetchDashboardData();
    });

    return () => {
      socket.off('request:new');
    };
  }, []);

  // Continuous location broadcast while active
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation && isAvailable) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          api.patch('/mechanics/me/location', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAvailable]);

  const fetchDashboardData = async () => {
    try {
      const [reqRes, statRes] = await Promise.all([
        api.get('/requests'),
        api.get('/mechanics/me/stats'),
      ]);
      setRequests(reqRes.data.requests || []);
      setStats(statRes.data.stats || {});
      setIsAvailable(statRes.data.stats?.isAvailable ?? true);

      // Check if there is an in-progress job
      const active = reqRes.data.requests.find(
        (r) => r.status === 'accepted' || r.status === 'on_the_way' || r.status === 'arrived'
      );
      setActiveJob(active || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const next = !isAvailable;
      await api.patch('/mechanics/me/availability', { isAvailable: next });
      setIsAvailable(next);
    } catch (err) {
      alert('Failed to update availability status');
    }
  };

  const updateJobStatus = async (requestId, nextStatus) => {
    try {
      await api.patch(`/requests/${requestId}/status`, { status: nextStatus });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update job status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner with Stats & Toggle */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mechanic Dispatch Terminal
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Live Rescue Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Accept priority triage breakdowns and update status along the journey
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Availability Toggle */}
          <button
            onClick={toggleAvailability}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              isAvailable
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-slate-950 animate-ping' : 'bg-white'}`} />
            {isAvailable ? 'Status: ONLINE & AVAILABLE' : 'Status: OFFLINE'}
          </button>

          {/* Quick Stats Pill */}
          {stats && (
            <div className="flex items-center gap-4 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Rating</span>
                <span className="font-bold text-amber-400">⭐ {stats.rating}</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Jobs Done</span>
                <span className="font-bold text-white">{stats.totalJobsDone}</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Avg Response</span>
                <span className="font-bold text-emerald-400">{stats.avgResponseTime}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE JOB CONTROLLER IF IN PROGRESS */}
      {activeJob && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-800 to-slate-800 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                ACTIVE ASSIGNMENT: #{activeJob.id}
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-700">
              {REQUEST_STATUS_LABELS[activeJob.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{activeJob.diagnosis?.faultLabel}</h2>
              <div className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                <span className="font-bold text-amber-400">Triage Note:</span> {activeJob.diagnosis?.reason}
              </div>

              {/* Pre-Arrival Tools Required */}
              <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
                <div className="font-bold text-slate-200 mb-1">🧰 Tools to Bring:</div>
                <div className="text-slate-400">
                  {activeJob.checklist?.tools?.join(', ') || 'Standard roadside kit'}
                </div>
              </div>
            </div>

            {/* Status Transition Action Buttons */}
            <div className="flex flex-col justify-center space-y-2">
              {activeJob.status === REQUEST_STATUS.ACCEPTED && (
                <button
                  onClick={() => updateJobStatus(activeJob.id, REQUEST_STATUS.ON_THE_WAY)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 transition"
                >
                  🚀 I Am On The Way
                </button>
              )}

              {activeJob.status === REQUEST_STATUS.ON_THE_WAY && (
                <button
                  onClick={() => updateJobStatus(activeJob.id, REQUEST_STATUS.ARRIVED)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
                >
                  📍 I Have Arrived at Location
                </button>
              )}

              {activeJob.status === REQUEST_STATUS.ARRIVED && (
                <button
                  onClick={() => updateJobStatus(activeJob.id, REQUEST_STATUS.COMPLETED)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30 transition"
                >
                  ✓ Complete Job & Return to Available
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INCOMING BREAKDOWN REQUESTS LIST */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>🚨</span> Incoming Roadside Breakdown Requests
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-amber-400 hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {requests.filter((r) => r.status === REQUEST_STATUS.REQUESTED).length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            No unassigned breakdown calls at the moment. You'll receive instant alerts when dispatched.
          </div>
        ) : (
          <div className="space-y-3">
            {requests
              .filter((r) => r.status === REQUEST_STATUS.REQUESTED)
              .map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">
                        {req.diagnosis?.faultLabel || req.fault_category}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400">
                        {SEVERITY_LABELS[req.severity]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Reason: {req.diagnosis?.reason || 'Needs inspection'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      📍 Lat: {req.lat.toFixed(4)}, Lng: {req.lng.toFixed(4)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateJobStatus(req.id, REQUEST_STATUS.ACCEPTED)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20"
                    >
                      ✓ Accept Job
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
