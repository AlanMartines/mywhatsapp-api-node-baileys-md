const i18n = require('i18n');
const config = require('../config.global');
i18n.configure({
    locales: ['pt-br', 'en'],
    directory: __dirname + '/languages',
    defaultLocale: 'en',
    objectNotation: true,
});

module.exports = i18n;