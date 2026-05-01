/**
 * Generates mock patient data based on the provided schema.
 * @param {Array} schema - The nested schema array.
 * @param {number} days - Number of days to generate data for.
 * @returns {Array} - Array of data rows mapped to expected column headers.
 */
export function generateMockData(schema, days = 7) {
  const data = [];
  
  // Start from (days - 1) days ago to today
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    
    const row = { 'Date': dateString };
    
    schema.forEach(section => {
      section.fields.forEach(field => {
        let value = '';
        
        switch (field.type) {
          case 'scale':
            const min = field.config?.min ?? 0;
            const max = field.config?.max ?? 5;
            // 90% chance to have a value for mock data
            if (Math.random() > 0.1) {
              value = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            break;
            
          case 'boolean':
            if (Math.random() > 0.2) {
              value = Math.random() > 0.5;
            }
            break;
            
          case 'single_select':
            if (Math.random() > 0.2 && field.config?.options?.length > 0) {
              value = field.config.options[Math.floor(Math.random() * field.config.options.length)];
            }
            break;
            
          case 'multi_select':
            if (Math.random() > 0.2 && field.config?.options?.length > 0) {
              // Pick 1 to 3 random options
              const numOptions = Math.floor(Math.random() * 3) + 1;
              const selected = [];
              for(let j=0; j<numOptions; j++) {
                const opt = field.config.options[Math.floor(Math.random() * field.config.options.length)];
                if(!selected.includes(opt)) selected.push(opt);
              }
              value = selected.join(', ');
            }
            break;
            
          case 'text_short':
            if (Math.random() > 0.5) {
              const shorts = ["Work stress", "Arguments", "Poor sleep", "Traffic", "Ate a good meal"];
              value = shorts[Math.floor(Math.random() * shorts.length)];
            }
            break;
            
          case 'text_long':
            if (Math.random() > 0.3) {
              value = "Honestly, today was quite a mix. I started off feeling really anxious about the upcoming presentation, but using the TIPP skills definitely brought my baseline down. In the afternoon I managed to focus on my tasks and even enjoyed a short walk. Still feeling a bit of lingering tension but it's manageable. Hoping tomorrow is smoother.";
            }
            break;

          case 'number':
            if (Math.random() > 0.2) {
              value = Math.floor(Math.random() * 10) + 1;
            }
            break;
        }
        
        row[field.id] = value;
      });
    });
    
    data.push(row);
  }
  
  return data;
}
