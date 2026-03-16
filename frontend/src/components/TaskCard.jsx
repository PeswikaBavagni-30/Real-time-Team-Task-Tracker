import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, Play, Square, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

const TaskCard = ({ task, innerRef, provided, isDragging, onDelete, onTimerAction }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentElapsed, setCurrentElapsed] = useState(task.elapsedSeconds || 0);
  const [hasNotified, setHasNotified] = useState(false);
  const intervalRef = useRef(null);

  const estimatedSeconds = task.estimatedMinutes ? task.estimatedMinutes * 60 : null;
  const isOverdue = estimatedSeconds && currentElapsed > estimatedSeconds;
  const hasEstimate = task.estimatedMinutes && task.estimatedMinutes > 0;

  // Live ticking timer
  useEffect(() => {
    if (task.isRunning && task.startedAt) {
      const startTime = new Date(task.startedAt).getTime();

      const tick = () => {
        const now = Date.now();
        const additionalSeconds = Math.floor((now - startTime) / 1000);
        setCurrentElapsed((task.elapsedSeconds || 0) + additionalSeconds);
      };

      tick(); // immediately
      intervalRef.current = setInterval(tick, 1000);

      return () => clearInterval(intervalRef.current);
    } else {
      setCurrentElapsed(task.elapsedSeconds || 0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [task.isRunning, task.startedAt, task.elapsedSeconds]);

  // Browser notification when overdue
  useEffect(() => {
    if (isOverdue && !hasNotified && task.isRunning) {
      setHasNotified(true);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Task Overdue!', {
          body: `"${task.title}" has exceeded its estimated time of ${task.estimatedMinutes} min.`,
          icon: '⏰'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification('⏰ Task Overdue!', {
              body: `"${task.title}" has exceeded its estimated time of ${task.estimatedMinutes} min.`,
            });
          }
        });
      }
    }
  }, [isOverdue, hasNotified, task.isRunning, task.title, task.estimatedMinutes]);

  // Reset notification flag when timer resets
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
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!estimatedSeconds) return null;
    const remaining = estimatedSeconds - currentElapsed;
    if (remaining <= 0) {
      return `Overdue by ${formatTime(Math.abs(remaining))}`;
    }
    return `${formatTime(remaining)} left`;
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

      {/* Timer Section */}
      {hasEstimate && (
        <div className={`timer-section ${isOverdue ? 'timer-overdue' : ''}`}>
          {/* Progress bar */}
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
              <button
                className="timer-btn start-btn"
                onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'start'); }}
                title="Start Timer"
              >
                <Play size={14} />
                Start
              </button>
            ) : (
              <button
                className="timer-btn stop-btn"
                onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'stop'); }}
                title="Stop Timer"
              >
                <Square size={14} />
                Stop
              </button>
            )}
            <button
              className="timer-btn reset-btn"
              onClick={(e) => { e.stopPropagation(); onTimerAction(task.id, 'reset'); }}
              title="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Badge for estimated time if no timer started yet */}
      {hasEstimate && currentElapsed === 0 && !task.isRunning && (
        <div className="estimate-badge">
          <Clock size={12} />
          {task.estimatedMinutes} min
        </div>
      )}
    </div>
  );
};

export default TaskCard;
