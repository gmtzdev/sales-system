const sequelize = require('../db')
const Producto = require('./Producto')
const Usuario = require('./Usuario')
const Venta = require('./Venta')
const VentaDetalle = require('./VentaDetalle')

// Asociaciones
Venta.hasMany(VentaDetalle, { foreignKey: 'venta_id', as: 'detalles' })
VentaDetalle.belongsTo(Venta, { foreignKey: 'venta_id' })

VentaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' })
Producto.hasMany(VentaDetalle, { foreignKey: 'producto_id' })

async function initDatabase() {
    await sequelize.authenticate()
    // sync({ alter: true }) actualiza las tablas sin borrar datos
    // En producción se recomienda usar migraciones en su lugar
    await sequelize.sync({ alter: true })
}

async function closeDatabase() {
    await sequelize.close()
}

module.exports = {
    sequelize,
    initDatabase,
    closeDatabase,
    Producto,
    Usuario,
    Venta,
    VentaDetalle,
}
