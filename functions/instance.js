const osUtils = require('os-utils');
const os = require('os');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const rmfr = require('rmfr');
const CircularJSON = require('circular-json');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const { Tokens } = require('../models');
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
	var string = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
	return string;
}
//
// ------------------------------------------------------------------------------------------------//
//
async function updateStateDb(state, status, AuthorizationToken) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando status');
		//
		await Tokens.update({
			state: state,
			status: status,
			lastactivity: date_now,
		},
			{
				where: {
					token: AuthorizationToken
				},
			}).then(async (entries) => {
				logger?.info('- Status atualizado');
			}).catch(async (err) => {
				logger?.error('- Status não atualizado');
				logger?.error(`- Error: ${err}`);
			}).finally(async () => {
				//Tokens.release();
			});
		//
	}
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
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
		try {
			let existSession = await Sessions?.checkSession(resSessionName);
			if (existSession) {
				//só adiciona se não existir
				switch (existSession.status) {
					case 'isStarting':
						return {
							statusCode: 202,
							state: "STARTING",
							status: "isStarting",
							message: "Sistema iniciando. Aguarde..."
						};
						case 'isConnecting':
							return {
								statusCode: 202,
								state: "CONNECTING",
								status: "isConnecting",
								message: "Dispositivo conectando. Aguarde..."
							};
					case 'isBanned':
						return {
							statusCode: 403,
							state: "BANNED",
							status: "isBanned",
							message: "Usuario banido, entre em contato com suporte do whatsapp"
						};
					case 'isLogged':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "isLogged",
							message: "Sistema iniciado e disponivel para uso"
						};
					case 'notLogged':
					case 'desconnectedMobile':
					case 'deviceNotConnected':
						return {
							statusCode: 401,
							state: "DISCONNECTED",
							status: "notLogged",
							message: "Dispositivo desconectado"
						};
					case 'browserClose':
						return {
							statusCode: 200,
							state: "CLOSE",
							status: "browserClose",
							message: "Navegador fechado"
						};
					case 'qrReadSuccess':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "qrReadSuccess",
							message: "Verificação do QR-Code feita com sucesso"
						};
					case 'qrReadFail':
						return {
							statusCode: 400,
							state: "DISCONNECTED",
							status: "qrReadFail",
							message: "Falha na verificação do QR-Code"
						};
					case 'qrRead':
						return {
							statusCode: 202,
							state: "QRCODE",
							status: "qrRead",
							message: "Sistema aguardando leitura do QR-Code"
						};
					case 'autocloseCalled':
						return {
							statusCode: 200,
							state: "CLOSE",
							status: "autocloseCalled",
							message: "Navegador fechado automaticamente"
						};
					case 'deleteToken':
						return {
							statusCode: 200,
							state: "DISCONNECTED",
							status: "deleteToken",
							message: "Token de sessão removido"
						};
					case 'chatsAvailable':
						return {
							statusCode: 200,
							state: "CONNECTED",
							status: "chatsAvailable",
							message: "Sistema iniciado e disponivel para uso"
						};
					case 'serverWssNotConnected':
						return {
							statusCode: 404,
							state: "DISCONNECTED",
							status: "serverWssNotConnected",
							message: "O endereço wss não foi encontrado"
						};
					case 'noOpenBrowser':
						return {
							statusCode: 400,
							state: "DISCONNECTED",
							status: "noOpenBrowser",
							message: "Não foi encontrado o navegador ou falta algum comando no args"
						};
					case 'serverClose':
						return {
							statusCode: 401,
							state: "DISCONNECTED",
							status: "serverClose",
							message: "O cliente se desconectou do wss"
						};
					default:
						return {
							statusCode: 404,
							state: 'NOTFOUND',
							status: 'notFound',
							message: 'Sistema Off-line'
						};
				}				
			} else {
				return {
					statusCode: 404,
					state: 'NOTFOUND',
					status: 'notFound',
					message: 'Sistema Off-line'
				};
			}
		} catch (error) {
			res.status(500).json({ error: error })
		}
	} //Status
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
			logger?.info("- Sessão fechada");
			//
			let addJson = {
				message: "Sessão fechada",
				state: "CLOSED",
				status: "notLogged"
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			webhooks?.wh_connect(SessionName);
			await updateStateDb(addJson?.state, addJson?.status, SessionName);
			//
			session?.funcoesSocket?.stateChange(SessionName, {
				SessionName: SessionName,
				state: addJson?.state,
				status: addJson?.status,
				message: addJson?.message,
			});
			//
			let result = {
				"error": false,
				"status": 200,
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
				"error": true,
				"status": 404,
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
			await updateStateDb(addJson?.state, addJson?.status, SessionName);
			//await Sessions?.deleteSession(SessionName);
			//
			let result = {
				"error": false,
				"status": 200,
				"message": "Sessão desconetada com sucesso"
			};
			//
			return result;
			//
		} catch (error) {
			logger?.error(`- Error ao desconetar sessão: ${error}`);
			//
			let result = {
				"error": true,
				"status": 404,
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
					status: "notLogged"
				};
				//
				await Sessions?.addInfoSession(SessionName, addJson);
				//
				webhooks?.wh_connect(SessionName);
				await updateStateDb(addJson?.state, addJson?.status, SessionName);
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
					"error": false,
					"status": 200,
					"message": "Sistema reiniciado com sucesso"
				};
				//
			} catch (error) {
				logger?.error(`- Error when: ${error}`);
				//
				session.client = false;
				//
				return {
					"error": false,
					"status": 404,
					"message": 'Sistema Off-line'
				};
				//
			};
			//
		} else {
			return {
				"error": false,
				"status": 404,
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
					"error": false,
					"status": 200,
					"message": "Sessão carregada com sucesso",
					"session": dataSessions
				};
				//
			} else {
				//
				return {
					"error": false,
					"status": 200,
					"message": "Sessão não encontrada"
				};
				//
			}
		} catch (error) {
			logger?.error(`- Error when: ${error}`);
			//
			return {
				"error": false,
				"status": 404,
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
					"error": false,
					"status": 200,
					"message": "Sessões carregadas com sucesso",
					"session": novoJson
				};
				//
			} else {
				//
				return {
					"error": false,
					"status": 200,
					"message": "Sessões não encontradas"
				};
				//
			}
		} catch (error) {
			logger?.error(`- Error when: ${error}`);
			//
			return {
				"error": false,
				"status": 404,
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