import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, User, LogOut, Bell, Check, X } from 'lucide-react';
const TaskScheduler = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [isSignup, setIsSignup] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    status: 'pending'
  });
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([
    { id: 1, username: 'demo', password: btoa('demo123' + 'salt123') },
    { id: 2, username: 'admin', password: btoa('admin123' + 'salt123') }
  ]);
  const [userTasksDB, setUserTasksDB] = useState({});
  const hashPassword = (password) => {
    return btoa(password + 'salt123');
  };
  useEffect(() => {
    if (user) {
      const userTasks = userTasksDB[user.id] || [];
      setTasks(userTasks);
    }
  }, [user]);
  useEffect(() => {
    if (user && tasks.length >= 0) {
      setUserTasksDB(prev => ({
        ...prev,
        [user.id]: tasks
      }));
    }
  }, [tasks, user]);
  useEffect(() => {
    if (!user) return;

    const checkDeadlines = () => {
      const now = new Date();
      const upcomingTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        const deadline = new Date(task.deadline);
        const timeDiff = deadline - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff > 0 && hoursDiff <= 24; 
      });

      upcomingTasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const timeDiff = deadline - now;
        const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
        
        const existingNotification = notifications.find(n => n.taskId === task.id);
        if (!existingNotification) {
          const notification = {
            id: Date.now() + Math.random(),
            taskId: task.id,
            message: `"${task.title}" is due in ${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''}!`,
            timestamp: now,
            type: hoursDiff <= 1 ? 'urgent' : 'warning'
          };
          setNotifications(prev => [...prev, notification]);
        }
      });
    };

    const interval = setInterval(checkDeadlines, 30000); 
    checkDeadlines(); 
    return () => clearInterval(interval);
  }, [tasks, user, notifications]);
  const handleLogin = () => {
    const foundUser = users.find(u => 
      u.username === loginForm.username && 
      u.password === hashPassword(loginForm.password)
    );
    if (foundUser) {
      setUser(foundUser);
      setShowLogin(false);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Bhai test er jonne eta use kor: \n\nDemo accounts:\nUsername: demo, Password: demo123\nUsername: admin, Password: admin123');
    }
  };
  const handleSignup = () => {
    if (signupForm.password !== signupForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (signupForm.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    if (users.find(u => u.username === signupForm.username)) {
      alert('Username already exists');
      return;
    }
    const newUser = {
      id: Date.now(),
      username: signupForm.username,
      password: hashPassword(signupForm.password)
    };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setShowLogin(false);
    setSignupForm({ username: '', password: '', confirmPassword: '' });
  };
  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
    setTasks([]);
    setNotifications([]);
  };
  const handleSubmitTask = () => {
    if (!taskForm.title || !taskForm.deadline) {
      alert('Please fill in title and deadline');
      return;
    }
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...taskForm, id: editingTask.id }
          : task
      ));
      setEditingTask(null);
    } else {
      const newTask = {
        ...taskForm,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }
    setTaskForm({
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
      status: 'pending'
    });
    setShowTaskForm(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
      setNotifications(notifications.filter(n => n.taskId !== taskId));
    }
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeadlineStatus = (deadline, status) => {
    if (status === 'completed') return 'completed';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;
    
    if (timeDiff < 0) return 'overdue';
    if (timeDiff < 24 * 60 * 60 * 1000) return 'urgent'; 
    if (timeDiff < 3 * 24 * 60 * 60 * 1000) return 'warning'; 
    return 'normal';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Calendar className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Task Scheduler</h1>
            <p className="text-gray-600 mt-2">Manage your tasks and deadlines</p>
          </div>

          {!isSignup ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Login
              </button>
              <div className="text-center text-xs text-gray-500 mt-2">
                <p>Demo accounts:</p>
                <p>Username: demo, Password: demo123</p>
                <p>Username: admin, Password: admin123</p>
              </div>
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-indigo-600 hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Choose username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Choose password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirm password"
                  onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                />
              </div>
              <button
                onClick={handleSignup}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignup(false)}
                  className="text-indigo-600 hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Task Scheduler</h1>
            </div>
            <div className="flex items-center space-x-4">
              {notifications.length > 0 && (
                <div className="relative">
                  <Bell className="h-6 w-6 text-gray-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-1" />
                {user.username}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.type === 'urgent' 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-yellow-50 border-yellow-500'
                } flex justify-between items-center`}
              >
                <div className="flex items-center">
                  <Bell className={`h-5 w-5 mr-3 ${
                    notification.type === 'urgent' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Add Task Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
        {/* Task Form */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    placeholder="Task description (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSubmitTask}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                    setTaskForm({
                      title: '',
                      description: '',
                      deadline: '',
                      priority: 'medium',
                      status: 'pending'
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/*Tasks List*/}
        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first task</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          ) : (
            sortedTasks.map(task => {
              const deadlineStatus = getDeadlineStatus(task.deadline, task.status);
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                    deadlineStatus === 'overdue' ? 'border-red-500' :
                    deadlineStatus === 'urgent' ? 'border-orange-500' :
                    deadlineStatus === 'warning' ? 'border-yellow-500' :
                    deadlineStatus === 'completed' ? 'border-green-500' :
                    'border-blue-500'
                  } ${task.status === 'completed' ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center ${
                          task.status === 'completed' 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className={`text-sm mb-2 ${
                            task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(task.deadline).toLocaleString()}
                          </div>
                          {deadlineStatus === 'overdue' && task.status !== 'completed' && (
                            <span className="text-red-600 font-medium">Overdue</span>
                          )}
                          {deadlineStatus === 'urgent' && task.status !== 'completed' && (
                            <span className="text-orange-600 font-medium">Due soon</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskScheduler;