// fetchCurrentAlphaVersion.js

const fetch = require('node-fetch');

const WA_URL = 'https://web.whatsapp.com';
const WA_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const { logger } = require('./logger');

/**
 * Retorna a versão alpha atual do WhatsApp Web
 * @returns {Promise<string|null>}
 */
async function fetchCurrentAlphaVersion() {
  try {
    const response = await fetch(WA_URL, {
      headers: {
        'user-agent': WA_USER_AGENT,
        'accept-language': 'en-US,en;q=1',
        'sec-fetch-mode': 'navigate',
        'cookie': 'wa_lang_pref=en;wa_build=c',
        'pragma': 'no-cache',
        'cache-control': 'no-cache',
      },
    });

    const text = await response.text();

    if (text) {
      const matches = text.match(/"client_revision"\s*:\s*(\d+)/) || [];
      if (matches[1]) {
        return `2.3000.${matches[1]}`;
      } else {
        logger.warn('Regex não encontrou client_revision!');
      }
    }
    return null;
  } catch (err) {
    logger.warn('Erro ao buscar a versão: ' + err.message);
    return null;
  }
}

module.exports = { fetchCurrentAlphaVersion };

// Exemplo de uso
// const { fetchCurrentAlphaVersion } = require('./utils/fetchCurrentAlphaVersion');
// (async () => {
//   const version = await fetchCurrentAlphaVersion();
//   console.log(version);
// })();
