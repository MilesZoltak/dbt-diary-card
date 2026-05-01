import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import JournalPage from './pages/JournalPage';
import ClinicianPage from './pages/ClinicianPage';
import BuilderPage from './pages/BuilderPage';
import { useAuth } from './contexts/GoogleAuthContext';

function ProtectedRoute({ children }) {
  const { accessToken } = useAuth();
  // If not signed in, force redirect to landing page
  if (!accessToken) return <Navigate to="/" replace />;
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
        <Route path="/sheet/:sheetId/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/sheet/:sheetId/clinician" element={<ProtectedRoute><ClinicianPage /></ProtectedRoute>} />
        <Route path="/sheet/:sheetId/builder" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
