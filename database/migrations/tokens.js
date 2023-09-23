module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Tokens', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      AuthorizationToken: {
        allowNull: false,
        type: DataTypes.CHAR(255),
      },
      datafinal: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      active: {
        allowNull: false,
        type: DataTypes.CHAR(5),
				defaultValue: "true",
      },
      created: {
        allowNull: false,
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      modified: {
        allowNull: false,
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Tokens');
  }
};