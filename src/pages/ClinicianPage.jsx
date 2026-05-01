import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Users, Loader2, AlertCircle, Share2, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import GoogleSheetsService from '../services/GoogleSheetsService';
import DriveService from '../services/DriveService';
import SchemaService from '../services/SchemaService';
import ClinicianView from '../components/ClinicianView';

function ClinicianPage() {
  const { sheetId } = useParams();
  const { accessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schema, setSchema] = useState([]);
  const [patientData, setPatientData] = useState([]);

  // Sharing State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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

  const handleShare = async () => {
    if (!shareEmail || !accessToken || !sheetId) return;
    setSharing(true);
    setError(null);
    setShareSuccess(false);

    try {
      const driveService = new DriveService(accessToken);
      await driveService.shareFile(sheetId, shareEmail, 'reader');
      setShareSuccess(true);
      setShareEmail('');
      setTimeout(() => {
        setShowShareModal(false);
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to share sheet: " + err.message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="toggle-group" style={{ margin: 0 }}>
          <Link to={`/sheet/${sheetId}/journal`} className="toggle-btn" style={{textDecoration: 'none'}}>
            <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Entry
          </Link>
          <Link to={`/sheet/${sheetId}/clinician`} className="toggle-btn active" style={{textDecoration: 'none'}}>
            <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Dashboard View
          </Link>
        </div>

        <button 
          onClick={() => setShowShareModal(true)}
          className="secondary" 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}
        >
          <Share2 size={18} /> Share with Clinician
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{flexShrink:0}}/><span>{error}</span>
        </div>
      )}

      <ClinicianView schema={schema} patientData={patientData} />

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={24} color="var(--accent-primary)" /> Share Dashboard
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Invite your clinician or a family member to view your diary data by entering their Google email address.
            </p>

            {shareSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ margin: 0, color: 'var(--success)' }}>Shared Successfully!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>They will now have read access to your diary spreadsheet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} /> Clinician's Google Email
                  </label>
                  <input 
                    type="email" 
                    value={shareEmail} 
                    onChange={e => setShareEmail(e.target.value)} 
                    placeholder="example@gmail.com" 
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setShowShareModal(false)} className="secondary" style={{ flex: 1 }}>Cancel</button>
                  <button 
                    onClick={handleShare} 
                    disabled={sharing || !shareEmail} 
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {sharing ? <Loader2 className="spin" size={18} /> : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicianPage;
