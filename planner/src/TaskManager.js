import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  createTask,
  updateTask,
  toggleTaskCompletion,
  getTaskStats,
  loadTasks,
  saveTasks,
  exportTasks,
  importTasksFromFile,
  configureBlobStorage,
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  filterTasksByDateRange,
  formatDateRange,
  navigateDate,
  isCurrentPeriod
} from './utils';
import './TaskManager.css';

// Custom Chart Component
const TaskChart = ({ stats, viewType }) => {
  const { total, completed, pending, completionRate } = stats;
  
  const circumference = 2 * Math.PI * 38;
  const strokeDasharray = `${(completionRate / 100) * circumference} ${circumference}`;
  
  return (
    <div className="task-chart">
      <div className="chart-container">
        <svg className="progress-ring" width="100" height="100">
          <circle
            className="progress-ring-circle-bg"
            stroke="#e2e8f0"
            strokeWidth="6"
            fill="transparent"
            r="38"
            cx="50"
            cy="50"
          />
          <circle
            className="progress-ring-circle"
            stroke="#10b981"
            strokeWidth="6"
            fill="transparent"
            r="38"
            cx="50"
            cy="50"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="55" textAnchor="middle" className="progress-text">
            {completionRate}%
          </text>
        </svg>
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-icon">📋</span>
            <div className="stat-details">
              <span className="stat-label">Total</span>
              <span className="stat-value">{total}</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <div className="stat-details">
              <span className="stat-label">Done</span>
              <span className="stat-value">{completed}</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⏳</span>
            <div className="stat-details">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Item Component
const TaskItem = ({ task, onToggle, onEdit, onDelete, onAddSubtask, onEditSubtask, onDeleteSubtask, level = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const handleEdit = () => {
    if (editTitle.trim()) {
      onEdit(task.id, { title: editTitle.trim(), description: editDescription.trim() });
      setIsEditing(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
    }
  };

  const handleSubtaskToggle = (subtaskId) => {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    onEditSubtask(task.id, subtaskId, { completed: !subtask.completed });
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} level-${level}`}>
      <div className="task-main">
        <div className="task-content">
          <button
            className={`task-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
          >
            {task.completed ? '✓' : ''}
          </button>
          
          {isEditing ? (
            <div className="task-edit">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-title"
                placeholder="Task title..."
                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="edit-description"
                placeholder="Task description..."
                rows="2"
              />
              <div className="edit-actions">
                <button onClick={handleEdit} className="btn-save">💾 Save</button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(task.title);
                    setEditDescription(task.description || '');
                  }}
                  className="btn-cancel"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="task-info">
              <h3 className="task-title">{task.title}</h3>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-meta">
                <span className="task-date">
                  🗓️ {new Date(task.createdAt).toLocaleDateString()}
                </span>
                <span className="task-category">
                  {task.category === 'work' ? '💼' : '👤'} {task.category || 'personal'}
                </span>
                <span className={`task-priority priority-${task.priority || 'medium'}`}>
                  {task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'} {task.priority || 'medium'}
                </span>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="subtask-count">
                    📝 {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="task-actions">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="btn-edit" title="Edit task">
                ✏️
              </button>
              <button onClick={() => setShowAddSubtask(!showAddSubtask)} className="btn-add-subtask" title="Add subtask">
                ➕
              </button>
              {task.subtasks && task.subtasks.length > 0 && (
                <button onClick={() => setShowSubtasks(!showSubtasks)} className="btn-toggle-subtasks">
                  {showSubtasks ? '🔼' : '🔽'}
                </button>
              )}
              <button onClick={() => onDelete(task.id)} className="btn-delete" title="Delete task">
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {showAddSubtask && (
        <div className="add-subtask">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Enter subtask title..."
            className="subtask-input"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
            autoFocus
          />
          <div className="subtask-actions">
            <button onClick={handleAddSubtask} className="btn-add">➕ Add</button>
            <button onClick={() => { setShowAddSubtask(false); setNewSubtaskTitle(''); }} className="btn-cancel">❌ Cancel</button>
          </div>
        </div>
      )}

      {showSubtasks && task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onToggle={handleSubtaskToggle}
              onEdit={(_, updates) => onEditSubtask(task.id, subtask.id, updates)}
              onDelete={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
              onAddSubtask={() => {}}
              onEditSubtask={() => {}}
              onDeleteSubtask={() => {}}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main TaskManager Component
const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('personal'); // 'personal' or 'work'
  const [newTaskPriority, setNewTaskPriority] = useState('medium'); // 'low', 'medium', 'high'
  const [showBlobConfig, setShowBlobConfig] = useState(false);
  const [blobConnectionString, setBlobConnectionString] = useState('');
  const [blobContainerName, setBlobContainerName] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending'
  const [showChart, setShowChart] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('all'); // 'all', 'week', 'month', 'year'

  // Load tasks on component mount
  useEffect(() => {
    const initializeTasks = async () => {
      try {
        setLoading(true);
        const loadedTasks = await loadTasks();
        setTasks(loadedTasks);
        setError(null);
      } catch (err) {
        setError('Failed to load tasks');
        console.error('Error loading tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    initializeTasks();
  }, []);

  // Save tasks to storage
  const saveTasksToStorage = useCallback(async (updatedTasks) => {
    try {
      await saveTasks(updatedTasks);
      setError(null);
    } catch (err) {
      setError('Failed to save tasks');
      console.error('Error saving tasks:', err);
    }
  }, []);

  // Get filtered and searched tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply date range filter
    if (viewType !== 'all') {
      let range;
      switch (viewType) {
        case 'week':
          range = getCurrentWeekRange(currentDate);
          break;
        case 'month':
          range = getCurrentMonthRange(currentDate);
          break;
        case 'year':
          range = getCurrentYearRange(currentDate);
          break;
        default:
          range = null;
      }
      if (range) {
        filtered = filterTasksByDateRange(filtered, range);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchInTasks = (taskList) => {
        return taskList.filter(task => {
          const matchesTitle = task.title.toLowerCase().includes(query);
          const matchesDescription = task.description && task.description.toLowerCase().includes(query);
          const hasMatchingSubtasks = task.subtasks && searchInTasks(task.subtasks).length > 0;
          
          return matchesTitle || matchesDescription || hasMatchingSubtasks;
        }).map(task => ({
          ...task,
          subtasks: task.subtasks ? searchInTasks(task.subtasks) : []
        }));
      };
      filtered = searchInTasks(filtered);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const filterByStatus = (taskList) => {
        return taskList.filter(task => {
          const isCompleted = task.completed;
          const matchesFilter = filterStatus === 'completed' ? isCompleted : !isCompleted;
          return matchesFilter;
        }).map(task => ({
          ...task,
          subtasks: task.subtasks ? filterByStatus(task.subtasks) : []
        }));
      };
      filtered = filterByStatus(filtered);
    }

    return filtered;
  }, [tasks, searchQuery, filterStatus, viewType, currentDate]);

  // Get task statistics
  const taskStats = useMemo(() => getTaskStats(filteredTasks), [filteredTasks]);

  const isCurrentView = viewType === 'all' || isCurrentPeriod(currentDate, viewType);

  // Task CRUD operations
  const addTask = useCallback((title, description = '', dueDate = null, category = 'personal', priority = 'medium') => {
    const newTask = createTask(title, description, dueDate, null, category, priority);
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
    return newTask;
  }, [tasks, saveTasksToStorage]);

  const deleteTask = useCallback((taskId) => {
    const removeTaskById = (taskList, id) => {
      return taskList.filter(task => {
        if (task.id === id) return false;
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks = removeTaskById(task.subtasks, id);
        }
        return true;
      });
    };
    const updatedTasks = removeTaskById(tasks, taskId);
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  const editTask = useCallback((taskId, updates) => {
    const updateTaskById = (taskList, id, updates) => {
      return taskList.map(task => {
        if (task.id === id) {
          return updateTask(task, updates);
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskById(task.subtasks, id, updates) };
        }
        return task;
      });
    };
    const updatedTasks = updateTaskById(tasks, taskId, updates);
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  const toggleTask = useCallback((taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return toggleTaskCompletion(task);
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  const addSubtask = useCallback((parentTaskId, subtaskTitle) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === parentTaskId) {
        const subtask = createTask(subtaskTitle, '', null, parentTaskId, task.category, task.priority);
        return updateTask(task, { subtasks: [...task.subtasks, subtask] });
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  const editSubtask = useCallback((parentTaskId, subtaskId, updates) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === parentTaskId) {
        return updateTask(task, {
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId ? updateTask(subtask, updates) : subtask
          )
        });
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  const deleteSubtask = useCallback((parentTaskId, subtaskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === parentTaskId) {
        return updateTask(task, {
          subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
        });
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  }, [tasks, saveTasksToStorage]);

  // Date navigation
  const handleNavigate = (direction) => {
    const newDate = navigateDate(currentDate, direction, viewType);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Form handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim(), newTaskDescription.trim(), newTaskDueDate || null, newTaskCategory, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskCategory('personal');
      setNewTaskPriority('medium');
      setShowAddTask(false);
    }
  };

  const handleImportTasks = async (file) => {
    try {
      const importedTasks = await importTasksFromFile(file);
      setTasks(importedTasks);
      alert('📥 Tasks imported successfully!');
    } catch (error) {
      console.error('Error importing tasks:', error);
      alert('❌ Error importing tasks. Please check the file format.');
    }
  };

  const handleExportTasks = () => {
    exportTasks(tasks);
  };

  const handleConfigureBlob = async () => {
    try {
      configureBlobStorage(blobConnectionString, blobContainerName);
      setShowBlobConfig(false);
      alert('✅ Blob storage configured! Auto-sync enabled - tasks will automatically sync to Azure Blob Storage.');
      // Save current tasks to blob immediately
      await saveTasks(tasks);
    } catch (error) {
      console.error('Error configuring blob storage:', error);
      alert('❌ Error configuring blob storage. Please check your connection string.');
    }
  };

  if (error) {
    return (
      <div className="task-manager error">
        <div className="error-message">
          <h2>🚫 Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-reload">
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-manager">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="app-title">📋 Task Planner</h1>
            <p className="app-description">Organize your life, one task at a time</p>
          </div>
          
          <div className="header-controls">
            <button onClick={() => setShowChart(!showChart)} className="chart-toggle" title="View Statistics">
              📊
            </button>
            <button onClick={() => setShowBlobConfig(!showBlobConfig)} className="settings-toggle" title="Blob Storage Settings">
              ⚙️
            </button>
          </div>
        </div>
        
        {/* Status Indicator in Header */}
        <div className="period-indicator">
          {viewType === 'all' ? (
            <span className="current-indicator">📋 All Tasks</span>
          ) : (
            <span className={isCurrentView ? "current-indicator" : "history-indicator"}>
              {isCurrentView ? '⚡' : '📜'} {formatDateRange(
                viewType === 'week' ? getCurrentWeekRange(currentDate) :
                viewType === 'month' ? getCurrentMonthRange(currentDate) :
                getCurrentYearRange(currentDate), viewType
              )}
            </span>
          )}
          {searchQuery && (
            <span className="search-indicator">🔍 "{searchQuery}"</span>
          )}
          {filterStatus !== 'all' && (
            <span className="filter-indicator">
              {filterStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
            </span>
          )}
        </div>
      </header>

      {/* Blob Storage Settings Modal */}
      {showBlobConfig && (
        <div className="modal-overlay" onClick={() => setShowBlobConfig(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Azure Blob Storage Settings</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowBlobConfig(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="config-inputs">
                <div className="input-group">
                  <label htmlFor="connectionString">Connection String</label>
                  <textarea
                    id="connectionString"
                    value={blobConnectionString}
                    onChange={(e) => setBlobConnectionString(e.target.value)}
                    placeholder="DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey;EndpointSuffix=core.windows.net"
                    className="form-input connection-string-input"
                    rows="3"
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="containerName">Container Name</label>
                  <input
                    id="containerName"
                    type="text"
                    value={blobContainerName}
                    onChange={(e) => setBlobContainerName(e.target.value)}
                    placeholder="tasks"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="config-help">
                <div className="help-section">
                  <h4>📋 Setup Instructions</h4>
                  <ol>
                    <li>Go to Azure Portal → Storage Account</li>
                    <li>Navigate to "Access keys" section</li>
                    <li>Copy the connection string</li>
                    <li>Create a container (default: 'tasks')</li>
                    <li>Paste connection string above</li>
                  </ol>
                </div>
                
                <div className="help-section">
                  <h4>🔄 Auto-Sync</h4>
                  <p>Once configured, all task changes will automatically sync to Azure Blob Storage in the background.</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={handleConfigureBlob} 
                className="btn-save-config" 
                disabled={!blobConnectionString}
              >
                💾 Save & Enable Auto-Sync
              </button>
              <button 
                onClick={() => setShowBlobConfig(false)} 
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Statistics Chart Modal */}
      {showChart && (
        <div className="modal-overlay" onClick={() => setShowChart(false)}>
          <div className="modal-content chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Task Statistics</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowChart(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body chart-modal-body">
              <TaskChart stats={taskStats} viewType="all" />
              
              <div className="chart-details">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                      <div className="stat-number">{taskStats.total}</div>
                      <div className="stat-label">Total Tasks</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <div className="stat-number">{taskStats.completed}</div>
                      <div className="stat-label">Completed</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                      <div className="stat-number">{taskStats.pending}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                      <div className="stat-number">{taskStats.completionRate}%</div>
                      <div className="stat-label">Completion Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Management Section */}
      <div className="content-area">
        {/* Task List */}
        <main className="main-content">
          {/* Task Form - At the top of main content */}
          {isCurrentView && (
            <div className="task-form">
              <div className="form-header">
                <button onClick={() => setShowAddTask(!showAddTask)} className="btn-add-task">
                  {showAddTask ? '❌ Cancel' : '➕ Add New Task'}
                </button>
                
                <div className="form-actions">
                  <button onClick={handleExportTasks} className="btn-export" title="Export tasks to CSV">
                    💾 Export
                  </button>
                  <label className="btn-import">
                    📂 Import
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.type === 'text/csv') {
                          handleImportTasks(file);
                        }
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {showAddTask && (
                <form onSubmit={handleAddTask} className="add-task-form">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="📝 Enter task title..."
                    className="form-input title-input"
                    required
                    autoFocus
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="📄 Enter task description (optional)..."
                    className="form-input description-input"
                    rows="3"
                  />
                  <div className="form-row">
                    <label className="form-label">
                      📅 Due Date (optional):
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="form-input date-input"
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        📂 Category:
                        <select
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="form-input category-select"
                        >
                          <option value="personal">👤 Personal</option>
                          <option value="work">💼 Work</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        ⚡ Priority:
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="form-input priority-select"
                        >
                          <option value="low">🟢 Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🔴 High</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="btn-submit" disabled={!newTaskTitle.trim()}>
                      ➕ Add Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTask(false);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskDueDate('');
                        setNewTaskCategory('personal');
                        setNewTaskPriority('medium');
                      }}
                      className="btn-cancel"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          {/* Search Input */}
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Date Navigation - Only show when not viewing all tasks */}
          {viewType !== 'all' && (
            <div className="date-navigation">
              <button 
                onClick={() => handleNavigate('prev')} 
                className="nav-btn" 
                title={`Previous ${viewType}`}
              >
                ⬅️
              </button>
              
              <div className="date-display">
                <span className="date-range">
                  {formatDateRange(
                    viewType === 'week' ? getCurrentWeekRange(currentDate) :
                    viewType === 'month' ? getCurrentMonthRange(currentDate) :
                    getCurrentYearRange(currentDate), viewType
                  )}
                </span>
              </div>
              
              <button 
                onClick={() => handleNavigate('next')} 
                className="nav-btn" 
                title={`Next ${viewType}`}
              >
                ➡️
              </button>
              
              {!isCurrentView && (
                <button 
                  onClick={goToToday} 
                  className="today-btn" 
                  title="Go to current period"
                >
                  🏠 Today
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="task-list-loading">
              <div className="loading-spinner"></div>
              <p>⏳ Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="task-list-empty">
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p className="empty-message">
                  {(searchQuery || filterStatus !== 'all')
                    ? 'No tasks match your search or filter criteria.'
                    : 'No tasks yet. Add some tasks to get started!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="task-list">
              <div className="task-summary-bar">
                <div className="summary-stats">
                  <span className="summary-item">📊 Total: {tasks.length}</span>
                  <span className="summary-item">🔍 Showing: {filteredTasks.length}</span>
                  <span className="summary-item">✅ Completed: {filteredTasks.filter(t => t.completed).length}</span>
                </div>
                
                <div className="filter-buttons">
                  <select 
                    className="date-filter-dropdown"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                  >
                    <option value="all">📋 All Time</option>
                    <option value="week">📅 This Week</option>
                    <option value="month">🗓️ This Month</option>
                    <option value="year">📆 This Year</option>
                  </select>
                  
                  <button 
                    className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    📋 All
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('pending')}
                  >
                    ⏳ Pending
                  </button>
                  <button 
                    className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('completed')}
                  >
                    ✅ Done
                  </button>
                </div>
              </div>
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  onAddSubtask={addSubtask}
                  onEditSubtask={editSubtask}
                  onDeleteSubtask={deleteSubtask}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TaskManager;