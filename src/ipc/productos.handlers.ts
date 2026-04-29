import { ipcMain } from 'electron'
import type { Order, WhereOptions } from 'sequelize'
import Product, { type ProductAttributes } from '../database/models/Product'

interface FindAllOptions {
    where?: WhereOptions<ProductAttributes>
    order?: Order
    limit?: number
    includeAssociations?: boolean
}

export function registerProductosHandlers(): void {
    // Returns products with optional supplier/departament names joined
    ipcMain.handle('productos:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order, limit, includeAssociations } = opts
        const include = includeAssociations
            ? [
                { association: 'supplier', attributes: ['id', 'name'] },
                { association: 'departament', attributes: ['id', 'name'] },
            ]
            : []
        const rows = await Product.findAll({ where, order, limit, include })
        return rows.map(r => r.toJSON())
    })

    ipcMain.handle('productos:findByCode', async (_event, code: string) => {
        return Product.findByPk(code, { raw: true })
    })

    ipcMain.handle('productos:create', async (_event, data: Omit<ProductAttributes, never>) => {
        const product = await Product.create(data)
        return product.toJSON()
    })

    ipcMain.handle('productos:update', async (_event, code: string, data: Partial<ProductAttributes>) => {
        const [affectedRows] = await Product.update(data, { where: { code } })
        return { affectedRows }
    })

    ipcMain.handle('productos:delete', async (_event, code: string) => {
        const affectedRows = await Product.destroy({ where: { code } })
        return { affectedRows }
    })
}
