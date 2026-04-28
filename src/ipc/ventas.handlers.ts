import { ipcMain } from 'electron'
import type { Order } from 'sequelize'
import { sequelize, Venta, VentaDetalle, Producto } from '../database/models'
import type { VentaAttributes } from '../database/models/Venta'

interface VentaDetallePayload {
    producto_id: number
    cantidad: number
    precio_unitario: number
    subtotal: number
}

interface CreateVentaPayload {
    venta: Omit<VentaAttributes, 'id'>
    detalles: VentaDetallePayload[]
}

interface FindAllOptions {
    order?: Order
}

export function registerVentasHandlers(): void {
    // Create a complete sale with its line items in a single transaction
    ipcMain.handle('ventas:create', async (_event, { venta, detalles }: CreateVentaPayload) => {
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
                // Decrement product stock
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

    // List all sales
    ipcMain.handle('ventas:findAll', async (_event, opts: FindAllOptions = {}) => {
        return Venta.findAll({
            order: opts.order ?? [['fecha', 'DESC']],
            raw: true,
        })
    })

    // Get full sale details including line items and products
    ipcMain.handle('ventas:findById', async (_event, id: number) => {
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
