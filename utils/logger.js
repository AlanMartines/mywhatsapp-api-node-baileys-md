const pino = require("pino");
const pretty = require('pino-pretty');
const stackTrace = require('stack-trace');

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
      const stack = stackTrace.parse(error);
      const frame = stack[0];

      return {
        message: error.message,
        file: frame.getFileName(),
        line: frame.getLineNumber(),
        stack: error.stack
      };
    },
  },
});

exports.logger = logger;
