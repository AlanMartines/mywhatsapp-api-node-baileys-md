const i18n = require('i18n');
const config = require('../config.global');
//
i18n.configure({
    locales: ['pt_Br', 'us'],
    directory: __dirname + '/languages',
    defaultLocale: 'pt_Br',
    objectNotation: true,
});
//
module.exports = i18n;