import { ipcMain } from 'electron'
import type { Order, WhereOptions } from 'sequelize'
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
    sale: Omit<SaleTicketAttributes, 'id'>
    detalles: VentaDetallePayload[]
}

interface FindAllOptions {
    where?: WhereOptions<SaleTicketAttributes>
    order?: Order
    limit?: number
    includeAssociations?: boolean
}

export function registerSaleTicketHandlers(): void {
    // Create a complete sale with its line items in a single transaction
    ipcMain.handle('salesticket:create', async (_event, { sale, detalles }: CreateVentaPayload) => {
        const t = await sequelize.transaction()
        try {
            const nuevaVenta = await SaleTicket.create(sale, { transaction: t })

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
        const { where, order, limit, includeAssociations } = opts
        return SaleTicket.findAll({
            where,
            order: order ?? [['saled_at', 'DESC']],
            limit,
            include: includeAssociations
                ? [
                    {
                        association: 'articles',
                        include: [{ association: 'product', attributes: ['code', 'description', 'tsale', 'psale'] }],
                    },
                ]
                : undefined,
            raw: true,
        })
    })

    // Get full sale details including line items and products
    ipcMain.handle('salesticket:findById', async (_event, id: number) => {
        const venta = await SaleTicket.findByPk(id, {
            include: [
                {
                    association: 'articles',
                    include: [{ association: 'product', attributes: ['code', 'description', 'tsale', 'psale', 'dinventary'] }],
                },
            ],
        })
        return venta ? venta.toJSON() : null
    })

    // Create a single article for an open ticket (no inventory decrement — deferred to sale close)
    ipcMain.handle('salesticket:article:create', async (_event, data: {
        ticket_id: number
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
    }) => {
        const article = await SaleTicketArticles.create(data)
        return article.toJSON()
    })

    // Update the amount of an existing article
    ipcMain.handle('salesticket:article:update', async (_event, id: number, amount: number) => {
        await SaleTicketArticles.update({ amount }, { where: { id } })
        return { ok: true }
    })

    // Delete a single article
    ipcMain.handle('salesticket:article:delete', async (_event, id: number) => {
        await SaleTicketArticles.destroy({ where: { id } })
        return { ok: true }
    })

    // Close an open ticket: decrement inventory, set totals, mark as closed
    ipcMain.handle('salesticket:close', async (_event, id: number, data: {
        total: number
        subtotal: number
        taxes: number
        profit: number
        notes?: string
        pay_method?: string
        cashier_id?: number
    }) => {
        const t = await sequelize.transaction()
        try {
            const articles = await SaleTicketArticles.findAll({ where: { ticket_id: id }, transaction: t })

            for (const art of articles) {
                await Product.decrement('dinventary', {
                    by: art.amount,
                    where: { code: art.product_code },
                    transaction: t,
                })
            }

            await SaleTicket.update(
                {
                    is_open: false,
                    saled_at: new Date(),
                    total: data.total,
                    subtotal: data.subtotal,
                    taxes: data.taxes,
                    profit: data.profit,
                    article_count: articles.length,
                    notes: data.notes ?? '',
                    pay_method: data.pay_method ?? 'cash',
                    ...(data.cashier_id ? { cashier_id: data.cashier_id } : {}),
                },
                { where: { id }, transaction: t },
            )

            await t.commit()
            return { ok: true }
        } catch (err) {
            await t.rollback()
            throw err
        }
    })
}
