import { ipcMain } from 'electron'
import Operation, { type OperationAttributes } from '../database/models/Operation'

type CreateOperationData = Pick<OperationAttributes, 'money_in_box' | 'exchange_rate' | 'start_user_id' | 'box_id'>

export function registerOperationsHandlers(): void {
    // Returns the first open operation, or null if none exists
    ipcMain.handle('operations:findOpen', async () => {
        const op = await Operation.findOne({ where: { is_open: true }, raw: true })
        return op ?? null
    })

    ipcMain.handle('operations:create', async (_event, data: CreateOperationData) => {
        const op = await Operation.create({
            ...data,
            start_at: new Date(),
            is_open: true,
        })
        return op.toJSON()
    })

    ipcMain.handle('operations:close', async (_event, id: number) => {
        const [affectedRows] = await Operation.update(
            { is_open: false, closed_at: new Date() },
            { where: { id } },
        )
        return { affectedRows }
    })
}
