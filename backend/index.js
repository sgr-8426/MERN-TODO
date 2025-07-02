const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 8080;
const MONGO = process.env.MONGOURL;
app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

mongoose.connect(MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  settings: {
    theme: { type: String, default: 'light' },
    defaultView: { type: String, default: 'list' }
  }
});
const User = mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  text: String,
  description: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  priority: { type: String, default: 'medium' },
  dueDate: { type: Date },
  categories: [String],
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.index({ text: 'text', description: 'text' });
const Task = mongoose.model("Task", taskSchema);

// User routes
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.json({ message: "User registered" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: "24h" });
    res.json({ token, settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, "secret");
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Task routes
app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const { search, status, priority, category, sortBy } = req.query;
    let query = { userId: req.userId };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filters
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.categories = category;
    
    // Sort options
    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case 'dueDate':
          sort.dueDate = 1;
          break;
        case 'priority':
          sort.priority = -1;
          break;
        case 'created':
          sort.createdAt = -1;
          break;
        default:
          sort.createdAt = -1;
      }
    }

    const tasks = await Task.find(query).sort(sort);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error creating task" });
  }
});

app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task" });
  }
});

app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

// Stats route
app.get("/tasks/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $eq: ["$status", "pending"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    res.json(stats[0] || { total: 0, completed: 0, pending: 0, highPriority: 0, overdue: 0 });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// User settings routes
app.patch("/user/settings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { settings: req.body },
      { new: true }
    );
    res.json({ settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: "Error updating settings" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
