import { DataTypes, Model, type Optional } from 'sequelize'
import sequelize from '../db'

export type UserRole = 'admin' | 'vendedor'

export interface UserAttributes {
    id: number
    name: string
    address: string
    phoneNumber: string
    username: string
    email: string
    password: string
    rol: UserRole
    isActive: boolean
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'name' | 'address' | 'phoneNumber' | 'rol' | 'isActive'>

class User extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes {
    declare id: number
    declare name: string
    declare address: string
    declare phoneNumber: string
    declare username: string
    declare email: string
    declare password: string
    declare rol: UserRole
    declare isActive: boolean
}

User.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(150), defaultValue: '' },
        address: { type: DataTypes.STRING(255), defaultValue: '' },
        phoneNumber: { type: DataTypes.STRING(20), defaultValue: '' },
        username: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
            validate: { notEmpty: { msg: 'El nombre de usuario no puede estar vacío' } },
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: 'El correo electrónico no es válido' },
                notEmpty: { msg: 'El correo electrónico no puede estar vacío' },
            },
        },
        password: { type: DataTypes.STRING(255), allowNull: false },
        rol: {
            type: DataTypes.ENUM('admin', 'vendedor'),
            defaultValue: 'vendedor',
        },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, tableName: 'usuarios', timestamps: false }
)

export default User
