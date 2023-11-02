const i18n = require('i18n');

i18n.configure({
    locales: ['pt', 'es'],
    directory: __dirname + '/languages',
    defaultLocale: 'pt',
    objectNotation: true,
});

module.exports = i18n;