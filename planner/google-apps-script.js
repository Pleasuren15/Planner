/**
 * Google Apps Script for Task Planner - Google Sheets Integration
 * 
 * Instructions:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace Code.gs content with this code
 * 4. Save the project
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 6. Copy the Web App URL and update APPS_SCRIPT_URL in utils.js
 * 7. Make sure your Google Sheet has the correct headers in row 1:
 *    id | title | description | completed | createdAt | updatedAt | dueDate | parentId
 */

const SHEET_ID = '1eUBMFjVeYZLNXVDusTlMxwqNzra-FCZVdIME3daG2Jk';
const SHEET_NAME = 'Sheet1'; // Change this if your sheet has a different name

function doPost(e) {
  try {
    // Parse the incoming request
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'updateTasks') {
      return updateTasksInSheet(requestData.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests for reading data
  try {
    const tasks = readTasksFromSheet();
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: tasks }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateTasksInSheet(tasks) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Clear existing data (keep headers)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Set headers if the sheet is empty
    const headers = ['id', 'title', 'description', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'parentId'];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Flatten tasks for CSV format
    const flatTasks = [];
    
    const flattenTasks = (taskList, parentId = null) => {
      taskList.forEach(task => {
        flatTasks.push([
          task.id,
          task.title,
          task.description || '',
          task.completed ? 'true' : 'false',
          task.createdAt,
          task.updatedAt,
          task.dueDate || '',
          parentId || ''
        ]);
        
        if (task.subtasks && task.subtasks.length > 0) {
          flattenTasks(task.subtasks, task.id);
        }
      });
    };
    
    flattenTasks(tasks);
    
    // Write data to sheet
    if (flatTasks.length > 0) {
      sheet.getRange(2, 1, flatTasks.length, headers.length).setValues(flatTasks);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: `Updated ${flatTasks.length} tasks` }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readTasksFromSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) return [];
    
    const headers = data[0];
    const tasks = [];
    const taskMap = new Map();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const task = {
        id: row[0],
        title: row[1],
        description: row[2],
        completed: row[3] === 'true',
        createdAt: row[4],
        updatedAt: row[5],
        dueDate: row[6] || null,
        parentId: row[7] || null,
        subtasks: []
      };
      
      taskMap.set(task.id, task);
      
      if (task.parentId) {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          parent.subtasks.push(task);
        }
      } else {
        tasks.push(task);
      }
    }
    
    return tasks;
  } catch (error) {
    throw new Error(`Error reading from sheet: ${error.toString()}`);
  }
}

// Test functions for development
function testUpdateTasks() {
  const sampleTasks = [
    {
      id: 'test-1',
      title: 'Test Task 1',
      description: 'Test description',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      parentId: null,
      subtasks: [
        {
          id: 'test-1-1',
          title: 'Test Subtask 1',
          description: '',
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: null,
          parentId: 'test-1',
          subtasks: []
        }
      ]
    }
  ];
  
  return updateTasksInSheet(sampleTasks);
}

function testReadTasks() {
  return readTasksFromSheet();
}