const dotenv = require('dotenv')
const https = require('https');
const axios = require('axios');
const agent = new https.Agent({
	rejectUnauthorized: false
});
dotenv.config()
const config = require('../../config/config');
//
const DisconnectReason = {
	loggedOpen: 'loggedOpen',	// Indica que a conexão com o servidor do WhatsApp foi feita com sucesso.
	loggedQr: 'loggedQr',			// Indica que a conexão com o servidor do WhatsApp esta na leitura do qrcode.
	genericOut: 400,
	connectionClosed: 428, 		// Indica que a conexão com o servidor do WhatsApp foi fechada.
	connectionLost: 408, 			// Significa que a conexão com o servidor foi perdida. Isso é frequentemente causado por instabilidade na rede, como perda de sinal de internet.
	connectionReplaced: 440, 	// Ocorre quando uma nova sessão do WhatsApp Web é aberta em outro lugar (por exemplo, em outro navegador ou dispositivo), substituindo a sessão atual.
	timedOut: 408, 						// Indica que a conexão expirou, geralmente devido à falta de atividade ou a um tempo limite de resposta do servidor.
	loggedOut: 401, 					// A sessão foi desconectada porque o usuário fez logout do WhatsApp Web em outro dispositivo ou diretamente no aplicativo móvel.
	bannedTimetamp: 402, 			// Possui um timestamp de banimento, conta temporariamente banida
	badSession: 500, 					// Sugere que o arquivo de sessão (autenticação) está corrompido ou inválido.
	restartRequired: 515, 		// Indica que um reinício da aplicação ou da conexão é necessário para que a Baileys funcione corretamente.
	multideviceMismatch: 411, // Acontece quando há uma incompatibilidade com o modo multi-dispositivo do WhatsApp.
	forbidden: 403,						// Geralmente indica que a conta foi banida ou bloqueada pelo WhatsApp.
	clientOutdated: 405, 			// Cliente desatualizado.
	unavailableService: 503,	// Significa que o serviço do WhatsApp está temporariamente indisponível ou sobrecarregado.
	unknownLogout: 406, 			// Agora chamado de BANNED no código do WhatsApp Web, desconectado por motivo desconhecido.
	dadUserAgent: 409, 				// O agente do usuário do cliente foi rejeitado.
	CATExpired: 413, 					// O token de autenticação criptográfica do Messenger expirou.
	CATInvalid: 414, 					// O token de autenticação criptográfica do Messenger é inválido
	notFound: 415,
	experimental: 501,
}
//
// Códigos de desconexão oficiais da Baileys
const resDisconnectReason = {
	// Estados customizados para controle interno
	loggedOpen: 'loggedOpen',		// Indica que a conexão com o servidor do WhatsApp foi feita com sucesso.
	loggedQr: 'loggedQr',				// Indica que a conexão com o servidor do WhatsApp está na leitura do qrcode.
	
	// Códigos oficiais da Baileys (enum DisconnectReason)
	connectionClosed: 428, 			// Indica que a conexão com o servidor do WhatsApp foi fechada.
	connectionLost: 408, 				// Significa que a conexão com o servidor foi perdida. Isso é frequentemente causado por instabilidade na rede.
	connectionReplaced: 440, 		// Ocorre quando uma nova sessão do WhatsApp Web é aberta em outro lugar, substituindo a sessão atual.
	timedOut: 408, 							// Indica que a conexão expirou, geralmente devido à falta de atividade ou tempo limite de resposta.
	loggedOut: 401, 						// A sessão foi desconectada porque o usuário fez logout do WhatsApp Web em outro dispositivo.
	badSession: 500, 						// Sugere que o arquivo de sessão (autenticação) está corrompido ou inválido.
	restartRequired: 515, 			// Indica que um reinício da aplicação ou da conexão é necessário.
	multideviceMismatch: 411, 	// Acontece quando há uma incompatibilidade com o modo multi-dispositivo do WhatsApp.
	forbidden: 403,							// Geralmente indica que a conta foi banida ou bloqueada pelo WhatsApp.
	unavailableService: 503,		// Significa que o serviço do WhatsApp está temporariamente indisponível ou sobrecarregado.
}

