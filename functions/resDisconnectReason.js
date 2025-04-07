const dotenv = require('dotenv')
const https = require('https');
const axios = require('axios');
const agent = new https.Agent({
	rejectUnauthorized: false
});
dotenv.config()
const config = require('../../config/config')
//
//
const resDisconnectReason = {
	loggedOpen: 'loggedOpen',
	loggedQr: 'loggedQr',
	genericOut: 400,
	loggedOut: 401, // Desconectado de outro dispositivo
	bannedTimetamp: 402, // O código de status 402 possui um timestamp de banimento, conta temporariamente banida
	bannedTemporary: 403, // Agora chamado de LOCKED no código do WhatsApp Web, conta banida, dispositivo principal foi desconectado
	clientOutdated: 405, // Cliente desatualizado
	unknownLogout: 406, // Agora chamado de BANNED no código do WhatsApp Web, desconectado por motivo desconhecido
	timedOut: 408, // Conexão expirada, reconectando...
	connectionLost: 408, // Conexão perdida com o servidor, reconectando...
	dadUserAgent: 409, // O agente do usuário do cliente foi rejeitado
	multideviceMismatch: 411, // Incompatibilidade de múltiplos dispositivos, escaneie novamente...
	CATExpired: 413, // O token de autenticação criptográfica do Messenger expirou
	CATInvalid: 414, // O token de autenticação criptográfica do Messenger é inválido
	notFound: 415,
	connectionClosed: 428, // Conexão fechada, reconectando...
	connectionReplaced: 440, // Conexão substituída, outra nova sessão foi aberta e reconectada...
	badSession: 500, // Arquivo de sessão corrompido, exclua a sessão e escaneie novamente.
	experimental: 501,
	serviceUnavailable: 503,
	restartRequired: 515,
};
//
//
module.exports = class Disconnect {

	static async lastDisconnect(key, lastDisconnect) {
		//
		if (lastDisconnect == 'loggedOpen') {
			var statusCode = 'loggedOpen';
		} else {
			var statusCode = lastDisconnect?.error ? lastDisconnect.error?.output?.statusCode : 0;
		}
		//
		var addJson = {};
		//
		switch (statusCode) {
			case resDisconnectReason.loggedOpen:
				// Device Logged Out, Deleting Session
				console.log(`- Connection loggedOpen`);
				//
				addJson = {
					SessionName: key,
					state: "CONNECTED",
					status: "inChat",
					message: "Sistema iniciado e disponivel para uso"
				};
				//
				break;
				case resDisconnectReason.loggedQr:
					// Device Logged Out, Deleting Session
					console.log(`- Connection loggedQr`);
					//
					addJson = {
						SessionName: key,
						state: "QRCODE",
						status: "qrRead",
						message: "Sistema aguardando leitura do QR-Code"
					};
					//
					break;
			case resDisconnectReason.loggedOut:
				// Device Logged Out, Deleting Session
				console.log(`- Connection loggedOut`);
				//
				addJson = {
					SessionName: key,
					state: "CLOSED",
					status: "notLogged",
					message: "Sistema desconectado"
				};
				//
				break;
			case resDisconnectReason.bannedTemporary:
				//
				console.log(`- User banned temporary`);
				//
				addJson = {
					SessionName: key,
					state: "BANNED",
					status: "notLogged",
					message: "Sistema desconectado"
				};
				//
				break;
			case resDisconnectReason.bannedTimetamp:
				//
				console.log(`- User banned timestamp`);
				//
				addJson = {
					SessionName: key,
					state: "BANNED",
					status: "notLogged",
					message: "Sistema desconectado"
				};
				//
				break;
			case resDisconnectReason.timedOut:
				//
				console.log(`- Connection TimedOut`);
				//
				addJson = {
					SessionName: key,
					state: "CONNECTING",
					status: "desconnectedMobile",
					message: "Dispositivo conectando"
				};
				//
				break;
			case resDisconnectReason.connectionLost:
				//
				console.log(`- Connection Los`);
				//
				addJson = {
					SessionName: key,
					message: "Dispositivo conectando",
					state: "CONNECTING",
					status: "desconnectedMobile"
				};
				//
				break;
			case resDisconnectReason.multideviceMismatch:
				//
				console.log('- Connection multideviceMismatch');
				//
				addJson = {
					SessionName: key,
					message: "Dispositivo conectando",
					state: "CONNECTING",
					status: "desconnectedMobile"
				};
				//
				break;
			case resDisconnectReason.connectionClosed:
				//
				console.log(`- Connection connectionClosed`);
				//
				addJson = {
					SessionName: key,
					message: "Sistema desconectado",
					state: "CLOSED",
					status: "notLogged"
				};
				//
				break;
			case resDisconnectReason.connectionReplaced:
				//
				// Connection Replaced, Another New Session Opened, Please Close Current Session First
				console.log(`- Connection connectionReplaced`);
				//
				addJson = {
					SessionName: key,
					state: "DISCONNECTED",
					status: "notLogged",
					message: "Dispositivo desconectado"
				};
				//
				break;
			case resDisconnectReason.badSession:
				//
				// Bad session file, delete and run again
				console.log(`- Connection badSession`.red);
				//
				addJson = {
					SessionName: key,
					state: "DISCONNECTED",
					status: "notLogged",
					message: "Dispositivo desconectado"
				};
				//
				break;
			case resDisconnectReason.restartRequired:
				//
				console.log('- Connection restartRequired');
				//
				addJson = {
					SessionName: key,
					message: "Sistema desconectado",
					state: "CLOSED",
					status: "notLogged"
				};
				//
				break;
			case resDisconnectReason.genericOut:
				//
				console.log('- Generic Error');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "genericError",
					message: "Erro genérico"
				};
				//
				break;
			case resDisconnectReason.clientOutdated:
				//
				console.log('- Client Outdated');
				//
				addJson = {
					SessionName: key,
					state: "OUTDATED",
					status: "updateRequired",
					message: "Cliente desatualizado, atualização necessária"
				};
				//
				break;
			case resDisconnectReason.unknownLogout:
				//
				console.log('- Unknown Logout Reason');
				//
				addJson = {
					SessionName: key,
					state: "CLOSED",
					status: "notLogged",
					message: "Logout desconhecido"
				};
				//
				break;
			case resDisconnectReason.dadUserAgent:
				//
				console.log('- Bad User Agent');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "invalidUserAgent",
					message: "User Agent inválido"
				};
				//
				break;
			case resDisconnectReason.CATExpired:
				//
				console.log('- Crypto Auth Token Expired');
				//
				addJson = {
					SessionName: key,
					state: "AUTH_FAILED",
					status: "tokenExpired",
					message: "Token de autenticação criptografada expirado"
				};
				//
				break;
			case resDisconnectReason.CATInvalid:
				//
				console.log('- Invalid Crypto Auth Token');
				//
				addJson = {
					SessionName: key,
					state: "AUTH_FAILED",
					status: "invalidToken",
					message: "Token de autenticação criptografada inválido"
				};
				//
				break;
			case resDisconnectReason.notFound:
				//
				console.log('- Resource Not Found');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "resourceNotFound",
					message: "Recurso não encontrado"
				};
				//
				break;
			case resDisconnectReason.experimental:
				//
				console.log('- Experimental Feature Issue');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "experimental",
					message: "Problema de Recurso Experimental"
				};
				//
				break;
			case resDisconnectReason.serviceUnavailable:
				//
				console.log('- Service Unavailable');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "serviceUnavailable",
					message: "Serviço Indisponível"
				};
				//
				break;
			default:
				//
				//console.log(`- lastDisconnect: ${lastDisconnect?.error}`);
				//
				/*
				addJson = {
					SessionName: key,
					state: "CLOSED",
					status: "notLogged",
					message: "Sistema desconectado"
				};
				*/
			//
		}
		//
		if (Object.keys(addJson).length !== 0) {
			//
			if (config.reasonUrl) {
				await axios({
					method: 'POST',
					maxBodyLength: Infinity,
					url: `${config.reasonUrl}`,
					httpsAgent: agent,
					headers: {
						'Content-Type': 'application/json;charset=utf-8',
						'Accept': 'application/json'
					},
					data: addJson
				}).then(async (response) => {
					let responseData = response?.data;
					let statusCode = response?.status;
					let statusText = response?.statusText;
					//
					console.log(`- SessionName: ${key}`);
					console.log(`- lastDisconnect: ${lastDisconnect?.error}`);
					//
					console.log('- Redirect Success');
					//
					console.log(`- Success: status ${statusText}`);
					console.log(`- Success: statusCode ${statusCode}`);
					//
					console.log('=====================================================================================================');
					//
					//
					//res.setHeader('Content-Type', 'application/json');
					//return res.status(statusCode).json(responseData);
					//
				}).catch(async (error) => {
					let responseError = error?.response?.data;
					let statusCode = error?.response?.status || 401;
					let statusText = error?.response?.statusText;
					let errorMessage = error?.message;
					//
					console.log(`- SessionName: ${key}`);
					console.log(`- lastDisconnect: ${lastDisconnect?.error}`);
					//
					console.log(`- Redirect Error`);
					//
					//
					console.log(`- Error: status ${statusText}`);
					console.log(`- Error: statusCode ${statusCode}`);
					console.log(`- Error: errorMessage ${errorMessage}`);
					//
					console.log('=====================================================================================================');
					//
					//res.setHeader('Content-Type', 'application/json');
					//return res.status(statusCode).json(responseError);
					//
				});
				//
			}
		}
		//
	}
}
