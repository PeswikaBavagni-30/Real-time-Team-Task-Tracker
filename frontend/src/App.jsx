import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Header from './components/Header';
import Column from './components/Column';
import StatsBar from './components/StatsBar';
import ActivityPanel from './components/ActivityPanel';
import SearchBar from './components/SearchBar';
import AddTaskModal from './components/AddTaskModal';
import { socket } from './socket';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function App() {
  const [board, setBoard] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToColumnId, setAddToColumnId] = useState(null);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const fetchBoard = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/board`);
      if (res.data) {
        setBoard(res.data);
        setError(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to connect to backend. Make sure the server is running on port 5000.');
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/activity`);
      setActivities(res.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    fetchStats();
    fetchActivities();

    const refresh = () => { fetchBoard(); fetchStats(); fetchActivities(); };

    socket.on('task_moved', refresh);
    socket.on('task_created', refresh);
    socket.on('task_deleted', refresh);
    socket.on('columns_reordered', refresh);
    socket.on('tasks_reordered', refresh);
    socket.on('task_timer_updated', refresh);
    socket.on('activity_logged', refresh);

    return () => {
      socket.off('task_moved');
      socket.off('task_created');
      socket.off('task_deleted');
      socket.off('columns_reordered');
      socket.off('tasks_reordered');
      socket.off('task_timer_updated');
      socket.off('activity_logged');
    };
  }, [fetchBoard, fetchStats, fetchActivities]);

  const handleAddTask = async (title, description, estimatedMinutes, priority) => {
    try {
      await axios.post(`${API}/tasks`, {
        title, description,
        ColumnId: addToColumnId,
        estimatedMinutes: estimatedMinutes || null,
        priority: priority || 'medium'
      });
      setShowAddModal(false);
      setAddToColumnId(null);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleTimerAction = async (taskId, action) => {
    try {
      await axios.put(`${API}/tasks/${taskId}/timer/${action}`);
    } catch (err) {
      console.error(`Error ${action} timer:`, err);
    }
  };

  const openAddModal = (columnId) => {
    setAddToColumnId(columnId);
    setShowAddModal(true);
  };

  // Filter tasks based on search and priority
  const getFilteredTasks = (tasks) => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!board || !board.Columns) return;

    if (type === 'column') {
      const newColumns = Array.from(board.Columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setBoard({ ...board, Columns: newColumns });
      try {
        const payload = newColumns.map((col, index) => ({ id: col.id, order: index }));
        await axios.put(`${API}/columns/reorder`, { columns: payload });
      } catch (err) { console.error(err); fetchBoard(); }
      return;
    }

    const sourceColumn = board.Columns.find(col => col.id.toString() === source.droppableId);
    const destColumn = board.Columns.find(col => col.id.toString() === destination.droppableId);
    if (!sourceColumn || !destColumn) return;

    if (sourceColumn.id === destColumn.id) {
      const newTasks = Array.from(sourceColumn.Tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);
      const newColumns = board.Columns.map(col => col.id === sourceColumn.id ? { ...col, Tasks: newTasks } : col);
      setBoard({ ...board, Columns: newColumns });
      try {
        const payload = newTasks.map((task, index) => ({ id: task.id, order: index }));
        await axios.put(`${API}/tasks/reorder`, { tasks: payload });
      } catch (err) { console.error(err); fetchBoard(); }
    } else {
      const sourceTasks = Array.from(sourceColumn.Tasks);
      const destTasks = Array.from(destColumn.Tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);
      const newColumns = board.Columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, Tasks: sourceTasks };
        if (col.id === destColumn.id) return { ...col, Tasks: destTasks };
        return col;
      });
      setBoard({ ...board, Columns: newColumns });
      try {
        const taskId = draggableId.replace('task-', '');
        await axios.put(`${API}/tasks/${taskId}/move`, { targetColumnId: destColumn.id, newOrder: destination.index });
        await axios.put(`${API}/tasks/reorder`, { tasks: destTasks.map((t, i) => ({ id: t.id, order: i })) });
        await axios.put(`${API}/tasks/reorder`, { tasks: sourceTasks.map((t, i) => ({ id: t.id, order: i })) });
      } catch (err) { console.error(err); fetchBoard(); }
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading Board...</p></div>;

  if (error) return (
    <div className="error-screen">
      <div className="error-icon">⚠️</div>
      <h2>Connection Error</h2>
      <p>{error}</p>
      <button onClick={fetchBoard} className="retry-btn">Retry</button>
    </div>
  );

  return (
    <div className="app-container">
      <Header
        title={board?.title || 'Task Tracker'}
        onToggleActivity={() => setShowActivityPanel(!showActivityPanel)}
        showActivityPanel={showActivityPanel}
      />

      {stats && <StatsBar stats={stats} />}

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterPriority={filterPriority}
        onFilterChange={setFilterPriority}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div className="board" {...provided.droppableProps} ref={provided.innerRef}>
              {board?.Columns?.map((column, index) => (
                <Column
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={getFilteredTasks(column.Tasks)}
                  onAddTask={openAddModal}
                  onDeleteTask={handleDeleteTask}
                  onTimerAction={handleTimerAction}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAddModal && (
        <AddTaskModal
          onClose={() => { setShowAddModal(false); setAddToColumnId(null); }}
          onSubmit={handleAddTask}
        />
      )}

      {showActivityPanel && (
        <ActivityPanel
          activities={activities}
          onClose={() => setShowActivityPanel(false)}
        />
      )}
    </div>
  );
}

export default App;
