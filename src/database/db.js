const { Sequelize } = require('sequelize')
const path = require('path')

// Carga .env solo en desarrollo
if (!require('electron').app.isPackaged) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') })
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'sales',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
)

module.exports = sequelize

