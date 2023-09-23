module.exports = (sequelize, DataTypes) => {
	const Tokens = sequelize.define('Tokens', {
    authorizationtoken: {
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
	}, 
	{
		freezeTableName: true,
		tableName: 'tokens'
	});
	return Tokens;
}