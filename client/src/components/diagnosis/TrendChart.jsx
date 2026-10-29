import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
        No telematics telemetry recorded yet
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <span>📦</span>
            <span>Breakdown Black Box Telemetry (60s Snapshot)</span>
          </div>
          <div className="text-[11px] text-slate-400">Sensor trend right before breakdown</div>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line
              type="monotone"
              dataKey="batteryVoltage"
              name="Voltage (V)"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="coolantTemp"
              name="Coolant (°C)"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="engineRPM"
              name="RPM / 100"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
