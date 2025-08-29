# 📋 React Task Planner

A beautiful and comprehensive task management application built with React that allows you to manage tasks with weekly, monthly, and yearly views. Features a custom design with unique icons and visual progress charts.

## 🌟 Features

- ✅ **Task Management**: Create, edit, delete, and toggle completion status of tasks
- 📝 **Subtasks**: Add unlimited nested subtasks for better organization  
- 📅 **Smart Date Filtering**: View tasks by week, month, or year with intuitive navigation
- 📊 **Visual Analytics**: Beautiful circular progress charts showing completion statistics
- 📜 **History View**: Navigate through past periods to view historical tasks
- 💾 **CSV Persistence**: Tasks automatically saved to CSV format in localStorage
- 📤 **Import/Export**: Import tasks from CSV files or export current tasks
- 📱 **Responsive Design**: Stunning UI that works perfectly on desktop and mobile
- 🎨 **Custom Design**: Unique gradient themes with glass-morphism effects
- ⚡ **Real-time Updates**: All changes automatically saved and synced
- 🔍 **Smart Current Week Focus**: Only current week allows task creation

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## 📖 How to Use

### 🎯 Current Period View
- The app defaults to the current week view
- **Add tasks** using the "➕ Add New Task" button (only available in current period)
- **Edit tasks** by clicking the ✏️ edit button
- **Add subtasks** using the ➕ button on any task
- **Complete tasks** by checking the custom checkbox

### 🕰️ Historical Navigation
- Use **📅 Week**, **🗓️ Month**, **📆 Year** buttons to switch views
- Navigate with **⬅️** and **➡️** arrows
- Jump back to current period with **🏠 Today** button
- Historical periods are read-only (indicated by 📜 History status)

### 📊 Progress Tracking
- **Circular Progress Chart** shows completion percentage
- **Real-time statistics**: Total, completed, and pending tasks
- **Visual indicators** with custom icons for different metrics

### 💾 Data Management
- **Auto-save**: Tasks automatically persist to localStorage
- **Export**: Download all tasks as CSV file using "💾 Export"
- **Import**: Upload CSV files using "📂 Import" button
- **Format**: Data stored in structured CSV with full task hierarchy

## 🏗️ Architecture

### 📁 Simple File Structure
```
src/
├── App.js              # Main app component
├── TaskManager.js      # Complete task management system
├── TaskManager.css     # Custom styling with gradients
└── utils.js           # All utilities consolidated
```

### 🔧 Core Components (All in TaskManager.js)
- **TaskManager**: Main application container
- **TaskChart**: Circular progress visualization
- **TaskItem**: Individual task with full CRUD operations
- **Date Navigator**: Period selection and navigation
- **Task Form**: Add new tasks with description and due dates

### ⚙️ Utilities (utils.js)
- **Date Management**: Week/month/year filtering with date-fns
- **Task Operations**: CRUD operations with subtask support
- **CSV Processing**: Import/export with proper escaping
- **Data Persistence**: localStorage integration

## 📊 Data Structure

Tasks use this comprehensive structure:

```javascript
{
  id: "unique-uuid",
  title: "Task title",
  description: "Optional description", 
  completed: false,
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z", 
  dueDate: "2024-01-20T00:00:00.000Z", // optional
  parentId: null, // for subtasks
  subtasks: [] // nested task array
}
```

## 🎨 Design Features

- **Glass-morphism UI**: Translucent panels with backdrop blur
- **Gradient Backgrounds**: Beautiful purple-blue gradients
- **Custom Icons**: Emoji-based icons for intuitive navigation
- **Smooth Animations**: Hover effects and micro-interactions
- **Responsive Layout**: Mobile-first design approach
- **Accessibility**: Focus states and keyboard navigation

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (Full featured layout)
- **Tablet**: 768px - 1199px (Adapted components)
- **Mobile**: Below 768px (Stacked layout)
- **Small Mobile**: Below 480px (Compact design)

## 🔄 Available Scripts

- `npm start`: Start development server
- `npm run build`: Create production build
- `npm test`: Run test suite
- `npm run eject`: Eject from Create React App

## 🎯 Key Workflow

1. **📅 Current Week**: Add and manage active tasks
2. **✅ Complete Tasks**: Check off finished items
3. **📈 Track Progress**: Monitor completion via charts
4. **🔄 Weekly Cycles**: Tasks become history after the week ends
5. **📜 Review History**: Navigate back to see past accomplishments
6. **💾 Backup Data**: Export important task collections

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest)
- ✅ Edge (latest)

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using React, date-fns, and modern CSS techniques.
