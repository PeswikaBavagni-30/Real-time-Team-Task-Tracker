const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize, Board, Column, Task } = require('./db');

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

// Initialize dummy data if empty
async function initializeDB() {
  await sequelize.sync({ alter: true });
  const boardCount = await Board.count();
  if (boardCount === 0) {
    const board = await Board.create({ title: 'Main Project Board' });

    const todoCol = await Column.create({ title: 'To Do', order: 0, BoardId: board.id });
    const inProgCol = await Column.create({ title: 'In Progress', order: 1, BoardId: board.id });
    const doneCol = await Column.create({ title: 'Done', order: 2, BoardId: board.id });

    await Task.create({ title: 'Set up project repository', description: 'Initialize Git, Node, and React.', order: 0, ColumnId: doneCol.id });
    await Task.create({ title: 'Implement Backend API', description: 'Create REST endpoints and socket.io server.', order: 0, ColumnId: inProgCol.id, estimatedMinutes: 30 });
    await Task.create({ title: 'Design Frontend UI', description: 'Use Vanilla CSS for a stunning look.', order: 0, ColumnId: todoCol.id, estimatedMinutes: 45 });
    await Task.create({ title: 'Integrate Real-time updates', description: 'Use socket.io to push task moves to all clients.', order: 1, ColumnId: todoCol.id, estimatedMinutes: 20 });
  }
}

initializeDB();

// ================= API Endpoints =================

app.get('/api/board', async (req, res) => {
  try {
    const board = await Board.findOne({
      include: [
        {
          model: Column,
          include: [Task],
        }
      ],
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

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, ColumnId, estimatedMinutes } = req.body;

    const maxOrderTask = await Task.findOne({
      where: { ColumnId },
      order: [['order', 'DESC']]
    });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      ColumnId,
      order,
      estimatedMinutes: estimatedMinutes || null
    });

    io.emit('task_created', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Timer endpoints (must come BEFORE :id/move) ----

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

app.put('/api/tasks/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.isRunning = true;
    task.startedAt = new Date();
    await task.save();

    io.emit('task_timer_updated', {
      taskId: task.id,
      isRunning: true,
      startedAt: task.startedAt,
      elapsedSeconds: task.elapsedSeconds
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Calculate elapsed time since start and add to accumulated
    if (task.startedAt) {
      const now = new Date();
      const additionalSeconds = Math.floor((now - new Date(task.startedAt)) / 1000);
      task.elapsedSeconds = (task.elapsedSeconds || 0) + additionalSeconds;
    }
    task.isRunning = false;
    task.startedAt = null;
    await task.save();

    io.emit('task_timer_updated', {
      taskId: task.id,
      isRunning: false,
      startedAt: null,
      elapsedSeconds: task.elapsedSeconds
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/timer/reset', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.isRunning = false;
    task.startedAt = null;
    task.elapsedSeconds = 0;
    await task.save();

    io.emit('task_timer_updated', {
      taskId: task.id,
      isRunning: false,
      startedAt: null,
      elapsedSeconds: 0
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { targetColumnId, newOrder } = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const sourceColumnId = task.ColumnId;

    task.ColumnId = targetColumnId;
    task.order = newOrder;
    await task.save();

    io.emit('task_moved', {
      taskId: task.id,
      sourceColumnId,
      targetColumnId,
      newOrder
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    await Task.destroy({ where: { id: taskId } });
    io.emit('task_deleted', taskId);
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
