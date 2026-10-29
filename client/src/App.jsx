import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DriverHome from './pages/driver/DriverHome';
import BreakdownFlow from './pages/driver/BreakdownFlow';
import LiveTracker from './pages/driver/LiveTracker';
import MechanicDashboard from './pages/mechanic/MechanicDashboard';
import AdminPanel from './pages/admin/AdminPanel';
import ShareTracker from './pages/public/ShareTracker';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
          <Routes>
            {/* Public share tracker with no navbar needed */}
            <Route path="/track/:token" element={<ShareTracker />} />

            {/* Standard layout routes */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      {/* Auth routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Driver routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute allowedRoles={['driver', 'admin']}>
                            <DriverHome />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/breakdown"
                        element={
                          <ProtectedRoute allowedRoles={['driver', 'admin']}>
                            <BreakdownFlow />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/tracker/:id"
                        element={
                          <ProtectedRoute allowedRoles={['driver', 'mechanic', 'admin']}>
                            <LiveTracker />
                          </ProtectedRoute>
                        }
                      />

                      {/* Mechanic route */}
                      <Route
                        path="/mechanic"
                        element={
                          <ProtectedRoute allowedRoles={['mechanic', 'admin']}>
                            <MechanicDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin route */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminPanel />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
