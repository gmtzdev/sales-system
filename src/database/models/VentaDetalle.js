const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const VentaDetalle = sequelize.define('VentaDetalle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'La cantidad debe ser al menos 1' },
        },
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
}, {
    tableName: 'venta_detalles',
    timestamps: false,
})

module.exports = VentaDetalle
