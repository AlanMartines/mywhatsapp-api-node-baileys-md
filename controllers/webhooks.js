const axios = require('axios');
const https = require('https');
require('dotenv').config();
const { logger } = require("../utils/logger");
const Sessions = require('../controllers/sessions');
//
module.exports = class Webhooks {

	static async #sendRequest(url, data, eventName) {
		if (!url) {
			logger.info(`- Webhook ${eventName} no defined`);
			return;
		}
		try {
			let dataJson = JSON.stringify(data, null, 2);
			await axios.post(url, dataJson, {
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
					keepAlive: true
				}),
				headers: {
					'Content-type': 'application/json; charset=utf-8',
					'Accept': 'application/json; charset=utf-8'
				}
			});
			logger.info(`- Webhooks ${eventName}`);
		} catch (error) {
			logger?.error(`- Error webhook ${eventName}: ${error.message}`);
		}
	}

	static async wh_messages(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		await this.#sendRequest(dataSessions?.wh_message, object, 'message');
	}

	static async wh_connect(SessionName) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		try {
			var object = {
				"wook": 'STATUS_CONNECT',
				'SessionName': SessionName,
				'state': dataSessions?.state,
				'status': dataSessions?.status,
				'number': dataSessions?.client?.user?.id.split(":")[0],
			}
			await this.#sendRequest(dataSessions?.wh_connect, object, 'connect status');
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_status(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		await this.#sendRequest(dataSessions?.wh_status, object, 'status');
	}

	static async wh_qrcode(SessionName) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			let object = {
				"wook": 'QRCODE',
				'session': dataSessions?.SessionName,
				'state': dataSessions?.state,
				'status': dataSessions?.status,
				'qrcode': dataSessions?.qrcode,
				'urlCode': dataSessions?.urlCode
			}
			await this.#sendRequest(dataSessions?.wh_qrcode, object, 'qrcode');
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);;
		}
	}

	static async wh_incomingcall(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		await this.#sendRequest(dataSessions?.wh_incomingcall, object, 'receive call');
	}
}