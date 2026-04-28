import { ipcMain } from 'electron'
import type { Order, WhereOptions } from 'sequelize'
import Supplier, { type SupplierAttributes } from '../database/models/Supplier'

interface FindAllOptions {
    where?: WhereOptions<SupplierAttributes>
    order?: Order
    limit?: number
}

export function registerSuppliersHandlers(): void {
    ipcMain.handle('suppliers:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order, limit } = opts
        return Supplier.findAll({ where, order, limit, raw: true })
    })

    ipcMain.handle('suppliers:findById', async (_event, id: number) => {
        return Supplier.findByPk(id, { raw: true })
    })

    ipcMain.handle('suppliers:create', async (_event, data: Omit<SupplierAttributes, 'id'>) => {
        const supplier = await Supplier.create(data)
        return supplier.toJSON()
    })

    ipcMain.handle('suppliers:update', async (_event, id: number, data: Partial<SupplierAttributes>) => {
        const [affectedRows] = await Supplier.update(data, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('suppliers:delete', async (_event, id: number) => {
        const affectedRows = await Supplier.destroy({ where: { id } })
        return { affectedRows }
    })
}
