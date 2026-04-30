import sequelize from '../db'
import Product from './Product'
import User from './User'
import SaleTicket from './SaleTicket'
import SaleTicketArticles from './SaleTicketArtricles'
import Supplier from './Supplier'
import Departament from './Departament'
import Operation from './Operation'
import Client from './Client'

// Associations — Operation / SaleTicket
Operation.hasMany(SaleTicket, { foreignKey: 'operation_id', as: 'tickets' })
SaleTicket.belongsTo(Operation, { foreignKey: 'operation_id', as: 'operation' })

// Associations — SaleTicket / SaleTicketArticles / Product
SaleTicket.hasMany(SaleTicketArticles, { foreignKey: 'ticket_id', as: 'articles' })
SaleTicketArticles.belongsTo(SaleTicket, { foreignKey: 'ticket_id' })

SaleTicketArticles.belongsTo(Product, { foreignKey: 'product_code', as: 'product' })
Product.hasMany(SaleTicketArticles, { foreignKey: 'product_code' })

// Associations — SaleTicket / Client
Client.hasMany(SaleTicket, { foreignKey: 'client_id', as: 'tickets' })
SaleTicket.belongsTo(Client, { foreignKey: 'client_id', as: 'client' })

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

export { sequelize, Operation, Product, User, SaleTicket, SaleTicketArticles, Supplier, Departament, Client }
