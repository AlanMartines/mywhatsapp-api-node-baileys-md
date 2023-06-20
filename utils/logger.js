const pino = require("pino");
const pretty = require('pino-pretty');
const pinoGelf = require('pino-gelf');
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

exports.logger = logger;