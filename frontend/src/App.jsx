import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Header from './components/Header';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import { socket } from './socket';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function App() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToColumnId, setAddToColumnId] = useState(null);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/board`);
      if (res.data) {
        setBoard(res.data);
        setError(null);
      } else {
        setError('No board data found.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to connect to backend. Make sure the server is running on port 5000.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();

    socket.on('task_moved', fetchBoard);
    socket.on('task_created', fetchBoard);
    socket.on('task_deleted', fetchBoard);
    socket.on('columns_reordered', fetchBoard);
    socket.on('tasks_reordered', fetchBoard);

    return () => {
      socket.off('task_moved');
      socket.off('task_created');
      socket.off('task_deleted');
      socket.off('columns_reordered');
      socket.off('tasks_reordered');
    };
  }, [fetchBoard]);

  const handleAddTask = async (title, description) => {
    try {
      await axios.post(`${API}/tasks`, {
        title,
        description,
        ColumnId: addToColumnId,
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

  const openAddModal = (columnId) => {
    setAddToColumnId(columnId);
    setShowAddModal(true);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!board || !board.Columns) return;

    if (type === 'column') {
      const newColumns = Array.from(board.Columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setBoard({ ...board, Columns: newColumns });

      try {
        const payload = newColumns.map((col, index) => ({ id: col.id, order: index }));
        await axios.put(`${API}/columns/reorder`, { columns: payload });
      } catch (err) {
        console.error(err);
        fetchBoard();
      }
      return;
    }

    // Task movement
    const sourceColumn = board.Columns.find(
      (col) => col.id.toString() === source.droppableId
    );
    const destColumn = board.Columns.find(
      (col) => col.id.toString() === destination.droppableId
    );

    if (!sourceColumn || !destColumn) return;

    if (sourceColumn.id === destColumn.id) {
      // Same column reorder
      const newTasks = Array.from(sourceColumn.Tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumn = { ...sourceColumn, Tasks: newTasks };
      const newColumns = board.Columns.map((col) =>
        col.id === newColumn.id ? newColumn : col
      );
      setBoard({ ...board, Columns: newColumns });

      try {
        const payload = newTasks.map((task, index) => ({ id: task.id, order: index }));
        await axios.put(`${API}/tasks/reorder`, { tasks: payload });
      } catch (err) {
        console.error(err);
        fetchBoard();
      }
    } else {
      // Cross-column move
      const sourceTasks = Array.from(sourceColumn.Tasks);
      const destTasks = Array.from(destColumn.Tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      const newColumns = board.Columns.map((col) => {
        if (col.id === sourceColumn.id) return { ...col, Tasks: sourceTasks };
        if (col.id === destColumn.id) return { ...col, Tasks: destTasks };
        return col;
      });
      setBoard({ ...board, Columns: newColumns });

      try {
        const taskId = draggableId.replace('task-', '');
        await axios.put(`${API}/tasks/${taskId}/move`, {
          targetColumnId: destColumn.id,
          newOrder: destination.index,
        });

        const payload = destTasks.map((task, idx) => ({ id: task.id, order: idx }));
        await axios.put(`${API}/tasks/reorder`, { tasks: payload });

        const srcPayload = sourceTasks.map((task, idx) => ({ id: task.id, order: idx }));
        await axios.put(`${API}/tasks/reorder`, { tasks: srcPayload });
      } catch (err) {
        console.error(err);
        fetchBoard();
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={fetchBoard} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header title={board?.title || 'Task Tracker'} />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              className="board"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {board?.Columns?.map((column, index) => (
                <Column
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={column.Tasks || []}
                  onAddTask={openAddModal}
                  onDeleteTask={handleDeleteTask}
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
    </div>
  );
}

export default App;
