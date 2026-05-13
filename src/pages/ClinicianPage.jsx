import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle, Share2, CheckCircle2, User as UserIcon, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import FirestoreService from '../services/FirestoreService';
import ClinicianView from '../components/ClinicianView';

function ClinicianPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const viewMode = queryParams.get('view') || 'dashboard'; // 'dashboard' or 'patients'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dashboard state
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [selectedPatientUid, setSelectedPatientUid] = useState(null);
  
  // Clinician role state
  const [patientsList, setPatientsList] = useState([]);

  // Copied state for the Clinician Code
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Patient-initiated join logic removed for security (inversion of control)

  const loadPatientsList = async () => {
    setLoading(true);
    try {
      const patients = await FirestoreService.getPatientsForClinician(user.uid);
      setPatientsList(patients);
    } catch (err) {
      console.error(err);
      setError("Failed to load patients list: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFirestoreData = async (targetUid) => {
    setLoading(true);
    setError(null);
    try {
      const activeTemplate = await FirestoreService.fetchActiveTemplate(targetUid);
      setSchema(activeTemplate?.sections || []);

      const entries = await FirestoreService.fetchDiaryCards(targetUid);
      setPatientData(entries);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'clinician' && viewMode === 'patients') {
        loadPatientsList();
      } else {
        // Load personal dashboard
        loadFirestoreData(user.uid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, viewMode]);

  useEffect(() => {
    if (profile?.role === 'clinician' && viewMode === 'patients' && selectedPatientUid) {
      loadFirestoreData(selectedPatientUid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientUid, profile, viewMode]);

  const copyCodeToClipboard = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };



  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  if (!user || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Please log in and select a role to access the dashboard.</h2>
      </div>
    );
  }

  // Common Header Toggle
  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div className="toggle-group" style={{ margin: 0 }}>
        <Link to="/journal" className="toggle-btn" style={{textDecoration: 'none'}}>
          <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Entry
        </Link>
        <Link to="/clinician" className={`toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`} style={{textDecoration: 'none'}}>
          <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Dashboard
        </Link>
        {profile.role === 'clinician' && (
          <Link to="/clinician?view=patients" className={`toggle-btn ${viewMode === 'patients' ? 'active' : ''}`} style={{textDecoration: 'none'}}>
            <ClipboardList size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Patients
          </Link>
        )}
      </div>

      {profile.role === 'clinician' && viewMode === 'patients' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span>Your Code: <strong>{user.uid}</strong></span>
          <button 
            onClick={copyCodeToClipboard}
            className="secondary" 
            style={{ width: 'auto', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.8rem' }}
          >
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      )}
    </div>
  );

  // --- CLINICIAN PATIENT LIST VIEW ---
  if (profile.role === 'clinician' && viewMode === 'patients') {
    if (!selectedPatientUid) {
      return (
        <div>
          {renderHeader()}
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <div className="card" style={{ 
              marginBottom: '2.5rem', 
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, #f0f9ff 100%)', 
              border: '1px solid var(--accent-primary-light)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.08)'
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={20} /> Your Clinician Code
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
                  Share this unique code with your patients. When they enter it, you'll securely gain access to their diary data.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'white', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '2px solid var(--accent-primary-light)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                  <code style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>{user.uid}</code>
                </div>
                <button 
                  onClick={copyCodeToClipboard}
                  style={{ 
                    width: 'auto', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '2rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    background: copiedCode ? '#16a34a' : 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {copiedCode ? <><CheckCircle2 size={18} /> Copied!</> : <><ClipboardList size={18} /> Copy Code</>}
                </button>
              </div>
            </div>

            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Users size={24} color="var(--accent-primary)" /> My Patients
            </h2>


            {loading ? (
               <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="spin" size={24} /></div>
            ) : patientsList.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No patients have linked their diary with you yet.</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Provide your Clinician Code (<strong>{user.uid}</strong>) to your patients. They can enter it in their Journal under "Link Therapist".
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patientsList.map(patient => (
                  <div 
                    key={patient.id} 
                    className="card" 
                    style={{ cursor: 'pointer', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
                    onClick={() => setSelectedPatientUid(patient.id)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ background: 'var(--accent-primary-light)', padding: '0.75rem', borderRadius: '50%' }}>
                      <UserIcon size={24} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{patient.displayName || 'Anonymous Patient'}</h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{patient.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Clinician viewing a specific patient
    return (
      <div>
        {renderHeader()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Patient Dashboard</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Viewing data for {patientsList.find(p => p.id === selectedPatientUid)?.displayName || 'Patient'}
            </p>
          </div>
          <button 
            onClick={() => { setSelectedPatientUid(null); setSchema([]); setPatientData([]); }}
            className="secondary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '2rem' }}
          >
            <Users size={18} /> Back to Patients
          </button>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>
        ) : (
          <ClinicianView schema={schema} patientData={patientData} />
        )}
      </div>
    );
  }

  // --- PERSONAL DASHBOARD VIEW (For both Patients and Clinicians) ---
  return (
    <div>
      {renderHeader()}

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{flexShrink:0}}/><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>
      ) : (
        <ClinicianView schema={schema} patientData={patientData} />
      )}

    </div>
  );
}

export default ClinicianPage;
