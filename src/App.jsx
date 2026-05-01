import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import JournalPage from './pages/JournalPage';
import ClinicianPage from './pages/ClinicianPage';
import BuilderPage from './pages/BuilderPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Auth / Spreadsheet Selector */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Placeholder for creating a new schema without a sheet connected yet */}
        <Route path="/builder" element={<BuilderPage />} />

        {/* Connected Sheet Routes */}
        <Route path="/sheet/:sheetId/journal" element={<JournalPage />} />
        <Route path="/sheet/:sheetId/clinician" element={<ClinicianPage />} />
        <Route path="/sheet/:sheetId/builder" element={<BuilderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
