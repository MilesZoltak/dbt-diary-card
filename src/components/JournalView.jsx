import React from 'react';
import { Settings, ClipboardList, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function JournalView({ 
  schema, 
  patientData, 
  form, 
  setForm, 
  entryDate, 
  setEntryDate, 
  onSubmit, 
  submitting, 
  sheetId,
  readOnly = false
}) {

  const handleMultiSelectChange = (fieldId, option, checked) => {
    if (readOnly) return;
    setForm(prev => {
      const current = prev[fieldId] || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] };
      } else {
        return { ...prev, [fieldId]: current.filter(o => o !== option) };
      }
    });
  };

  const renderField = (field) => {
    const value = form[field.id];

    switch (field.type) {
      case 'scale':
        const min = field.config?.min ?? 0;
        const max = field.config?.max ?? 5;
        const start = field.config?.start ?? min;
        const isDetailed = !!field.config?.detailed;
        const listId = `ticks-${field.id}`;
        
        return (
          <div className="form-row" key={field.id} style={{ alignItems: isDetailed ? 'flex-start' : 'center' }}>
            <label style={{ paddingTop: isDetailed ? '0.25rem' : 0 }}>{field.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
              {isDetailed && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{min}</span>}
              <div style={{ display: 'flex', flexDirection: 'column', width: '150px' }}>
                <input 
                  type="range" 
                  min={min} 
                  max={max} 
                  list={isDetailed ? listId : undefined}
                  value={value !== undefined ? value : start} 
                  onChange={e => !readOnly && setForm({...form, [field.id]: parseInt(e.target.value)})} 
                  disabled={readOnly}
                  style={{ width: '100%', margin: 0 }} 
                />
                {isDetailed && (
                  <datalist id={listId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: '4px' }}>
                    {Array.from({length: max - min + 1}, (_, i) => min + i).map(n => <option key={n} value={n} label={n}></option>)}
                  </datalist>
                )}
              </div>
              {isDetailed && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{max}</span>}
              <span style={{ width: '20px', textAlign: 'right', fontWeight: 600 }}>{value !== undefined ? value : start}</span>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input 
              type="checkbox" 
              id={field.id} 
              checked={!!value} 
              onChange={e => !readOnly && setForm({...form, [field.id]: e.target.checked})} 
              disabled={readOnly}
              style={{ width: 'auto' }} 
            />
            <label htmlFor={field.id} style={{ display: 'inline', fontWeight: 400 }}>{field.label}</label>
          </div>
        );

      case 'single_select':
        return (
          <div className="form-group" key={field.id}>
            <label>{field.label}</label>
            <select value={value || ''} onChange={e => !readOnly && setForm({...form, [field.id]: e.target.value})} disabled={readOnly}>
              <option value="" disabled>Select an option...</option>
              {(field.config?.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'multi_select':
        return (
          <div className="form-group" key={field.id}>
            <label>{field.label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {(field.config?.options || []).map(opt => {
                const isChecked = Array.isArray(value) && value.includes(opt);
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                    <input 
                      type="checkbox" 
                      style={{ width: 'auto' }} 
                      checked={isChecked}
                      onChange={e => handleMultiSelectChange(field.id, opt, e.target.checked)}
                      disabled={readOnly}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'text_short':
      case 'number':
        return (
          <div className="form-group" key={field.id}>
            <label>{field.label}</label>
            <input 
              type={field.type === 'number' ? 'number' : 'text'} 
              value={value || ''} 
              onChange={e => !readOnly && setForm({...form, [field.id]: e.target.value})} 
              disabled={readOnly}
            />
          </div>
        );

      case 'text_long':
        return (
          <div className="form-group" key={field.id}>
            <label>{field.label}</label>
            <textarea 
              rows="3" 
              value={value || ''} 
              onChange={e => !readOnly && setForm({...form, [field.id]: e.target.value})} 
              disabled={readOnly}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Daily Log</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="date" 
              value={entryDate} 
              onChange={(e) => !readOnly && setEntryDate(e.target.value)} 
              disabled={readOnly}
              style={{ width: 'auto', padding: '0.5rem', fontSize: '0.875rem' }} 
            />
            {sheetId && !readOnly && (
              <Link to={`/sheet/${sheetId}/builder`} className="secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <Settings size={16} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> Edit Schema
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!readOnly && onSubmit) onSubmit(); }}>
          {schema.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>{section.title}</h3>
                {section.description && (
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem', marginBottom: 0 }}>{section.description}</p>
                )}
              </div>
              {section.fields.map(field => renderField(field))}
            </div>
          ))}
          <button type="submit" disabled={submitting || readOnly} style={{ opacity: readOnly ? 0.5 : 1 }}>
            {submitting ? <Loader2 className="spin" size={20} /> : 'Submit Entry'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={20} /> Recent History</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                {schema.slice(0, 1).map(s => s.fields.slice(0, 2).map(f => <th key={f.id}>{f.label}</th>))}
              </tr>
            </thead>
            <tbody>
              {patientData.length === 0 ? (
                <tr><td colSpan="3" className="empty-state">No entries.</td></tr>
              ) : (
                [...patientData].reverse().slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row['Date']}</td>
                    {schema.slice(0, 1).map(s => s.fields.slice(0, 2).map(f => <td key={f.id}>{row[f.label]}</td>))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
          {sheetId && !readOnly ? (
            <Link to={`/sheet/${sheetId}/clinician`} style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>View Full Dashboard &rarr;</Link>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View Full Dashboard &rarr;</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default JournalView;
