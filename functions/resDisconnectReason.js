const { Boom } = require("@hapi/boom");
const { DisconnectReason } = require('@whiskeysockets/baileys');
//
exports.resDisconnectReason = (lastDisconnect) => {
var addJson = {};
//
let resDisconnectReason = {
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
const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
switch (statusCode) {
	case DisconnectReason.loggedOut:
		// Device Logged Out, Deleting Session
		logger?.info(`- Connection loggedOut`);
		//
		addJson = {
			state: "CLOSED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case DisconnectReason.bannedTemporary:
		//
		logger?.info(`- User banned temporary`);
		//
		addJson = {
			state: "BANNED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case DisconnectReason.bannedTimetamp:
		//
		logger?.info(`- User banned timestamp`);
		//
		addJson = {
			state: "BANNED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case DisconnectReason.timedOut:
		//
		logger?.info(`- Connection TimedOut`);
		//
		addJson = {
			state: "CONNECTING",
			status: "desconnectedMobile",
			message: "Dispositivo conectando"
		};
		//
		break;
	case DisconnectReason.connectionLost:
		//
		logger?.info(`- Connection Los`);
		//
		addJson = {
			message: "Dispositivo conectando",
			state: "CONNECTING",
			status: "desconnectedMobile"
		};
		//
		break;
	case DisconnectReason.multideviceMismatch:
		//
		logger?.info('- Connection multideviceMismatch');
		//
		break;
	case DisconnectReason.connectionClosed:
		//
		logger?.info(`- Connection connectionClosed`);
		//
		addJson = {
			message: "Sistema desconectado",
			state: "CLOSED",
			status: "notLogged"
		};
		//
		break;
	case DisconnectReason.connectionReplaced:
		//
		// Connection Replaced, Another New Session Opened, Please Close Current Session First
		logger?.info(`- Connection connectionReplaced`);
		//
		addJson = {
			state: "DISCONNECTED",
			status: "notLogged",
			message: "Dispositivo desconectado"
		};
		//
		break;
	case DisconnectReason.badSession:
		//
		// Bad session file, delete and run again
		logger?.info(`- Connection badSession`.red);
		//
		addJson = {
			state: "DISCONNECTED",
			status: "notLogged",
			message: "Dispositivo desconectado"
		};
		//
		break;
	case DisconnectReason.restartRequired:
		//
		logger?.info('- Connection restartRequired');
		//
		break;
	case DisconnectReason.genericOut:
		logger?.info('- Generic Error');
		addJson = {
			state: "ERROR",
			status: "genericError",
			message: "Erro genérico"
		};
		break;
	case DisconnectReason.clientOutdated:
		logger?.info('- Client Outdated');
		addJson = {
			state: "OUTDATED",
			status: "updateRequired",
			message: "Cliente desatualizado, atualização necessária"
		};
		break;
	case DisconnectReason.unknownLogout:
		logger?.info('- Unknown Logout Reason');
		addJson = {
			state: "CLOSED",
			status: "notLogged",
			message: "Logout desconhecido"
		};
		break;
	case DisconnectReason.dadUserAgent:
		logger?.info('- Bad User Agent');
		addJson = {
			state: "ERROR",
			status: "invalidUserAgent",
			message: "User Agent inválido"
		};
		break;
	case DisconnectReason.CATExpired:
		logger?.info('- Crypto Auth Token Expired');
		addJson = {
			state: "AUTH_FAILED",
			status: "tokenExpired",
			message: "Token de autenticação criptografada expirado"
		};
		break;
	case DisconnectReason.CATInvalid:
		logger?.info('- Invalid Crypto Auth Token');
		addJson = {
			state: "AUTH_FAILED",
			status: "invalidToken",
			message: "Token de autenticação criptografada inválido"
		};
		break;
	case DisconnectReason.notFound:
		logger?.info('- Resource Not Found');
		addJson = {
			state: "ERROR",
			status: "resourceNotFound",
			message: "Recurso não encontrado"
		};
		break;
	case DisconnectReason.experimental:
		logger?.info('- Experimental Feature Issue');
		break;
	case DisconnectReason.serviceUnavailable:
		logger?.info('- Service Unavailable');
		addJson = {
			state: "ERROR",
			status: "serviceUnavailable",
			message: "Serviço indisponível"
		};
		break;
	default:
		// code block
		logger?.info(`- lastDisconnect: ${lastDisconnect?.error}`);
	//
}
//
}