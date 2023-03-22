const {
	forEach
} = require('p-iteration');
const axios = require('axios');
const config = require('../config.global');
const rra = require('recursive-readdir-async');
const { Tokens } = require('../models');
const tokenPatch = config.PATCH_TOKENS;
//
//
module.exports = class startAll {
	//
	static async getAllSessions() {
		//
		try {
			//
			const tokenActiveNow = [];
			//
			if (parseInt(config.VALIDATE_MYSQL) == true) {
				//
				const row = await Tokens.findAll({
					attributes: [
						'token',
						'datafinal',
						'active',
						'webhook',
						'wh_status',
						'wh_message',
						'wh_qrcode',
						'wh_connect'
					],
					where: {
						state: 'CONNECTED'
					}
				}).then(async function (entries) {
					return entries;
				}).catch(async (err) => {
					console.log('- Error:', err);
					return false;
				});
				//
				if (row) {
					//
					await forEach(row.toJSON(), async (result) => {
						tokenActiveNow.push({
							"AuthorizationToken": result?.token,
							"SessionName": result?.token,
							"wh_status": result?.webhook,
							"wh_message": result?.webhook,
							"wh_qrcode": result?.webhook,
							"wh_connect": result?.webhook
						});
					});
					//
				}
				return tokenActiveNow;
			} else {
				//
				const options = {
					mode: rra.LIST,
					recursive: false,
					stats: false,
					ignoreFolders: true,
					extensions: false,
					deep: false,
					realPath: true,
					normalizePath: true,
					include: [],
					exclude: [],
					readContent: false,
					encoding: 'base64'
				};
				//
				const result = await rra.list(`${tokenPatch}`, options).then(async function (dados) {
					//
					await dados.forEach(async function (result) {
						if (result.name.split('.')[2] == 'json') {
							console.log(`- File json Session: ${tokenPatch}/${result.name.split('.')[0]}.data.json`);
							//
							let obj = await require(`${tokenPatch}/${result.name.split('.')[0]}.data.json`);
							//
							tokenActiveNow.push({
								"AuthorizationToken": result?.name.split('.')[0],
								"SessionName": result?.name.split('.')[0],
								"wh_status": obj?.wh_status,
								"wh_message": obj?.wh_message,
								"wh_qrcode": obj?.wh_qrcode,
								"wh_connect": obj?.wh_connect
							});
						}
						//
					});
					//
					return tokenActiveNow;
					//
				});
				//
				return result;
			}
		} catch (error) {
			console.log("- Error:", error);
		}
	}

	static async startSession(SessionName) {
		console.log("- Auto startSession");
		try {
			if (SessionName != null && typeof SessionName != 'undefined') {
				//
				let obj = await require(`${tokenPatch}/${SessionName}.data.json`);
				//
				await axios.post(`http://127.0.0.1:${config.PORT}/sistema/Start`, {
					"SessionName": SessionName,
					"wh_status": obj?.wh_status,
					"wh_message": obj?.wh_message,
					"wh_qrcode": obj?.wh_qrcode,
					"wh_connect": obj?.wh_connect
				}, {
					headers: {
						"Content-Type": "application/json",
						"AuthorizationToken": result?.AuthorizationToken,
					}
				}).then(async function (response) {
					console.log(JSON.stringify(response.data, null, 2));
				}).catch(async function (error) {
					console.log(error);
				});
			}
		} catch (err) {
			console.log("- Error:", err);
		}
	}

	static async startAllSessions() {
		console.log("- Auto Start AllSessions");
		let dados = await this.getAllSessions();
		try {
			if (dados) {
				dados.map(async (result) => {
					await axios.post(`http://127.0.0.1:${config.PORT}/sistema/Start`, {
						"SessionName": result?.SessionName,
						"wh_status": result?.wh_status,
						"wh_message": result?.wh_message,
						"wh_qrcode": result?.wh_qrcode,
						"wh_connect": result?.wh_connect
					}, {
						headers: {
							"Content-Type": "application/json",
							"AuthorizationToken": result?.AuthorizationToken,
						}
					}).then(async function (response) {
						console.log(JSON.stringify(response.data, null, 2));
					}).catch(async function (error) {
						console.log(error);
					});
				});
			}
		} catch (error) {
			console.log("- Error:", error);
		}
	}
}
