import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';
import LeafletMap from '../../components/map/LeafletMap';
import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  STATUS_FLOW,
  SEVERITY_LABELS,
} from '../../../../shared/constants';

export default function LiveTracker() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [mechanicPos, setMechanicPos] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetchRequest();

    const socket = getSocket();
    socket.emit('join:request', id);

    socket.on('request:status', (update) => {
      fetchRequest();
    });

    socket.on('mechanic:location', (loc) => {
      setMechanicPos({ lat: loc.lat, lng: loc.lng });
    });

    return () => {
      socket.emit('leave:request', id);
      socket.off('request:status');
      socket.off('mechanic:location');
    };
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setData(res.data);
      if (res.data.mechanic?.lat && res.data.mechanic?.lng) {
        setMechanicPos({ lat: res.data.mechanic.lat, lng: res.data.mechanic.lng });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateShareLink = async () => {
    try {
      const res = await api.post(`/share/${id}`);
      setShareLink(res.data.shareUrl);
    } catch (err) {
      alert('Failed to generate tracking link');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRating = async () => {
    try {
      await api.post(`/requests/${id}/rate`, { score: ratingScore, feedback });
      setRated(true);
      fetchRequest();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    }
  };

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  const { request, mechanic, events } = data;
  const currentStepIdx = STATUS_FLOW.indexOf(request.status);

  // WhatsApp emergency sharing message
  const whatsappText = encodeURIComponent(
    `🚨 EMERGENCY: My car broke down. Follow my live rescue status and location here: ${shareLink || window.location.href}`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400">
              Request #{request.id}
            </span>
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {SEVERITY_LABELS[request.severity]}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-2">
            {request.diagnosis?.faultLabel || 'Roadside Assistance'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Created at {new Date(request.created_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Shareable Link / Emergency Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!shareLink ? (
            <button
              onClick={generateShareLink}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex items-center justify-center gap-1.5 transition"
            >
              <span>🔗</span> Generate Safety Share Link
            </button>
          ) : (
            <button
              onClick={copyToClipboard}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 transition"
            >
              <span>{copied ? '✓ Copied!' : '📋 Copy Safety Link'}</span>
            </button>
          )}

          {/* Night / Unsafe-Area WhatsApp SOS Button */}
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
          >
            <span>🛡️</span> SOS WhatsApp Share
          </a>
        </div>
      </div>

      {/* Status Progress Timeline */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Rescue Progress Timeline
        </div>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-700 z-0" />
          {STATUS_FLOW.map((s, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                  isCurrent ? 'text-amber-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {REQUEST_STATUS_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map with Live Tracking */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>🗺️</span> Live Location & Mechanic Tracker
          </div>
          {mechanic && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Tracking Connected
            </span>
          )}
        </div>

        <LeafletMap
          center={[request.lat, request.lng]}
          driverLocation={{ lat: request.lat, lng: request.lng }}
          mechanicLocation={mechanicPos}
          className="h-80 w-full rounded-xl overflow-hidden border border-slate-700"
        />
      </div>

      {/* Assigned Mechanic Profile */}
      {mechanic ? (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400 font-bold">
              🔧
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400">Assigned Mechanic</div>
              <h3 className="text-lg font-bold text-white">{mechanic.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                <span>⭐ {mechanic.rating || '4.8'}</span>
                <span>•</span>
                <span>📞 {mechanic.phone || 'Available via App'}</span>
              </div>
            </div>
          </div>

          <a
            href={`tel:${mechanic.phone}`}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-2 transition"
          >
            <span>📞</span> Call Mechanic
          </a>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-dashed border-slate-700 text-center">
          <div className="animate-spin inline-block text-2xl mb-2">⏳</div>
          <div className="text-sm font-bold text-white">Auto-Cascading Dispatch in Progress</div>
          <div className="text-xs text-slate-400 mt-1">
            Notifying top-ranked mechanics within your breakdown radius...
          </div>
        </div>
      )}

      {/* Rate Experience Modal/Card upon completion */}
      {request.status === REQUEST_STATUS.COMPLETED && !data.rating && !rated && (
        <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⭐</span> Rate Your RoadRescue Experience
          </h3>
          <p className="text-xs text-slate-400">
            Your feedback helps keep drivers safe and ranks our best roadside mechanics.
          </p>

          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingScore(star)}
                className={`text-2xl transition-transform hover:scale-125 ${
                  ratingScore >= star ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            rows="2"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share feedback on speed, tools, and professionalism..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
          />

          <button
            onClick={submitRating}
            className="py-2.5 px-6 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
}
