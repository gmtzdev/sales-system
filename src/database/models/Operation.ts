import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface OperationAttributes {
    id: number
    money_in_box: number
    exchange_rate: number
    start_user_id: number
    start_at: Date
    closed_at: Date | null
    box_id: number
    is_open: boolean
    sales: number
    exits: number
    entries: number
    payments: number
    taxes: number
    profits: number
    refund_id: number | null
    card_income: number
    voucher_income: number
    cash_income: number
}

type OperationCreationAttributes = Optional<
    OperationAttributes,
    'id' | 'closed_at' | 'refund_id' | 'sales' | 'exits' | 'entries' | 'payments' | 'taxes' | 'profits' | 'card_income' | 'voucher_income' | 'cash_income'
>

class Operation extends Model<OperationAttributes, OperationCreationAttributes>
    implements OperationAttributes {
    declare id: number
    declare money_in_box: number
    declare exchange_rate: number
    declare start_user_id: number
    declare start_at: Date
    declare closed_at: Date | null
    declare box_id: number
    declare is_open: boolean
    declare sales: number
    declare exits: number
    declare entries: number
    declare payments: number
    declare taxes: number
    declare profits: number
    declare refund_id: number | null
    declare card_income: number
    declare voucher_income: number
    declare cash_income: number
}

Operation.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        money_in_box: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('money_in_box'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        exchange_rate: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
            defaultValue: 1,
            get() { const v = this.getDataValue('exchange_rate'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        start_user_id: { type: DataTypes.INTEGER, allowNull: false },
        start_at: { type: DataTypes.DATE, allowNull: false },
        closed_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        box_id: { type: DataTypes.INTEGER, allowNull: false },
        is_open: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sales: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('sales'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        exits: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('exits'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        entries: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('entries'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        payments: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('payments'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        taxes: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('taxes'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        profits: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('profits'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        refund_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
        card_income: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('card_income'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        voucher_income: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('voucher_income'); return v === null ? null : parseFloat(v as unknown as string) },
        },
        cash_income: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            get() { const v = this.getDataValue('cash_income'); return v === null ? null : parseFloat(v as unknown as string) },
        },
    },
    { sequelize, tableName: 'operations', timestamps: false }
)

export default Operation