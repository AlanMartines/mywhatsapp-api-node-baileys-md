module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('tokens', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      iduser: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      sessionname: {
        allowNull: false,
        type: DataTypes.CHAR(255),
      },
      active: {
        allowNull: false,
        type: DataTypes.CHAR(5),
				defaultValue: "true",
      },
      state: {
        allowNull: false,
        type: DataTypes.CHAR(20),
				defaultValue: "DISCONNECTED",
      },
      status: {
        allowNull: false,
        type: DataTypes.CHAR(20),
				defaultValue: "notLogged",
      },
      userconnected: {
        allowNull: true,
        type: DataTypes.CHAR(20),
      },
      vencimento: {
        allowNull: true,
        type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: "10",
      },
      wh_status: {
        allowNull: true,
        type: DataTypes.STRING(255),
      },
      wh_message: {
        allowNull: true,
        type: DataTypes.STRING(255),
      },
      wh_qrcode: {
        allowNull: true,
        type: DataTypes.STRING(255),
      },
      wh_connect: {
        allowNull: true,
        type: DataTypes.STRING(255),
      },
      lastactivit: {
        allowNull: true,
        type: 'TIMESTAMP',
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
    return queryInterface.dropTable('tokens');
  }
};