module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Sessionwa', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      authorizationtoken: {
        allowNull: false,
        type: DataTypes.CHAR(255),
      },
      sessionname: {
        allowNull: false,
        type: DataTypes.CHAR(255),
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
      profilepicture: {
        allowNull: true,
        type: DataTypes.TEXT,
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
    return queryInterface.dropTable('Sessionwa');
  }
};