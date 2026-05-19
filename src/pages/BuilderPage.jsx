import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Loader2, GripVertical, Settings, Eye, Dices, Activity, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import FirestoreService from '../services/FirestoreService';
import { dbtSchema as defaultDbtSchema } from '../config/dbtSchema';
import { generateMockData } from '../utils/mockDataGenerator';
import JournalView from '../components/JournalView';
import ClinicianView from '../components/ClinicianView';

const PRIMITIVE_TYPES = [
  { value: 'scale', label: 'Slider' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'single_select', label: 'Pick One' },
  { value: 'multi_select', label: 'Pick Multiple' },
  { value: 'text_short', label: 'Short Answer' },
  { value: 'text_long', label: 'Long Text' },
  { value: 'number', label: 'Number Input' }
];

function BuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [schema, setSchema] = useState([]);
  const [templateMetadata, setTemplateMetadata] = useState({ id: `tmpl_${Date.now()}`, name: 'New Template', version: 1 });
  const [activeField, setActiveField] = useState(null); // { sectionIndex, fieldIndex }
  const [editingField, setEditingField] = useState(null); // { sectionIndex, fieldIndex } for inline rename
  const [draggedItem, setDraggedItem] = useState(null); // { sectionIndex, fieldIndex }

  // Preview State
  const [mode, setMode] = useState('edit'); // 'edit' or 'preview'
  const [previewTab, setPreviewTab] = useState('journal'); // 'journal' or 'clinician'
  const [mockData, setMockData] = useState([]);
  const [mockForm, setMockForm] = useState({});
  const [mockEntryDate, setMockEntryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && profile) {
      loadSchema();
    } else if (!authLoading) {
      // If not logged in and not loading auth, default to template
      setSchema(JSON.parse(JSON.stringify(defaultDbtSchema)));
    }
  }, [user, profile, authLoading]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const templateIdParam = searchParams.get('id');
      let targetTemplate = null;
      
      if (templateIdParam) {
        targetTemplate = await FirestoreService.fetchTemplate(user.uid, templateIdParam);
      } else {
        // Only load active template by default for patients
        if (profile?.role === 'patient') {
          targetTemplate = await FirestoreService.fetchActiveTemplate(user.uid);
        }
      }

      if (targetTemplate) {
        setTemplateMetadata({ 
          id: targetTemplate.id, 
          name: targetTemplate.name || 'Custom Template', 
          version: targetTemplate.version || 1 
        });
        setSchema(targetTemplate.sections || []);
      } else {
        setSchema(JSON.parse(JSON.stringify(defaultDbtSchema)));
        setTemplateMetadata({ 
          id: `tmpl_${Date.now()}`, 
          name: profile?.role === 'clinician' ? 'Clinician DBT Template' : 'Standard DBT Template', 
          version: 0 
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load schema: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const templateData = {
        name: templateMetadata.name,
        version: templateMetadata.version + 1, // Increment version on save
        sections: schema
      };
      // Clinician templates are not set active for themselves, only patient templates are made active
      const makeActive = profile?.role !== 'clinician';
      await FirestoreService.saveTemplate(user.uid, templateMetadata.id, templateData, makeActive);
      
      if (profile?.role === 'clinician') {
        navigate(`/clinician`);
      } else {
        navigate(`/journal`);
      }
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
  const moveField = (fromSection, fromField, toSection, toField) => {
    if (fromSection !== toSection) return; // Only reorder within same section for now
    const newSchema = [...schema];
    const section = newSchema[fromSection];
    const [moved] = section.fields.splice(fromField, 1);
    section.fields.splice(toField, 0, moved);
    setSchema(newSchema);
  };

  if (authLoading || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spin" size={32} color="var(--accent-primary)" /></div>;
  }

  const currentField = activeField ? schema[activeField.sectionIndex].fields[activeField.fieldIndex] : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={28} color="var(--accent-primary)"/>
              <input 
                type="text" 
                value={templateMetadata.name} 
                onChange={e => setTemplateMetadata(prev => ({ ...prev, name: e.target.value }))}
                style={{ fontSize: '1.75rem', fontWeight: 800, border: 'none', borderBottom: '2px solid var(--border-color)', background: 'transparent', padding: '0.25rem 0.5rem', borderRadius: 0, outline: 'none', width: '100%', maxWidth: '400px', color: 'var(--text-primary)' }}
                placeholder="Template Name"
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Version {templateMetadata.version} • Customize your diary structure</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={profile?.role === 'clinician' ? "/clinician" : "/journal"} className="secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '2rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
            </Link>
          </div>
        </div>

        <div className="toggle-group" style={{ margin: 0, alignSelf: 'center' }}>
          <button className={`toggle-btn ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')}>
            <Edit2 size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Edit Mode
          </button>
          <button className={`toggle-btn ${mode === 'preview' ? 'active' : ''}`} onClick={() => { setMode('preview'); if(mockData.length===0) handleRandomize(); }}>
            <Eye size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Full Preview
          </button>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="toggle-group" style={{ margin: 0, width: '100%' }}>
              <button className={`toggle-btn ${previewTab === 'journal' ? 'active' : ''}`} onClick={() => setPreviewTab('journal')} style={{ flex: 1, padding: '0.6rem' }}>
                <Activity size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} /> Journal
              </button>
              <button className={`toggle-btn ${previewTab === 'clinician' ? 'active' : ''}`} onClick={() => setPreviewTab('clinician')} style={{ flex: 1, padding: '0.6rem' }}>
                <Users size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} /> Clinician
              </button>
            </div>
            
            <button onClick={handleRandomize} className="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', background: 'rgba(255,255,255,0.5)', padding: '0.6rem', fontSize: '0.875rem' }}>
              <Dices size={16} color="var(--accent-purple)" /> Randomize Data
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
        <div className="grid" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* LEFT COLUMN: EDITOR */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SCHEMA STRUCTURE</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          draggable
                          onDragStart={() => setDraggedItem({ sectionIndex: sIdx, fieldIndex: fIdx })}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderTop = '2px solid var(--accent-primary)'; }}
                          onDragLeave={(e) => { e.currentTarget.style.borderTop = '1px solid var(--border-color)'; }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderTop = '1px solid var(--border-color)';
                            if (draggedItem) moveField(draggedItem.sectionIndex, draggedItem.fieldIndex, sIdx, fIdx);
                            setDraggedItem(null);
                          }}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '0.75rem 1rem', background: isActive ? '#f0f9ff' : 'white', 
                            border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            borderRadius: '0.75rem', cursor: 'grab', transition: 'all 0.2s'
                          }}
                          onClick={() => setActiveField({ sectionIndex: sIdx, fieldIndex: fIdx })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <GripVertical size={18} color="var(--text-secondary)" style={{ cursor: 'grab' }} />
                            {editingField?.sectionIndex === sIdx && editingField?.fieldIndex === fIdx ? (
                              <input 
                                autoFocus
                                type="text"
                                value={field.label}
                                onChange={(e) => updateActiveField({ label: e.target.value })}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
                                style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.9375rem' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span 
                                onDoubleClick={(e) => { e.stopPropagation(); setEditingField({ sectionIndex: sIdx, fieldIndex: fIdx }); }}
                                style={{ fontWeight: 600, fontSize: '0.9375rem', color: isActive ? 'var(--accent-purple)' : 'inherit' }}
                              >
                                {field.label}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'var(--accent-purple-light)', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                              {PRIMITIVE_TYPES.find(t => t.value === field.type)?.label || field.type}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteField(sIdx, fIdx); }} 
                            className="secondary"
                            style={{ width: 'auto', padding: '0.4rem', border: 'none', background: 'transparent' }}
                          >
                            <Trash2 size={16} color="var(--text-secondary)" />
                          </button>
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

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

              <button 
                onClick={handleSave} 
                disabled={saving || !user} 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '100%', padding: '1rem', borderRadius: '1.25rem', 
                  fontSize: '1rem', fontWeight: 800,
                  boxShadow: '0 8px 15px -3px rgba(14, 165, 233, 0.15)'
                }}
              >
                {saving ? <Loader2 size={18} className="spin" /> : <><Save size={20} style={{ marginRight: '0.75rem' }} /> Save Configuration</>}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: CONFIG */}
          <div className="desktop-settings" style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>FIELD SETTINGS</h3>
            <div className="card">
              {!currentField ? (
                <div className="empty-state">Select a field on the left to edit its settings.</div>
              ) : (
                <FieldSettingsContent currentField={currentField} updateActiveField={updateActiveField} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SETTINGS DRAWER */}
      <div className={`drawer-overlay ${activeField ? 'active' : ''}`} onClick={() => setActiveField(null)} />
      <div className={`drawer-content ${activeField ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Field Settings</h3>
          <button onClick={() => setActiveField(null)} className="secondary" style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
            Done
          </button>
        </div>
        {currentField && <FieldSettingsContent currentField={currentField} updateActiveField={updateActiveField} />}
      </div>
    </div>
  );
}

// Sub-component to avoid code duplication
function FieldSettingsContent({ currentField, updateActiveField }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label>Field Label (Unique Key)</label>
        <input type="text" value={currentField.label} onChange={e => updateActiveField({ label: e.target.value })} />
      </div>
      
      <div className="form-group">
        <label>Component Type</label>
        <CustomSelect 
          value={currentField.type} 
          options={PRIMITIVE_TYPES} 
          onChange={val => updateActiveField({ type: val })} 
        />
      </div>

      {/* Conditional Config Inputs */}
      {currentField.type === 'scale' && (
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Min</label>
              <input type="number" value={currentField.config?.min ?? 0} onChange={e => updateActiveField({ config: { min: parseInt(e.target.value) } })} style={{ padding: '0.5rem 0.2rem', textAlign: 'center', fontSize: '0.9rem' }} />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Max</label>
              <input type="number" value={currentField.config?.max ?? 5} onChange={e => updateActiveField({ config: { max: parseInt(e.target.value) } })} style={{ padding: '0.5rem 0.2rem', textAlign: 'center', fontSize: '0.9rem' }} />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Start</label>
              <input type="number" value={currentField.config?.start ?? ''} onChange={e => updateActiveField({ config: { start: e.target.value ? parseInt(e.target.value) : undefined } })} style={{ padding: '0.5rem 0.2rem', textAlign: 'center', fontSize: '0.9rem' }} placeholder="Min" />
            </div>
          </div>
        </div>
      )}

      {(currentField.type === 'single_select' || currentField.type === 'multi_select') && (
        <div className="form-group">
          <label>Options</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {(currentField.config?.options || []).map((opt, i) => (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.4rem', 
                  background: 'var(--accent-purple-light)', color: 'var(--accent-purple)', 
                  padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600
                }}>
                  {opt}
                  <button 
                    onClick={() => {
                      const newOpts = [...(currentField.config.options)];
                      newOpts.splice(i, 1);
                      updateActiveField({ config: { options: newOpts } });
                    }}
                    style={{ background: 'transparent', border: 'none', padding: 0, width: 'auto', display: 'flex', color: 'var(--accent-purple)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Add option..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const newOpts = [...(currentField.config?.options || []), e.target.value.trim()];
                    updateActiveField({ config: { options: newOpts } });
                    e.target.value = '';
                  }
                }}
                style={{ flex: 1, borderRadius: '2rem', padding: '0.5rem 1rem' }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling;
                  if (input.value.trim()) {
                    const newOpts = [...(currentField.config?.options || []), input.value.trim()];
                    updateActiveField({ config: { options: newOpts } });
                    input.value = '';
                  }
                }}
                className="secondary"
                style={{ width: 'auto', borderRadius: '2rem', padding: '0.5rem 1rem' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Select Component
function CustomSelect({ value, options, onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-select-container" ref={containerRef}>
      <button 
        type="button"
        className={`custom-select-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown size={18} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.3s',
          color: 'var(--text-secondary)'
        }} />
      </button>
      
      {isOpen && (
        <div className="custom-select-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`custom-select-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuilderPage;
