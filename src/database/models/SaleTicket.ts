import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface SaleTicketAttributes {
    id: number
    folio: number
    box_id: number
    cashier_id: number
    name: string
    subtotal: number
    taxes: number
    total: number
    profit: number
    is_open: boolean
    client_id: number
    saled_at: Date
    is_modifiable: boolean
    pay_by: number
    currency: string
    article_count: number
    pay_at: Date
    is_cancelled: boolean
    operation_id: number
    old_ticket_id: number
    notes: string
    print_note: string
    pay_method: string
    reference: string
    invoice_id: number
    total_refund: number
}

type SaleTicketCreationAttributes = Optional<SaleTicketAttributes,
    'id' | 'folio' | 'subtotal' | 'total' | 'taxes' | 'profit' | 'is_open' | 'client_id' | 'saled_at' | 'is_modifiable' | 'pay_by' | 'currency' | 'article_count' | 'pay_at' | 'is_cancelled' | 'notes' | 'print_note' | 'pay_method' | 'reference' | 'invoice_id' | 'total_refund'>

class SaleTicket extends Model<SaleTicketAttributes, SaleTicketCreationAttributes>
    implements SaleTicketAttributes {
    declare id: number
    declare folio: number
    declare box_id: number
    declare cashier_id: number
    declare name: string
    declare subtotal: number
    declare taxes: number
    declare total: number
    declare profit: number
    declare is_open: boolean
    declare client_id: number
    declare saled_at: Date
    declare is_modifiable: boolean
    declare pay_by: number
    declare currency: string
    declare article_count: number
    declare pay_at: Date
    declare is_cancelled: boolean
    declare operation_id: number
    declare old_ticket_id: number
    declare notes: string
    declare print_note: string
    declare pay_method: string
    declare reference: string
    declare invoice_id: number
    declare total_refund: number
}

SaleTicket.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        folio: { type: DataTypes.INTEGER, allowNull: false },
        box_id: { type: DataTypes.INTEGER, allowNull: false },
        cashier_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        taxes: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        profit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        is_open: { type: DataTypes.BOOLEAN, defaultValue: true },
        client_id: { type: DataTypes.INTEGER, allowNull: true },
        saled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        is_modifiable: { type: DataTypes.BOOLEAN, defaultValue: true },
        pay_by: { type: DataTypes.BIGINT, allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: true },
        article_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        pay_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        is_cancelled: { type: DataTypes.BOOLEAN, defaultValue: false },
        operation_id: { type: DataTypes.INTEGER, allowNull: false },
        old_ticket_id: { type: DataTypes.INTEGER, allowNull: true },
        notes: { type: DataTypes.TEXT, defaultValue: '' },
        print_note: { type: DataTypes.TEXT, defaultValue: '' },
        pay_method: { type: DataTypes.STRING(50), allowNull: false },
        reference: { type: DataTypes.STRING(255), allowNull: true },
        invoice_id: { type: DataTypes.INTEGER, allowNull: true },
        total_refund: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    },
    { sequelize, tableName: 'sale_tickets', timestamps: false }
)

export default SaleTicket
