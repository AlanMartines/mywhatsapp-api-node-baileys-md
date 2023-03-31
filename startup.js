const os = require('os');
const path = require('path');
const util = require('util');
const fs = require('fs-extra');
const request = util.promisify(require('request'));
const { logger } = require('./utils/logger');
const config = require('./config.global');

const tokenPatch = parseInt(config.INDOCKER) ? path.join(config.PATCH_TOKENS, os.hostname()) : config.PATCH_TOKENS;

if (!fs.existsSync(tokenPatch)) {
  try {
    fs.mkdirSync(tokenPatch, { recursive: true });
  } catch (error) {
    logger.error(`- Error creating directory ${tokenPatch}: ${error}`);
  }
}

class AllSessions {
  static async getAllSessions() {
    let startup = [];
    try {
      const files = await fs.readdir(tokenPatch);
      files.forEach(file => {
        if (file.includes('.startup.json')) {
          startup.push(file.split('.')[0]);
        }
      });
    } catch (error) {
      logger.error(`- Error getting sessions: ${error}`);
    }
    return startup;
  }

  static async startAllSessions() {
    const hostUrl = config.HOST == '0.0.0.0' ? '127.0.0.1' : config.HOST;
    const host = config.DOMAIN_SSL == '' ? `http://${hostUrl}:${config.PORT}` : `https://${config.DOMAIN_SSL}`;
    const dados = await this.getAllSessions();
		if(dados?.length){
    for (let item of dados) {
      setTimeout(async () => {
        try {
          const filePath = path.join(tokenPatch, `${item}.startup.json`);
					console.log(item);
          const resBody = {};
          if (fs.existsSync(filePath)) {
            const result = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            resBody.SessionName = item;
            resBody.setOnline = result.setOnlineue;
            resBody.wh_connect = result.wh_connect;
            resBody.wh_qrcode = result.wh_qrcode;
            resBody.wh_status = result.wh_status;
            resBody.wh_message = result.wh_message;
          } else {
            resBody.SessionName = item;
            resBody.setOnline = true;
            resBody.wh_connect = null;
            resBody.wh_qrcode = null;
            resBody.wh_status = null;
            resBody.wh_message = null;
          }
          const options = {
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
              'Content-Type': 'application/json',
              AuthorizationToken: parseInt(config.VALIDATE_MYSQL) ? item : config.SECRET_KEY
            },
            json: true,
            url: `${host}/sistema/Start`,
            body: resBody
          };
          const result = await request(options);
          logger?.info(`- Start Session Name: ${item}`);
        } catch (err) {
          logger?.error(`- Error starting session ${item}: ${err}`);
        }
      }, 3000);
    }
		}
  }
}

module.exports = AllSessions;