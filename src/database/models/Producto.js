const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Producto = sequelize.define('Producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre no puede estar vacío' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(255),
        defaultValue: '',
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'El precio no puede ser negativo' },
        },
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'El stock no puede ser negativo' },
        },
    },
}, {
    tableName: 'productos',
    timestamps: false,
})

module.exports = Producto
