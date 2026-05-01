import React from 'react';
import { Settings, ClipboardList, Loader2, Check } from 'lucide-react';
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

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const last7Days = getLast7Days();

  const renderField = (field) => {
    const value = form[field.id];

    switch (field.type) {
      case 'scale':
        const min = field.config?.min ?? 0;
        const max = field.config?.max ?? 5;
        const start = field.config?.start ?? min;
        const listId = `ticks-${field.id}`;
        
        return (
          <div className="form-row" key={field.id} style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <label style={{ minWidth: '150px', flex: '1 1 20%' }}>{field.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 60%' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '1.5rem', textAlign: 'right' }}>
                {min}
              </span>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                {/* Custom Track */}
                <div style={{ position: 'absolute', width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', zIndex: 0 }} />
                
                {/* Ticks */}
                <div style={{ position: 'absolute', width: '100%', zIndex: 0, pointerEvents: 'none' }}>
                    {Array.from({length: max - min + 1}, (_, i) => min + i).map(n => {
                      const percent = ((n - min) / (max - min)) * 100;
                      return (
                        <div key={n} style={{ 
                          position: 'absolute', 
                          left: `calc(${percent}% + ${(1 - percent/50) * 10}px)`, 
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '2px',
                          height: '10px',
                          backgroundColor: '#94a3b8',
                          borderRadius: '1px'
                        }} />
                      );
                    })}
                </div>

                <input 
                  type="range" 
                  min={min} 
                  max={max} 
                  list={listId}
                  value={value !== undefined ? value : start} 
                  onChange={e => !readOnly && setForm({...form, [field.id]: parseInt(e.target.value)})} 
                  disabled={readOnly}
                  style={{ width: '100%', margin: 0, cursor: readOnly ? 'default' : 'pointer', position: 'relative', zIndex: 1, background: 'transparent' }} 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '1.5rem', textAlign: 'left' }}>
                {max}
              </span>
              <span style={{ width: '2rem', textAlign: 'right', fontWeight: 600, fontSize: '1.1rem' }}>
                {value !== undefined ? value : start}
              </span>
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Top History Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Last 7 Days</span>
          {sheetId && !readOnly && (
            <Link to={`/sheet/${sheetId}/clinician`} style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}>
              View Full Dashboard &rarr;
            </Link>
          )}
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {last7Days.map((d, i) => {
            const dStr = d.toLocaleDateString();
            const isDone = patientData.some(row => row['Date'] === dStr);
            const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = d.getDate();
            const isSelectedDate = !readOnly && entryDate === d.toISOString().split('T')[0];
            
            return (
              <div 
                key={i} 
                onClick={() => {
                  if (!readOnly && !submitting) {
                    setEntryDate(d.toISOString().split('T')[0]);
                  }
                }}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  padding: '0.75rem 1rem', 
                  background: isSelectedDate ? 'var(--accent-purple)' : (isDone ? 'var(--accent-purple-light)' : 'white'),
                  color: isSelectedDate ? 'white' : 'inherit',
                  border: `1px solid ${isSelectedDate || isDone ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  borderRadius: '1rem',
                  minWidth: '64px',
                  cursor: readOnly || submitting ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelectedDate ? '0 4px 6px -1px rgba(124, 58, 237, 0.2)' : 'none',
                  flex: '1 0 auto'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: isSelectedDate ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {dayName}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isSelectedDate ? 'white' : (isDone ? 'var(--accent-purple)' : 'var(--text-primary)'), marginTop: '0.125rem' }}>
                  {dayNum}
                </span>
                {isDone ? (
                  <Check size={16} color={isSelectedDate ? 'white' : 'var(--accent-purple)'} style={{marginTop: '0.25rem'}}/>
                ) : (
                  <div style={{height: '16px', marginTop: '0.25rem'}}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
              <Link to={`/sheet/${sheetId}/builder`} className="secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center' }}>
                <Settings size={16} style={{ marginRight: '0.25rem' }} /> Edit Schema
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
    </div>
  );
}

export default JournalView;
