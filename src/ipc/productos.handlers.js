const { ipcMain } = require('electron')
const { Producto } = require('../database/models')

function registerProductosHandlers() {
    ipcMain.handle('productos:findAll', async (_event, { where, order, limit } = {}) => {
        return Producto.findAll({ where, order, limit, raw: true })
    })

    ipcMain.handle('productos:findById', async (_event, id) => {
        return Producto.findByPk(id, { raw: true })
    })

    ipcMain.handle('productos:create', async (_event, data) => {
        const producto = await Producto.create(data)
        return producto.toJSON()
    })

    ipcMain.handle('productos:update', async (_event, id, data) => {
        const [affectedRows] = await Producto.update(data, { where: { id } })
        return { affectedRows }
    })

    ipcMain.handle('productos:delete', async (_event, id) => {
        const affectedRows = await Producto.destroy({ where: { id } })
        return { affectedRows }
    })
}

module.exports = { registerProductosHandlers }
