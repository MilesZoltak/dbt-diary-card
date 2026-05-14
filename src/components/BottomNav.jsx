import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Users, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';

export default function BottomNav() {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user || !profile) return null;

  const isActive = (path, searchParams = null) => {
    if (location.pathname !== path) return false;
    if (searchParams) {
      const currentParams = new URLSearchParams(location.search);
      for (const [key, value] of Object.entries(searchParams)) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    }
    // If we only passed a path, make sure we aren't matching a more specific query
    return location.search === '';
  };

  return (
    <nav className="bottom-nav">
      <Link to="/skills" className={`nav-item ${isActive('/skills') ? 'active' : ''}`}>
        <BookOpen size={24} />
        <span>Skills</span>
      </Link>

      <Link to="/journal" className={`nav-item ${isActive('/journal') ? 'active' : ''}`}>
        <Activity size={24} />
        <span>Entry</span>
      </Link>
      
      <Link to="/clinician" className={`nav-item ${isActive('/clinician') ? 'active' : ''}`}>
        <Users size={24} />
        <span>Dashboard</span>
      </Link>

      {profile.role === 'clinician' && (
        <Link to="/clinician?view=patients" className={`nav-item ${isActive('/clinician', { view: 'patients' }) ? 'active' : ''}`}>
          <ClipboardList size={24} />
          <span>Patients</span>
        </Link>
      )}
    </nav>
  );
}
