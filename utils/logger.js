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
const gelfStream = require('gelf-stream');
const config = require('../config.global');

const stream = gelfStream.forBunyan(config.GRAYLOGSERVER, config.GRAYLOGPORT); // Substitua 'localhost' e '12201' pelo seu host e porta do Graylog

const logger = pino({
    level: 'info',
    messageKey: 'message',
    formatters: {
        level(label, number) {
            return { level: label };
        },
        log(object) {
            if (object.err && object.err.stack) {
                const stackTrace = object.err.stack.split('\n');
                const fileLine = stackTrace[1].match(/\(([^)]+)\)/)[1];
                const fileName = fileLine.split(':')[0];
                const lineNumber = fileLine.split(':')[1];
                //
                return {
                    stack: object.err.stack,
                    message: object.err.message,
                    line: lineNumber,
                    file: fileName
                };
            }
            //
            return object;
        },
    },
}, stream);

exports.logger = logger;