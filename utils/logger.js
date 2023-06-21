/*
const pino = require("pino");
const pretty = require('pino-pretty');

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
	// Opções de log de erro
	level: 'error',
	messageKey: 'message',
	formatters: {
		level(label, number) {
			return { level: label };
		},
		error(error) {
			if (error && error.stack) {
				const stackTrace = error.stack.split('\n');
				const fileLine = stackTrace[1].match(/\(([^)]+)\)/)[1];
				const fileName = fileLine.split(':')[0];
				const lineNumber = fileLine.split(':')[1];
				//
				return {
					stack: error.stack,
					message: error.message,
					line: lineNumber,
					file: fileName
				};
			}
			//
			return error;
		},
	},
});

exports.logger = logger;
*/

const pino = require('pino');
const config = require('../config.global');

const gelfStream = require('pino-gelf')({
      host: config.GRAYLOGSERVER, // substitua por seu host Graylog
      port: config.GRAYLOGPORT, // substitua pela sua porta Graylog, se diferente
});

const logger = pino({
  timestamp: false,
  levelFirst: true,
  messageKey: 'message',
  formatters: {
    level(label, number) {
      return { level: label };
    },
    log(object) {
      if (object && object.stack) {
        const stackTrace = object.stack.split('\n');
        const fileLine = stackTrace[1].match(/\(([^)]+)\)/)[1];
        const fileName = fileLine.split(':')[0];
        const lineNumber = fileLine.split(':')[1];
        return {
          stack: object.stack,
          message: object.message,
          line: lineNumber,
          file: fileName
        };
      }
      return object;
    },
  },
}, gelfStream);

exports.logger = logger;