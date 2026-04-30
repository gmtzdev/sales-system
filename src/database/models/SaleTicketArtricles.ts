import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface SaleTicketArticlesAttributes {
    id: number
    // Foreign keys — defined explicitly for proper TypeScript support
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
}

type SaleTicketArticlesCreationAttributes = Optional<SaleTicketArticlesAttributes, 'id'>

class SaleTicketArticles extends Model<SaleTicketArticlesAttributes, SaleTicketArticlesCreationAttributes>
    implements SaleTicketArticlesAttributes {
    declare id: number
    declare ticket_id: number
    declare product_code: string
    declare product_name: string
    declare amount: number
    declare profit: number
    declare departament_id: number
    declare pay_at: Date
    declare uses_wholesale_price: boolean
    declare discount_percentage: number
    declare components: string
    declare taxes_used: string
    declare unit_tax: number
    declare price_used: number
    declare amount_returned: number
    declare was_returned: boolean
    declare percentage_paid: number
}

SaleTicketArticles.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ticket_id: { type: DataTypes.INTEGER, allowNull: false },
        product_code: { type: DataTypes.STRING(150), allowNull: false },
        product_name: { type: DataTypes.STRING(255), allowNull: false },
        amount: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            get() { const v = this.getDataValue('amount'); return v === null ? null : parseFloat(v as unknown as string) },
            validate: { min: { args: [0], msg: 'La cantidad no puede ser negativa' } },
        },
        profit: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('profit'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        departament_id: { type: DataTypes.INTEGER, allowNull: false },
        pay_at: { type: DataTypes.DATE, allowNull: true },
        uses_wholesale_price: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        discount_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('discount_percentage'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        components: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
        taxes_used: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
        unit_tax: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('unit_tax'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        price_used: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            get() { const v = this.getDataValue('price_used'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        amount_returned: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('amount_returned'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        was_returned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        percentage_paid: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 100,
            get() { const v = this.getDataValue('percentage_paid'); return v === null ? null : parseFloat(v as unknown as string) },
        },
    },
    { sequelize, tableName: 'sale_ticket_articles', timestamps: false }
)

export default SaleTicketArticles
