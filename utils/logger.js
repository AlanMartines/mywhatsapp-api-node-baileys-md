const pino = require("pino");
const pretty = require('pino-pretty');
/*
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
*/
const logger = pino({
	level: 'error',
	prettyPrint: {
		ignore: 'pid,hostname',
		translateTime: true,
	},
	hooks: {
		logMethod(inputArgs, method) {
			const { err } = inputArgs[0];
			if (err instanceof Error) {
				const stack = err.stack.split('\n');
				const fileName = stack[1].replace(/.*\((.*)\)/, '$1');
				const lineNo = stack[1].replace(/^.*:(\d+):\d+$/, '$1');
				const message = stack[0] + '\n' + err.message;
				method.call(this, { ...inputArgs[0], err: message }, `Error in file ${fileName} at line number ${lineNo}`);
			} else {
				method.call(this, ...inputArgs);
			}
		},
	},
});

exports.logger = logger;