import React, { useState } from 'react';
import { ArrowRight, RotateCcw, AlertTriangle, Brain, Heart, Users } from 'lucide-react';
import { dbTSkillsLibrary } from '../data/skillsLibrary';

function findSkillById(id) {
  for (const mod of dbTSkillsLibrary) {
    const found = mod.skills.find(s => s.id === id);
    if (found) return found;
  }
  return null;
}

export default function SkillWizard({ onSelectSkill }) {
  const [step, setStep] = useState('initial');

  const resetWizard = () => setStep('initial');

  const handleRecommendation = (skillId) => {
    const skill = findSkillById(skillId);
    if (skill) {
      onSelectSkill(skill);
      // Optional: reset wizard after finding a skill so it doesn't stay open forever
      // resetWizard(); 
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="wizard-step" style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Not sure what to do? Answer a few quick questions to find the best DBT skill for your current situation.
            </p>
            <button onClick={() => setStep('start')} style={{ width: 'auto', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              <Brain size={24} /> Help me find a skill
            </button>
          </div>
        );

      case 'start':
        return (
          <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertTriangle color="var(--danger)" style={{ flexShrink: 0, marginTop: '0.15rem' }} /> 
              <span>Are you in a crisis or experiencing overwhelming urges right now?</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setStep('crisis')} style={{ background: 'var(--danger)', color: 'white', border: 'none' }}>
                Yes, I'm overwhelmed right now
              </button>
              <button onClick={() => setStep('goal')} className="secondary">
                No, I'm just trying to navigate a situation
              </button>
            </div>
          </div>
        );
      
      case 'crisis':
        return (
          <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              Is your physical arousal very high? (e.g., heart racing, panic, extreme rage)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleRecommendation('tipp')}>
                Yes, my body is highly activated
              </button>
              <button onClick={() => handleRecommendation('accepts')} className="secondary">
                No, it's mostly in my head (obsessive thoughts, urges)
              </button>
            </div>
          </div>
        );

      case 'goal':
        return (
          <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              What are you trying to accomplish?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <button onClick={() => handleRecommendation('what-skills')} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                <Brain size={18} /> Understand or ground myself in the present
              </button>
              <button onClick={() => handleRecommendation('dear-man')} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                <Users size={18} /> Navigate a conversation or ask for something
              </button>
              <button onClick={() => handleRecommendation('opposite-action')} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                <Heart size={18} /> Change an unjustified emotion I'm feeling
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid var(--accent-primary-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: step === 'initial' ? '0' : '1.5rem' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-primary)' }}>Skill Coach</h2>
        {step !== 'initial' && (
          <button onClick={resetWizard} className="secondary" style={{ padding: '0.4rem 0.8rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
            <RotateCcw size={14} /> Start Over
          </button>
        )}
      </div>
      
      <div style={{ background: step === 'initial' ? 'transparent' : 'white', padding: step === 'initial' ? '1rem 0 0 0' : '1.5rem', borderRadius: '1rem', boxShadow: step === 'initial' ? 'none' : '0 4px 6px rgba(0,0,0,0.05)' }}>
        {renderStep()}
      </div>
    </div>
  );
}
