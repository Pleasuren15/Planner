// Google Sheets Configuration
// Update these values after setting up Google Apps Script

export const GOOGLE_SHEETS_CONFIG = {
  // Your Google Sheet ID (extracted from the sheet URL)
  SHEET_ID: '1eUBMFjVeYZLNXVDusTlMxwqNzra-FCZVdIME3daG2Jk',
  
  // Public CSV export URL for reading (already works)
  PUBLISHED_CSV_URL: 'https://docs.google.com/spreadsheets/d/1eUBMFjVeYZLNXVDusTlMxwqNzra-FCZVdIME3daG2Jk/export?format=csv&gid=0',
  
  // Google Apps Script Web App URL for writing (update after setup)
  // Replace with your deployed Google Apps Script Web App URL
  APPS_SCRIPT_URL: null, // Example: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
  
  // Sheet configuration
  SHEET_NAME: 'Sheet1', // Change if your sheet has a different name
};

export default GOOGLE_SHEETS_CONFIG;