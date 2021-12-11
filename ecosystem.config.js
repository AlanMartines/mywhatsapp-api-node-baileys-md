//ecosystem.config.js
//
require('dotenv/config');
//
const NODE_ENV = process.env.NODE_ENV || 'production';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '9001';
const VIEW_QRCODE_TERMINAL = process.env.VIEW_QRCODE_TERMINAL || 1;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKENSPATCH = process.env.TOKENSPATCH || 'tokens';
const VALIDATE_MYSQL = process.env.VALIDATE_MYSQL || 0;
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = process.env.MYSQL_PORT || '3306';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || '';
//
module.exports = {
  apps: [{
    name: "ApiBaileysMd",
    script: "./server.js",
    instances: 1,
    exec_mode: "cluster",
    watch: true,
    env: {
      NODE_ENV,
      HOST,
      PORT,
      VIEW_QRCODE_TERMINAL,
      JWT_SECRET,
      TOKENSPATCH,
      VALIDATE_MYSQL,
      MYSQL_HOST,
      PORT_MYSQL,
      MYSQL_PORT,
      MYSQL_USER,
      MYSQL_PASSWORD,
      MYSQL_DATABASE
    },
  }]
}