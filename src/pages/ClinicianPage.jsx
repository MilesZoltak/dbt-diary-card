import React, { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle, Share2, CheckCircle2, User as UserIcon, ClipboardList, BookOpen, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import FirestoreService from '../services/FirestoreService';
import ClinicianView from '../components/ClinicianView';

function ClinicianPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const viewMode = queryParams.get('view') || 'dashboard'; // 'dashboard' or 'patients'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dashboard state
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [selectedPatientUid, setSelectedPatientUid] = useState(null);
  
  // Clinician role state
  const [patientsList, setPatientsList] = useState([]);
  const [clinicianTemplates, setClinicianTemplates] = useState([]);
  const [subTab, setSubTab] = useState('patients'); // 'patients' or 'templates'
  const [assigningPatient, setAssigningPatient] = useState(null);
  const [assigningTemplate, setAssigningTemplate] = useState(null);
  const [emailVerification, setEmailVerification] = useState("");

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

  const loadClinicianTemplates = async () => {
    try {
      const templates = await FirestoreService.fetchTemplates(user.uid);
      setClinicianTemplates(templates);
    } catch (err) {
      console.error(err);
      setError("Failed to load templates: " + err.message);
    }
  };

  const handleAssignTemplate = async () => {
    if (!assigningPatient || !assigningTemplate) return;
    setLoading(true);
    try {
      await FirestoreService.assignTemplateToPatient(user.uid, assigningPatient.id, assigningTemplate);
      setAssigningPatient(null);
      setAssigningTemplate(null);
      setEmailVerification("");
      await loadPatientsList(); // Reload patient roster to get new template metadata
    } catch (err) {
      console.error(err);
      setError("Failed to assign template: " + err.message);
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
        loadClinicianTemplates();
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
    return <Navigate to="/" replace />;
  }

  const renderAssignModal = () => {
    if (!assigningPatient) return null;
    
    // Check if the currently selected template is assigned to another patient
    let multiAssignmentWarning = null;
    if (assigningTemplate) {
      const otherPatientsUsingIt = patientsList.filter(p => p.assignedTemplateId === assigningTemplate.id && p.id !== assigningPatient.id);
      if (otherPatientsUsingIt.length > 0) {
        multiAssignmentWarning = `This template is currently assigned to ${otherPatientsUsingIt.map(p => p.displayName || p.email).join(', ')}. If this template contains personal information tailored for them, please Cancel and Duplicate it instead.`;
      }
    }

    const handleCloseModal = () => {
      setAssigningPatient(null);
      setAssigningTemplate(null);
      setEmailVerification("");
    };

    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}
        onClick={handleCloseModal}
      >
        <div 
          className="card" 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '80vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '2rem', 
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              {assigningTemplate ? "Confirm Assignment" : "Assign Template"}
            </h3>
            <button 
              onClick={handleCloseModal} 
              className="secondary" 
              style={{ width: 'auto', padding: '0.4rem', border: 'none', background: 'transparent' }}
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>
          
          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
            {assigningTemplate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  You are about to assign <strong>{assigningTemplate.name}</strong> to <strong>{assigningPatient.displayName || 'this patient'}</strong>.
                </p>

                {multiAssignmentWarning && (
                  <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ WARNING: {multiAssignmentWarning}
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Type their exact email to confirm: <br/><span style={{ userSelect: 'all', color: 'var(--accent-primary)' }}>{assigningPatient.email}</span>
                  </label>
                  <input
                    type="email"
                    value={emailVerification}
                    onChange={(e) => setEmailVerification(e.target.value)}
                    placeholder="patient@example.com"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '1rem' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Select a custom diary card template to assign to <strong>{assigningPatient.displayName || 'this patient'}</strong>.
                </p>
                {clinicianTemplates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed var(--border-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You haven't created any custom templates yet.</p>
                    <Link 
                      to="/builder" 
                      className="button" 
                      style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1rem', padding: '0.5rem 1.2rem', borderRadius: '2rem', fontSize: '0.85rem' }}
                    >
                      <Plus size={16} style={{ marginRight: '0.4rem' }} /> Create One Now
                    </Link>
                  </div>
                ) : (
                  clinicianTemplates.map(template => (
                    <div 
                      key={template.id} 
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '1rem', 
                        border: '1px solid var(--border-color)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{template.name}</h4>
                        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Version {template.version || 1} • {template.sections?.length || 0} sections
                        </p>
                      </div>
                      <button 
                        onClick={() => setAssigningTemplate(template)}
                        className="button"
                        style={{ 
                          width: 'auto', 
                          padding: '0.4rem 1rem', 
                          borderRadius: '2rem', 
                          fontSize: '0.8rem', 
                          fontWeight: 600 
                        }}
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {assigningTemplate && (
              <button 
                onClick={() => setAssigningTemplate(null)} 
                className="secondary" 
                style={{ width: 'auto', padding: '0.6rem 1.5rem', borderRadius: '2rem' }}
              >
                Back
              </button>
            )}
            {!assigningTemplate && (
              <button 
                onClick={handleCloseModal} 
                className="secondary" 
                style={{ width: 'auto', padding: '0.6rem 1.5rem', borderRadius: '2rem' }}
              >
                Cancel
              </button>
            )}
            {assigningTemplate && (
              <button 
                onClick={handleAssignTemplate} 
                disabled={emailVerification.trim().toLowerCase() !== assigningPatient.email.trim().toLowerCase()}
                className="button" 
                style={{ 
                  width: 'auto', 
                  padding: '0.6rem 1.5rem', 
                  borderRadius: '2rem',
                  opacity: emailVerification.trim().toLowerCase() !== assigningPatient.email.trim().toLowerCase() ? 0.5 : 1,
                  cursor: emailVerification.trim().toLowerCase() !== assigningPatient.email.trim().toLowerCase() ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Assignment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
              background: 'linear-gradient(135deg, var(--bg-color) 0%, #e0f2fe 100%)', 
              border: '1px solid var(--accent-primary-light)', 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '1.5rem',
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.08)'
            }}>
              <div style={{ flex: '1 1 250px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={20} /> Your Clinician Code
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
                  Share this unique code with your patients. When they enter it, you'll securely gain access to their diary data.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: '1 1 auto' }}>
                <div style={{ background: 'white', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '2px solid var(--accent-primary-light)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', maxWidth: '100%' }}>
                  <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.05em', wordBreak: 'break-all' }}>{user.uid}</code>
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

            {/* Sub-tabs menu */}
            <div className="toggle-group" style={{ margin: '0 0 2rem 0', display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
              <button 
                className={`toggle-btn ${subTab === 'patients' ? 'active' : ''}`} 
                onClick={() => setSubTab('patients')}
                style={{ padding: '0.6rem 1.5rem', fontWeight: 600 }}
              >
                <Users size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                Patients ({patientsList.length})
              </button>
              <button 
                className={`toggle-btn ${subTab === 'templates' ? 'active' : ''}`} 
                onClick={() => setSubTab('templates')}
                style={{ padding: '0.6rem 1.5rem', fontWeight: 600 }}
              >
                <ClipboardList size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                Templates ({clinicianTemplates.length})
              </button>
            </div>

            {/* Tab contents */}
            {subTab === 'patients' ? (
              <div>
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
                        style={{ cursor: 'pointer', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
                        onClick={() => setSelectedPatientUid(patient.id)}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ background: 'var(--accent-primary-light)', padding: '0.75rem', borderRadius: '50%' }}>
                            <UserIcon size={24} color="var(--accent-primary)" />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{patient.displayName || 'Anonymous Patient'}</h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{patient.email}</p>
                            
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'var(--accent-purple-light)', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                                Template: {patient.assignedTemplateName || 'Default DBT Template'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening patient dashboard
                            setAssigningPatient(patient);
                          }}
                          className="secondary"
                          style={{ 
                            width: 'auto', 
                            padding: '0.5rem 1.2rem', 
                            borderRadius: '2rem', 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem' 
                          }}
                        >
                          <ClipboardList size={16} />
                          Assign Template
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <ClipboardList size={24} color="var(--accent-primary)" /> Templates Library
                  </h2>
                  <Link 
                    to="/builder" 
                    className="button" 
                    style={{ 
                      textDecoration: 'none', 
                      padding: '0.6rem 1.2rem', 
                      borderRadius: '2rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <Plus size={18} /> Create Template
                  </Link>
                </div>
                
                {clinicianTemplates.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't created any custom templates yet.</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Click "Create Template" above to launch the Visual Builder and customize schemas.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {clinicianTemplates.map(template => (
                      <div key={template.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', border: '1px solid var(--border-color)' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{template.name || 'Untitled Template'}</h4>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Version {template.version || 1} • Last updated {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'Unknown'}
                          </p>
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                              {template.sections?.length || 0} Sections
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                              {template.sections?.reduce((sum, s) => sum + (s.fields?.length || 0), 0) || 0} Fields
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link 
                            to={`/builder?id=${template.id}`} 
                            className="secondary" 
                            style={{ 
                              flex: 1, 
                              textDecoration: 'none', 
                              padding: '0.5rem', 
                              borderRadius: '2rem', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '0.4rem' 
                            }}
                          >
                            <Edit2 size={16} /> Edit
                          </Link>
                          <Link 
                            to={`/builder?clone=${template.id}`} 
                            className="secondary" 
                            style={{ 
                              flex: 1, 
                              textDecoration: 'none', 
                              padding: '0.5rem', 
                              borderRadius: '2rem', 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '0.4rem',
                              background: 'var(--bg-secondary)',
                              borderColor: 'var(--border-color)'
                            }}
                          >
                            <ClipboardList size={16} /> Duplicate
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {renderAssignModal()}
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
