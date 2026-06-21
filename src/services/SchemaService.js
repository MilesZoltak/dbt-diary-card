/**
 * Utility service for handling the new JSON Schema Template format.
 */
class SchemaService {
  /**
   * Generates the default form state based on a template's schema.
   * Useful for initializing a new diary card.
   */
  static generateDefaultResponses(template) {
    if (!template || !template.sections) return {};
    
    const defaults = {};
    template.sections.forEach(section => {
      section.fields.forEach(f => {
        if (f.type === 'scale') {
          defaults[f.id] = null;
        } else if (f.type === 'boolean') {
          defaults[f.id] = false;
        } else if (f.type === 'multi_select') {
          defaults[f.id] = [];
        } else {
          defaults[f.id] = '';
        }
      });
    });
    return defaults;
  }

  /**
   * Validates if a template object has the required fields.
   */
  static isValidTemplate(template) {
    if (!template) return false;
    if (!template.id || !template.name || typeof template.version !== 'number') return false;
    if (!Array.isArray(template.sections)) return false;
    return true;
  }
}

export default SchemaService;
