module.exports = (sequelize, DataTypes) => {
	const Tokens = sequelize.define('tokens', {
		iduser: DataTypes.INTEGER.UNSIGNED,
		sessionname: DataTypes.CHAR(255),
		active: DataTypes.CHAR(5),
		state: DataTypes.CHAR(20),
		status: DataTypes.CHAR(20),
		userconnected: DataTypes.CHAR(20),
		wh_status: DataTypes.STRING(255),
		wh_message: DataTypes.STRING(255),
		wh_qrcode: DataTypes.STRING(255),
		wh_connect: DataTypes.STRING(255),
		lastactivit: 'TIMESTAMP',
		created: 'TIMESTAMP',
		modified: 'TIMESTAMP',
	});
	return Tokens;
}