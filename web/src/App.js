import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
    }
  }
`;

const GET_TODOS = gql`
  query GetTodos($userId: ID!) {
    getTodos(userId: $userId) {
      id
      text
      completed
    }
  }
`;

const CREATE_TODO = gql`
  mutation CreateTodo($userId: ID!, $text: String!) {
    createTodo(userId: $userId, text: $text) {
      id
      text
      completed
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('todo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('todo_theme') === 'dark';
  });

  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [login] = useMutation(LOGIN_USER);

  useEffect(() => {
    if (user && darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('todo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('todo_theme', 'light');
    }
  }, [darkMode, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      setErrorMsg('');
      const { data } = await login({ variables: { email, password } });
      setUser(data.login);
      localStorage.setItem('todo_user', JSON.stringify(data.login));
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('todo_user');
  };

  // Clean permanent light-mode login view
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mb-3 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to access your task dashboard</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-medium">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 text-sm transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 text-sm transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition p-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition duration-200 shadow-md disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-500">
            Demo Credentials: <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">test@test.com</span> / <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">password123</span>
          </div>
        </div>
      </div>
    );
  }

  return <TodoDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;
}

function TodoDashboard({ user, onLogout, darkMode, setDarkMode }) {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); 
  const [sortBy, setSortBy] = useState('default');
  const [localCompletedMap, setLocalCompletedMap] = useState({});
  const [localPriorityMap, setLocalPriorityMap] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data, loading, refetch } = useQuery(GET_TODOS, { variables: { userId: user.id } });
  const [createTodo] = useMutation(CREATE_TODO);
  const [deleteTodo] = useMutation(DELETE_TODO);

  const inputStyle = {
    backgroundColor: darkMode ? '#334155' : '#ffffff',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderColor: darkMode ? '#475569' : '#cbd5e1'
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!taskText.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const res = await createTodo({ variables: { userId: user.id, text: taskText } });
      if (res?.data?.createTodo?.id) {
        setLocalPriorityMap(prev => ({
          ...prev,
          [res.data.createTodo.id]: priority
        }));
      }
      setTaskText('');
      await refetch();
      showToast('Task added successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo({ variables: { id } });
      await refetch();
      showToast('Task deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditPriority(localPriorityMap[task.id] || 'Medium');
  };

  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;
    setLocalPriorityMap(prev => ({
      ...prev,
      [id]: editPriority
    }));
    setEditingId(null);
    showToast('Task updated!');
  };

  const handleClearCompleted = async () => {
    const completedTasks = allTasks.filter(item => 
      localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed
    );
    try {
      for (const task of completedTasks) {
        await deleteTodo({ variables: { id: task.id } });
      }
      await refetch();
      showToast('Cleared all completed tasks!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJSON = () => {
    const exportData = allTasks.map(item => ({
      id: item.id,
      text: item.text,
      completed: localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed,
      priority: localPriorityMap[item.id] || 'Medium'
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tasks_backup_${user.email.split('@')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported tasks to JSON!');
  };

  const toggleComplete = (id) => {
    setLocalCompletedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allTasks = data?.getTodos || [];
  
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter(item => localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const allSelected = totalCount > 0 && totalCount === completedCount;

  const handleSelectAll = () => {
    const newMap = {};
    const targetState = !allSelected;
    allTasks.forEach(item => {
      newMap[item.id] = targetState;
    });
    setLocalCompletedMap(newMap);
    showToast(targetState ? 'All tasks marked completed!' : 'All tasks unmarked.');
  };

  let filteredTasks = allTasks.filter(item => {
    const isDone = localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed;
    
    if (filterTab === 'active' && isDone) return false;
    if (filterTab === 'completed' && !isDone) return false;

    if (searchQuery.trim() && !item.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.text.localeCompare(b.text);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      const prioA = priorityOrder[localPriorityMap[a.id] || 'Medium'];
      const prioB = priorityOrder[localPriorityMap[b.id] || 'Medium'];
      return prioA - prioB;
    }
    return 0;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'High':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: darkMode ? '#450a0a' : '#fef2f2',
              color: darkMode ? '#fca5a5' : '#dc2626',
              borderColor: darkMode ? '#7f1d1d' : '#fecaca'
            }}>
            High
          </span>
        );
      case 'Low':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: darkMode ? '#0c4a6e' : '#f0f9ff',
              color: darkMode ? '#7dd3fc' : '#0284c7',
              borderColor: darkMode ? '#075985' : '#bae6fd'
            }}>
            Low
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: darkMode ? '#451a03' : '#fffbeb',
              color: darkMode ? '#fcd34d' : '#d97706',
              borderColor: darkMode ? '#78350f' : '#fde68a'
            }}>
            Medium
          </span>
        );
    }
  };

  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = darkMode ? '#94a3b8' : '#475569';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const cardBorder = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="min-h-screen py-10 px-4 relative transition-colors duration-200" style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc', color: textColor }}>
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center p-6 rounded-2xl shadow-sm border transition-colors" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center text-lg shadow-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: textColor }}>Task Dashboard</h1>
              <p className="text-xs mt-0.5" style={{ color: subTextColor }}>
                Connected as <span className="font-semibold" style={{ color: textColor }}>{user.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition border"
              style={inputStyle}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 border border-rose-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Progress Overview Card */}
        {totalCount > 0 && (
          <div className="p-5 rounded-2xl shadow-sm border transition-colors" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: subTextColor }}>Progress Overview</span>
              <span className="text-xs font-semibold text-emerald-600">
                {completedCount} of {totalCount} completed ({progressPercent}%) {progressPercent === 100 ? '🎉' : ''}
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#334155' : '#e2e8f0' }}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Add Task Input Form */}
        <div className="p-5 rounded-2xl shadow-sm border space-y-3 transition-colors" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="What needs to be accomplished today?" 
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition"
              style={inputStyle}
            />
            <div className="flex gap-2">
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                style={inputStyle}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
              <button 
                type="submit"
                disabled={isAdding || !taskText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {isAdding ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>

        {/* Tasks List Card */}
        <div className="rounded-2xl shadow-sm border overflow-hidden transition-colors" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          
          {/* Controls Header */}
          <div className="p-5 border-b space-y-3" style={{ backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderColor: cardBorder }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              
              {/* Filter Tabs */}
              <div className="flex p-1 rounded-xl text-xs font-medium w-full sm:w-auto" style={{ backgroundColor: darkMode ? '#334155' : '#e2e8f0' }}>
                <button 
                  onClick={() => setFilterTab('all')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition font-semibold"
                  style={{
                    backgroundColor: filterTab === 'all' ? (darkMode ? '#475569' : '#ffffff') : 'transparent',
                    color: filterTab === 'all' ? textColor : subTextColor
                  }}
                >
                  All ({allTasks.length})
                </button>
                <button 
                  onClick={() => setFilterTab('active')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition font-semibold"
                  style={{
                    backgroundColor: filterTab === 'active' ? (darkMode ? '#475569' : '#ffffff') : 'transparent',
                    color: filterTab === 'active' ? textColor : subTextColor
                  }}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFilterTab('completed')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition font-semibold"
                  style={{
                    backgroundColor: filterTab === 'completed' ? (darkMode ? '#475569' : '#ffffff') : 'transparent',
                    color: filterTab === 'completed' ? textColor : subTextColor
                  }}
                >
                  Completed
                </button>
              </div>

              {/* Instant Search & Sort Options */}
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  style={inputStyle}
                >
                  <option value="default">Sort by: Default</option>
                  <option value="priority">Sort by: Priority</option>
                  <option value="alphabetical">Sort by: Name (A-Z)</option>
                </select>

                <div className="relative flex-1 sm:w-48">
                  <input 
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    style={inputStyle}
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center pt-2 text-xs">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  disabled={totalCount === 0}
                  className="font-bold text-indigo-600 hover:underline disabled:opacity-40"
                >
                  {allSelected ? '☑ Deselect All' : '☐ Select All'}
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={allTasks.length === 0}
                  className="font-bold text-indigo-600 hover:underline disabled:opacity-40"
                >
                  📥 Export JSON
                </button>
              </div>

              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="font-semibold text-rose-600 hover:underline transition"
                >
                  Clear Completed ({completedCount})
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading tasks...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-sm" style={{ color: textColor }}>No tasks found</p>
              <p className="text-xs mt-1" style={{ color: subTextColor }}>Try adjusting your search, filters, or add a new task!</p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: cardBorder }}>
              {filteredTasks.map((item) => {
                const isDone = localCompletedMap[item.id] !== undefined ? localCompletedMap[item.id] : item.completed;
                const taskPriority = localPriorityMap[item.id] || 'Medium';
                const isEditingThis = editingId === item.id;

                return (
                  <li key={item.id} className="px-6 py-4 flex items-center justify-between transition hover:opacity-90" style={{ borderBottomColor: cardBorder }}>
                    <div className="flex items-center gap-3.5 flex-1 pr-4">
                      <input 
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleComplete(item.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="px-2.5 py-1 text-xs border rounded-md focus:outline-none flex-1"
                            style={inputStyle}
                          />
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            className="px-2 py-1 text-xs border rounded-md focus:outline-none"
                            style={inputStyle}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                          <button 
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-xs font-bold text-emerald-600 px-2 py-1"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1">
                          <span 
                            onDoubleClick={() => handleStartEdit(item)}
                            className="text-sm font-semibold transition cursor-pointer"
                            style={{
                              color: isDone ? '#94a3b8' : textColor,
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}
                          >
                            {item.text}
                          </span>
                          {getPriorityBadge(taskPriority)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!isEditingThis && (
                        <button 
                          onClick={() => handleStartEdit(item)}
                          className="text-xs font-semibold px-2 py-1 rounded transition hover:text-indigo-600"
                          style={{ color: subTextColor }}
                        >
                          Edit
                        </button>
                      )}
<button 
  onClick={() => handleDeleteTodo(item.id)}
  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition duration-150 border"
  style={{
    backgroundColor: darkMode ? '#450a0a' : '#fef2f2',
    color: darkMode ? '#fca5a5' : '#dc2626',
    borderColor: darkMode ? '#7f1d1d' : '#fecaca'
  }}
>
  Delete
</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}