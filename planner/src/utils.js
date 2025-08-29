import { v4 as uuidv4 } from 'uuid';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  format,
  addWeeks,
  addMonths,
  addYears,
  subWeeks,
  subMonths,
  subYears,
  isSameWeek,
  isSameMonth,
  isSameYear,
  parseISO,
  isValid
} from 'date-fns';

// ========== DATE UTILITIES ==========
export const getCurrentWeekRange = (date = new Date()) => ({
  start: startOfWeek(date, { weekStartsOn: 1 }),
  end: endOfWeek(date, { weekStartsOn: 1 })
});

export const getCurrentMonthRange = (date = new Date()) => ({
  start: startOfMonth(date),
  end: endOfMonth(date)
});

export const getCurrentYearRange = (date = new Date()) => ({
  start: startOfYear(date),
  end: endOfYear(date)
});

export const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

export const filterTasksByDateRange = (tasks, range) => {
  const filterTask = (task) => {
    const taskDate = parseTaskDate(task.createdAt);
    const isInRange = taskDate && isWithinInterval(taskDate, range);
    
    return {
      ...task,
      subtasks: task.subtasks ? task.subtasks.filter(filterTask) : []
    };
  };
  
  return tasks.filter(task => {
    const taskDate = parseTaskDate(task.createdAt);
    return taskDate && isWithinInterval(taskDate, range);
  }).map(filterTask);
};

export const formatDateRange = (range, type = 'week') => {
  switch (type) {
    case 'week':
      return `${format(range.start, 'MMM dd')} - ${format(range.end, 'MMM dd, yyyy')}`;
    case 'month':
      return format(range.start, 'MMMM yyyy');
    case 'year':
      return format(range.start, 'yyyy');
    default:
      return `${format(range.start, 'MMM dd')} - ${format(range.end, 'MMM dd, yyyy')}`;
  }
};

export const navigateDate = (currentDate, direction, type = 'week') => {
  const isNext = direction === 'next';
  
  switch (type) {
    case 'week':
      return isNext ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case 'month':
      return isNext ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case 'year':
      return isNext ? addYears(currentDate, 1) : subYears(currentDate, 1);
    default:
      return currentDate;
  }
};

export const isCurrentPeriod = (date, type = 'week', referenceDate = new Date()) => {
  switch (type) {
    case 'week':
      return isSameWeek(date, referenceDate, { weekStartsOn: 1 });
    case 'month':
      return isSameMonth(date, referenceDate);
    case 'year':
      return isSameYear(date, referenceDate);
    default:
      return false;
  }
};

export const createDateString = (date = new Date()) => {
  return date.toISOString();
};

// ========== TASK UTILITIES ==========
export const createTask = (title, description = '', dueDate = null, parentId = null, category = 'personal', priority = 'medium') => ({
  id: uuidv4(),
  title,
  description,
  completed: false,
  createdAt: createDateString(),
  updatedAt: createDateString(),
  dueDate,
  parentId,
  category,
  priority,
  subtasks: []
});

export const updateTask = (task, updates) => ({
  ...task,
  ...updates,
  updatedAt: createDateString(),
  // Preserve original createdAt if not explicitly updated
  createdAt: updates.createdAt || task.createdAt
});

export const toggleTaskCompletion = (task) => {
  const updatedTask = updateTask(task, { completed: !task.completed });
  
  if (updatedTask.completed && updatedTask.subtasks.length > 0) {
    updatedTask.subtasks = updatedTask.subtasks.map(subtask => 
      updateTask(subtask, { completed: true })
    );
  }
  
  return updatedTask;
};

