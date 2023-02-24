const config = require('./config.global');
const { logger } = require("./utils/logger");
const fs = require('fs-extra');
const request = require('request-promise');
//
let tokenPatch;
if (parseInt(config.INDOCKER)) {
	//
	const containerHostname = os.hostname();
  tokenPatch = `${config.PATCH_TOKENS}/${containerHostname}`;
	//
} else {
	//
  tokenPatch = `${config.PATCH_TOKENS}`;
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
  if (!fs.existsSync(tokenPatch)) { // verifica se o diretório já existe
    fs.mkdirSync(tokenPatch, { recursive: true }); // cria o diretório recursivamente
  }
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class AllSessions {
	static async getAllSessions() {
		let startup = [];
		try {
			fs.readdirSync(tokenPatch).forEach(file => {
				//
				if (file.includes('.data.json') || file.includes('.store.json')) {
					startup.push(file.split(".")[0]);
				}
				//
			});
		} catch (error) {
			//
			logger.error(`- Error startup:\n ${error}`);
			startup = [];
			//
		}
		return startup;
	}

	static async startAllSessions() {
		let host = config.DOMAIN_SSL == '' ? `${config.HOST}:${config.PORT}` : `https://${config.DOMAIN_SSL}`;
		let dados = await this.getAllSessions();
		//
		if (dados != null) {
			dados.map((item, i) => {
				setTimeout(async () => {
					//
					try {
						if (fs.existsSync(`${tokenPatch}/${item}.startup.json`)) {
							let result = JSON.parse(fs.readFileSync(`${tokenPatch}/${item}.startup.json`, 'utf-8'));
							//
							let resBody = {
								"AuthorizationToken": item,
								"SessionName": item,
								"setOnline": result.setOnlineue,
								"wh_connect": result.wh_connect,
								"wh_qrcode": result.wh_qrcode,
								"wh_status": result.wh_status,
								"wh_message": result.wh_message
							}
							//
							var options = {
								'method': 'POST',
								"rejectUnauthorized": false,
								'json': true,
								'url': `${host}/sistema/Start`,
								body: resBody
							};
							request(options).then(result => {
								logger?.info(`- Start Session: ${item}`);
							}).catch(error => {
								logger?.error(`- Error Start Session: ${error}`);
							});
							//
						} else {
							//
							let resBody = {
								"AuthorizationToken": item,
								"SessionName": item,
								"setOnline": true,
								"wh_connect": null,
								"wh_qrcode": null,
								"wh_status": null,
								"wh_message": null
							}
							//
							var options = {
								'method': 'POST',
								"rejectUnauthorized": false,
								'json': true,
								'url': `${host}/sistema/Start`,
								body: resBody
							};
							request(options).then(result => {
								logger?.info(`- Start Session: ${item}`);
							}).catch(error => {
								logger?.error(`- Error Start Session: ${error}`);
							});
							//
						}
					} catch (err) {
						logger?.error(`- Arquivo ${tokenPatch}/${item}.startup.json não existe`);
					}
				}, 3000);
			});
		}
	}
}