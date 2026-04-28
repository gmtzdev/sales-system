import sequelize from '../db'
import Producto from './Producto'
import Usuario from './Usuario'
import Venta from './Venta'
import VentaDetalle from './VentaDetalle'
import Supplier from './Supplier'
import Departament from './Departament'

// Associations
Venta.hasMany(VentaDetalle, { foreignKey: 'venta_id', as: 'detalles' })
VentaDetalle.belongsTo(Venta, { foreignKey: 'venta_id' })

VentaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' })
Producto.hasMany(VentaDetalle, { foreignKey: 'producto_id' })

export async function initDatabase(): Promise<void> {
    await sequelize.authenticate()
    // sync({ alter: true }) updates tables without dropping data
    // In production, use migrations instead
    await sequelize.sync({ alter: true })
}

export async function closeDatabase(): Promise<void> {
    await sequelize.close()
}

export { sequelize, Producto, Usuario, Venta, VentaDetalle, Supplier, Departament }
