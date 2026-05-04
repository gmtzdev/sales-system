import { ipcMain } from 'electron'
import type { Order } from 'sequelize'
import { sequelize, SaleTicket, SaleTicketArticles, Product } from '../database/models'
import type { SaleTicketAttributes } from '../database/models/SaleTicket'

interface VentaDetallePayload {
    product_code: string
    product_name: string
    amount: number
    profit: number
    departament_id: number
    pay_at: Date
    uses_wholesale_price: boolean
    discount_percentage: number
    components: string
    taxes_used: string
    unit_tax: number
    price_used: number
    amount_returned: number
    was_returned: boolean
    percentage_paid: number
}

interface CreateVentaPayload {
    venta: Omit<SaleTicketAttributes, 'id'>
    detalles: VentaDetallePayload[]
}

interface FindAllOptions {
    order?: Order
}

export function registerSaleTicketHandlers(): void {
    // Create a complete sale with its line items in a single transaction
    ipcMain.handle('salesticket:create', async (_event, { venta, detalles }: CreateVentaPayload) => {
        const t = await sequelize.transaction()
        try {
            const nuevaVenta = await SaleTicket.create(venta, { transaction: t })

            for (const det of detalles) {
                await SaleTicketArticles.create(
                    {
                        ticket_id: nuevaVenta.id,
                        product_code: det.product_code,
                        product_name: det.product_name,
                        amount: det.amount,
                        profit: det.profit,
                        departament_id: det.departament_id,
                        pay_at: det.pay_at,
                        uses_wholesale_price: det.uses_wholesale_price,
                        discount_percentage: det.discount_percentage,
                        components: det.components,
                        taxes_used: det.taxes_used,
                        unit_tax: det.unit_tax,
                        price_used: det.price_used,
                        amount_returned: det.amount_returned,
                        was_returned: det.was_returned,
                        percentage_paid: det.percentage_paid,
                    },
                    { transaction: t },
                )
                // Decrement product inventory
                await Product.decrement('dinventary', {
                    by: det.amount,
                    where: { code: det.product_code },
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
    ipcMain.handle('salesticket:findAll', async (_event, opts: FindAllOptions = {}) => {
        return SaleTicket.findAll({
            order: opts.order ?? [['saled_at', 'DESC']],
            raw: true,
        })
    })

    // Get full sale details including line items and products
    ipcMain.handle('salesticket:findById', async (_event, id: number) => {
        const venta = await SaleTicket.findByPk(id, {
            include: [
                {
                    association: 'articles',
                    include: [{ association: 'product', attributes: ['code', 'description'] }],
                },
            ],
        })
        return venta ? venta.toJSON() : null
    })
}
