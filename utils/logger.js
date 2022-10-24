const pino = require("pino");
const pretty = require('pino-pretty');
//
// https://github.com/pinojs/pino-pretty
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
			ignore: "pid,hostname",
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      colorize: true
    }
  }
});
//
exports.logger = logger;