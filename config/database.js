const config = require('../config.global');
//
module.exports = {
  dialect: config.MYSQL_DIALECT,
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  username: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE,
  logging: false,
  define: {
    timestamps: false,
    underscored: true,
    underscoredAll: true,
    freezeTableName: false,
    syncOnAssociation: true,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  pool: {
    max: 20,
    min: 5,
		idle: 20000,
		evict: 15000,
		acquire: 30000
	},
	timezone: '-03:00'
};
//