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

// Relationships
Board.hasMany(Column);
Column.belongsTo(Board);

Column.hasMany(Task);
Task.belongsTo(Column);

module.exports = { sequelize, Board, Column, Task };
