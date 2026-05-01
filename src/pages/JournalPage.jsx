import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import GoogleSheetsService from '../services/GoogleSheetsService';
import SchemaService from '../services/SchemaService';
import { dbtSchema as defaultDbtSchema } from '../config/dbtSchema';
import JournalView from '../components/JournalView';

function JournalPage() {
  const { sheetId } = useParams();
  const { accessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [form, setForm] = useState({});
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (accessToken && sheetId) {
      loadSheetData();
    }
  }, [accessToken, sheetId]);

  const loadSheetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sheetsService = new GoogleSheetsService(sheetId, accessToken);
      
      await sheetsService.ensureTabExists('Config');
      await sheetsService.ensureTabExists('Data');

      let configRows = await sheetsService.fetchData('Config');
      let currentSchema = configRows.length === 0 ? defaultDbtSchema : SchemaService.parseConfig(configRows);
      
      if (configRows.length === 0) {
        const flatConfig = SchemaService.flattenSchema(defaultDbtSchema);
        await sheetsService.updateSheet('Config', flatConfig);
        const dataHeaders = SchemaService.getExpectedDataHeaders(defaultDbtSchema);
        await sheetsService.updateSheet('Data', [dataHeaders]);
      }

      setSchema(currentSchema);
      resetForm(currentSchema);

      const data = await sheetsService.fetchData('Data');
      setPatientData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load diary sheet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (currentSchema = schema) => {
    const defaults = {};
    currentSchema.forEach(section => {
      section.fields.forEach(f => {
        if (f.type === 'scale') defaults[f.id] = f.config?.start !== undefined ? f.config.start : (f.config?.min || 0);
        else if (f.type === 'boolean') defaults[f.id] = false;
        else if (f.type === 'multi_select') defaults[f.id] = [];
        else defaults[f.id] = '';
      });
    });
    setForm(defaults);
  };

  const handlePatientSubmit = async () => {
    setSubmitting(true);
    try {
      const sheetsService = new GoogleSheetsService(sheetId, accessToken);
      const dateString = new Date(entryDate + 'T12:00:00').toLocaleDateString();
      const rowData = { 'Date': dateString };
      
      schema.forEach(section => {
        section.fields.forEach(f => {
          let value = form[f.id];
          if (f.type === 'boolean') value = value ? 'Yes' : 'No';
          if (f.type === 'multi_select') value = Array.isArray(value) ? value.join(', ') : '';
          rowData[f.label] = value;
        });
      });
      
      await sheetsService.addRow(rowData, 'Data');
      resetForm();
      
      const newData = await sheetsService.fetchData('Data');
      setPatientData(newData);
    } catch (err) {
      setError("Failed to save entry: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  return (
    <div>
      <div className="toggle-group">
        <Link to={`/sheet/${sheetId}/journal`} className="toggle-btn active" style={{textDecoration: 'none'}}>
          <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Entry
        </Link>
        <Link to={`/sheet/${sheetId}/clinician`} className="toggle-btn" style={{textDecoration: 'none'}}>
          <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Dashboard View
        </Link>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{flexShrink:0}}/><span>{error}</span>
        </div>
      )}

      <JournalView 
        schema={schema}
        patientData={patientData}
        form={form}
        setForm={setForm}
        entryDate={entryDate}
        setEntryDate={setEntryDate}
        onSubmit={handlePatientSubmit}
        submitting={submitting}
        sheetId={sheetId}
      />
    </div>
  );
}

export default JournalPage;
