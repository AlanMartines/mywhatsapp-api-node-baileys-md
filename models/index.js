const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');
//
const db = {};
const sequelize = new Sequelize(config);
//
const initApp = async () => {
	await sequelize.authenticate().then(async () => {
		console.log('- Connection has been established successfully');
	}).catch(async (error) => {
		console.error('- Unable to connect to the database: ', error);
	});
};
//
initApp();
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