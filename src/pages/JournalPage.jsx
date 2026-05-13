import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle, ClipboardList, Share2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import FirestoreService from '../services/FirestoreService';
import SchemaService from '../services/SchemaService';
import JournalView from '../components/JournalView';
import { normalizeDate, getLocalDateString } from '../utils/dateUtils';
import { dbtSchema as defaultDbtSchema } from '../config/dbtSchema';

function JournalPage() {
  const { user, profile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [form, setForm] = useState({});
  const [entryDate, setEntryDate] = useState(getLocalDateString());
  
  // Sharing state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [clinicianCode, setClinicianCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [sharedWithList, setSharedWithList] = useState([]);

  const resetForm = (currentSchema = schema) => {
    if (currentSchema && currentSchema.sections) {
      setForm(SchemaService.generateDefaultResponses(currentSchema));
    } else {
      setForm({});
    }
  };

  const loadFirestoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      let activeTemplate;
      try {
        activeTemplate = await FirestoreService.fetchActiveTemplate(user.uid);
      } catch (e) {
        console.error("Error fetching active template:", e);
        throw new Error("Active Template: " + e.message);
      }
      
      if (!activeTemplate) {
        // Fallback to default schema if no template found in Firestore
        activeTemplate = { 
          id: 'default', 
          name: 'Standard DBT Template', 
          version: 1, 
          sections: defaultDbtSchema 
        };
      }

      setSchema(activeTemplate);
      resetForm(activeTemplate);

      try {
        const entries = await FirestoreService.fetchDiaryCards(user.uid);
        setPatientData(entries);
      } catch (e) {
        console.error("Error fetching diary cards:", e);
        throw new Error("Diary Cards: " + e.message);
      }

      // Load sharing info
      if (profile?.role === 'patient') {
        try {
          const sharedWith = await FirestoreService.getSharedWith(user.uid);
          setSharedWithList(sharedWith);
        } catch (e) {
          console.error("Error fetching sharedWith list:", e);
          throw new Error("Sharing Info: " + e.message);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load diary data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      loadFirestoreData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  // Load existing data into form when date changes
  useEffect(() => {
    if (patientData.length > 0 && schema?.sections?.length > 0) {
      const entry = [...patientData].reverse().find(d => normalizeDate(d.logicalDate || d.Date) === entryDate);
      
      if (entry) {
        // We use the entry's responses, mapping to the active schema's defaults for missing fields
        const loadedForm = SchemaService.generateDefaultResponses(schema);
        if (entry.responses) {
          Object.keys(entry.responses).forEach(key => {
            loadedForm[key] = entry.responses[key];
          });
        }
        setForm(loadedForm);
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDate, patientData, schema]);

  const handleSaveDraft = async () => {
    try {
      const payload = {
        templateId: schema.id || 'unknown',
        templateVersion: schema.version || 1,
        schemaSnapshot: schema,
        responses: form,
        status: 'draft'
      };
      await FirestoreService.saveDiaryCard(user.uid, entryDate, payload);
    } catch (err) {
      console.error("Draft auto-save failed:", err);
    }
  };

  const handlePatientSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        templateId: schema.id || 'unknown',
        templateVersion: schema.version || 1,
        schemaSnapshot: schema,
        responses: form,
        status: 'submitted'
      };
      
      await FirestoreService.saveDiaryCard(user.uid, entryDate, payload);
      
      const newEntries = await FirestoreService.fetchDiaryCards(user.uid);
      setPatientData(newEntries);
    } catch (err) {
      setError("Failed to save entry: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const processHandshake = async (code) => {
    if (!user || !code) return;
    setLinking(true);
    setError(null);
    try {
      // 1. Fetch Clinician Profile
      const clinicianProfile = await FirestoreService.getUserProfile(code);
      if (!clinicianProfile || clinicianProfile.role !== 'clinician') {
        throw new Error("Invalid Clinician Code. Please check the code and try again.");
      }

      // 2. Execute Dual-Write Handshake
      await FirestoreService.addToRoster(
        code, 
        user.uid, 
        {
          displayName: profile?.displayName || user.displayName || 'Patient',
          email: profile?.email || user.email
        },
        {
          displayName: clinicianProfile.displayName || 'Clinician',
          email: clinicianProfile.email
        }
      );

      setLinkSuccess(true);
      
      // Refresh shared list
      const updatedSharedWith = await FirestoreService.getSharedWith(user.uid);
      setSharedWithList(updatedSharedWith);

      setTimeout(() => {
        setShowLinkModal(false);
        setLinkSuccess(false);
        setClinicianCode('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleRevokeAccess = async (clinicianUid) => {
    if (!window.confirm("Are you sure you want to stop sharing your data with this therapist? They will no longer be able to see your diary entries.")) return;
    
    setLinking(true);
    try {
      await FirestoreService.revokeAccess(user.uid, clinicianUid);
      const updatedSharedWith = await FirestoreService.getSharedWith(user.uid);
      setSharedWithList(updatedSharedWith);
    } catch (err) {
      console.error(err);
      setError("Failed to revoke access: " + err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleLinkClinician = () => {
    setShowLinkModal(true);
  };

  if (authLoading || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  if (!user || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Please log in and select a role to access your diary.</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="toggle-group" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/journal" className="toggle-btn active" style={{textDecoration: 'none'}}>
            <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Entry
          </Link>
          <Link to="/clinician" className="toggle-btn" style={{textDecoration: 'none'}}>
            <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Dashboard
          </Link>
          {profile.role === 'clinician' && (
            <Link to="/clinician?view=patients" className="toggle-btn" style={{textDecoration: 'none'}}>
              <ClipboardList size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Patients
            </Link>
          )}
        </div>
        
        {profile.role === 'patient' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {sharedWithList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={14} color="#16a34a" /> Linked: <strong>{sharedWithList[0].displayName}</strong>
                </span>
                <button 
                  onClick={() => handleRevokeAccess(sharedWithList[0].id)}
                  style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginLeft: '0.25rem' }}
                >
                  Unlink
                </button>
              </div>
            )}
            <button 
              onClick={handleLinkClinician}
              className="secondary" 
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}
            >
              <Share2 size={18} /> Link Therapist
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{flexShrink:0}}/><span>{error}</span>
        </div>
      )}

      <JournalView 
        schema={schema?.sections || []}
        patientData={patientData}
        form={form}
        setForm={setForm}
        entryDate={entryDate}
        setEntryDate={setEntryDate}
        onSubmit={handlePatientSubmit}
        onSaveDraft={handleSaveDraft}
        submitting={submitting}
      />

      {/* LINK MODAL */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => !linking && setShowLinkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={24} color="var(--accent-primary)" /> Link with Therapist
            </h2>
            
            {linkSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle2 size={48} />
                  <p style={{ fontWeight: 600, margin: 0 }}>Successfully Linked!</p>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Enter the unique Clinician Code provided by your therapist to securely share your diary data with them.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>Clinician Code</label>
                    <input 
                      type="text" 
                      placeholder="Paste code here..."
                      value={clinicianCode}
                      onChange={(e) => setClinicianCode(e.target.value)}
                      disabled={linking}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  
                  {error && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => setShowLinkModal(false)} 
                      className="secondary" 
                      style={{ flex: 1 }}
                      disabled={linking}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => processHandshake(clinicianCode)} 
                      style={{ flex: 2 }}
                      disabled={linking || !clinicianCode.trim()}
                    >
                      {linking ? <Loader2 className="spin" size={18} /> : 'Link Now'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JournalPage;
