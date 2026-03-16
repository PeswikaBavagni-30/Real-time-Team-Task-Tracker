import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Header from './components/Header'; // We'll add a simple header
import Column from './components/Column';
import api from './api';
import { socket } from './socket';

function App() {
  const [data, setData] = useState({ columns: [] });
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    try {
      const res = await api.get('/board');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching board:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();

    // Socket listeners
    socket.on('task_moved', (moveData) => {
      // For a robust implementation, we might just refetch or apply optimistic update
      // Taking the easy route here to guarantee state consistency across clients:
      fetchBoard();
    });

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
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'column') {
      const newColumns = Array.from(data.Columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      // Optimistic UI update
      setData({ ...data, Columns: newColumns });

      try {
        const payload = newColumns.map((col, index) => ({ id: col.id, order: index }));
        await api.reorderColumns(payload);
      } catch (err) {
        console.error(err);
        fetchBoard(); // Revert on error
      }
      return;
    }

    // Task movement
    const sourceColumn = data.Columns.find(col => col.id.toString() === source.droppableId);
    const destColumn = data.Columns.find(col => col.id.toString() === destination.droppableId);

    if (sourceColumn === destColumn) {
      const newTasks = Array.from(sourceColumn.Tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumn = { ...sourceColumn, Tasks: newTasks };
      const newColumns = data.Columns.map(col =>
        col.id === newColumn.id ? newColumn : col
      );

      setData({ ...data, Columns: newColumns });

      try {
        const payload = newTasks.map((task, index) => ({ id: task.id, order: index }));
        await api.put('/tasks/reorder', { tasks: payload });
      } catch (err) {
        console.error(err);
        fetchBoard();
      }
    } else {
      const sourceTasks = Array.from(sourceColumn.Tasks);
      const destTasks = Array.from(destColumn.Tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      const newSourceColumn = { ...sourceColumn, Tasks: sourceTasks };
      const newDestColumn = { ...destColumn, Tasks: destTasks };

      const newColumns = data.Columns.map(col => {
        if (col.id === sourceColumn.id) return newSourceColumn;
        if (col.id === destColumn.id) return newDestColumn;
        return col;
      });

      setData({ ...data, Columns: newColumns });

      try {
        const taskId = draggableId.replace('task-', '');
        await api.put(`/tasks/${taskId}/move`, { targetColumnId: destColumn.id, newOrder: destination.index });
        
        // Update siblings order in destination
        const payload = destTasks.map((task, index) => ({ id: task.id, order: index }));
        await api.put('/tasks/reorder', { tasks: payload });
      } catch (err) {
        console.error(err);
        fetchBoard();
      }
    }
  };

  if (loading) return <div className="loading">Loading Board...</div>;

  return (
    <div className="app-container">
      <Header title={data.title || 'Task Tracker'} connected={socket.connected} />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              className="board"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {data.Columns?.map((column, index) => (
                <Column key={column.id} column={column} tasks={column.Tasks || []} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default App;
