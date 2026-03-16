import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

const Column = ({ column, index, tasks, onAddTask, onDeleteTask, onTimerAction }) => {
  return (
    <Draggable draggableId={`column-${column.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={`column ${snapshot.isDragging ? 'dragging-column' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="column-header" {...provided.dragHandleProps}>
            <h3>{column.title}</h3>
            <span className="task-count">{tasks.length}</span>
          </div>

          <Droppable droppableId={`${column.id}`} type="task">
            {(provided, snapshot) => (
              <div
                className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {tasks.map((task, idx) => (
                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={idx}>
                    {(provided, snapshot) => (
                      <TaskCard
                        task={task}
                        innerRef={provided.innerRef}
                        provided={provided}
                        isDragging={snapshot.isDragging}
                        onDelete={onDeleteTask}
                        onTimerAction={onTimerAction}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <button className="add-task-btn" onClick={() => onAddTask(column.id)}>
            <Plus size={16} />
            Add Task
          </button>
        </div>
      )}
    </Draggable>
  );
};

export default Column;
