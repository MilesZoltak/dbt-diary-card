/**
 * Normalizes a date string from various formats (e.g., 5/1/2026, 2026-05-01)
 * into a standard YYYY-MM-DD format.
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    // If it's already YYYY-MM-DD, just return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Otherwise, parse and format
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Date normalization failed for:', dateStr, e);
    return null;
  }
};
