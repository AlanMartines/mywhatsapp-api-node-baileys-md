module.exports = (sequelize, DataTypes) => {
	const Sessionwa = sequelize.define('Sessionwa', {
    authorizationtoken: {
      type: DataTypes.CHAR(255),
      allowNull: false
    },
    sessionname: {
      type: DataTypes.CHAR(255),
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
    profilepicture: {
      type: DataTypes.TEXT,
      allowNull: true
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
    }
	});
	return Sessionwa;
}