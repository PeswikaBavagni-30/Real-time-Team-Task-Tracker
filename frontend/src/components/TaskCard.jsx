import React, { useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';

const TaskCard = ({ task, innerRef, provided, isDragging, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (showConfirm) {
      onDelete(task.id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      ref={innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <div className="task-card-top">
        <GripVertical size={14} className="grip-icon" />
        <button
          className={`delete-btn ${showConfirm ? 'confirm' : ''}`}
          onClick={handleDelete}
          title={showConfirm ? 'Click again to confirm' : 'Delete task'}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}
    </div>
  );
};

export default TaskCard;