export const getTaskStats = (tasks) => {
  let total = 0;
  let completed = 0;
  
  const countTasks = (taskList) => {
    taskList.forEach(task => {
      total++;
      if (task.completed) completed++;
      if (task.subtasks && task.subtasks.length > 0) {
        countTasks(task.subtasks);
      }
    });
  };
  
  countTasks(tasks);
  
  return {
    total,
    completed,
    pending: total - completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

// ========== CSV UTILITIES ==========
export const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

export const escapeCSVField = (field) => {
  if (field == null) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

export const arrayToCSVLine = (array) => {
  return array.map(escapeCSVField).join(',');
};

export const tasksToCSV = (tasks) => {
  const headers = ['id', 'title', 'description', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'parentId', 'category', 'priority'];
  const csvLines = [arrayToCSVLine(headers)];
  
  const flattenTasks = (taskList, parentId = null) => {
    taskList.forEach(task => {
      csvLines.push(arrayToCSVLine([
        task.id,
        task.title,
        task.description || '',
        task.completed,
        task.createdAt,
        task.updatedAt,
        task.dueDate || '',
        parentId || '',
        task.category || 'personal',
        task.priority || 'medium'
      ]));
      
      if (task.subtasks && task.subtasks.length > 0) {
        flattenTasks(task.subtasks, task.id);
      }
    });
  };
  
  flattenTasks(tasks);
  return csvLines.join('\n');
};

export const csvToTasks = (csvContent) => {
  if (!csvContent.trim()) return [];
  
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const taskMap = new Map();
  const rootTasks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const task = {
      id: values[0],
      title: values[1],
      description: values[2],
      completed: values[3] === 'true',
      createdAt: values[4],
      updatedAt: values[5],
      dueDate: values[6] || null,
      parentId: values[7] || null,
      category: values[8] || 'personal',
      priority: values[9] || 'medium',
      subtasks: []
    };
    
    taskMap.set(task.id, task);
    
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.subtasks.push(task);
      }
    } else {
      rootTasks.push(task);
    }
  }
  
  return rootTasks;
};

// ========== BLOB STORAGE UTILITIES ==========
// Configuration for Azure Blob Storage
let blobConfig = {
  connectionString: '',
  containerName: 'tasks',
  accountName: '',
  accountKey: '',
  enabled: false
};

// Parse Azure Storage connection string
const parseConnectionString = (connectionString) => {
  const params = {};
  connectionString.split(';').forEach(part => {
    const [key, value] = part.split('=', 2);
    if (key && value) {
      params[key] = value;
    }
  });
  
  return {
    accountName: params['AccountName'] || '',
    accountKey: params['AccountKey'] || '',
    endpointSuffix: params['EndpointSuffix'] || 'core.windows.net'
  };
};

// Set blob storage configuration
export const configureBlobStorage = (connectionString, containerName = 'tasks') => {
  const parsed = parseConnectionString(connectionString);
  
  blobConfig = {
    connectionString,
    containerName,
    accountName: parsed.accountName,
    accountKey: parsed.accountKey,
    endpointSuffix: parsed.endpointSuffix,
    enabled: !!(parsed.accountName && parsed.accountKey)
  };
  
  // Store config in localStorage for persistence
  localStorage.setItem('blobConfig', JSON.stringify(blobConfig));
};

