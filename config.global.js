require('dotenv').config();
const config = module.exports = {};
//
config.NODE_ENV = process.env.NODE_ENV || 'production';
config.HOST = process.env.HOST || 'localhost';
config.PORT = process.env.PORT || '9001';
config.VIEW_QRCODE_TERMINAL = process.env.VIEW_QRCODE_TERMINAL || 1;
config.JWT_SECRET = process.env.JWT_SECRET;
config.TOKENSPATCH = process.env.TOKENSPATCH || 'tokens';
config.VALIDATE_MYSQL = process.env.VALIDATE_MYSQL || 0;
config.MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
config.MYSQL_PORT = process.env.MYSQL_PORT || '3306';
config.MYSQL_USER = process.env.MYSQL_USER || 'root';
config.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
config.MYSQL_DATABASE = process.env.MYSQL_DATABASE || '';
//