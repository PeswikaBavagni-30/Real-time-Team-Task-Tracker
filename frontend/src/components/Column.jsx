import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const Column = ({ column, tasks }) => {
  return (
    <Draggable draggableId={`column-${column.id}`} index={column.order}>
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
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                    {(provided, snapshot) => (
                      <TaskCard
                        task={task}
                        innerRef={provided.innerRef}
                        provided={provided}
                        isDragging={snapshot.isDragging}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

export default Column;
