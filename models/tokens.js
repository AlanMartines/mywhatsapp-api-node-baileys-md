module.exports = (sequelize, DataTypes) => {
	const Tokens = sequelize.define('Tokens', {
    iduser: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    token: {
      type: DataTypes.CHAR(255),
      allowNull: false
    },
    datafinal: {
      type: DataTypes.DATE,
      allowNull: false
    },
    active: {
      type: DataTypes.CHAR(5),
      allowNull: false
    },
    state: {
      type: DataTypes.CHAR(20),
      allowNull: false
    },
    status: {
      type: DataTypes.CHAR(20),
      allowNull: false
    },
    userconnected: {
      type: DataTypes.CHAR(20),
      allowNull: false
    },
    webhook: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    wh_status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    wh_message: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    wh_qrcode: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    wh_connect: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
		lastactivity: 'TIMESTAMP',
		created: 'TIMESTAMP',
		modified: 'TIMESTAMP',
	});
	return Tokens;
}