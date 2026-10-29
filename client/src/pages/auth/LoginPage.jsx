import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'mechanic') {
        navigate('/mechanic');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 items-center justify-center text-2xl shadow-lg shadow-amber-500/20 mb-3">
            🔑
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to your RoadRescue account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@example.com"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            ⚡ Quick Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('arun@example.com')}
              className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 transition text-left"
            >
              🚗 <span className="font-medium text-white">Driver</span> (Arun)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('priya@roadrescue.com')}
              className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 transition text-left"
            >
              🔧 <span className="font-medium text-white">Mechanic</span> (Priya)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ravi@roadrescue.com')}
              className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 transition text-left"
            >
              🔧 <span className="font-medium text-white">Mechanic</span> (Ravi)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@roadrescue.com')}
              className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 transition text-left"
            >
              👑 <span className="font-medium text-white">Admin</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
