import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface VentaAttributes {
    id: number
    fecha: Date
    total: number
    notas: string
    vendedor: string
}

type VentaCreationAttributes = Optional<VentaAttributes, 'id' | 'fecha' | 'total' | 'notas' | 'vendedor'>

class Venta extends Model<VentaAttributes, VentaCreationAttributes>
    implements VentaAttributes {
    declare id: number
    declare fecha: Date
    declare total: number
    declare notas: string
    declare vendedor: string
}

Venta.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        notas: { type: DataTypes.STRING(255), defaultValue: '' },
        vendedor: { type: DataTypes.STRING(80), defaultValue: '' },
    },
    { sequelize, tableName: 'ventas', timestamps: false }
)

export default Venta
