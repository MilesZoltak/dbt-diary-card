import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import GoogleSheetsService from '../services/GoogleSheetsService';
import SchemaService from '../services/SchemaService';
import ClinicianView from '../components/ClinicianView';

function ClinicianPage() {
  const { sheetId } = useParams();
  const { accessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);

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
      let configRows = await sheetsService.fetchData('Config');
      let currentSchema = SchemaService.parseConfig(configRows);
      
      setSchema(currentSchema);

      const data = await sheetsService.fetchData('Data');
      setPatientData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  return (
    <div>
      <div className="toggle-group">
        <Link to={`/sheet/${sheetId}/journal`} className="toggle-btn" style={{textDecoration: 'none'}}>
          <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Entry
        </Link>
        <Link to={`/sheet/${sheetId}/clinician`} className="toggle-btn active" style={{textDecoration: 'none'}}>
          <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Dashboard View
        </Link>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{flexShrink:0}}/><span>{error}</span>
        </div>
      )}

      <ClinicianView schema={schema} patientData={patientData} />
    </div>
  );
}

export default ClinicianPage;
