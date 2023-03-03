const { Sequelize } = require("sequelize");

const db= new Sequelize({
    dialect: 'postgres',
    host: 'localhost', // direccion ip del serviddor
    username:process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'eccomerceDb',
    logging: false,
});
module.exports={db}