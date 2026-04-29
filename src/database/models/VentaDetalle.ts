import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface VentaDetalleAttributes {
    id: number
    // Foreign keys — defined explicitly for proper TypeScript support
    venta_id: number
    producto_id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
}

type VentaDetalleCreationAttributes = Optional<VentaDetalleAttributes, 'id'>

class VentaDetalle extends Model<VentaDetalleAttributes, VentaDetalleCreationAttributes>
    implements VentaDetalleAttributes {
    declare id: number
    declare venta_id: number
    declare producto_id: string
    declare cantidad: number
    declare precio_unitario: number
    declare subtotal: number
}

VentaDetalle.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        venta_id: { type: DataTypes.INTEGER, allowNull: false },
        producto_id: { type: DataTypes.STRING(150), allowNull: false },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: { args: [1], msg: 'La cantidad debe ser al menos 1' } },
        },
        precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { sequelize, tableName: 'venta_detalles', timestamps: false }
)

export default VentaDetalle
