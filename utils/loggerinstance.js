const P = require("pino");
//
exports.default = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` });