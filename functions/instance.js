const osUtils = require('os-utils');
const os = require('os');
const i18n = require('../translate/i18n');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const rmfr = require('rmfr');
const CircularJSON = require('circular-json');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const webhooks = require('../controllers/webhooks');
const config = require('../config.global');
const engine = require("../engine");
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
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	try {
		//logger.info(`- Removendo todas as quebras de linha e espaços`);
		let result = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
		return result;
	} catch (error) {
		//logger.error(`- Erro ao remover todas as quebras de linha e espaços: ${error?.message}`);
		return string;
	}
}
//
// ------------------------------------------------------------------------------------------------//
//
function soNumeros(string) {
	try {
		logger.info(`- Removendo todos os caracteres que não são números`);
		let result = string.replace(/[^0-9]/g, '');
		return result;
	} catch (error) {
		logger.error(`- Erro ao remover todos os caracteres que não são números: ${error?.message}`);
		return string;
	}
}
//
// ------------------------------------------------------------------------------------------------//
//
async function deletaPastaToken(filePath, filename) {
	//
	await rmfr(`${filePath}/${filename}`).then(async (result) => {
		//
		logger?.info(`- Pasta "${filePath}/${filename}" removida com sucesso`);
		//
	}).catch((erro) => {
		//
		logger?.error(`- Erro ao remover pasta "${filePath}/${filename}"`);
		//
	});
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function deletaToken(filePath, filename) {
	//
	await rmfr(`${filePath}/${filename}`, { glob: true }).then(async (result) => {
		//
		logger?.info(`- Arquivo "${filename}" removido com sucesso`);
		//
	}).catch((erro) => {
		//
		logger?.error(`- Erro ao remover arquivo "${filename}"`);
		//
	});
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Instance {
	//
	static async Status(resSessionName) {
		//
		try {
			let existSession = await Sessions?.checkSession(resSessionName);
			if (existSession) {
				//só adiciona se não existir
				let getSession = await Sessions?.getSession(resSessionName);
				switch (getSession.status) {
					case 'isStarting':
						return {
							statusCode: 202,
							state: "STARTING",
							status: "isStarting",
							message: i18n.__('instance.Status.isStarting')
						};
						break;
					case 'isConnecting':
						return {
							statusCode: 202,
							state: "CONNECTING",
							status: "isConnecting",
							message: i18n.__('instance.Status.isConnecting')
						};
						break;
					case 'isBanned':
						return {
							statusCode: 403,
							state: "BANNED",
							status: "isBanned",
							message: i18n.__('instance.Status.isBanned')
						};
						break;
					case 'inChat':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "inChat",
							message: i18n.__('instance.Status.inChat')
						};
						break;
					case 'isLogged':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "isLogged",
							message: i18n.__('instance.Status.isLogged')
						};
						break;
					case 'notLogged':
					case 'desconnectedMobile':
					case 'deviceNotConnected':
						return {
							statusCode: 401,
							state: "DISCONNECTED",
							status: "notLogged",
							message: i18n.__('instance.Status.notLogged')
						};
						break;
					case 'browserClose':
						return {
							statusCode: 200,
							state: "CLOSE",
							status: "browserClose",
							message: i18n.__('instance.Status.browserClose')
						};
						break;
					case 'qrReadSuccess':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "qrReadSuccess",
							message: i18n.__('instance.Status.qrReadSuccess')
						};
						break;
					case 'qrReadFail':
						return {
							statusCode: 400,
							state: "DISCONNECTED",
							status: "qrReadFail",
							message: i18n.__('instance.Status.qrReadFail')
						};
						break;
					case 'qrRead':
						return {
							statusCode: 202,
							state: "QRCODE",
							status: "qrRead",
							message: i18n.__('instance.Status.qrRead')
						};
						break;
						case 'getCode':
							return {
								statusCode: 202,
								state: "GETCODE",
								status: "getCode",
								message: i18n.__('instance.Status.getCode')
							};
							break;
					case 'autocloseCalled':
						return {
							statusCode: 200,
							state: "CLOSE",
							status: "autocloseCalled",
							message: i18n.__('instance.Status.autocloseCalled')
						};
						break;
					case 'deleteToken':
						return {
							statusCode: 200,
							state: "DISCONNECTED",
							status: "deleteToken",
							message: i18n.__('instance.Status.deleteToken')
						};
						break;
					case 'chatsAvailable':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "chatsAvailable",
							message: i18n.__('instance.Status.chatsAvailable')
						};
						break;
					case 'serverWssNotConnected':
						return {
							statusCode: 404,
							state: "DISCONNECTED",
							status: "serverWssNotConnected",
							message: i18n.__('instance.Status.serverWssNotConnected')
						};
						break;
					case 'noOpenBrowser':
						return {
							statusCode: 400,
							state: "DISCONNECTED",
							status: "noOpenBrowser",
							message: i18n.__('instance.Status.noOpenBrowser')
						};
						break;
					case 'serverClose':
						return {
							statusCode: 401,
							state: "DISCONNECTED",
							status: "serverClose",
							message: i18n.__('instance.Status.serverClose')
						};
						break;
					case 'isError':
						return {
							statusCode: 500,
							state: "ERROR",
							status: "isError",
							message: i18n.__('instance.Status.isError')
						};
						break;
					default:
						return {
							statusCode: 404,
							state: 'NOTFOUND',
							status: 'notFound',
							message: i18n.__('instance.Status.default')
						};
				}

			} else {
				return {
					statusCode: 404,
					state: 'NOTFOUND',
					status: 'notFound',
					message: i18n.__('instance.Status.default')
				};
			}
		} catch (error) {
			res.status(500).json({ error: error })
		}
	} //Status
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async getCodePairing(SessionName, resNumber) {
		//
		logger?.info("- Obtendo codigo de pareamento");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		try {
			//
			const code = await session.client.requestPairingCode(soNumeros(resNumber));
			let addJson = {
				state: "GETCODE",
				status: "getCode",
				message: 'Sistema aguardando leitura do código de pareamento',
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			webhooks?.wh_connect(SessionName);
			//
			let result = {
				"statusCode": 200,
				"pairingCode": code,
				"message": "Código de pareamento gerado com sucesso"
			};
			//
			return result;
			//
		} catch (error) {
			logger?.error(`- Error ao gerar código de pareamento: ${error}`);
			//
			let result = {
				"statusCode": 404,
				"message": "Error ao gerar código de pareamento"
			};
			//
			return result;
			//
		}
		//
	} //getCode
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async closeSession(SessionName) {
		//
		logger?.info("- Fechando sessão");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		try {
			//
			// close WebSocket connection
			await session.client.ws.close();
			// remove all events
			await session.client.ev.removeAllListeners();
			//
			logger?.info("- Navegador fechado");
			//
			let addJson = {
				state: "CLOSE",
				status: "browserClose",
				message: "Navegador fechado",
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			webhooks?.wh_connect(SessionName);
			//
			session?.funcoesSocket?.stateChange(SessionName, {
				SessionName: SessionName,
				state: addJson?.state,
				status: addJson?.status,
				message: addJson?.message,
			});
			//
			let result = {
				"statusCode": 200,
				"message": "Sessão fechada com sucesso"
			};
			//
			return result;
			//
		} catch (error) {
			//
			logger?.error(`- Erro ao fechar navegador ${error}`);
			//
			let result = {
				"statusCode": 404,
				"message": "Erro ao fechar navegador"
			};
			//
			return result;
			//
		}
		//
	} //closeSession
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async logoutSession(SessionName) {
		//
		logger?.info("- Desconetando sessão");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		try {
			//
			await session.client.logout();
			// close WebSocket connection
			//await session.client.ws.close();
			// remove all events
			//await session.client.ev.removeAllListeners();
			//
			let addJson = {
				client: false,
				message: "Sessão desconetada",
				state: "DISCONNECTED",
				status: "notLogged"
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			webhooks?.wh_connect(SessionName);
			//await Sessions?.deleteSession(SessionName);
			//
			let result = {
				"statusCode": 200,
				"message": "Sessão desconetada com sucesso"
			};
			//
			return result;
			//
		} catch (error) {
			logger?.error(`- Error ao desconetar sessão: ${error}`);
			//
			let result = {
				"statusCode": 404,
				"message": "Erro ao desconetar sessão"
			};
			//
			return result;
			//
		}
		//
	} //LogoutSession
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async restartToken(req, res, next) {
		//
		const SessionName = removeWithspace(req?.body?.SessionName);
		//
		logger?.info("- Reiniciando sessão");
		logger?.info(`- SessionName: ${SessionName}`);
		var session = await Sessions?.getSession(SessionName);
		//
		if (session) {
			//
			try {
				//
				// close WebSocket connection
				await session.client.ws.close();
				// remove all events
				await session.client.ev.removeAllListeners();
				//
				await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
				await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
				await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
				//await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
				await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
				//
				let addJson = {
					client: false,
					message: "Sessão sendo reiniciada",
					state: "STARTING",
					status: "isStarting"
				};
				//
				await Sessions?.addInfoSession(SessionName, addJson);
				//
				webhooks?.wh_connect(SessionName);
				//
				session?.funcoesSocket?.stateChange(SessionName, {
					SessionName: SessionName,
					state: addJson?.state,
					status: addJson?.status,
					message: addJson?.message,
				});
				//
				engine?.Start(req, res, next);
				//
				return {
					"statusCode": 200,
					"message": "Sistema reiniciado com sucesso"
				};
				//
			} catch (error) {
				logger?.error(`- Error when: ${error}`);
				//
				session.client = false;
				//
				return {
					"statusCode": 404,
					"message": 'Sistema Off-line'
				};
				//
			};
			//
		} else {
			return {
				"statusCode": 404,
				"message": 'Sistema Off-line'
			};
		}
	} //restartToken
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async getSession(SessionName) {
		try {
			let dataSessions = await Sessions?.getSession(SessionName);
			//
			if (dataSessions) {
				//
				delete dataSessions?.funcoesSocket;
				delete dataSessions?.store;
				delete dataSessions?.client;
				delete dataSessions?.waqueue;
				//
				return {
					"statusCode": 200,
					"message": "Sessão carregada com sucesso",
					"session": dataSessions
				};
				//
			} else {
				//
				return {
					"statusCode": 200,
					"message": "Sessão não encontrada"
				};
				//
			}
		} catch (error) {
			logger?.error(`- Error when: ${error}`);
			//
			return {
				"statusCode": 404,
				"message": 'Erro ao carregar sessão'
			};
			//
		};
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async AllSessions(req, res, next) {
		try {
			let dataSessions = await Sessions?.getAll();
			//
			if (dataSessions) {
				//
				const novoJson = dataSessions.map(data => {
					//
					delete data?.funcoesSocket;
					delete data?.store;
					delete data?.client;
					delete data?.waqueue;
					//
					return data;
				});
				//
				return {
					"statusCode": 200,
					"message": "Sessões carregadas com sucesso",
					"session": novoJson
				};
				//
			} else {
				//
				return {
					"statusCode": 200,
					"message": "Sessões não encontradas"
				};
				//
			}
		} catch (error) {
			logger?.error(`- Error when: ${error}`);
			//
			return {
				"statusCode": 404,
				"message": 'Erro ao carregar sessões'
			};
			//
		};
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
}