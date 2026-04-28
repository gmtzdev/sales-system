import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface ProductoAttributes {
    id: number
    nombre: string
    descripcion: string
    precio: number
    stock: number
}

type ProductoCreationAttributes = Optional<ProductoAttributes, 'id' | 'descripcion' | 'precio' | 'stock'>

class Producto extends Model<ProductoAttributes, ProductoCreationAttributes>
    implements ProductoAttributes {
    declare id: number
    declare nombre: string
    declare descripcion: string
    declare precio: number
    declare stock: number
}

Producto.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: { notEmpty: { msg: 'El nombre no puede estar vacío' } },
        },
        descripcion: { type: DataTypes.STRING(255), defaultValue: '' },
        precio: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            validate: { min: { args: [0], msg: 'El precio no puede ser negativo' } },
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: { args: [0], msg: 'El stock no puede ser negativo' } },
        },
    },
    { sequelize, tableName: 'productos', timestamps: false }
)

export default Producto
