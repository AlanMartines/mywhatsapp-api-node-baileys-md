/*
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
*/
const pino = require("pino");
const pretty = require('pino-pretty');
const pinoGelf = require('pino-gelf');
const gelfPro = require('gelf-pro');
const config = require('../config.global');

// Configurar o gelf-pro
gelfPro.setConfig({
  host: config.GRAYLOGSERVER,
  port: config.GRAYLOGPORT,
  adapterName: 'udp',
  // ... outras opções conforme necessário ...
});

// Criar um stream GELF para o Pino
const gelfStream = pinoGelf.createWriteStream({
  fields: {
    // ... quaisquer campos adicionais que você deseja enviar com cada log ...
  },
});

const logger = pino({
	timestamp: false,
	levelFirst: true,
	transport: {
		target: pretty,
		options: {
			errorProps: '*',
			ignore: "pid,hostname",
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
			colorize: true
		}
	}
}, gelfStream, { // Adicione o stream GELF aqui
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
