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
      return {
        stack: error.stack, // exibe nome do arquivo e linha do erro
        message: error.message,
      };
    },
  },
});

exports.logger = logger;
