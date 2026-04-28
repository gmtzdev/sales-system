import { ipcMain } from 'electron'
import type { Order, WhereOptions } from 'sequelize'
import Producto, { type ProductoAttributes } from '../database/models/Producto'

interface FindAllOptions {
    where?: WhereOptions<ProductoAttributes>
    order?: Order
    limit?: number
}

export function registerProductosHandlers(): void {
    ipcMain.handle('productos:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order, limit } = opts
        return Producto.findAll({ where, order, limit, raw: true })
    })

    ipcMain.handle('productos:findById', async (_event, id: number) => {
        return Producto.findByPk(id, { raw: true })
    })

    ipcMain.handle('productos:create', async (_event, data: Omit<ProductoAttributes, 'id'>) => {
        const producto = await Producto.create(data)
        return producto.toJSON()
    })

    ipcMain.handle('productos:update', async (_event, id: number, data: Partial<ProductoAttributes>) => {
        const [affectedRows] = await Producto.update(data, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('productos:delete', async (_event, id: number) => {
        const affectedRows = await Producto.destroy({ where: { id } })
        return { affectedRows }
    })
}
