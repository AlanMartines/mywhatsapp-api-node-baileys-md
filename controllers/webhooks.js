const axios = require('axios');
const https = require('https');
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
				await axios.post(dataSessions?.wh_message, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
         }
				}).then(response => {
					logger.info('- Webhooks message');
				}).catch(error => {
					logger?.error(`- Error webhook message: ${error.message}`);
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
					headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
         }
				}).then(response => {
					logger.info('- Webhook connect status');
				}).catch(error => {
					logger?.error(`- Error webhook connect status: ${error.message}`);
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
					headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
         }
				}).then(response => {
					logger.info('- Webhooks status')
				}).catch(error => {
					logger?.error(`- Error webhook status: ${error.message}`);
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
				'session': dataSessions?.SessionName,
				'state': dataSessions?.state,
				'status': dataSessions?.status,
				'qrcode': dataSessions?.qrcode,
				'urlCode': dataSessions?.urlCode
			}
			if (dataSessions?.wh_qrcode != undefined && dataSessions?.wh_qrcode != null && dataSessions?.wh_qrcode != '') {
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_qrcode, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
         }
				}).then(response => {
					logger.info('- Webhooks qrcode')
				}).catch(error => {
					logger?.error(`- Error webhook qrcode: ${error.message}`);
				});

			} else {
				logger.info('- Webhook qrcode no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);;
		}
	}

	static async wh_incomingcall(SessionName, object) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (dataSessions?.wh_incomingcall != undefined && dataSessions?.wh_incomingcall != null && dataSessions?.wh_incomingcall != '') {
				logger.info(`- SessionName: ${SessionName}`);
				let dataJson = JSON.stringify(object, null, 2);
				await axios.post(dataSessions?.wh_incomingcall, dataJson, {
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
						keepAlive: true
					}),
					headers: {
            'Content-type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
         }
				}).then(response => {
					logger.info('- Webhooks receive call')
				}).catch(error => {
					logger?.error(`- Error webhook receive call: ${error.message}`);
				});

			} else {
				logger.info('- Webhook receive call no defined');
			}
		} catch (error) {
			logger?.error(`- Error: ${error.message}`);
		}
	}
}