import { DataTypes } from 'sequelize';
import sequelize from './configSql';

const History = sequelize.define('history', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  IdCard: {
    type: DataTypes.STRING,
    allowNull:false
  },
  TimeCheckIn: {
    type: DataTypes.STRING,
    allowNull:false
  },
  TimeCheckOut: {
    type: DataTypes.STRING,
    allowNull:false
  },
  RegPlate: {
    type: DataTypes.STRING,
    allowNull:false
  },
  Cash: {
    type: DataTypes.INTEGER,
    allowNull:false
  }
});

export default History;