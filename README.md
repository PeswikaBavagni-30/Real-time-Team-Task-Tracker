# 🚀 Real-time Team Task Tracker

A full-stack **Kanban board** application with **real-time collaboration**, **task timers**, **activity logging**, and **priority management**. Built with **React**, **Node.js**, **Express**, **Socket.io**, and **SQLite**.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

### Core
- 📋 **Kanban Board** — Drag-and-drop tasks across To Do → In Progress → Done
- 🔄 **Real-time Sync** — All changes broadcast instantly via WebSockets to every connected client
- ➕ **Task CRUD** — Create, read, update, and delete tasks with a modern modal UI

### Advanced
- ⏱ **Task Timer** — Assign estimated time, start/stop/reset a live countdown timer per task
- 🔴 **Overdue Alerts** — Visual warnings + browser notifications when tasks exceed their time estimate
- 📊 **Dashboard Stats** — Live metrics bar showing total tasks, completed, in-progress, running timers, and overdue counts
- 🏷 **Priority Labels** — Assign Low (green), Medium (yellow), or High (red) priority to each task
- 🔍 **Search & Filter** — Search tasks by title and filter by priority level
- 📜 **Activity Log** — Full audit trail of all actions (create, delete, move, timer events) with timestamps
- 🎨 **Premium Dark Mode UI** — Glassmorphism, gradients, micro-animations, Inter font

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  (Vite + @hello-pangea/dnd + Socket.io-client)  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ StatsBar │ │SearchBar │ │  Activity Panel  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────────────┐│
│  │         Kanban Board (DragDropContext)        ││
│  │  ┌────────┐  ┌────────┐  ┌────────┐         ││
│  │  │ To Do  │  │In Prog │  │  Done  │         ││
│  │  │TaskCard│  │TaskCard│  │TaskCard│         ││
│  │  └────────┘  └────────┘  └────────┘         ││
│  └──────────────────────────────────────────────┘│
└────────────────────┬───────────────┬─────────────┘
                     │ REST API      │ WebSocket
                     ▼               ▼
┌─────────────────────────────────────────────────┐
│               Node.js Backend                    │
│         (Express + Socket.io Server)             │
│                                                  │
│  Routes: /api/board, /api/tasks, /api/stats,     │
│          /api/activity, /api/tasks/search         │
│  Timer:  /api/tasks/:id/timer/start|stop|reset   │
└────────────────────┬─────────────────────────────┘
                     │ Sequelize ORM
                     ▼
              ┌──────────────┐
              │    SQLite    │
              │  database.db │
              └──────────────┘
```

---

## 🛠 Tech Stack

| Layer       | Technology                                         |
|-------------|-----------------------------------------------------|
| Frontend    | React 19, Vite, @hello-pangea/dnd, Axios, Lucide   |
| Backend     | Node.js, Express, Socket.io                         |
| Database    | SQLite with Sequelize ORM                           |
| Real-time   | Socket.io (bidirectional WebSocket)                  |
| Styling     | Vanilla CSS (glassmorphism, dark mode, animations)   |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/PeswikaBavagni-30/Real-time-Team-Task-Tracker.git
cd Real-time-Team-Task-Tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
# ✅ Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ✅ App running on http://localhost:5173
```

Open http://localhost:5173 in your browser.

> **Tip:** Open in two browser tabs to see real-time sync in action!

---

## 📡 API Endpoints

| Method | Endpoint                      | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/api/board`                  | Get board with columns & tasks |
| GET    | `/api/stats`                  | Get dashboard statistics       |
| GET    | `/api/activity`               | Get activity log (last 50)     |
| GET    | `/api/tasks/search?q=&priority=` | Search & filter tasks       |
| POST   | `/api/tasks`                  | Create a new task              |
| PUT    | `/api/tasks/:id/move`         | Move task between columns      |
| PUT    | `/api/tasks/reorder`          | Reorder tasks within column    |
| PUT    | `/api/columns/reorder`        | Reorder columns                |
| PUT    | `/api/tasks/:id/timer/start`  | Start task timer               |
| PUT    | `/api/tasks/:id/timer/stop`   | Stop task timer                |
| PUT    | `/api/tasks/:id/timer/reset`  | Reset task timer               |
| DELETE | `/api/tasks/:id`              | Delete a task                  |

---

## 🔌 WebSocket Events

| Event               | Direction       | Description                    |
|---------------------|-----------------|--------------------------------|
| `task_created`      | Server → Client | A new task was created         |
| `task_moved`        | Server → Client | A task was moved               |
| `task_deleted`      | Server → Client | A task was deleted             |
| `task_timer_updated`| Server → Client | Timer state changed            |
| `tasks_reordered`   | Server → Client | Task order changed             |
| `columns_reordered` | Server → Client | Column order changed           |
| `activity_logged`   | Server → Client | New activity log entry         |

---

## 📁 Project Structure

```
├── backend/
│   ├── db.js              # Sequelize models (Board, Column, Task, ActivityLog)
│   ├── server.js          # Express server, REST API, Socket.io, timer logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # App header with live sync indicator
│   │   │   ├── Column.jsx        # Kanban column with droppable zone
│   │   │   ├── TaskCard.jsx      # Task card with timer, priority, delete
│   │   │   ├── AddTaskModal.jsx  # Modal for creating tasks
│   │   │   ├── StatsBar.jsx      # Dashboard statistics bar
│   │   │   ├── SearchBar.jsx     # Search input + priority filter
│   │   │   └── ActivityPanel.jsx # Slide-out activity audit log
│   │   ├── App.jsx          # Main app with DnD context
│   │   ├── socket.js        # Socket.io client connection
│   │   ├── api.js           # Axios API client
│   │   ├── index.css        # Complete CSS (700+ lines)
│   │   └── main.jsx         # React entry point
│   └── package.json
└── README.md
```

---

## 🎯 Key Technical Highlights

- **Event-driven architecture** — WebSocket events ensure real-time consistency across clients
- **Optimistic UI updates** — Instant drag & drop feedback before server confirmation
- **Server-side timer** — Timer state persisted in database, survives page refreshes
- **Audit trail** — ActivityLog model tracks all mutations with timestamps
- **RESTful API design** — Clean endpoint structure with proper HTTP methods
- **Responsive CSS** — Mobile-friendly layout with CSS variables and custom properties

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

**Built with ❤️ by [PeswikaBavagni-30](https://github.com/PeswikaBavagni-30)**
