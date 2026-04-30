import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface ClientAttributes {
    id: number
    name: string
    address: string
    phone: string
    current_credit: number
    limit_credit: number
    last_payment_at: Date | null
    folio: number
}

type ClientCreationAttributes = Optional<ClientAttributes, 'id' | 'address' | 'phone' | 'current_credit' | 'limit_credit' | 'last_payment_at' | 'folio'>

class Client extends Model<ClientAttributes, ClientCreationAttributes>
    implements ClientAttributes {
    declare id: number
    declare name: string
    declare address: string
    declare phone: string
    declare current_credit: number
    declare limit_credit: number
    declare last_payment_at: Date | null
    declare folio: number
}

Client.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
            validate: { notEmpty: { msg: 'El nombre no puede estar vacío' } },
        },
        address: { type: DataTypes.STRING(150), defaultValue: '' },
        phone: { type: DataTypes.STRING(20), defaultValue: '' },
        current_credit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        limit_credit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        last_payment_at: { type: DataTypes.DATE, allowNull: true },
        folio: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: 'clients', timestamps: false }
)

export default Client
