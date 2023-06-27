module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Statistics', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      SessionName: {
        allowNull: false,
        type: DataTypes.CHAR(255),
      },
      status: {
        allowNull: false,
        type: DataTypes.CHAR(10),
      },
      type: {
        allowNull: false,
        type: DataTypes.CHAR(20),
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
    return queryInterface.dropTable('Statistics');
  }
};