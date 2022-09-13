module.exports = (sequelize, DataTypes) => {
	const Tokens = sequelize.define('tokens', {
		iduser: DataTypes.INTEGER.UNSIGNED,
		token: DataTypes.CHAR(255),
		sessionToken: DataTypes.TEXT,
		datainicial: DataTypes.DATE,
		datafinal: DataTypes.DATE,
		active: DataTypes.CHAR(5),
		state: DataTypes.CHAR(20),
		status: DataTypes.CHAR(20),
		processid: DataTypes.INTEGER.UNSIGNED,
		userconnected: DataTypes.CHAR(20),
		vencimento: DataTypes.INTEGER.UNSIGNED,
		emailcob: DataTypes.CHAR(100),
		webhook: DataTypes.STRING(255),
		wh_status: DataTypes.STRING(255),
		wh_message: DataTypes.STRING(255),
		wh_qrcode: DataTypes.STRING(255),
		wh_connect: DataTypes.STRING(255),
		tptoken: DataTypes.INTEGER.UNSIGNED,
		descricao: DataTypes.CHAR(20),
		valor: DataTypes.CHAR(20),
		lastactivit: 'TIMESTAMP',
		created: 'TIMESTAMP',
		modified: 'TIMESTAMP',
	});
	return Tokens;
}