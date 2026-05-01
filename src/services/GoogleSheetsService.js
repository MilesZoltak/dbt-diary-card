/**
 * Service to interact directly with the Google Sheets API.
 * Supports multiple tabs (e.g., 'Data' and 'Config').
 */
class GoogleSheetsService {
  constructor(spreadsheetId, accessToken) {
    this.spreadsheetId = spreadsheetId;
    this.accessToken = accessToken;
    this.baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  }

  async fetchData(sheetName = 'Data', range = 'A:Z') {
    if (!this.spreadsheetId || !this.accessToken) return [];

    try {
      const response = await fetch(`${this.baseUrl}/values/${sheetName}!${range}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error?.status === 'INVALID_ARGUMENT') return []; // Sheet doesn't exist
        throw new Error(error.error?.message || `Failed to fetch from ${sheetName}`);
      }

      const data = await response.json();
      const values = data.values || [];
      
      if (values.length === 0) return [];

      const headers = values[0];
      const rows = values.slice(1);
      
      return rows.map(row => {
        let obj = {};
        headers.forEach((header, i) => obj[header] = row[i]);
        return obj;
      });
    } catch (error) {
      console.error('Sheets API Error:', error);
      throw error;
    }
  }

  async addRow(data, sheetName = 'Data') {
    if (!this.spreadsheetId || !this.accessToken) throw new Error('Missing configuration');

    try {
      const headers = await this.getHeaders(sheetName);
      const newRow = headers.map(header => {
        const val = data[header];
        return val !== undefined && val !== null ? val : "";
      });

      const response = await fetch(`${this.baseUrl}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [newRow]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add row');
      }

      return await response.json();
    } catch (error) {
      console.error('Sheets API Error:', error);
      throw error;
    }
  }

  async getHeaders(sheetName = 'Data') {
    const response = await fetch(`${this.baseUrl}/values/${sheetName}!1:1`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.values ? data.values[0] : [];
  }

  async updateSheet(sheetName, values) {
    const response = await fetch(`${this.baseUrl}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Failed to update ${sheetName}`);
    }
  }

  /**
   * Creates a new tab (sheet) in the spreadsheet if it doesn't exist
   */
  async ensureTabExists(title) {
    // First check if it exists
    const res = await fetch(`${this.baseUrl}?fields=sheets(properties(title))`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const metadata = await res.json();
    const exists = metadata.sheets?.some(s => s.properties.title === title);

    if (exists) return true;

    // Create it
    const createRes = await fetch(`${this.baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title } } }]
      })
    });

    return createRes.ok;
  }
}

export default GoogleSheetsService;
