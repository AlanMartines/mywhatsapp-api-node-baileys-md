const axios = require('axios');
const https = require('https');
require('superagent-queue');
require('dotenv').config();
const { logger } = require("../utils/logger");
const Sessions = require('../controllers/sessions');
//
module.exports = class Webhooks {

	static async wh_messages(data, object) {
		//let data = Sessions?.getSession(session);
		try {
			if (data?.wh_message != undefined && data?.wh_message != null && data?.wh_message != '') {
				logger.info(`- SessionName: ${data?.name}`);
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(data?.wh_message, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json' }
				}).then(response => {
					logger.info('- Webhooks receive message')
				}).catch(error => {
					logger?.error(`- Error receive message: ${error.message}`);
				});

			} else {
				logger.info('- Webhook no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_connect(data, object, phone = null) {
		//let data = Sessions?.getSession(session)
		logger.info(`- SessionName: ${data?.name}`);
		try {
			var object = {
				"wook": 'STATUS_CONNECT',
				'result': 200,
				'session': data.name,
				'state': data.state,
				'status': data.status,
				'number': phone?.split('@')[0],
			}

			if (data?.wh_connect != undefined && data?.wh_connect != null && data?.wh_connect != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(data?.wh_connect, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json' }
				}).then(response => {
					logger.info('- Webhooks connect status')
				}).catch(error => {
					logger?.error(`- Error connect status ${error.message}`);
				});

			} else {
				logger.info('- Webhook no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}

	}

	static async wh_status(data, object) {
		//let data = Sessions?.getSession(session)
		logger.info(`- SessionName: ${data?.name}`);
		try {
			if (data?.wh_status != undefined && data?.wh_status != null && data?.wh_status != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(data?.wh_status, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json' }
				}).then(response => {
					logger.info('- Webhooks status message')
				}).catch(error => {
					logger?.error(`- Error status message ${error.message}`);
				});

			} else {
				logger.info('- Webhook no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_qrcode(SessionName, readQRCode, urlCode) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			let object = {
				"wook": 'QRCODE',
				'result': 200,
				'session': dataSessions?.SessionName,
				'state': dataSessions?.state,
				'status': dataSessions?.status,
				'qrcode': readQRCode,
				'urlCode': urlCode
			}
			if (dataSessions?.wh_qrcode != undefined && dataSessions?.wh_qrcode != null && dataSessions?.wh_qrcode != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_qrcode, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json' }
				}).then(response => {
					logger.info('- Webhooks status message send')
				}).catch(error => {
					logger?.error(`- Error status message ${error.message}`);
				});

			} else {
				logger.info('- Webhook no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);;
		}
	}
}