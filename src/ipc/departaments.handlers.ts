import { ipcMain } from 'electron'
import type { Order, WhereOptions } from 'sequelize'
import Departament, { type DepartamentAttributes } from '../database/models/Departament'

interface FindAllOptions {
    where?: WhereOptions<DepartamentAttributes>
    order?: Order
    limit?: number
}

export function registerDepartamentsHandlers(): void {
    ipcMain.handle('departaments:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order, limit } = opts
        return Departament.findAll({ where, order, limit, raw: true })
    })

    ipcMain.handle('departaments:findById', async (_event, id: number) => {
        return Departament.findByPk(id, { raw: true })
    })

    ipcMain.handle('departaments:create', async (_event, data: Omit<DepartamentAttributes, 'id'>) => {
        const dept = await Departament.create(data)
        return dept.toJSON()
    })

    ipcMain.handle('departaments:update', async (_event, id: number, data: Partial<DepartamentAttributes>) => {
        const [affectedRows] = await Departament.update(data, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('departaments:delete', async (_event, id: number) => {
        const affectedRows = await Departament.destroy({ where: { id } })
        return { affectedRows }
    })
}
