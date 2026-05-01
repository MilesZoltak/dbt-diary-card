/**
 * Handles conversion between the flat Google Sheet 'Config' tab 
 * and the nested Schema object used by the UI.
 */
class SchemaService {
  /**
   * Converts flat rows from Google Sheets into a section-based schema.
   */
  static parseConfig(rows) {
    if (!rows || rows.length === 0) return [];

    const sectionsMap = {};
    const sectionsOrder = [];

    rows.forEach(row => {
      const sectionTitle = row.Section || 'General';
      if (!sectionsMap[sectionTitle]) {
        sectionsMap[sectionTitle] = {
          title: sectionTitle,
          description: row.Description || '',
          fields: []
        };
        sectionsOrder.push(sectionTitle);
      }

      let config = {};
      try {
        if (row.ConfigJSON) {
          config = JSON.parse(row.ConfigJSON);
        }
      } catch (e) {
        console.warn(`Failed to parse ConfigJSON for field ${row.Label}`, e);
      }

      const fieldLabel = (row.Label || '').trim();
      sectionsMap[sectionTitle].fields.push({
        id: fieldLabel,
        label: fieldLabel,
        type: row.Type || 'text_short',
        config: config
      });
    });

    return sectionsOrder.map(title => sectionsMap[title]);
  }

  /**
   * Converts nested schema object back into flat rows for Google Sheets.
   */
  static flattenSchema(schema) {
    const rows = [];
    // We only save the necessary columns back to the sheet to keep it clean.
    // The columns are: Section, Label, Type, ConfigJSON
    rows.push(['Section', 'Label', 'Type', 'ConfigJSON']); 
    
    schema.forEach(section => {
      section.fields.forEach(field => {
        rows.push([
          section.title,
          field.label,
          field.type,
          field.config ? JSON.stringify(field.config) : '{}'
        ]);
      });
    });
    
    return rows;
  }

  /**
   * Generates the expected headers for the Data tab based on the schema.
   * Format: Date, Field1, Field2...
   */
  static getExpectedDataHeaders(schema) {
    const headers = ['Date'];
    schema.forEach(section => {
      section.fields.forEach(field => {
        headers.push(field.label);
      });
    });
    return headers;
  }
}

export default SchemaService;
