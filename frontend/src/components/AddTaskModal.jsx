import React, { useState, useRef, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

const AddTaskModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [priority, setPriority] = useState('medium');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(
      title.trim(),
      description.trim(),
      estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      priority
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Task</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input ref={inputRef} id="task-title" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title..." required />
          </div>
          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)..." rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group form-half">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                className="filter-select modal-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div className="form-group form-half">
              <label htmlFor="task-time">
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Est. Time (min)
              </label>
              <input id="task-time" type="number" min="1" max="999" value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="e.g. 30" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={!title.trim()}>Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
