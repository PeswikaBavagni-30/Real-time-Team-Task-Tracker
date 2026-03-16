import React from 'react';

const TaskCard = ({ task, innerRef, provided, isDragging }) => {
  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      ref={innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}
    </div>
  );
};

export default TaskCard;
