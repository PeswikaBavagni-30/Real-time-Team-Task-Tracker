const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

const Board = sequelize.define('Board', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Column = sequelize.define('Column', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium' // 'low', 'medium', 'high'
  },
  estimatedMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  elapsedSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isRunning: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

const ActivityLog = sequelize.define('ActivityLog', {
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taskTitle: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Relationships
Board.hasMany(Column);
Column.belongsTo(Board);

Column.hasMany(Task);
Task.belongsTo(Column);

Board.hasMany(ActivityLog);
ActivityLog.belongsTo(Board);

module.exports = { sequelize, Board, Column, Task, ActivityLog };
