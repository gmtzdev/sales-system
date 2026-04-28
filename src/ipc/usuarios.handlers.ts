import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import type { Order, WhereOptions } from 'sequelize'
import Usuario, { type UsuarioAttributes } from '../database/models/Usuario'

const SALT_ROUNDS = 10

interface FindAllOptions {
    where?: WhereOptions<UsuarioAttributes>
    order?: Order
}

// Data shape for creating a new user (password is always required on create)
type CreateUsuarioData = Omit<UsuarioAttributes, 'id'>

export function registerUsuariosHandlers(): void {
    ipcMain.handle('usuarios:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order } = opts
        return Usuario.findAll({
            where,
            order,
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('usuarios:findById', async (_event, id: number) => {
        return Usuario.findByPk(id, {
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('usuarios:create', async (_event, data: CreateUsuarioData) => {
        const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)
        const usuario = await Usuario.create({ ...data, password: hashed })
        // Strip password from the returned object
        const { password: _pw, ...safe } = usuario.toJSON()
        return safe
    })

    ipcMain.handle('usuarios:update', async (_event, id: number, data: Partial<UsuarioAttributes>) => {
        const payload: Partial<UsuarioAttributes> = { ...data }
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS)
        } else {
            delete payload.password
        }
        const [affectedRows] = await Usuario.update(payload, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('usuarios:delete', async (_event, id: number) => {
        const affectedRows = await Usuario.destroy({ where: { id } })
        return { affectedRows }
    })
}
