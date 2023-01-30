const pino = require("pino");
const pretty = require('pino-pretty');
//
// https://github.com/pinojs/pino-pretty
const logger = pino({
  timestamp: false,
  transport: {
    target: 'pino-pretty',
    options: {
    errorProps: '*',
		ignore: "pid,hostname",
		translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
    colorize: true
    }
  }
});
//
exports.logger = logger;