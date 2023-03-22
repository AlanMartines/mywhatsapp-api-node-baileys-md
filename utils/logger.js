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
        stack: error.stack + `\n\tat ${__filename}:${__line}`,
        message: error.message,
        line: error.lineNumber, // adiciona a propriedade line com o número da linha do erro
      };
    },
  },
});

exports.logger = logger;