module.exports = class Disconnect {

	static async lastDisconnect(key, lastDisconnect) {
		//
		if (lastDisconnect == 'loggedOpen' || lastDisconnect == 'loggedQr') {
			var statusCode = lastDisconnect;
		} else {
			var statusCode = lastDisconnect?.error ? lastDisconnect.error?.output?.statusCode : 0;
		}
		//
		var addJson = {};
		//
		switch (statusCode) {
			case resDisconnectReason.loggedOpen:
				// Device Logged In Successfully
				console.log(`- Connection loggedOpen`);
				//
				addJson = {
					SessionName: key,
					state: "CONNECTED",
					status: "inChat",
					message: "Sistema iniciado e disponível para uso"
				};
				//
				break;
				
			case resDisconnectReason.loggedQr:
				// Waiting for QR Code Scan
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
				// Device Logged Out
				console.log(`- Connection loggedOut`);
				//
				addJson = {
					SessionName: key,
					state: "CLOSED",
					status: "notLogged",
					message: "Sistema desconectado - logout realizado"
				};
				//
				break;
				
			case resDisconnectReason.forbidden:
				// Account Banned or Blocked
				console.log(`- User forbidden/banned`);
				//
				addJson = {
					SessionName: key,
					state: "BANNED",
					status: "notLogged",
					message: "Conta banida ou bloqueada pelo WhatsApp"
				};
				//
				break;
				
			case resDisconnectReason.timedOut:
				// Connection Timed Out
				console.log(`- Connection TimedOut`);
				//
				addJson = {
					SessionName: key,
					state: "CONNECTING",
					status: "desconnectedMobile",
					message: "Conexão expirou - tentando reconectar"
				};
				//
				break;
				
			case resDisconnectReason.connectionLost:
				// Connection Lost
				console.log(`- Connection Lost`);
				//
				addJson = {
					SessionName: key,
					message: "Conexão perdida - tentando reconectar",
					state: "CONNECTING",
					status: "desconnectedMobile"
				};
				//
				break;
				
			case resDisconnectReason.multideviceMismatch:
				// Multi-device Mismatch
				console.log('- Connection multideviceMismatch');
				//
				addJson = {
					SessionName: key,
					message: "Incompatibilidade multi-dispositivo - escaneie QR novamente",
					state: "QRCODE",
					status: "qrRead"
				};
				//
				break;
				
			case resDisconnectReason.connectionClosed:
				// Connection Closed
				console.log(`- Connection connectionClosed`);
				//
				addJson = {
					SessionName: key,
					message: "Conexão fechada",
					state: "CLOSED",
					status: "notLogged"
				};
				//
				break;
				
			case resDisconnectReason.connectionReplaced:
				// Connection Replaced by Another Session
				console.log(`- Connection connectionReplaced`);
				//
				addJson = {
					SessionName: key,
					state: "DISCONNECTED",
					status: "notLogged",
					message: "Conexão substituída por nova sessão"
				};
				//
				break;
				
			case resDisconnectReason.badSession:
				// Bad Session File
				console.log(`- Connection badSession`);
				//
				addJson = {
					SessionName: key,
					state: "DISCONNECTED",
					status: "notLogged",
					message: "Sessão corrompida - escaneie QR novamente"
				};
				//
				break;
				
			case resDisconnectReason.restartRequired:
				// Restart Required
				console.log('- Connection restartRequired');
				//
				addJson = {
					SessionName: key,
					message: "Reinício necessário",
					state: "CLOSED",
					status: "notLogged"
				};
				//
				break;
				
			case resDisconnectReason.unavailableService:
				// Service Unavailable
				console.log('- Service Unavailable');
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "serviceUnavailable",
					message: "Serviço do WhatsApp temporariamente indisponível"
				};
				//
				break;
				
			default:
				// Unknown Disconnect Reason
				console.log(`- Unknown disconnect reason: ${statusCode}`);
				//
				addJson = {
					SessionName: key,
					state: "ERROR",
					status: "unknown",
					message: "Motivo de desconexão desconhecido"
				};
				//
				break;
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
					console.log(`- Error: status ${statusText}`);
					console.log(`- Error: statusCode ${statusCode}`);
					console.log(`- Error: errorMessage ${errorMessage}`);
					//
					console.log('=====================================================================================================');
					//
				});
				//
			}
		}
		//
	}
}