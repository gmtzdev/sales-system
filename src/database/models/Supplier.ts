import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface SupplierAttributes {
    id: number
    name: string
    description: string
    address: string
    phoneNumber: string
}

type SupplierCreationAttributes = Optional<SupplierAttributes, 'id' | 'description' | 'address' | 'phoneNumber'>

class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes>
    implements SupplierAttributes {
    declare id: number
    declare name: string
    declare description: string
    declare address: string
    declare phoneNumber: string
}

Supplier.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: { name: 'suppliers_name_unique', msg: 'Ya existe un proveedor con ese nombre' },
            validate: { notEmpty: { msg: 'El nombre no puede estar vacío' } },
        },
        description: { type: DataTypes.STRING(255), defaultValue: '' },
        address: {
            type: DataTypes.STRING(255),
            defaultValue: '',
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            defaultValue: '',
        },
    },
    { sequelize, tableName: 'suppliers', timestamps: true }
)

export default Supplier
