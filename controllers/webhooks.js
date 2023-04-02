const axios = require('axios');
const https = require('https');
const request = require('request');
require('dotenv').config();
const { logger } = require("../utils/logger");
const Sessions = require('../controllers/sessions');
//
module.exports = class Webhooks {

	static async wh_messages(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);;
		try {
			if (dataSessions?.wh_message != undefined && dataSessions?.wh_message != null && dataSessions?.wh_message != '') {
				logger.info(`- SessionName: ${SessionName}`);
				let dataJson = JSON.stringify(object, null, 2);
				/*
				await axios.post(dataSessions?.wh_message, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json; charset=utf-8' }
				}).then(response => {
					logger.info('- Webhooks receive message');
				}).catch(error => {
					logger?.error(`- Error receive message: ${error.message}`);
				});
				*/
				request.post({
					url: dataSessions?.wh_connect,
					rejectUnauthorized: false,
					json: object
				}, (err, res, body) => {
					if (err) {
						logger?.error(`- Error receive message: ${err.message}`);
					} else {
						logger.info('- Webhooks receive message');
					}
				});

			} else {
				logger.info('- Webhook message no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_connect(SessionName) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		try {
			var object = {
				"wook": 'STATUS_CONNECT',
				'statusCode': 200,
				'SessionName': SessionName,
				'state': dataSessions?.state,
				'status': dataSessions?.status,
				'number': dataSessions?.client?.user?.id.split(":")[0],
			}

			if (dataSessions?.wh_connect != undefined && dataSessions?.wh_connect != null && dataSessions?.wh_connect != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_connect, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json; charset=utf-8' }
				}).then(response => {
					logger.info('- Webhooks connect status');
				}).catch(error => {
					logger?.error(`- Error connect status ${error.message}`);
				});
			} else {
				logger.info('- Webhook connect no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_status(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);
		logger.info(`- SessionName: ${SessionName}`);
		try {
			if (dataSessions?.wh_status != undefined && dataSessions?.wh_status != null && dataSessions?.wh_status != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_status, dataJson, {
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
				logger.info('- Webhook status no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}

	static async wh_qrcode(SessionName) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			let object = {
				"wook": 'QRCODE',
				'statusCode': 200,
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
				logger.info('- Webhook status no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);;
		}
	}

	static async wh_incomingCall(SessionName, response) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (dataSessions?.wh_message != undefined && dataSessions?.wh_message != null && dataSessions?.wh_message != '') {
				logger.info(`- SessionName: ${SessionName}`);
				let object = {
					"wook": "INCOMING_CALL",
					"statusCode": 200,
					"id": response?.id,
					"phone": response?.peerJid,
					"data": moment?.unix(response?.offerTime)?.format('DD-MM-YYYY hh:mm:ss'),
					"isVideo": response?.isVideo,
					"isGroup": response?.isGroup,
					"participants": response?.participants
				};
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_message, dataJson, {
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
				logger.info('- Webhook receive no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}
}