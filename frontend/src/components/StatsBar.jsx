import React from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

const StatsBar = ({ stats }) => {
  if (!stats || !stats.total) return null;

  const items = [
    { label: 'Total Tasks', value: stats.total, icon: <BarChart3 size={16} />, color: 'var(--accent-color)' },
    { label: 'Done', value: stats.byColumn?.['Done'] || 0, icon: <CheckCircle size={16} />, color: 'var(--success-color)' },
    { label: 'In Progress', value: stats.byColumn?.['In Progress'] || 0, icon: <Zap size={16} />, color: 'var(--warning-color)' },
    { label: 'Running', value: stats.running || 0, icon: <Clock size={16} />, color: '#a78bfa' },
    { label: 'Overdue', value: stats.overdue || 0, icon: <AlertTriangle size={16} />, color: 'var(--danger-color)' },
  ];

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-icon" style={{ color: item.color }}>{item.icon}</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: item.color }}>{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </div>
      ))}

      {stats.byPriority && (
        <div className="stat-card priority-breakdown">
          <div className="stat-info">
            <span className="stat-label">Priority</span>
            <div className="priority-dots">
              <span className="priority-dot high" title="High">{stats.byPriority.high}</span>
              <span className="priority-dot medium" title="Medium">{stats.byPriority.medium}</span>
              <span className="priority-dot low" title="Low">{stats.byPriority.low}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBar;
