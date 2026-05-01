/**
 * Default DBT Schema representing standard DBT tracking.
 * This is used to initialize new spreadsheets if their Config tab is empty.
 * It uses the new component primitive types and ConfigJSON.
 */
export const dbtSchema = [
  {
    title: 'EMOTIONS',
    fields: [
      { id: 'Anger', label: 'Anger', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Fear', label: 'Fear', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Joy', label: 'Joy', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Sadness', label: 'Sadness', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Shame', label: 'Shame', type: 'scale', config: { min: 0, max: 5 } },
    ]
  },
  {
    title: 'URGES',
    fields: [
      { id: 'Urge to Self-Harm', label: 'Urge to Self-Harm', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Urge to Quit Therapy', label: 'Urge to Quit Therapy', type: 'scale', config: { min: 0, max: 5 } },
      { id: 'Urge to Die', label: 'Urge to Die', type: 'scale', config: { min: 0, max: 5 } },
    ]
  },
  {
    title: 'BEHAVIORS',
    fields: [
      { id: 'Self-Harm', label: 'Self-Harm', type: 'boolean', config: {} },
      { id: 'Lying', label: 'Lying', type: 'boolean', config: {} },
      { id: 'Alcohol/Drugs', label: 'Alcohol/Drugs', type: 'boolean', config: {} },
    ]
  },
  {
    title: 'SKILLS USED',
    fields: [
      { 
        id: 'Primary Skill Used', 
        label: 'Primary Skill Used', 
        type: 'single_select', 
        config: { options: ['None', 'Mindfulness', 'Distress Tolerance', 'Emotion Regulation', 'Interpersonal Effectiveness'] } 
      },
      { 
        id: 'Specific Skills', 
        label: 'Specific Skills', 
        type: 'multi_select', 
        config: { options: ['TIPP', 'ACCEPTS', 'Self-Soothe', 'IMPROVE', 'Pros & Cons', 'Radical Acceptance', 'Wise Mind', 'DEAR MAN'] } 
      },
    ]
  },
  {
    title: 'NOTES',
    fields: [
      { id: 'Daily Notes', label: 'Daily Notes', type: 'text_long', config: {} },
    ]
  }
];
