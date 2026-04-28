const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Venta = sequelize.define('Venta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
    },
    notas: {
        type: DataTypes.STRING(255),
        defaultValue: '',
    },
    vendedor: {
        type: DataTypes.STRING(80),
        defaultValue: '',
    },
}, {
    tableName: 'ventas',
    timestamps: false,
})

module.exports = Venta
