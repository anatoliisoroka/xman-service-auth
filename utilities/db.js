//imports
//npm libraries
const { Sequelize } = require('sequelize');
//for environment variables
require('dotenv').config();

//local libraries

//instatiate value for sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || 5432),
        dialect: process.env.DB_DIALECT || 'postgres',
        pool: {
            min: parseInt(process.env.DB_POOL_MIN || 0),
            max: parseInt(process.env.DB_POOL_MAX || 20),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || 300000),
            acquire: parseInt(process.env.DB_POOL_IDLE || 30000),
        }
    }
);

const connect = async () => {
    try {
        await sequelize.authenticate();
        return true;
    } catch(error) {
        return false;
    }
}

const disconnect = async () => {
    try {
        await sequelize.close();
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = { sequelize, connect, disconnect }