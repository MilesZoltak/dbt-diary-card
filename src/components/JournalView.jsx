import React from 'react';
import { Settings, ClipboardList, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeDate, getLocalDateString } from '../utils/dateUtils';

function JournalView({ 
  schema, 
  patientData, 
  form, 
  setForm, 
  entryDate, 
  setEntryDate, 
  onSubmit,
  onSaveDraft,
  submitting, 
  readOnly = false
}) {
  const [currentSectionIdx, setCurrentSectionIdx] = React.useState(0);
  const totalSections = schema.length;

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

  React.useEffect(() => {
    setCurrentSectionIdx(0);
  }, [entryDate]);

  const renderField = (field) => {
    const value = form[field.id];

    switch (field.type) {
      case 'scale':
        const min = field.config?.min ?? 0;
        const max = field.config?.max ?? 5;
        const start = field.config?.start ?? min;
        const listId = `ticks-${field.id}`;
        
        return (
          <div className="form-row" key={field.id}>
            <label>{field.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '1rem', textAlign: 'right' }}>
                {min}
              </span>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                {/* Custom Track */}
                <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', zIndex: 0 }} />
                
                {/* Ticks */}
                <div style={{ position: 'absolute', width: '100%', zIndex: 0, pointerEvents: 'none' }}>
                    {Array.from({length: max - min + 1}, (_, i) => min + i).map(n => {
                      const percent = ((n - min) / (max - min)) * 100;
                      return (
                        <div key={n} style={{ 
                          position: 'absolute', 
                          left: `calc(${percent}% + ${(1 - percent/50) * 12}px)`, 
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '2px',
                          height: '12px',
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '1rem', textAlign: 'left' }}>
                {max}
              </span>
              <span style={{ minWidth: '1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent-purple)' }}>
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
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '1rem' }}>Last 7 Days</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
          {last7Days.map(dateObj => {
            const dStr = getLocalDateString(dateObj);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const dayNum = dateObj.getDate();
            const isSelected = entryDate === dStr;
            const hasData = patientData.some(d => normalizeDate(d.logicalDate || d.Date) === dStr);

            return (
              <div 
                key={dStr}
                onClick={() => !submitting && !readOnly && setEntryDate(dStr)}
                style={{ 
                  padding: '0.75rem 0.2rem', borderRadius: '0.75rem', 
                  textAlign: 'center', cursor: submitting || readOnly ? 'default' : 'pointer', 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isSelected ? 'var(--accent-purple)' : 'white',
                  border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  boxShadow: isSelected ? '0 4px 12px rgba(124, 58, 237, 0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: isSelected ? 0.9 : 0.7 }}>{dayName}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0' }}>{dayNum}</div>
                <div style={{ 
                  height: '4px', width: '4px', borderRadius: '50%', 
                  background: hasData ? (isSelected ? 'white' : 'var(--accent-purple)') : 'transparent', 
                  margin: '0 auto' 
                }}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Daily Log</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="date" 
              value={entryDate} 
              onChange={(e) => !readOnly && setEntryDate(e.target.value)} 
              disabled={readOnly}
              style={{ width: 'auto', padding: '0.5rem', fontSize: '0.875rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} 
            />
            {!readOnly && (
              <Link to="/builder" className="secondary" style={{ padding: '0.5rem', textDecoration: 'none', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem' }}>
                <Settings size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Progress</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-purple)' }}>Section {currentSectionIdx + 1} of {totalSections}</span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${((currentSectionIdx + 1) / totalSections) * 100}%`, 
              background: 'linear-gradient(to right, var(--accent-primary), var(--accent-purple))',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!readOnly && onSubmit) onSubmit(); }}>
          {schema.map((section, idx) => {
            if (idx !== currentSectionIdx) return null;
            return (
              <div key={idx} style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: 'white', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}>
                  <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>{section.title}</h3>
                  {section.description && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem', marginBottom: 0 }}>{section.description}</p>
                  )}
                </div>
                {section.fields.map(field => renderField(field))}
              </div>
            );
          })}
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            {currentSectionIdx > 0 && (
              <button 
                type="button" 
                className="secondary" 
                onClick={() => {
                  setCurrentSectionIdx(prev => prev - 1);
                  if (!readOnly && onSaveDraft) onSaveDraft();
                }}
                style={{ flex: 1 }}
              >
                Back
              </button>
            )}
            
            {currentSectionIdx < totalSections - 1 ? (
              <button 
                type="button" 
                onClick={() => {
                  setCurrentSectionIdx(prev => prev + 1);
                  if (!readOnly && onSaveDraft) onSaveDraft();
                }}
                style={{ flex: 2 }}
              >
                Next Section
              </button>
            ) : (
              <button type="submit" disabled={submitting || readOnly} style={{ flex: 2, opacity: readOnly ? 0.5 : 1 }}>
                {submitting ? <Loader2 className="spin" size={20} /> : 'Complete Diary'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default JournalView;
