const { ipcMain } = require('electron')
const bcrypt = require('bcryptjs')
const { Usuario } = require('../database/models')

const SALT_ROUNDS = 10

function registerUsuariosHandlers() {
    ipcMain.handle('usuarios:findAll', async (_event, { where, order } = {}) => {
        return Usuario.findAll({
            where,
            order,
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('usuarios:findById', async (_event, id) => {
        return Usuario.findByPk(id, {
            attributes: { exclude: ['password'] },
            raw: true,
        })
    })

    ipcMain.handle('usuarios:create', async (_event, data) => {
        const hashed = await bcrypt.hash(data.password, SALT_ROUNDS)
        const usuario = await Usuario.create({ ...data, password: hashed })
        const { password: _pw, ...safe } = usuario.toJSON()
        return safe
    })

    ipcMain.handle('usuarios:update', async (_event, id, data) => {
        const payload = { ...data }
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS)
        } else {
            delete payload.password
        }
        const [affectedRows] = await Usuario.update(payload, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('usuarios:delete', async (_event, id) => {
        const affectedRows = await Usuario.destroy({ where: { id } })
        return { affectedRows }
    })
}

module.exports = { registerUsuariosHandlers }
