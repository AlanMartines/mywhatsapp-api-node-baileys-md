require('dotenv').config();
const config = module.exports = {};
//
config.NODE_ENV = process.env.NODE_ENV || 'production';
config.IPV4 = process.env.IPV4 || '127.0.0.1';
config.IPV6 = process.env.IPV6 || undefined;
config.PORT = process.env.PORT || '9009';
config.DOMAIN_SSL = process.env.DOMAIN_SSL || null;
config.VIEW_QRCODE_TERMINAL = process.env.VIEW_QRCODE_TERMINAL === "true";
config.DEVICE_NAME = process.env.DEVICE_NAME || 'My-Whatsapp';
config.PATCH_TOKENS = process.env.PATCH_TOKENS || '/usr/local/tokens';
config.WA_VERSION = process.env.WA_VERSION || undefined;
config.WA_URL = process.env.WA_URL || undefined;
config.AUTO_CLOSE = process.env.AUTO_CLOSE || 15;
config.SECRET_KEY = process.env.SECRET_KEY || null;
config.START_ALL_SESSIONS = process.env.START_ALL_SESSIONS === "true";
config.USE_HERE = process.env.FORCE_CONNECTION_USE_HERE === "true";
config.CONCURRENCY = process.env.CONCURRENCY || 1;
config.GRAYLOGSERVER = process.env.GRAYLOGSERVER || '127.0.0.1';
config.GRAYLOGPORT = process.env.GRAYLOGPORT || 12201;
config.INDOCKER = process.env.INDOCKER === "true";
config.DELETE_FILE_UNUSED = process.env.DELETE_FILE_UNUSED === "true";
config.TZ = process.env.TZ || 'America/Sao_Paulo';
config.LANGUAGE = process.env.LANGUAGE || 'pt_BR';
//
config.tokenPatch = "/usr/local/tokens";
//