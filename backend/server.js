const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize, Board, Column, Task, ActivityLog } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Helper: log activity
async function logActivity(boardId, action, taskTitle, details) {
  const log = await ActivityLog.create({ action, taskTitle, details, BoardId: boardId });
  io.emit('activity_logged', log);
  return log;
}

// Initialize seed data
async function initializeDB() {
  await sequelize.sync({ alter: true });
  const boardCount = await Board.count();
  if (boardCount === 0) {
    const board = await Board.create({ title: 'Main Project Board' });

    const todoCol = await Column.create({ title: 'To Do', order: 0, BoardId: board.id });
    const inProgCol = await Column.create({ title: 'In Progress', order: 1, BoardId: board.id });
    const doneCol = await Column.create({ title: 'Done', order: 2, BoardId: board.id });

    await Task.create({ title: 'Set up project repository', description: 'Initialize Git, Node, and React.', order: 0, ColumnId: doneCol.id, priority: 'high' });
    await Task.create({ title: 'Implement Backend API', description: 'Create REST endpoints and socket.io server.', order: 0, ColumnId: inProgCol.id, estimatedMinutes: 30, priority: 'high' });
    await Task.create({ title: 'Design Frontend UI', description: 'Use Vanilla CSS for a stunning look.', order: 0, ColumnId: todoCol.id, estimatedMinutes: 45, priority: 'medium' });
    await Task.create({ title: 'Integrate Real-time updates', description: 'Use socket.io to push task moves to all clients.', order: 1, ColumnId: todoCol.id, estimatedMinutes: 20, priority: 'low' });
    await Task.create({ title: 'Write unit tests', description: 'Add test coverage for API endpoints.', order: 2, ColumnId: todoCol.id, estimatedMinutes: 60, priority: 'medium' });

    await logActivity(board.id, 'board_created', null, 'Board initialized with seed data');
  }
}

initializeDB();

// ==================== API ====================

// Get board with columns and tasks
app.get('/api/board', async (req, res) => {
  try {
    const board = await Board.findOne({
      include: [{
        model: Column,
        include: [Task],
      }],
      order: [
        [Column, 'order', 'ASC'],
        [Column, Task, 'order', 'ASC']
      ]
    });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const board = await Board.findOne({
      include: [{
        model: Column,
        include: [Task],
      }]
    });
    if (!board) return res.json({});

    const allTasks = board.Columns.flatMap(col => col.Tasks);
    const total = allTasks.length;
    const byColumn = {};
    board.Columns.forEach(col => {
      byColumn[col.title] = col.Tasks.length;
    });

    const byPriority = { low: 0, medium: 0, high: 0 };
    let overdue = 0;
    let running = 0;

    allTasks.forEach(task => {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      if (task.isRunning) running++;
      if (task.estimatedMinutes && task.isRunning && task.startedAt) {
        const elapsed = (task.elapsedSeconds || 0) + Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
        if (elapsed > task.estimatedMinutes * 60) overdue++;
      }
    });

    res.json({ total, byColumn, byPriority, overdue, running });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity log
app.get('/api/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tasks
app.get('/api/tasks/search', async (req, res) => {
  try {
    const { q, priority } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (q) {
      where.title = { [Op.like]: `%${q}%` };
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    const tasks = await Task.findAll({ where, include: [Column] });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, ColumnId, estimatedMinutes, priority } = req.body;
    const maxOrderTask = await Task.findOne({ where: { ColumnId }, order: [['order', 'DESC']] });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      title, description, ColumnId, order,
      estimatedMinutes: estimatedMinutes || null,
      priority: priority || 'medium'
    });

    const board = await Board.findOne();
    await logActivity(board.id, 'task_created', title, `Created in column`);

    io.emit('task_created', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder columns
app.put('/api/columns/reorder', async (req, res) => {
  try {
    const updates = req.body.columns;
    for (const update of updates) {
      await Column.update({ order: update.order }, { where: { id: update.id } });
    }
    io.emit('columns_reordered', updates);
    res.json({ message: 'Columns reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder tasks
app.put('/api/tasks/reorder', async (req, res) => {
  try {
    const updates = req.body.tasks;
    for (const update of updates) {
      await Task.update({ order: update.order }, { where: { id: update.id } });
    }
    io.emit('tasks_reordered', updates);
    res.json({ message: 'Tasks reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Timer: start
app.put('/api/tasks/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.isRunning = true;
    task.startedAt = new Date();
    await task.save();

    const board = await Board.findOne();
    await logActivity(board.id, 'timer_started', task.title, 'Timer started');

    io.emit('task_timer_updated', { taskId: task.id, isRunning: true, startedAt: task.startedAt, elapsedSeconds: task.elapsedSeconds });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Timer: stop
app.put('/api/tasks/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.startedAt) {
      const additionalSeconds = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
      task.elapsedSeconds = (task.elapsedSeconds || 0) + additionalSeconds;
    }
    task.isRunning = false;
    task.startedAt = null;
    await task.save();

    const board = await Board.findOne();
    await logActivity(board.id, 'timer_stopped', task.title, `Elapsed: ${task.elapsedSeconds}s`);

    io.emit('task_timer_updated', { taskId: task.id, isRunning: false, startedAt: null, elapsedSeconds: task.elapsedSeconds });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Timer: reset
app.put('/api/tasks/:id/timer/reset', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.isRunning = false;
    task.startedAt = null;
    task.elapsedSeconds = 0;
    await task.save();
    io.emit('task_timer_updated', { taskId: task.id, isRunning: false, startedAt: null, elapsedSeconds: 0 });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move task between columns
app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: [Column] });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const { targetColumnId, newOrder } = req.body;
    const sourceCol = task.Column;
    const destCol = await Column.findByPk(targetColumnId);

    task.ColumnId = targetColumnId;
    task.order = newOrder;
    await task.save();

    const board = await Board.findOne();
    await logActivity(board.id, 'task_moved', task.title, `Moved from "${sourceCol?.title}" to "${destCol?.title}"`);

    io.emit('task_moved', { taskId: task.id, sourceColumnId: sourceCol?.id, targetColumnId, newOrder });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const title = task.title;
    await task.destroy();

    const board = await Board.findOne();
    await logActivity(board.id, 'task_deleted', title, 'Task deleted');

    io.emit('task_deleted', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
