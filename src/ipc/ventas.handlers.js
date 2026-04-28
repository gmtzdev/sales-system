const { ipcMain } = require('electron')
const { Venta, VentaDetalle, Producto, sequelize } = require('../database/models')

function registerVentasHandlers() {
    // Crear una venta completa con sus detalles en una transacción
    ipcMain.handle('ventas:create', async (_event, { venta, detalles }) => {
        const t = await sequelize.transaction()
        try {
            const nuevaVenta = await Venta.create(venta, { transaction: t })

            for (const det of detalles) {
                await VentaDetalle.create(
                    {
                        venta_id: nuevaVenta.id,
                        producto_id: det.producto_id,
                        cantidad: det.cantidad,
                        precio_unitario: det.precio_unitario,
                        subtotal: det.subtotal,
                    },
                    { transaction: t },
                )
                // Decrementar stock del producto
                await Producto.decrement('stock', {
                    by: det.cantidad,
                    where: { id: det.producto_id },
                    transaction: t,
                })
            }

            await t.commit()
            return nuevaVenta.toJSON()
        } catch (err) {
            await t.rollback()
            throw err
        }
    })

    // Listar todas las ventas
    ipcMain.handle('ventas:findAll', async (_event, { order } = {}) => {
        return Venta.findAll({
            order: order || [['fecha', 'DESC']],
            raw: true,
        })
    })

    // Obtener detalle completo de una venta (con productos)
    ipcMain.handle('ventas:findById', async (_event, id) => {
        const venta = await Venta.findByPk(id, {
            include: [
                {
                    association: 'detalles',
                    include: [{ association: 'producto', attributes: ['id', 'nombre'] }],
                },
            ],
        })
        return venta ? venta.toJSON() : null
    })
}

module.exports = { registerVentasHandlers }
