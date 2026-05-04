import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import type { Order, WhereOptions } from 'sequelize'
import Usuario, { type UserAttributes } from '../database/models/User'

const SALT_ROUNDS = 10

interface FindAllOptions {
    where?: WhereOptions<UserAttributes>
    order?: Order
}

// Data shape for creating a new user (password is always required on create)
type CreateUserData = Omit<UserAttributes, 'id'>

export function registerUsersHandlers(): void {
    ipcMain.handle('users:findAll', async (_event, opts: FindAllOptions = {}) => {
        const { where, order } = opts
        return Usuario.findAll({
            where,
            order,
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('users:findById', async (_event, id: number) => {
        return Usuario.findByPk(id, {
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('users:create', async (_event, data: CreateUserData) => {
        const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)
        const usuario = await Usuario.create({ ...data, password: hashed })
        // Strip password from the returned object
        const { password: _pw, ...safe } = usuario.toJSON()
        return safe
    })

    ipcMain.handle('users:update', async (_event, id: number, data: Partial<UserAttributes>) => {
        const payload: Partial<UserAttributes> = { ...data }
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS)
        } else {
            delete payload.password
        }
        const [affectedRows] = await Usuario.update(payload, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('users:delete', async (_event, id: number) => {
        const affectedRows = await Usuario.destroy({ where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('users:login', async (_event, username: string, password: string) => {
        const user = await Usuario.findOne({ where: { username } })
        if (!user) return { ok: false, error: 'Usuario o contraseña incorrectos' }
        if (!user.isActive) return { ok: false, error: 'El usuario está desactivado' }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return { ok: false, error: 'Usuario o contraseña incorrectos' }

        const { password: _pw, ...safe } = user.toJSON()
        return { ok: true, user: safe }
    })
}
