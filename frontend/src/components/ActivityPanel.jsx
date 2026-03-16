import React from 'react';
import { X, ArrowRight, Plus, Trash2, Clock, Play, Square, LayoutDashboard } from 'lucide-react';

const iconMap = {
  task_created: <Plus size={14} />,
  task_deleted: <Trash2 size={14} />,
  task_moved: <ArrowRight size={14} />,
  timer_started: <Play size={14} />,
  timer_stopped: <Square size={14} />,
  board_created: <LayoutDashboard size={14} />,
};

const colorMap = {
  task_created: 'var(--success-color)',
  task_deleted: 'var(--danger-color)',
  task_moved: 'var(--accent-color)',
  timer_started: 'var(--warning-color)',
  timer_stopped: '#a78bfa',
  board_created: 'var(--accent-color)',
};

const ActivityPanel = ({ activities, onClose }) => {
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="activity-panel">
      <div className="activity-header">
        <h3><Clock size={16} /> Activity Log</h3>
        <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">No activity yet</p>
        ) : (
          activities.map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-icon" style={{ color: colorMap[log.action] || 'var(--text-secondary)' }}>
                {iconMap[log.action] || <Clock size={14} />}
              </div>
              <div className="activity-content">
                <span className="activity-action">{log.action.replace(/_/g, ' ')}</span>
                {log.taskTitle && <span className="activity-task">{log.taskTitle}</span>}
                {log.details && <span className="activity-details">{log.details}</span>}
              </div>
              <span className="activity-time">{formatTime(log.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
