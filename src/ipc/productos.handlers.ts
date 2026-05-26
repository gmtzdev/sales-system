import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
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
        const result = await Product.findByPk(code, { raw: true });
        return result;
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

    ipcMain.handle('productos:saveImage', async (_event, fileName: string, buffer: number[]) => {
        const dir = path.join(app.getPath('userData'), 'products')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        const ext = path.extname(fileName) || '.jpg'
        const name = `${randomUUID()}${ext}`
        const filePath = path.join(dir, name)
        fs.writeFileSync(filePath, Buffer.from(buffer))
        return name
    })

    ipcMain.handle('productos:deleteImage', async (_event, fileName: string) => {
        const dir = path.join(app.getPath('userData'), 'products')
        const filePath = path.join(dir, path.basename(fileName))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        return { ok: true }
    })
}
