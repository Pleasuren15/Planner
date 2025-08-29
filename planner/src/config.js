// Application Configuration

// Azure Blob Storage Configuration
export const BLOB_STORAGE_CONFIG = {
  // Development/Local Azurite URLs
  LOCAL_BASE_URL: 'http://localhost:10000/devstoreaccount1',
  
  // Production Azure URLs (will be dynamically constructed)
  PRODUCTION_BASE_URL: 'https://{accountName}.blob.core.windows.net',
  
  // Default container settings
  DEFAULT_CONTAINER: 'tasks',
  DEFAULT_FILENAME: 'tasks.csv',
  
  // API Version for Azure Storage REST API
  API_VERSION: '2020-10-02',
};

// Application Settings
export const APP_CONFIG = {
  // Local Storage Keys
  STORAGE_KEYS: {
    TASKS: 'plannerTasks',
    BLOB_CONFIG: 'blobConfig',
  },
  
  // Default task settings
  DEFAULT_TASK: {
    CATEGORY: 'personal',
    PRIORITY: 'medium',
  },
  
  // Date settings
  WEEK_STARTS_ON: 1, // Monday = 1, Sunday = 0
};

// Environment Detection
export const ENVIRONMENT = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Blob URL Builders
export const buildBlobUrl = (accountName, containerName, filename, isLocal = false) => {
  if (isLocal) {
    return `${BLOB_STORAGE_CONFIG.LOCAL_BASE_URL}/${containerName}/${filename}`;
  }
  
  return `https://${accountName}.blob.core.windows.net/${containerName}/${filename}`;
};

// Default blob URL for tasks
export const getTasksBlobUrl = (accountName, isLocal = ENVIRONMENT.IS_DEVELOPMENT) => {
  return buildBlobUrl(
    accountName || 'devstoreaccount1', 
    BLOB_STORAGE_CONFIG.DEFAULT_CONTAINER, 
    BLOB_STORAGE_CONFIG.DEFAULT_FILENAME, 
    isLocal
  );
};