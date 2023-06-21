/*
const pino = require("pino");
const pretty = require('pino-pretty');
const config = require('../config.global');

const logger = pino({
	timestamp: false,
	levelFirst: true,
	transport: {
		target: 'pino-pretty',
		options: {
			errorProps: '*',
			ignore: "pid,hostname",
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
			colorize: true
		}
	}
}, {
	level: 'error',
	messageKey: 'message',
	formatters: {
		level(label, number) {
			return { level: label };
		},
		error(error) {
			if (error && error.stack) {
				const stackTrace = error.stack.split('\n');
				let fileLine, fileName, lineNumber;
				try {
					fileLine = stackTrace[1].match(/\(([^)]+)\)/)[1];
					[fileName, lineNumber] = fileLine.split(':');
				} catch (err) {
					console.error("Erro ao processar a stack trace", err);
				}
				return {
					stack: error.stack,
					message: error.message,
					line: lineNumber,
					file: fileName
				};
			}
			return error;
		},
	},
});
//
exports.logger = logger;
*/
const pino = require("pino");
const gelfPro = require('gelf-pro');
const config = require('../config.global');

// Configuração do gelf-pro para o Graylog
gelfPro.setConfig({
  host: config.GRAYLOGSERVER,
  port: config.GRAYLOGPORT,
  protocol: 'udp', // ou 'tcp'
  adapterName: 'udp', // ou 'tcp'
  adapterOptions: {
    family: 4,
		host: config.GRAYLOGSERVER,
		port: config.GRAYLOGPORT,
    exclusive: false
  }
});

const logger = pino({
  timestamp: false,
  levelFirst: true,
  formatters: {
    level(label, number) {
      return { level: label };
    },
    log(object) {
      gelfPro.info(object);
      return object;
    },
    error(error) {
      if (error && error.stack) {
        const stackTrace = error.stack.split('\n');
        let fileLine, fileName, lineNumber;
        try {
          fileLine = stackTrace[1].match(/\(([^)]+)\)/)[1];
          [fileName, lineNumber] = fileLine.split(':');
        } catch (err) {
          console.error("Erro ao processar a stack trace", err);
        }
        const logObject = {
          stack: error.stack,
          message: error.message,
          line: lineNumber,
          file: fileName
        };
        gelfPro.error(logObject);
        return logObject;
      }
      gelfPro.error(error);
      return error;
    },
  },
});

module.exports = logger ;
