import sequelize from '../db'
import Producto from './Product'
import Product from './Product'
import Usuario from './Usuario'
import Venta from './Venta'
import VentaDetalle from './VentaDetalle'
import Supplier from './Supplier'
import Departament from './Departament'

// Associations — Venta / VentaDetalle / Producto
Venta.hasMany(VentaDetalle, { foreignKey: 'venta_id', as: 'detalles' })
VentaDetalle.belongsTo(Venta, { foreignKey: 'venta_id' })

VentaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' })
Producto.hasMany(VentaDetalle, { foreignKey: 'producto_id' })

// Associations — Product / Supplier / Departament
Product.belongsTo(Supplier, { foreignKey: 'provid', as: 'supplier' })
Supplier.hasMany(Product, { foreignKey: 'provid', as: 'products' })

Product.belongsTo(Departament, { foreignKey: 'dept', as: 'departament' })
Departament.hasMany(Product, { foreignKey: 'dept', as: 'products' })

export async function initDatabase(): Promise<void> {
    await sequelize.authenticate()
    // sync({ alter: true }) updates tables without dropping data
    // In production, use migrations instead
    try {
        await sequelize.sync({ alter: true })
    } catch (err: unknown) {
        const e = err as Error & { sql?: string; parent?: Error }
        console.error('[DB sync error]', e.message)
        if (e.sql) console.error('[SQL]', e.sql)
        if (e.parent) console.error('[MySQL error]', e.parent.message)
        throw err
    }
}

export async function closeDatabase(): Promise<void> {
    await sequelize.close()
}

export { sequelize, Producto, Product, Usuario, Venta, VentaDetalle, Supplier, Departament }
