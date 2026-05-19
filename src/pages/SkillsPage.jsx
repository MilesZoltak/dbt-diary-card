import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BookOpen, Activity, Users, ClipboardList, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/GoogleAuthContext';
import { dbTSkillsLibrary } from '../data/skillsLibrary';
import SkillWizard from '../components/SkillWizard';

export default function SkillsPage() {
  const { user, profile } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [activeModule, setActiveModule] = useState(dbTSkillsLibrary[0].module);


  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '3rem', paddingTop: '1.5rem' }}>
        <SkillWizard onSelectSkill={(skill) => setSelectedSkill(skill)} />
      </div>

      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <BookOpen size={24} color="var(--accent-primary)" /> Reference Library
        </h2>
        
        {/* Module Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
          {dbTSkillsLibrary.map((mod) => (
            <button
              key={mod.module}
              onClick={() => setActiveModule(mod.module)}
              className={activeModule === mod.module ? '' : 'secondary'}
              style={{ 
                width: 'auto', 
                whiteSpace: 'nowrap', 
                padding: '0.6rem 1.2rem',
                borderRadius: '2rem',
                border: activeModule === mod.module ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {mod.module}
            </button>
          ))}
        </div>

        {/* Active Module Content */}
        {dbTSkillsLibrary.filter(m => m.module === activeModule).map((mod) => (
          <div key={mod.module} style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              {mod.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {mod.skills.map((skill) => (
                <div 
                  key={skill.id} 
                  className="card"
                  style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
                  onClick={() => setSelectedSkill(skill)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {skill.name} <ArrowRight size={18} color="var(--text-secondary)" />
                  </h3>
                  {skill.acronymMeaning && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {skill.acronymMeaning}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div className="modal-overlay" onClick={() => setSelectedSkill(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-primary)', fontSize: '1.75rem' }}>{selectedSkill.name}</h2>
                {selectedSkill.acronymMeaning && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{selectedSkill.acronymMeaning}</p>
                )}
              </div>
              <button onClick={() => setSelectedSkill(null)} className="secondary" style={{ padding: '0.5rem', width: 'auto', background: 'var(--bg-secondary)', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>What it is</h4>
                <p style={{ margin: 0 }}>{selectedSkill.description}</p>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534' }}>When to use it</h4>
                <p style={{ margin: 0, color: '#15803d' }}>{selectedSkill.whenToUse}</p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>How to practice</h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedSkill.stepsToPractice.map((step, idx) => {
                    // Highlight the first word if it's an acronym part (e.g. "Temperature: Splash...")
                    const colonIndex = step.indexOf(':');
                    if (colonIndex > -1 && colonIndex < 30) {
                      return (
                        <li key={idx}>
                          <strong>{step.substring(0, colonIndex + 1)}</strong>
                          {step.substring(colonIndex + 1)}
                        </li>
                      );
                    }
                    return <li key={idx}>{step}</li>;
                  })}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedSkill(null)} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
