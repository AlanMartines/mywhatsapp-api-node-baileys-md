const Sessions = require("../sessions.js");
const axios = require('axios');
const https = require('https');
require('superagent-queue');
require('dotenv').config();
const { logger } = require("../utils/logger");
//
module.exports = class Webhooks {

	static async wh_messages(data, object) {
		//let data = Sessions?.getSession(session);
		//logger.info(response);
		try {
			if (data?.wh_message != undefined && data?.wh_message != null && data?.wh_message != '') {
				logger.info(`- SessionName: ${data?.name}`);

				await axios.post(data?.wh_message, object, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: { 'Content-Type': 'application/json' }
				}).then(response => {
					logger.info('- Webhooks receive message')
				}).catch(error => {
					logger?.error(`- Error receive message ${error.message}`);
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

				await axios.post(data?.wh_connect, object, {
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

				await axios.post(data?.wh_status, object, {
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

	static async wh_qrcode(data, response, urlCode) {
		//let data = Sessions?.getSession(session)
		logger.info(`- SessionName: ${data?.name}`);
		try {
			let object = {
				"wook": 'QRCODE',
				'result': 200,
				'session': data.name,
				'state': data.state,
				'status': data.status,
				'qrcode': response,
				'urlCode': urlCode
			}
			if (data?.wh_qrcode != undefined && data?.wh_qrcode != null && data?.wh_qrcode != '') {

				await axios.post(data?.wh_qrcode, object, {
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
			logger?.error(`- Error: ${error.message}`);;
		}
	}
}