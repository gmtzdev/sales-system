const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El nombre de usuario no puede estar vacío' },
        },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(150),
        defaultValue: '',
    },
    rol: {
        type: DataTypes.ENUM('admin', 'vendedor'),
        defaultValue: 'vendedor',
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'usuarios',
    timestamps: false,
})

module.exports = Usuario
