import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface ProductAttributes {
    code: string
    description: string
    tsale: string
    pcost: number
    psale: number
    dept: number        // FK → Departament.id
    provid: number      // FK → Supplier.id
    umeas: number
    wholeSale: number
    ipriority: number
    dinventary: number
    dinventarymin: number
    dinventarymax: number
    profitporcentage: number
    components: string
    taxes: string
    image?: string
}

type ProductCreationAttributes = Optional<
    ProductAttributes,
    'ipriority' | 'profitporcentage' | 'components' | 'taxes'
>

class Product extends Model<ProductAttributes, ProductCreationAttributes>
    implements ProductAttributes {
    declare code: string
    declare description: string
    declare tsale: string
    declare pcost: number
    declare psale: number
    declare dept: number
    declare provid: number
    declare umeas: number
    declare wholeSale: number
    declare ipriority: number
    declare dinventary: number
    declare dinventarymin: number
    declare dinventarymax: number
    declare profitporcentage: number
    declare components: string
    declare taxes: string
    declare image?: string
}

Product.init(
    {
        code: {
            type: DataTypes.STRING(150),
            primaryKey: true,
            allowNull: false,
            unique: { name: 'products_code_unique', msg: 'Ya existe un producto con ese código' },
            validate: { notEmpty: { msg: 'El código no puede estar vacío' } },
        },
        description: { type: DataTypes.STRING(255), defaultValue: '' },
        // Sale type: e.g. 'unit', 'weight', etc.
        tsale: { type: DataTypes.STRING(50), allowNull: false },
        pcost: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            get() { const v = this.getDataValue('pcost'); return v === null ? null : parseFloat(v as unknown as string) },
            validate: { min: { args: [0], msg: 'El costo no puede ser negativo' } },
        },
        psale: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            get() { const v = this.getDataValue('psale'); return v === null ? null : parseFloat(v as unknown as string) },
            validate: { min: { args: [0], msg: 'El precio de venta no puede ser negativo' } },
        },
        // FK → departaments.id
        dept: { type: DataTypes.INTEGER, allowNull: false },
        // FK → suppliers.id
        provid: { type: DataTypes.INTEGER, allowNull: false },
        // Unit of measure (references a uom table or enum value)
        umeas: { type: DataTypes.INTEGER, allowNull: false },
        wholeSale: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            get() { const v = this.getDataValue('wholeSale'); return v === null ? null : parseFloat(v as unknown as string) },
            validate: { min: { args: [0], msg: 'El precio mayoreo no puede ser negativo' } },
        },
        ipriority: { type: DataTypes.INTEGER, defaultValue: 0 },
        dinventary: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            get() { const v = this.getDataValue('dinventary'); return v === null ? null : parseFloat(v as unknown as string) },
            validate: { min: { args: [0], msg: 'El inventario no puede ser negativo' } },
        },
        dinventarymin: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, get() { const v = this.getDataValue('dinventarymin'); return v === null ? null : parseFloat(v as unknown as string) } },
        dinventarymax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, get() { const v = this.getDataValue('dinventarymax'); return v === null ? null : parseFloat(v as unknown as string) } },
        profitporcentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, get() { const v = this.getDataValue('profitporcentage'); return v === null ? null : parseFloat(v as unknown as string) } },
        // JSON string for composite products
        components: { type: DataTypes.TEXT, defaultValue: '' },
        // JSON string with applied tax IDs
        taxes: { type: DataTypes.TEXT, defaultValue: '' },
        image: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, tableName: 'products', timestamps: false }
)

export default Product
