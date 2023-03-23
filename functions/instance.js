const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const { Tokens } = require('../models');
const webhooks = require('../controllers/webhooks');
const config = require('../config.global');
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
module.exports = class Instance {
	//
	static async Status(resSessionName) {
		try {
			let session = Sessions?.getSession(resSessionName);
			if (session) {
				//só adiciona se não existir
				if (session.state == "CONNECTED") {
					return {
						state: "CONNECTED",
						status: "inChat",
						message: "Sistema iniciado e disponivel para uso"
					};
				} else if (session.state == "STARTING") {
					return {
						state: "STARTING",
						status: "notLogged",
						message: "Sistema iniciando e indisponivel para uso"
					};
				} else if (session.state == "QRCODE") {
					return {
						state: "QRCODE",
						status: "qrRead",
						message: "Sistema aguardando leitura do QR-Code"
					};
				} else if (session.state == "DISCONNECTED") {
					return {
						state: "DISCONNECTED",
						status: "notLogged",
						message: "Dispositivo desconectado"
					};
				} else if (session.state == "CLOSE") {
					return {
						state: "CLOSE",
						status: "notLogged",
						message: "Navegador interno fechado"
					};
				} else {
					switch (session.status) {
						case 'isLogged':
							return {
								state: "CONNECTED",
								status: "isLogged",
								message: "Sistema iniciado e disponivel para uso"
							};
							break;
						case 'notLogged':
							return {
								state: "DISCONNECTED",
								status: "notLogged",
								message: "Dispositivo desconectado"
							};
							break;
						case 'browserClose':
							return {
								state: "CLOSE",
								status: "browserClose",
								message: "Navegador interno fechado"
							};
							break;
						case 'qrReadSuccess':
							return {
								state: "CONNECTED",
								status: "qrReadSuccess",
								message: "Verificação do QR-Code feita com sucesso"
							};
							break;
						case 'qrReadFail':
							return {
								state: "DISCONNECTED",
								status: "qrReadFail",
								message: "Falha na verificação do QR-Code"
							};
							break;
						case 'qrRead':
							return {
								state: "QRCODE",
								status: "qrRead",
								message: "Sistema aguardando leitura do QR-Code"
							};
							break;
						case 'autocloseCalled':
							return {
								state: "DISCONNECTED",
								status: "notLogged",
								message: "Navegador interno fechado automaticamente"
							};
							break;
						case 'desconnectedMobile':
							return {
								state: "DISCONNECTED",
								status: "desconnectedMobile",
								message: "Dispositivo desconectado"
							};
							break;
						case 'deleteToken':
							return {
								state: "DISCONNECTED",
								status: "deleteToken",
								message: "Token de sessão removido"
							};
							break;
						case 'chatsAvailable':
							return {
								state: "CONNECTED",
								status: "chatsAvailable",
								message: "Sistema iniciado e disponivel para uso"
							};
							break;
						case 'deviceNotConnected':
							return {
								state: "DISCONNECTED",
								status: "deviceNotConnected",
								message: "Dispositivo desconectado"
							};
							break;
						case 'serverWssNotConnected':
							return {
								state: "DISCONNECTED",
								status: "serverWssNotConnected",
								message: "O endereço wss não foi encontrado"
							};
							break;
						case 'noOpenBrowser':
							return {
								state: "DISCONNECTED",
								status: "noOpenBrowser",
								message: "Não foi encontrado o navegador ou falta algum comando no args"
							};
							break;
						case 'serverClose':
							return {
								state: "DISCONNECTED",
								status: "serverClose",
								message: "O cliente se desconectou do wss"
							};
							break;
						case 'OPENING':
							return {
								state: "OPENING",
								status: "notLogged",
								message: "'Sistema iniciando e indisponivel para uso'"
							};
							break;
						case 'CONFLICT':
							return {
								state: "CONFLICT",
								status: "isLogged",
								message: "Dispositivo conectado em outra sessão, reconectando"
							};
							break;
						case 'UNPAIRED':
						case 'UNLAUNCHED':
						case 'UNPAIRED_IDLE':
							return {
								state: "DISCONNECTED",
								status: "notLogged",
								message: "Dispositivo desconectado"
							};
							break;
						case 'DISCONNECTED':
							return {
								state: "DISCONNECTED",
								status: "notLogged",
								message: "Dispositivo desconectado"
							};
							break;
						case 'SYNCING':
							return {
								state: "SYNCING",
								status: "notLogged",
								message: "Dispositivo sincronizando"
							};
							break;
						case 'CLOSED':
							return {
								state: "CLOSED",
								status: "notLogged",
								message: "Navegador interno fechado"
							};
							break;
						default:
							//
							return {
								state: 'NOTFOUND',
								status: 'notLogged',
								message: 'Sistema Off-line'
							};
						//
					}
				}
			} else {
				return {
					state: 'NOTFOUND',
					status: 'notLogged',
					message: 'Sistema Off-line'
				};
			}
		} catch (error) {
			res.status(500).json({ error: error })
		}
	}
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
				client: false,
				message: "Sessão fechada",
				state: "CLOSED",
				status: "notLogged"
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			webhooks?.wh_connect(SessionName);
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Sessão fechada com sucesso"
			};
			//
			await updateStateDb(addJson?.state, addJson?.status, SessionName);
			//
			return result;
			//
		} catch (error) {
			//
			logger?.error(`- Erro ao fechar navegador ${error}`);
			//
			let result = {
				"erro": true,
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
}