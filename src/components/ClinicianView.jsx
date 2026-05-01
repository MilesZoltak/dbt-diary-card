import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Users, Calendar } from 'lucide-react';

function ClinicianView({ schema, patientData }) {
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // Default to last 7 days (including today)
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(40);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height);
    }
  });

  // Generate array of all dates in the range
  const dateRangeArray = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toLocaleDateString());
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  // Map data by date for O(1) lookup
  const dataByDate = useMemo(() => {
    const map = {};
    patientData.forEach(row => {
      map[row['Date']] = row; 
    });
    return map;
  }, [patientData]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--accent-primary)" /> Weekly Dashboard
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <Calendar size={18} color="var(--text-secondary)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', width: 'auto', border: 'none', background: 'transparent' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', width: 'auto', border: 'none', background: 'transparent' }}
            />
          </div>
        </div>
      </div>
      
      <div style={{ overflow: 'auto', padding: '0', maxHeight: '70vh', position: 'relative' }}>
        {dateRangeArray.length === 0 ? (
          <div className="empty-state">Please select a valid date range.</div>
        ) : (
          <table className="dashboard-table" style={{ margin: 0, borderTop: 'none', position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 40 }} ref={headerRef}>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 50, background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                  {/* Blank top-left cell */}
                </th>
                {dateRangeArray.map((date, i) => (
                  <th key={i} className="date-header" style={{ borderBottom: '2px solid var(--border-color)' }}>{date}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schema.map(section => (
                <React.Fragment key={section.title}>
                  <tr className="section-header">
                    <td 
                      colSpan={dateRangeArray.length + 1} 
                      style={{ 
                        position: 'sticky', 
                        top: headerHeight - 1,
                        left: 0, 
                        zIndex: 35, 
                        textAlign: 'left', 
                        paddingLeft: '1rem',
                        background: 'linear-gradient(to right, var(--accent-primary), var(--accent-purple))',
                        color: 'white'
                      }}
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.fields.map(field => {
                    if (field.type === 'text_long') {
                      return (
                        <React.Fragment key={field.id}>
                          <tr>
                            <td 
                              colSpan={dateRangeArray.length + 1} 
                              style={{ position: 'sticky', left: 0, background: '#e2e8f0', zIndex: 10, fontWeight: 600 }}
                            >
                              {field.label}
                            </td>
                          </tr>
                          {dateRangeArray.map(date => {
                            const row = dataByDate[date];
                            const val = row ? row[field.label] : undefined;
                            const dateObj = new Date(date);
                            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                            
                            return (
                              <tr key={date}>
                                <td style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10, fontWeight: 500, paddingLeft: '2rem' }}>
                                  {displayDate}
                                </td>
                                <td colSpan={dateRangeArray.length} style={{ textAlign: 'left', whiteSpace: 'pre-wrap', verticalAlign: 'top', background: 'white' }}>
                                  {val || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No notes</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }

                    return (
                      <tr key={field.id}>
                        <td style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10, fontWeight: 500 }}>
                          {field.label}
                        </td>
                        {dateRangeArray.map(date => {
                          const row = dataByDate[date];
                          const val = row ? row[field.label] : undefined;
                          
                          // Handle display formatting based on primitive type
                          let displayVal = val;
                          if (field.type === 'boolean') {
                            displayVal = val === 'Yes' ? '✅' : '-';
                          } else if (field.type === 'scale' || field.type === 'number') {
                            displayVal = val !== undefined && val !== '' ? val : '-';
                          } else if (!val) {
                            displayVal = '-';
                          }

                          return <td key={date} style={{ background: 'white' }}>{displayVal}</td>;
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ClinicianView;
