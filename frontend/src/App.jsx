import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    highPriority: 0,
    overdue: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Fetch all tasks from backend only when token changes or after add/update/delete
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(
        `https://devtown-mern-todo.onrender.com/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [token]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        "https://devtown-mern-todo.onrender.com/tasks/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchStats();
    }
  }, [token, fetchTasks]);

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setTasks([]);
  };

  const addTask = async (taskData) => {
    try {
      const response = await fetch(
        "https://devtown-mern-todo.onrender.com/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );
      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      fetchStats();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const response = await fetch(
        `https://devtown-mern-todo.onrender.com/tasks/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );
      const updatedTask = await response.json();
      setTasks((prev) => prev.map((task) => (task._id === id ? updatedTask : task)));
      fetchStats();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`https://devtown-mern-todo.onrender.com/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((task) => task._id !== id));
      fetchStats();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Memoized local filter, search, and sort
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Status filter
        if (filterStatus !== "all" && task.status !== filterStatus) return false;
        // Priority filter
        if (filterPriority !== "all" && task.priority !== filterPriority) return false;
        // Category filter
        if (filterCategory !== "all" && (!Array.isArray(task.categories) || !task.categories.includes(filterCategory))) return false;
        // Search
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          (task.text && task.text.toLowerCase().includes(q)) ||
          (task.description && task.description.toLowerCase().includes(q)) ||
          (Array.isArray(task.categories) && task.categories.some(cat => cat.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        if (sortBy === "created") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === "dueDate") {
          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        } else if (sortBy === "priority") {
          const order = { high: 3, medium: 2, low: 1 };
          return (order[b.priority] || 0) - (order[a.priority] || 0);
        }
        return 0;
      });
  }, [tasks, filterStatus, filterPriority, filterCategory, searchQuery, sortBy]);

  // Task Modal Component
  const TaskModal = ({ task, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      text: task?.text || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      categories: task?.categories?.join(", ") || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const taskData = {
        ...formData,
        categories: formData.categories
          .split(",")
          .map((cat) => cat.trim())
          .filter(Boolean),
      };
      onSave(taskData);
      onClose();
    };

    const modalBg = darkMode ? "bg-gray-800" : "bg-white";
    const modalText = darkMode ? "text-white" : "text-gray-800";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div
          className={`${modalBg} rounded-lg p-6 w-full max-w-md`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${modalText}`}
          >
            {task ? "Edit Task" : "Add New Task"}
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              placeholder="Task title"
              className="w-full p-2 mb-3 border rounded"
              required
            />
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description"
              className="w-full p-2 mb-3 border rounded"
              rows="3"
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full p-2 mb-3 border rounded"
            />
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full p-2 mb-3 border rounded"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="text"
              value={formData.categories}
              onChange={(e) =>
                setFormData({ ...formData, categories: e.target.value })
              }
              placeholder="Categories (comma-separated)"
              className="w-full p-2 mb-3 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                {task ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Stats Component
  const Stats = () => {
    const statsText = darkMode ? "text-white" : "";
    return (
      <div
        className={`grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 ${statsText}`}
      >
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Tasks</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">
            {stats.completed}
          </div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">
            {stats.highPriority}
          </div>
          <div className="text-sm text-red-600">High Priority</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.overdue}</div>
          <div className="text-sm text-purple-600">Overdue</div>
        </div>
      </div>
    );
  };

  // Main app UI for authenticated users
  const MainApp = () => {
    const mainBg = darkMode ? "bg-gray-900" : "bg-orange-50";
    const navBg = darkMode ? "bg-gray-800" : "bg-orange-500";
    const footerBg = darkMode ? "bg-gray-800" : "bg-orange-500";
    return (
      <div className={`min-h-screen ${mainBg} flex flex-col`}>
        <nav
          className={`${navBg} text-white px-6 py-4 flex justify-between items-center shadow-md`}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-white"
            >
              {darkMode ? "🌞" : "🌙"}
            </button>
            <h1 className="text-xl font-bold">Todo App</h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow transition-colors duration-200"
          >
            Logout
          </button>
        </nav>

        <main className="flex-1 p-8">
          <Stats />

          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className={`w-full p-3 border-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-orange-300 focus:ring-orange-400"
                }`}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                onChange={(e) => setFilterStatus(e.target.value)}
                value={filterStatus}
                className={`p-2 border-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-orange-300 focus:ring-orange-400"
                }`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                onChange={(e) => setFilterPriority(e.target.value)}
                value={filterPriority}
                className={`p-2 border-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-orange-300 focus:ring-orange-400"
                }`}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                onChange={(e) => setSortBy(e.target.value)}
                value={sortBy}
                className={`p-2 border-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-orange-300 focus:ring-orange-400"
                }`}
              >
                <option value="created">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors duration-200 w-full md:w-auto"
            >
              Add New Task
            </button>
          </div>

          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ${
                  darkMode
                    ? "bg-gray-800 text-white hover:bg-gray-700"
                    : "bg-white hover:bg-orange-50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() =>
                          updateTask(task._id, {
                            status: task.status === "completed" ? "pending" : "completed",
                          })
                        }
                        className="h-5 w-5"
                      />
                      <span
                        className={`text-lg ${
                          task.status === "completed" ? "line-through opacity-50" : ""
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>
                    {task.description && (
                      <p
                        className={`mt-2 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.categories?.map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`mt-2 text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {task.dueDate && (
                        <span
                          className={`mr-4 ${
                            new Date(task.dueDate) < new Date() &&
                            task.status !== "completed"
                              ? "text-red-500 font-bold"
                              : ""
                          }`}
                        >
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span
                        className={`mr-4 ${
                          task.priority === "high"
                            ? "text-red-500"
                            : task.priority === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setShowEditModal(true);
                      }}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div
                className={`text-center py-8 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No tasks found. Add your first task!
              </div>
            )}
          </div>
        </main>

        {showAddModal && <TaskModal onClose={() => setShowAddModal(false)} onSave={addTask} />}

        {showEditModal && editingTask && (
          <TaskModal
            task={editingTask}
            onClose={() => {
              setShowEditModal(false);
              setEditingTask(null);
            }}
            onSave={(updates) => updateTask(editingTask._id, updates)}
          />
        )}

        <footer
          className={`${footerBg} text-white p-4 mt-auto text-center shadow-inner`}
        >
          © 2025 Your Todo App - Organize your life
        </footer>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={token ? <MainApp /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;