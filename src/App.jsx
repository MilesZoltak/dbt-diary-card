import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import JournalPage from './pages/JournalPage';
import ClinicianPage from './pages/ClinicianPage';
import BuilderPage from './pages/BuilderPage';
import { useAuth } from './contexts/GoogleAuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Routes */}
        <Route path="/builder" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/clinician" element={<ProtectedRoute><ClinicianPage /></ProtectedRoute>} />
        
        {/* Compatibility Routes */}
        <Route path="/sheet/:sheetId/journal" element={<Navigate to="/journal" replace />} />
        <Route path="/sheet/:sheetId/clinician" element={<Navigate to="/clinician" replace />} />
        <Route path="/sheet/:sheetId/builder" element={<Navigate to="/builder" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
