import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export interface DepartamentAttributes {
    id: number
    name: string
    taxPorcentage: string
    active: boolean
}

type DepartamentCreationAttributes = Optional<DepartamentAttributes, 'id' | 'taxPorcentage' | 'active'>

class Departament extends Model<DepartamentAttributes, DepartamentCreationAttributes>
    implements DepartamentAttributes {
    declare id: number
    declare name: string
    declare taxPorcentage: string
    declare active: boolean
}

Departament.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: { name: 'departaments_name_unique', msg: 'Ya existe un departamento con ese nombre' },
            validate: { notEmpty: { msg: 'El nombre no puede estar vacío' } },
        },
        taxPorcentage: { type: DataTypes.DECIMAL(10, 2), defaultValue: '0' },
        active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'departaments', timestamps: true }
)

export default Departament
