import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  filterTasksByDateRange,
  formatDateRange,
  navigateDate,
  isCurrentPeriod,
  createTask,
  updateTask,
  toggleTaskCompletion,
  getTaskStats,
  loadTasks,
  saveTasks,
  exportTasks,
  importTasksFromFile
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('taskPlannerTheme');
    return saved ? saved === 'dark' : true; // default to dark
  });

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

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('taskPlannerTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

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

  // Get filtered tasks based on current date and view type
  const filteredTasks = useMemo(() => {
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
        range = getCurrentWeekRange(currentDate);
    }
    return filterTasksByDateRange(tasks, range);
  }, [tasks, currentDate, viewType]);

  // Get task statistics
  const taskStats = useMemo(() => getTaskStats(filteredTasks), [filteredTasks]);

  const isCurrentView = isCurrentPeriod(currentDate, viewType);

  // Task CRUD operations
  const addTask = useCallback((title, description = '', dueDate = null) => {
    const newTask = createTask(title, description, dueDate);
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
        const subtask = createTask(subtaskTitle, '', null, parentTaskId);
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
      addTask(newTaskTitle.trim(), newTaskDescription.trim(), newTaskDueDate || null);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
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

  // Get date range for display
  const getDateRange = () => {
    switch (viewType) {
      case 'week':
        return getCurrentWeekRange(currentDate);
      case 'month':
        return getCurrentMonthRange(currentDate);
      case 'year':
        return getCurrentYearRange(currentDate);
      default:
        return getCurrentWeekRange(currentDate);
    }
  };

  const range = getDateRange();

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
          
          <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* Period Indicator in Header */}
        <div className="period-indicator">
          {isCurrentView ? (
            <span className="current-indicator">⚡ Current {viewType}</span>
          ) : (
            <span className="history-indicator">📜 History - {viewType}</span>
          )}
        </div>
      </header>

      {/* Top Controls Row */}
      <div className="top-controls">
        {/* Date Navigator */}
        <div className="date-navigator">
          <div className="view-type-selector">
            <button className={`view-btn ${viewType === 'week' ? 'active' : ''}`} onClick={() => setViewType('week')}>
              📅 Week
            </button>
            <button className={`view-btn ${viewType === 'month' ? 'active' : ''}`} onClick={() => setViewType('month')}>
              🗓️ Month
            </button>
            <button className={`view-btn ${viewType === 'year' ? 'active' : ''}`} onClick={() => setViewType('year')}>
              📆 Year
            </button>
          </div>

          <div className="date-controls">
            <button onClick={() => handleNavigate('prev')} className="nav-btn" title={`Previous ${viewType}`}>
              ⬅️
            </button>
            
            <div className="date-display">
              <span className="date-range">{formatDateRange(range, viewType)}</span>
            </div>
            
            <button onClick={() => handleNavigate('next')} className="nav-btn" title={`Next ${viewType}`}>
              ➡️
            </button>
          </div>

          {!isCurrentView && (
            <button onClick={goToToday} className="today-btn" title="Go to current period">
              🏠 Today
            </button>
          )}
        </div>

        {/* Task Statistics Chart */}
        <TaskChart stats={taskStats} viewType={viewType} />
      </div>

      {/* Task Management Section */}
      <div className="content-area">
        {/* Task Form - Only show in current view */}
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

        {/* Task List */}
        <main className="main-content">
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
                  {isCurrentView 
                    ? `No tasks for this ${viewType}. Add some tasks to get started!` 
                    : `No tasks found for this ${viewType}.`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="task-list">
              <div className="task-summary-bar">
                <span className="summary-item">📊 Total: {tasks.length}</span>
                <span className="summary-item">🔍 Filtered: {filteredTasks.length}</span>
                <span className="summary-item">✅ Completed: {filteredTasks.filter(t => t.completed).length}</span>
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