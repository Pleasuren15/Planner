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
import { GOOGLE_SHEETS_CONFIG } from './config';

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
export const createTask = (title, description = '', dueDate = null, parentId = null) => ({
  id: uuidv4(),
  title,
  description,
  completed: false,
  createdAt: createDateString(),
  updatedAt: createDateString(),
  dueDate,
  parentId,
  subtasks: []
});

export const updateTask = (task, updates) => ({
  ...task,
  ...updates,
  updatedAt: createDateString()
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
  const headers = ['id', 'title', 'description', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'parentId'];
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
        parentId || ''
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

// ========== GOOGLE SHEETS INTEGRATION ==========
export const loadTasksFromGoogleSheets = async () => {
  try {
    const response = await fetch(GOOGLE_SHEETS_CONFIG.PUBLISHED_CSV_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/csv',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvContent = await response.text();
    
    // Cache the data locally
    localStorage.setItem('plannerTasks', csvContent);
    
    return csvToTasks(csvContent);
  } catch (error) {
    console.error('Error loading tasks from Google Sheets:', error);
    // Fallback to localStorage if Google Sheets fails
    const localContent = localStorage.getItem('plannerTasks');
    return localContent ? csvToTasks(localContent) : [];
  }
};

export const saveTasksToGoogleSheets = async (tasks) => {
  try {
    const csvContent = tasksToCSV(tasks);
    
    // Save locally first
    localStorage.setItem('plannerTasks', csvContent);
    
    // Check if Google Apps Script is configured
    if (GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL) {
      try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updateTasks',
            data: tasks
          })
        });
        
        if (response.ok) {
          console.info('✅ Tasks successfully saved to Google Sheets');
          return true;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (apiError) {
        console.error('Google Apps Script error:', apiError);
        return true; // Still saved locally
      }
    } else {
      // Auto-copy CSV to clipboard for easy pasting
      try {
        await navigator.clipboard.writeText(csvContent);
        console.info('📋 CSV data copied to clipboard! Paste it into your Google Sheet.');
      } catch (clipboardError) {
        console.warn('Could not copy to clipboard:', clipboardError);
      }
      
      console.info('💾 Tasks saved locally. Set up Google Apps Script for automatic sync.');
      return true;
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
};

// Helper function to open Google Sheets in new tab for manual update
export const openGoogleSheetForUpdate = () => {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/edit`;
  window.open(sheetUrl, '_blank');
};

// Updated main functions to use Google Sheets
export const saveTasks = async (tasks) => {
  return await saveTasksToGoogleSheets(tasks);
};

export const loadTasks = async () => {
  return await loadTasksFromGoogleSheets();
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