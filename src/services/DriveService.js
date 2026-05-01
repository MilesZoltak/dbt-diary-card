/**
 * Handles interactions with the Google Drive API for file-level operations.
 */
class DriveService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://www.googleapis.com/drive/v3/files';
  }

  /**
   * Searches for Google Spreadsheets in the user's account.
   * @param {string} query - Optional search string to filter by name.
   */
  async searchSpreadsheets(query = '') {
    const q = `mimeType = 'application/vnd.google-apps.spreadsheet' ${query ? `and name contains '${query}'` : ''} and trashed = false`;
    const url = `${this.baseUrl}?q=${encodeURIComponent(q)}&fields=files(id, name, modifiedTime)&orderBy=modifiedTime desc&pageSize=20`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to search spreadsheets');
      }

      const data = await response.json();
      return data.files || [];
    } catch (err) {
      console.error('DriveService Error:', err);
      throw err;
    }
  }
}

export default DriveService;
