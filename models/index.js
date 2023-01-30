const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config.global');
const configDb = require('../config/database');
const { logger } = require("../utils/logger");
//
const db = {};
const sequelize = new Sequelize(configDb);
//
const initApp = async () => {
	await sequelize.authenticate().then(async () => {
		logger.info(`- Connection has been established successfully`);
	}).catch(async (error) => {
		logger.error(`- Unable to connect to the database: ${error}`);
	});
};
//
if (parseInt(config.VALIDATE_MYSQL) == true) {
	initApp();
}
//
fs.readdirSync(__dirname)
	.filter(file => (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js'))
	.forEach((file) => {
		const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
		db[model.name] = model;
	});
//
Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});
//
db.sequelize = sequelize;
db.Sequelize = Sequelize;
//
module.exports = db;