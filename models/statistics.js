module.exports = (sequelize, DataTypes) => {
	const Statistics = sequelize.define('Statistics', {
    AuthorizationToken: {
      type: DataTypes.CHAR(255),
      allowNull: false
    },
    sessionname: {
      type: DataTypes.CHAR(255),
      allowNull: false
    },
    status: {
      type: DataTypes.CHAR(10),
      allowNull: false
    },
    type: {
      type: DataTypes.CHAR(20),
      allowNull: false
    },
    isgroup: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
		created: 'TIMESTAMP',
		modified: 'TIMESTAMP',
	});
	return Statistics;
}