import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, Play, Square, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

const priorityConfig = {
  high: { label: 'High', color: '#f85149', bg: 'rgba(248, 81, 73, 0.15)' },
  medium: { label: 'Medium', color: '#d29922', bg: 'rgba(210, 153, 34, 0.15)' },
  low: { label: 'Low', color: '#2ea043', bg: 'rgba(46, 160, 67, 0.15)' },
};

const TaskCard = ({ task, innerRef, provided, isDragging, onDelete, onTimerAction }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentElapsed, setCurrentElapsed] = useState(task.elapsedSeconds || 0);
  const [hasNotified, setHasNotified] = useState(false);
  const intervalRef = useRef(null);

  const estimatedSeconds = task.estimatedMinutes ? task.estimatedMinutes * 60 : null;
  const isOverdue = estimatedSeconds && currentElapsed > estimatedSeconds;
  const hasEstimate = task.estimatedMinutes && task.estimatedMinutes > 0;
  const prio = priorityConfig[task.priority] || priorityConfig.medium;

  useEffect(() => {
    if (task.isRunning && task.startedAt) {
      const startTime = new Date(task.startedAt).getTime();
      const tick = () => {
        const additionalSeconds = Math.floor((Date.now() - startTime) / 1000);
        setCurrentElapsed((task.elapsedSeconds || 0) + additionalSeconds);
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setCurrentElapsed(task.elapsedSeconds || 0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [task.isRunning, task.startedAt, task.elapsedSeconds]);

  useEffect(() => {
    if (isOverdue && !hasNotified && task.isRunning) {
      setHasNotified(true);
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('⏰ Task Overdue!', { body: `"${task.title}" exceeded ${task.estimatedMinutes} min` });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
  }, [isOverdue, hasNotified, task.isRunning]);

  useEffect(() => {
    if (currentElapsed === 0) setHasNotified(false);
  }, [currentElapsed]);

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

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!estimatedSeconds) return null;
    const remaining = estimatedSeconds - currentElapsed;
    return remaining <= 0 ? `Overdue by ${formatTime(Math.abs(remaining))}` : `${formatTime(remaining)} left`;
  };

  const getProgressPercent = () => {
    if (!estimatedSeconds) return 0;
    return Math.min((currentElapsed / estimatedSeconds) * 100, 100);
  };

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
      ref={innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style, borderLeftColor: prio.color }}
    >
      <div className="task-card-top">
        <GripVertical size={14} className="grip-icon" />
        <div className="task-card-top-right">
          <span className="priority-badge" style={{ color: prio.color, background: prio.bg }}>
            {prio.label}
          </span>
          <button
            className={`delete-btn ${showConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={showConfirm ? 'Click again to confirm' : 'Delete task'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}

      {hasEstimate && (
        <div className={`timer-section ${isOverdue ? 'timer-overdue' : ''}`}>
          <div className="timer-progress-bar">
            <div
              className={`timer-progress-fill ${isOverdue ? 'overdue-fill' : ''}`}
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <div className="timer-info">
            <div className="timer-display">
              <Clock size={13} />
              <span className="timer-elapsed">{formatTime(currentElapsed)}</span>
              <span className="timer-separator">/</span>
              <span className="timer-estimate">{formatTime(estimatedSeconds)}</span>
            </div>
            <div className="timer-remaining">
              {isOverdue && <AlertTriangle size={13} className="overdue-icon" />}
              <span>{getTimeRemaining()}</span>
            </div>
          </div>
          <div className="timer-controls">
            {!task.isRunning ? (
              <button className="timer-btn start-btn" onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'start'); }}>
                <Play size={14} /> Start
              </button>
            ) : (
              <button className="timer-btn stop-btn" onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'stop'); }}>
                <Square size={14} /> Stop
              </button>
            )}
            <button className="timer-btn reset-btn" onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'reset'); }}>
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {hasEstimate && currentElapsed === 0 && !task.isRunning && (
        <div className="estimate-badge"><Clock size={12} /> {task.estimatedMinutes} min</div>
      )}
    </div>
  );
};

export default TaskCard;
