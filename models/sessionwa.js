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
      allowNull: true
    },
    status: {
      type: DataTypes.CHAR(20),
      allowNull: true
    },
    userconnected: {
      type: DataTypes.CHAR(20),
      allowNull: true
    },
    profilepicture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    wh_status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wh_message: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wh_qrcode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wh_connect: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
	}, 
	{
		freezeTableName: true,
		tableName: 'sessionwa'
	});
	return Sessionwa;
}