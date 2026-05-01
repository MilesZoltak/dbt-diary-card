import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Loader2, GripVertical, Settings, Eye, Dices, Activity, Users } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import GoogleSheetsService from '../services/GoogleSheetsService';
import SchemaService from '../services/SchemaService';
import { dbtSchema as defaultDbtSchema } from '../config/dbtSchema';
import { generateMockData } from '../utils/mockDataGenerator';
import JournalView from '../components/JournalView';
import ClinicianView from '../components/ClinicianView';

const PRIMITIVE_TYPES = [
  { value: 'scale', label: 'Scale / Rating' },
  { value: 'boolean', label: 'Checkbox (Yes/No)' },
  { value: 'single_select', label: 'Single Choice (Dropdown)' },
  { value: 'multi_select', label: 'Multiple Choice (Checkboxes)' },
  { value: 'text_short', label: 'Short Text' },
  { value: 'text_long', label: 'Long Text / Notes' },
  { value: 'number', label: 'Number Input' }
];

function BuilderPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [schema, setSchema] = useState([]);
  const [activeField, setActiveField] = useState(null); // { sectionIndex, fieldIndex }

  // Preview State
  const [mode, setMode] = useState('edit'); // 'edit' or 'preview'
  const [previewTab, setPreviewTab] = useState('journal'); // 'journal' or 'clinician'
  const [mockData, setMockData] = useState([]);
  const [mockForm, setMockForm] = useState({});
  const [mockEntryDate, setMockEntryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (accessToken && sheetId) {
      loadSchema();
    } else if (!sheetId) {
      setSchema(JSON.parse(JSON.stringify(defaultDbtSchema)));
    }
  }, [accessToken, sheetId]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const sheetsService = new GoogleSheetsService(sheetId, accessToken);
      let configRows = await sheetsService.fetchData('Config');
      let currentSchema = configRows.length === 0 ? defaultDbtSchema : SchemaService.parseConfig(configRows);
      setSchema(JSON.parse(JSON.stringify(currentSchema)));
    } catch (err) {
      console.error(err);
      setError("Failed to load schema: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sheetId) return;
    setSaving(true);
    setError(null);
    try {
      const sheetsService = new GoogleSheetsService(sheetId, accessToken);
      const flatConfig = SchemaService.flattenSchema(schema);
      await sheetsService.updateSheet('Config', flatConfig);
      
      const dataHeaders = SchemaService.getExpectedDataHeaders(schema);
      const existingData = await sheetsService.fetchData('Data');
      if (existingData.length === 0) {
         await sheetsService.updateSheet('Data', [dataHeaders]);
      } else {
         await sheetsService.updateRow1('Data', dataHeaders);
      }
      
      navigate(`/sheet/${sheetId}/journal`);
    } catch (err) {
      console.error(err);
      setError("Failed to save schema: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRandomize = () => {
    setMockData(generateMockData(schema, 14)); // Gen 14 days of mock data
    
    // Also randomize the mock form for the Journal view
    const newForm = {};
    schema.forEach(section => {
      section.fields.forEach(f => {
        if (f.type === 'scale') {
          // If mock randomize, we just randomize the form value anyway
          newForm[f.id] = Math.floor(Math.random() * ((f.config?.max || 5) - (f.config?.min || 0) + 1)) + (f.config?.min || 0);
        } else if (f.type === 'boolean') {
          newForm[f.id] = Math.random() > 0.5;
        } else if (f.type === 'single_select') {
          newForm[f.id] = f.config?.options?.[0] || '';
        } else if (f.type === 'multi_select') {
          newForm[f.id] = [];
        } else {
          newForm[f.id] = '';
        }
      });
    });
    setMockForm(newForm);
  };

  // --- STATE MUTATORS ---
  const addSection = () => setSchema([...schema, { title: 'NEW SECTION', fields: [] }]);
  const updateSectionTitle = (index, newTitle) => { const newSchema = [...schema]; newSchema[index].title = newTitle; setSchema(newSchema); };
  const updateSectionDescription = (index, newDesc) => { const newSchema = [...schema]; newSchema[index].description = newDesc; setSchema(newSchema); };
  const deleteSection = (index) => {
    if (confirm('Are you sure you want to delete this entire section?')) {
      const newSchema = [...schema]; newSchema.splice(index, 1); setSchema(newSchema); setActiveField(null);
    }
  };
  const addField = (sectionIndex) => {
    const newSchema = [...schema];
    newSchema[sectionIndex].fields.push({ id: 'New Field', label: 'New Field', type: 'scale', config: { min: 0, max: 5 } });
    setSchema(newSchema);
    setActiveField({ sectionIndex, fieldIndex: newSchema[sectionIndex].fields.length - 1 });
  };
  const deleteField = (sectionIndex, fieldIndex) => {
    const newSchema = [...schema]; newSchema[sectionIndex].fields.splice(fieldIndex, 1); setSchema(newSchema);
    if (activeField?.sectionIndex === sectionIndex && activeField?.fieldIndex === fieldIndex) setActiveField(null);
  };
  const updateActiveField = (updates) => {
    if (!activeField) return;
    const newSchema = [...schema];
    const field = newSchema[activeField.sectionIndex].fields[activeField.fieldIndex];
    if (updates.label !== undefined) { field.id = updates.label; field.label = updates.label; }
    if (updates.type !== undefined) {
      field.type = updates.type;
      if (updates.type === 'scale') field.config = { min: 0, max: 5 };
      else if (updates.type === 'single_select' || updates.type === 'multi_select') field.config = { options: ['Option 1'] };
      else field.config = {};
    }
    if (updates.config !== undefined) field.config = { ...field.config, ...updates.config };
    setSchema(newSchema);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  const currentField = activeField ? schema[activeField.sectionIndex].fields[activeField.fieldIndex] : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={24} color="var(--accent-primary)"/> Schema Builder
          </h2>

          <div className="toggle-group" style={{ margin: 0 }}>
            <button className={`toggle-btn ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')} style={{ padding: '0.5rem 1rem' }}>
              <Edit2 size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Edit Mode
            </button>
            <button className={`toggle-btn ${mode === 'preview' ? 'active' : ''}`} onClick={() => { setMode('preview'); if(mockData.length===0) handleRandomize(); }} style={{ padding: '0.5rem 1rem' }}>
              <Eye size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Full Preview
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {sheetId ? (
            <Link to={`/sheet/${sheetId}/journal`} className="secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Cancel
            </Link>
          ) : (
            <Link to="/" className="secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
            </Link>
          )}
          {sheetId && (
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', width: 'auto', padding: '0.5rem 1.5rem' }}>
              {saving ? <Loader2 size={18} className="spin" /> : <><Save size={18} style={{ marginRight: '0.5rem' }} /> Save & Apply</>}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* FULL PREVIEW MODE */}
      {mode === 'preview' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div className="toggle-group" style={{ margin: 0 }}>
              <button className={`toggle-btn ${previewTab === 'journal' ? 'active' : ''}`} onClick={() => setPreviewTab('journal')}>
                <Activity size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Journal Preview
              </button>
              <button className={`toggle-btn ${previewTab === 'clinician' ? 'active' : ''}`} onClick={() => setPreviewTab('clinician')}>
                <Users size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Clinician Preview
              </button>
            </div>
            
            <button onClick={handleRandomize} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', background: 'white' }}>
              <Dices size={18} color="var(--accent-purple)" /> Randomize Mock Data
            </button>
          </div>

          <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.5)' }}>
            {previewTab === 'journal' ? (
              <JournalView 
                schema={schema}
                patientData={mockData}
                form={mockForm}
                setForm={setMockForm}
                entryDate={mockEntryDate}
                setEntryDate={setMockEntryDate}
                readOnly={false}
              />
            ) : (
              <ClinicianView 
                schema={schema}
                patientData={mockData}
              />
            )}
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {mode === 'edit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* LEFT COLUMN: EDITOR */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SCHEMA STRUCTURE</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {schema.map((section, sIdx) => (
                <div key={sIdx} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={section.title} 
                      onChange={e => updateSectionTitle(sIdx, e.target.value)}
                      style={{ flex: 1, fontSize: '1rem', fontWeight: 600, padding: '0.5rem', border: '1px solid transparent', background: '#f8fafc' }}
                    />
                    <button onClick={() => deleteSection(sIdx)} className="secondary" style={{ width: 'auto', padding: '0.5rem' }} title="Delete Section">
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
                  </div>
                  
                  <textarea 
                    placeholder="Add an optional description/instructions for this section..."
                    value={section.description || ''}
                    onChange={e => updateSectionDescription(sIdx, e.target.value)}
                    style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem', background: '#f8fafc', border: '1px solid transparent', borderRadius: '0.5rem', marginBottom: '1rem', resize: 'vertical' }}
                    rows="2"
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {section.fields.map((field, fIdx) => {
                      const isActive = activeField?.sectionIndex === sIdx && activeField?.fieldIndex === fIdx;
                      return (
                        <div 
                          key={fIdx} 
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '0.5rem', background: isActive ? '#f0f9ff' : 'white', 
                            border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            borderRadius: '0.5rem', cursor: 'pointer'
                          }}
                          onClick={() => setActiveField({ sectionIndex: sIdx, fieldIndex: fIdx })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <GripVertical size={16} color="var(--text-secondary)" />
                            <span style={{ fontWeight: isActive ? 600 : 400 }}>{field.label}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>
                              {field.type}
                            </span>
                          </div>
                          <Trash2 size={16} color="var(--text-secondary)" onClick={(e) => { e.stopPropagation(); deleteField(sIdx, fIdx); }} style={{cursor: 'pointer'}} />
                        </div>
                      );
                    })}
                    <button onClick={() => addField(sIdx)} className="secondary" style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderStyle: 'dashed' }}>
                      <Plus size={16} /> Add Field
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={addSection} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: 'auto', alignSelf: 'flex-start' }}>
                <Plus size={18} /> Add New Section
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: CONFIG & (DEPRECATED LOCAL PREVIEW) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '2rem' }}>
            
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>FIELD SETTINGS</h3>
              {!currentField ? (
                <div className="empty-state">Select a field on the left to edit its settings.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Field Label (Column Name)</label>
                    <input type="text" value={currentField.label} onChange={e => updateActiveField({ label: e.target.value })} />
                  </div>
                  
                  <div className="form-group">
                    <label>Component Type</label>
                    <select value={currentField.type} onChange={e => updateActiveField({ type: e.target.value })}>
                      {PRIMITIVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {/* Conditional Config Inputs */}
                  {currentField.type === 'scale' && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Value</label>
                          <input type="number" value={currentField.config?.min ?? 0} onChange={e => updateActiveField({ config: { min: parseInt(e.target.value) } })} style={{ padding: '0.5rem' }} />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Value</label>
                          <input type="number" value={currentField.config?.max ?? 5} onChange={e => updateActiveField({ config: { max: parseInt(e.target.value) } })} style={{ padding: '0.5rem' }} />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Start</label>
                          <input type="number" value={currentField.config?.start ?? ''} onChange={e => updateActiveField({ config: { start: e.target.value ? parseInt(e.target.value) : undefined } })} style={{ padding: '0.5rem' }} placeholder="Min" />
                        </div>
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!currentField.config?.detailed} onChange={e => updateActiveField({ config: { detailed: e.target.checked } })} style={{ width: 'auto', margin: 0 }} />
                          Show detailed ticks and min/max labels
                        </label>
                      </div>
                    </div>
                  )}

                  {(currentField.type === 'single_select' || currentField.type === 'multi_select') && (
                    <div className="form-group">
                      <label>Options (Comma separated)</label>
                      <textarea 
                        rows="3" 
                        value={(currentField.config?.options || []).join(', ')} 
                        onChange={e => {
                          const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          updateActiveField({ config: { options: opts } });
                        }}
                        placeholder="E.g. Good, Fair, Poor"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default BuilderPage;
