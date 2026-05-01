import GoogleSheetsService from './GoogleSheetsService';

class GoogleDriveService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.driveUrl = 'https://www.googleapis.com/drive/v3/files';
  }

  /**
   * Finds or creates a spreadsheet with the given name.
   * Returns the Spreadsheet ID.
   */
  async findOrCreateSheet(fileName, isClinician = false) {
    if (!this.accessToken) return null;

    try {
      // 1. Search for existing file
      const query = encodeURIComponent(`name = '${fileName}' and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`);
      const searchRes = await fetch(`${this.driveUrl}?q=${query}&fields=files(id, name)`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        // Found it!
        return searchData.files[0].id;
      }

      // 2. Not found, create it
      const createRes = await fetch(this.driveUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: 'application/vnd.google-apps.spreadsheet'
        })
      });

      const newFileData = await createRes.json();
      const newSpreadsheetId = newFileData.id;

      // 3. Initialize the sheet with headers
      await this.initializeHeaders(newSpreadsheetId, isClinician);

      return newSpreadsheetId;
    } catch (error) {
      console.error('Drive API Error:', error);
      throw error;
    }
  }

  async initializeHeaders(spreadsheetId, isClinician) {
    const sheetsService = new GoogleSheetsService(spreadsheetId, this.accessToken);
    
    let headers;
    if (isClinician) {
      headers = ['Patient Email', 'Spreadsheet ID', 'Date Added'];
    } else {
      headers = [
        'Date', 
        'Urge to Self-Harm', 
        'Urge to Quit Therapy', 
        'Urge for Substance Use',
        'Joy', 
        'Sadness', 
        'Anger', 
        'Fear', 
        'Shame',
        'Acted on Urges?',
        'Skills Usage (0-7)',
        'Notes'
      ];
    }

    // Convert to row data
    const body = {
      values: [headers]
    };

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1?valueInputOption=USER_ENTERED`;
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
}

export default GoogleDriveService;
