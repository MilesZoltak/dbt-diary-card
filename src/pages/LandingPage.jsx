import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogIn, Database, Loader2, Plus, Search, FileText, X } from 'lucide-react';
import GoogleSheetsService from '../services/GoogleSheetsService';
import DriveService from '../services/DriveService';

const extractSheetId = (input) => {
  if (!input) return null;
  const match = input.match(/\/d\/(.*?)(\/|$)/);
  return match ? match[1] : input.trim();
};

function LandingPage() {
  const { accessToken, login } = useAuth();
  const navigate = useNavigate();

  const [sheetIdInput, setSheetIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial spreadsheets when logged in
  useEffect(() => {
    if (accessToken) {
      handleSearch('');
    }
  }, [accessToken]);

  const handleSearch = async (query) => {
    if (!accessToken) return;
    setSearching(true);
    try {
      const driveService = new DriveService(accessToken);
      const files = await driveService.searchSpreadsheets(query);
      setSearchResults(files);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setSheetIdInput(val);
    setShowDropdown(true);
    // Debounce search? For now just trigger on change if not a URL
    if (val.length > 2 && !val.includes('docs.google.com')) {
      handleSearch(val);
    } else if (val.length === 0) {
      handleSearch('');
    }
  };

  const handleConnect = async (targetId) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setShowDropdown(false);

    try {
      const sheetsService = new GoogleSheetsService(targetId, accessToken);
      await sheetsService.ensureTabExists('Config');
      await sheetsService.ensureTabExists('Data');

      // Add to local recents (keep this logic for legacy/quick access)
      const saved = JSON.parse(localStorage.getItem('dbtRecentSheets') || '[]');
      const updatedRecents = [targetId, ...saved.filter(id => id !== targetId)].slice(0, 5);
      localStorage.setItem('dbtRecentSheets', JSON.stringify(updatedRecents));

      navigate(`/sheet/${targetId}/journal`);
    } catch (err) {
      console.error(err);
      setError("Cannot access sheet. Check permissions or ensure the ID is correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildNew = () => {
    navigate('/builder');
  };

  if (!accessToken) {
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

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Database size={24} color="var(--accent-primary)" /> Connect Diary Spreadsheet
      </h2>
      
      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <X size={18} style={{cursor: 'pointer'}} onClick={() => setError(null)} />
        </div>
      )}

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name or paste link..." 
              value={sheetIdInput} 
              onChange={onInputChange}
              onFocus={() => setShowDropdown(true)}
              style={{ paddingLeft: '40px' }}
              disabled={loading} 
            />
            {searching && <Loader2 className="spin" size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />}
          </div>
          <button 
            onClick={() => handleConnect(extractSheetId(sheetIdInput))} 
            disabled={loading || !sheetIdInput} 
            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          >
            {loading ? <Loader2 className="spin" size={20} /> : 'Connect'}
          </button>
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="card" style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 100, 
            padding: '0.5rem', 
            marginTop: '0.25rem',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            {searchResults.map(file => (
              <div 
                key={file.id} 
                className="form-row" 
                style={{ cursor: 'pointer', padding: '0.75rem', borderRadius: '0.5rem', borderBottom: 'none' }}
                onClick={() => {
                  setSheetIdInput(file.name);
                  handleConnect(file.id);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={18} color="var(--accent-primary)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{file.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {file.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>OR</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
      </div>

      <button 
        onClick={handleBuildNew} 
        className="secondary" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Plus size={20} /> Build New Diary Sheet
      </button>
    </div>
  );
}

export default LandingPage;
