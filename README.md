# MERN-TODO

A modern, full-featured To-Do List application built with the MERN stack. This project was created during DevTown's 5 Day MERN stack bootcamp and has been enhanced with features like authentication, task filtering, search, sorting, dark mode, and more.

---

## 🚀 Project Description

MERN-TODO is a productivity app that allows users to:

- Register and log in securely
- Add, edit, and delete tasks
- Set priorities, due dates, and categories/tags for tasks
- Filter, search, and sort tasks instantly
- View task statistics (total, completed, pending, high priority, overdue)
- Enjoy a responsive, modern UI with dark mode support

---

## 🛠 Technologies Used

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Other:** CORS, dotenv

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
# Clone the repo
git clone <your-repo-url>
cd MERN-TODO
```

### 2. Backend Setup

```bash
cd backend
npm install
# Create a .env file with your MongoDB URI and desired PORT
# Example .env:
# MONGOURL=mongodb+srv://<username>:<password>@cluster.mongodb.net/
# PORT=3000
npm start
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

- The frontend will run on [http://localhost:5173](http://localhost:5173) (default Vite port)
- The backend will run on [http://localhost:3000](http://localhost:3000) (or your chosen port)

---

## 🌐 Deployment Links

- **Frontend Demo:** [https://your-frontend-demo-link](https://your-frontend-demo-link)
- **Backend API:** [https://your-backend-api-link](https://your-backend-api-link)

> Replace the above links with your actual deployment URLs (e.g., Vercel, Netlify, Render, Heroku, etc.)

---

## 📸 Screenshots

_Add screenshots here to showcase the UI and features._

---

## 🙏 Credits

- Built during DevTown's 5 Day MERN Bootcamp
- Enhanced and maintained by [Your Name]
