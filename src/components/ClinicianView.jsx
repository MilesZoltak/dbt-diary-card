import React, { useState } from 'react';
import { Activity, Calendar, ClipboardList, ChevronDown, MessageSquare, X } from 'lucide-react';
import { normalizeDate, getLocalDateString } from '../utils/dateUtils';

function ClinicianView({ schema, patientData }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return getLocalDateString(d);
  });
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [expandedSections, setExpandedSections] = useState([0]); 
  const [selectedNote, setSelectedNote] = useState(null); // { label, date, text }

  const toggleSection = (idx) => {
    setExpandedSections(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const dates = [];
  let curr = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const getHeatmapColor = (value, type, config) => {
    if (value === undefined || value === null || value === '') return 'transparent';
    
    if (type === 'boolean') {
      const isTrue = value === true || value === 'TRUE' || value === 'true' || value === 'Yes' || value === 'Y';
      return isTrue ? 'rgba(124, 58, 237, 0.8)' : 'rgba(226, 232, 240, 0.5)';
    }
    
    if (type !== 'scale') return 'rgba(226, 232, 240, 0.5)';
    
    const min = config?.min ?? 0;
    const max = config?.max ?? 5;
    const percent = (value - min) / (max - min);
    
    // Scale from light purple to deep purple
    return `rgba(124, 58, 237, ${0.1 + percent * 0.8})`;
  };

  const getTextColor = (value, type, config) => {
    if (value === undefined || value === null || value === '') return 'var(--text-secondary)';
    
    if (type === 'boolean') {
      const isTrue = value === true || value === 'TRUE' || value === 'true' || value === 'Yes' || value === 'Y';
      return isTrue ? 'white' : 'var(--text-primary)';
    }
    
    if (type !== 'scale') return 'var(--text-primary)';
    
    const min = config?.min ?? 0;
    const max = config?.max ?? 5;
    const percent = (value - min) / (max - min);
    return percent > 0.6 ? 'white' : 'var(--text-primary)';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <Activity size={28} color="var(--accent-primary)" /> Weekly Dashboard
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.5)', padding: '0.75rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-color)', backdropFilter: 'blur(8px)', alignSelf: 'flex-start' }}>
          <Calendar size={18} color="var(--text-secondary)" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 'auto', border: 'none', background: 'transparent', fontSize: '0.875rem', fontWeight: 600, padding: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>&rarr;</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 'auto', border: 'none', background: 'transparent', fontSize: '0.875rem', fontWeight: 600, padding: 0 }} />
        </div>
      </div>

      <div className="clinician-accordion">
        {schema.map((section, sIdx) => {
          const isOpen = expandedSections.includes(sIdx);
          return (
            <div key={sIdx} className={`accordion-item ${isOpen ? 'active' : ''}`}>
              <button className="accordion-trigger" onClick={() => toggleSection(sIdx)}>
                <div className="accordion-title">
                  <ClipboardList size={20} color="var(--accent-purple)" />
                  <span>{section.title}</span>
                </div>
                <ChevronDown size={20} style={{ 
                  transform: isOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.3s',
                  color: 'var(--text-secondary)'
                }} />
              </button>
              
              {isOpen && (
                <div className="accordion-content">
                  <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    <table className="dashboard-table" style={{ borderCollapse: 'separate', borderSpacing: '0.5rem' }}>
                      <thead>
                        <tr>
                          <th className="sticky-col" style={{ left: 0, background: 'white', zIndex: 10, minWidth: '120px', padding: '0.5rem' }}>Field</th>
                          {dates.map(date => {
                            const row = patientData.find(d => normalizeDate(d.logicalDate || d.Date) === date);
                            const isDraft = row?.status === 'draft';
                            const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                            return (
                              <th key={date} style={{ 
                                minWidth: '3.5rem', 
                                textAlign: 'center', 
                                fontSize: '0.7rem', 
                                color: isDraft ? '#d97706' : 'var(--text-secondary)', 
                                textTransform: 'uppercase',
                                padding: '0.5rem'
                              }}>
                                <div>{dateLabel}</div>
                                {isDraft && (
                                  <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem', letterSpacing: '0.05em' }}>[DRAFT]</div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {section.fields.map((field, fIdx) => (
                          <tr key={fIdx}>
                            <th className="sticky-col" style={{ left: 0, background: 'white', zIndex: 10, textAlign: 'left', fontWeight: 500, fontSize: '0.875rem', padding: '0.5rem' }}>
                              {field.label}
                            </th>
                            {dates.map(date => {
                              const row = [...patientData].reverse().find(d => normalizeDate(d.logicalDate || d.Date) === date);
                              const isDraft = row?.status === 'draft';
                              const maxReached = row?.maxSectionReached ?? 0;
                              const isReached = !isDraft || sIdx <= maxReached;
                              
                              const val = row?.responses?.[field.id] ?? row?.[field.id];
                              const displayVal = isReached ? val : undefined;
                              
                              const bgColor = getHeatmapColor(displayVal, field.type, field.config);
                              const textColor = getTextColor(displayVal, field.type, field.config);
                              
                              return (
                                <td key={date} style={{ padding: 0 }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    minHeight: '3rem', 
                                    height: '100%', 
                                    width: '100%',
                                    opacity: isDraft ? 0.75 : 1
                                  }}>
                                    {field.type === 'text_long' ? (
                                      val ? (
                                        <button 
                                          onClick={() => setSelectedNote({ label: field.label, date, text: val })}
                                          className="secondary"
                                          style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }}
                                        >
                                          <MessageSquare size={18} color="var(--accent-purple)" />
                                        </button>
                                      ) : (
                                        <div style={{ minHeight: '2.5rem' }}></div>
                                      )
                                    ) : (
                                      <div className="heatmap-cell" style={{ 
                                        background: bgColor, 
                                        color: textColor,
                                        width: '100%',
                                        height: '3rem',
                                        borderRadius: 0, /* Fill the box */
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {displayVal !== undefined && displayVal !== null && displayVal !== '' ? (
                                          field.type === 'boolean' ? (displayVal === true || displayVal === 'TRUE' || displayVal === 'true' || displayVal === 'Yes' || displayVal === 'Y' ? 'Y' : 'N') : displayVal
                                        ) : (row ? (isReached ? (field.type === 'boolean' ? 'N' : '-') : '') : '')}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NOTE MODAL */}
      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{selectedNote.label}</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(selectedNote.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelectedNote(null)} className="secondary" style={{ width: 'auto', padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {selectedNote.text}
            </div>
            <button onClick={() => setSelectedNote(null)} style={{ marginTop: '1.5rem' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicianView;
