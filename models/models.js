const dbConfig = require('../config/db.config');
const Sequelize = require("sequelize");
const UserModel = require("./user.model");

const createSequelizeInstance = () => {
  return new Sequelize('', dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: 0
  });
};

const database = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});


const db = {};

db.Sequelize = Sequelize;
db.database = database;
db.user = require("./user.model")(database, Sequelize);


db.initializeDatabase = async () => {
  try {
    const adminDatabase = createSequelizeInstance();
    await adminDatabase.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.DB}\`;`);
    await adminDatabase.close();

    db.database = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
      host: dbConfig.HOST,
      dialect: dbConfig.dialect,
      operatorsAliases: 0,
      pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
      }
    });

    db.User = UserModel(db.database, Sequelize);

    await db.database.sync();

    console.log('Database connection established.');
  } catch (error) {
    console.error('Error occurred during database initialization:', error);
    throw error;
  }
};

module.exports = db;