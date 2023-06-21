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
const gelf = require('pino-gelf');
const config = require('../config.global');

const logger = pino({
	timestamp: false,
	levelFirst: true,
	messageKey: 'message',
	formatters: {
		level(label, number) {
			return { level: label };
		},
		log(object) {
			return {
				version: '1.1',
				host: `${config.GRAYLOGSERVER}:${config.GRAYLOGPORT}}`,
				short_message: object.message,
				full_message: JSON.stringify(object),
				timestamp: object.time,
				level: object.level,
				_file: object.file,
				_line: object.line,
				...object
			};
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

const gelfStream = gelf.createWriteStream({
	host: 'graylog-server',
	port: 12201
});

logger.pipe(gelfStream);

module.exports = logger;