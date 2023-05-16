const { DataTypes } = require('sequelize');
const sequelize = new Sequelize(/* configurações do banco de dados */);

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
});

module.exports = {
  Usuario,
};
