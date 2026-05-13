import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogIn, Loader2, Plus, ArrowRight, User, Users } from 'lucide-react';
import FirestoreService from '../services/FirestoreService';

function LandingPage() {
  const { user, profile, loading: authLoading, login, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [creatingProfile, setCreatingProfile] = useState(false);

  const handleSelectRole = async (role) => {
    setCreatingProfile(true);
    try {
      const newProfile = {
        role,
        email: user.email,
        displayName: user.displayName,
        sharedWith: []
      };
      await FirestoreService.createUserProfile(user.uid, newProfile);
      await refreshProfile(user.uid);
    } catch (err) {
      console.error("Failed to create profile:", err);
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleGoToDiary = () => navigate('/journal');
  const handleGoToDashboard = () => navigate('/clinician');
  if (authLoading || creatingProfile) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  // If user is logged in and has a profile, drop them straight into their view
  if (user && profile) {
    if (profile.role === 'clinician') {
      return <Navigate to="/clinician" replace />;
    } else {
      return <Navigate to="/journal" replace />;
    }
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px', padding: '3rem' }}>
          <div style={{ background: '#ecfdf5', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Heart size={32} color="var(--accent-primary)" />
          </div>
          <h1>DBT Diary Card</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Track your emotions, urges, and skills safely and privately.
          </p>
          <button onClick={() => login()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <LogIn size={20} /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in but has no profile, ask for their role
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Welcome to DBT Diary Card!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Before we begin, please tell us how you will be using the app.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => handleSelectRole('patient')} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem' }}
          >
            <User size={20} /> I am a Patient
          </button>

          <button 
            onClick={() => handleSelectRole('clinician')} 
            className="secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem' }}
          >
            <Users size={20} /> I am a Clinician
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