// Load blob configuration from localStorage
export const loadBlobConfig = () => {
  try {
    const stored = localStorage.getItem('blobConfig');
    if (stored) {
      blobConfig = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading blob config:', error);
  }
};

// Generate HMAC-SHA256 signature using Web Crypto API
const generateSignature = async (stringToSign, accountKey) => {
  const keyBuffer = Uint8Array.from(atob(accountKey), c => c.charCodeAt(0));
  const dataBuffer = new TextEncoder().encode(stringToSign);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

// Generate Azure Storage authorization header using Shared Key
const generateAuthHeader = async (method, url, contentLength = 0, contentType = '') => {
  const urlParts = new URL(url);
  const canonicalizedResource = `/${blobConfig.accountName}${urlParts.pathname}`;
  
  const now = new Date().toUTCString();
  const xMsDate = now;
  const xMsVersion = '2020-10-02';
  
  const stringToSign = [
    method,
    '', // Content-Encoding
    '', // Content-Language
    contentLength || '', // Content-Length
    '', // Content-MD5
    contentType, // Content-Type
    '', // Date
    '', // If-Modified-Since
    '', // If-Match
    '', // If-None-Match
    '', // If-Unmodified-Since
    '', // Range
    `x-ms-blob-type:BlockBlob`,
    `x-ms-date:${xMsDate}`,
    `x-ms-version:${xMsVersion}`,
    canonicalizedResource
  ].join('\n');

  const signature = await generateSignature(stringToSign, blobConfig.accountKey);
  
  return {
    'Authorization': `SharedKey ${blobConfig.accountName}:${signature}`,
    'x-ms-date': xMsDate,
    'x-ms-version': xMsVersion,
    'x-ms-blob-type': 'BlockBlob'
  };
};

// Save tasks to Azure Blob Storage
export const saveTasksToBlob = async (tasks) => {
  if (!blobConfig.enabled) {
    throw new Error('Blob storage not configured');
  }

  try {
    const csvContent = tasksToCSV(tasks);
    const blobUrl = `http://localhost:10000/devstoreaccount1/tasks/tasks.csv`;
    console.log('Saving tasks to blob URL:', blobUrl);
    
    const headers = await generateAuthHeader('PUT', blobUrl, csvContent.length, 'text/csv');
    
    const response = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'text/csv',
        'Content-Length': csvContent.length.toString()
      },
      body: csvContent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    console.log('Tasks saved to blob storage successfully');
    return true;
  } catch (error) {
    console.error('Error saving tasks to blob:', error);
    throw error;
  }
};

// Load tasks from Azure Blob Storage  
export const loadTasksFromBlob = async () => {
  if (!blobConfig.enabled) {
    throw new Error('Blob storage not configured');
  }

  try {
    const blobUrl = `http://localhost:10000/devstoreaccount1/tasks/tasks.csv`;    
    const headers = await generateAuthHeader('GET', blobUrl);
    
    const response = await fetch(blobUrl, {
      method: 'GET',
      headers
    });
    
    if (response.status === 404) {
      // File doesn't exist yet, return empty array
      return [];
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const csvContent = await response.text();
    const tasks = csvToTasks(csvContent);
    console.log('Tasks loaded from blob storage successfully');
    return tasks;
  } catch (error) {
    console.error('Error loading tasks from blob:', error);
    throw error;
  }
};

export const saveTasks = async (tasks) => {
  try {
    const csvContent = tasksToCSV(tasks);
    localStorage.setItem('plannerTasks', csvContent);
    
    // Also save to blob storage if configured
    if (blobConfig.enabled) {
      try {
        await saveTasksToBlob(tasks);
      } catch (blobError) {
        console.warn('Failed to save to blob storage, saved to localStorage only:', blobError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
};

export const loadTasks = async () => {
  // Load blob configuration first
  loadBlobConfig();
  
  try {
    // Try to load from blob storage first if configured
    if (blobConfig.enabled) {
      try {
        const blobTasks = await loadTasksFromBlob();
        console.log('Loaded tasks from blob storage');
        return blobTasks;
      } catch (blobError) {
        console.warn('Failed to load from blob storage, falling back to localStorage:', blobError);
      }
    }
    
    // Fallback to localStorage
    const csvContent = localStorage.getItem('plannerTasks');
    if (csvContent) {
      console.log('Loaded tasks from localStorage');
      return csvToTasks(csvContent);
    }
    
    return [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const exportTasks = async (tasks) => {
  try {
    const csvContent = tasksToCSV(tasks);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks.csv';
    link.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting tasks:', error);
    return false;
  }
};

export const importTasksFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const tasks = csvToTasks(csvContent);
        localStorage.setItem('plannerTasks', csvContent);
        resolve(tasks);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};