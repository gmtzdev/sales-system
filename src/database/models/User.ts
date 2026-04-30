import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export type UserRole = 'admin' | 'vendedor'

export interface UserAttributes {
    id: number
    username: string
    password: string
    nombre: string
    rol: UserRole
    activo: boolean
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'nombre' | 'rol' | 'activo'>

class User extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes {
    declare id: number
    declare username: string
    declare password: string
    declare nombre: string
    declare rol: UserRole
    declare activo: boolean
}

User.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
            validate: { notEmpty: { msg: 'El nombre de usuario no puede estar vacío' } },
        },
        password: { type: DataTypes.STRING(255), allowNull: false },
        nombre: { type: DataTypes.STRING(150), defaultValue: '' },
        rol: {
            type: DataTypes.ENUM('admin', 'vendedor'),
            defaultValue: 'vendedor',
        },
        activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'usuarios', timestamps: false }
)

export default User
