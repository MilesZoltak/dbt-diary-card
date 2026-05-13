import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle, ClipboardList } from 'lucide-react';
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

  useEffect(() => {
    if (user && profile) {
      loadFirestoreData();
      
      // Handle Invite Link
      const searchParams = new URLSearchParams(window.location.search);
      const inviteUid = searchParams.get('invite');
      if (inviteUid && profile.role === 'patient') {
        FirestoreService.addToRoster(inviteUid, user.uid, {
          displayName: profile.displayName || user.displayName || 'Patient',
          email: profile.email || user.email
        }).then(() => {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }).catch(console.error);
      }
    }
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
  }, [entryDate, patientData, schema]);

  const loadFirestoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      let activeTemplate = await FirestoreService.fetchActiveTemplate(user.uid);
      
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

      const entries = await FirestoreService.fetchDiaryCards(user.uid);
      setPatientData(entries);
    } catch (err) {
      console.error(err);
      setError("Failed to load diary data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (currentSchema = schema) => {
    if (currentSchema && currentSchema.sections) {
      setForm(SchemaService.generateDefaultResponses(currentSchema));
    } else {
      setForm({});
    }
  };

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
      <div className="toggle-group" style={{ marginBottom: '1.5rem' }}>
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
    </div>
  );
}

export default JournalPage;
