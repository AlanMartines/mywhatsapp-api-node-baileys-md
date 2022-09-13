'use strict';
// Configuração dos módulos
const config = require('./config.global');
const events = require('./controllers/events');
const webhooks = require('./controllers/webhooks.js');
const fnSocket = require('./controllers/fnSockets');
const fs = require('fs-extra');
const rimraf = require("rimraf");
const {
	forEach
} = require('p-iteration');
const QRCode = require('qrcode');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const pino = require("pino");
const colors = require('colors');
const { Boom } = require('@hapi/boom');
const { default: pQueue } = require('p-queue');
const { release } = require('os');
const { Tokens } = require('./models');
//
const {
	default: makeWASocket,
	useSingleFileAuthState,
	DisconnectReason,
	AnyMessageContent,
	delay,
	makeInMemoryStore,
	MessageType,
	MessageOptions,
	Mimetype,
	isJidGroup,
	fetchLatestBaileysVersion,
	WASocket,
	AuthenticationState,
	BufferJSON,
	getMessage,
	WA_DEFAULT_EPHEMERAL,
	initInMemoryKeyStore,
	WAMessage,
	Contact,
	SocketConfig,
	BaileysEventMap,
	GroupMetadata,
	MiscMessageGenerationOptions,
	generateWAMessageFromContent,
	downloadContentFromMessage,
	downloadHistory,
	proto,
	generateWAMessageContent,
	prepareWAMessageMedia,
	WAUrlInfo
} = require('@adiwajshing/baileys');
//
const tokenPatch = config.PATCH_TOKENS;
//
// ------------------------------------------------------------------------------------------------------- //
//
async function saudacao() {
	//
	var data = new Date();
	var hr = data.getHours();
	//
	if (hr >= 0 && hr < 12) {
		var saudacao = "Bom dia";
		//
	} else if (hr >= 12 && hr < 18) {
		var saudacao = "Boa tarde";
		//
	} else if (hr >= 18 && hr < 23) {
		var saudacao = "Boa noite";
		//
	} else {
		var saudacao = "Boa madrugada";
		//
	}
	return saudacao;
}
//
async function osplatform() {
	//
	var opsys = process.platform;
	if (opsys == "darwin") {
		opsys = "MacOS";
	} else if (opsys == "win32" || opsys == "win64") {
		opsys = "Windows";
	} else if (opsys == "linux") {
		opsys = "Linux";
	}
	//
	console.log("- Sistema operacional", opsys) // I don't know what linux is.
	console.log("-", os.type());
	console.log("-", os.release());
	console.log("-", os.platform());
	//
	return opsys;
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateStateDb(state, status, AuthorizationToken) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	console.log("- Date:", date_now);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		console.log('- Atualizando status');
		//
		const [updatedRows] = await Tokens.update(
			{
				state: state,
				status: status,
				lastactivit: date_now,
			},
			{
				where: { token: AuthorizationToken },
			}
		);
		//
		if (updatedRows) {
			console.log('- Status atualizado');
		} else {
			console.log('- Status não atualizado');
		}
	}
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateUserConDb(userconnected, AuthorizationToken) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	console.log("- Date:", date_now);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		console.log('- Atualizando User Connected');
		//
		const [updatedRows] = await Tokens.update(
			{
				userconnected: userconnected,
				lastactivit: date_now,
			},
			{
				where: { token: AuthorizationToken },
			}
		);
		//
		if (updatedRows) {
			console.log('- User connection atualizado');
		} else {
			console.log('- User connection não atualizado');
		}
	}
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function deletaToken(filePath, filename) {
	//
	fs.unlink(`${filePath}/${filename}`, function (err) {
		if (err && err.code == 'ENOENT') {
			// file doens't exist
			console.log(`- Arquivo "${filePath}/${filename}" não encontado`);
		} else if (err) {
			// other errors, e.g. maybe we don't have enough permission
			console.log(`- Erro ao remover arquivo "${filePath}/${filename}"`);
		} else {
			console.log(`- Arquivo "${filePath}/${filename}" removido com sucesso`);
		}
	});
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Sessions {
	//
	static async ApiStatus(SessionName) {
		var session = Sessions.getSession(SessionName);
		if (session) { //só adiciona se não existir
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
	} //status
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async Start(socket, SessionName, AuthorizationToken, whatsappVersion) {
		Sessions.sessions = Sessions.sessions || []; //start array
		var session = Sessions.getSession(SessionName);
		//
		if (session == false) {
			//create new session
			session = await Sessions.addSesssion(socket, SessionName, AuthorizationToken, whatsappVersion);
			//
		} else if (["CLOSED"].includes(session.state)) {
			//restart session
			console.log("- State: CLOSED");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = "Sistema iniciando e indisponivel para uso";
			session.prossesid = null;
			//
			console.log('- Nome da sessão:', session.name);
			console.log('- State do sistema:', session.state);
			console.log('- Status da sessão:', session.status);
			//
			session.client = await Sessions.initSession(socket, SessionName, AuthorizationToken, whatsappVersion);
			//
		} else if (["DISCONNECTED"].includes(session.state)) {
			//
			console.log("- State: DISCONNECTED");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			session.prossesid = null;
			//
			console.log('- Nome da sessão:', session.name);
			console.log('- State do sistema:', session.state);
			console.log('- Status da sessão:', session.status);
			//
			session.client = await Sessions.initSession(socket, SessionName, AuthorizationToken, whatsappVersion);
			//
		} else if (["NOTFOUND"].includes(session.state)) {
			//
			console.log("- State: NOTFOUND");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			session.prossesid = null;
			//
			console.log('- Nome da sessão:', session.name);
			console.log('- State do sistema:', session.state);
			console.log('- Status da sessão:', session.status);
			//
			session = await Sessions.addSesssion(socket, SessionName, AuthorizationToken, whatsappVersion);
			//
		} else {
			//
			console.log("- State: OTHER");
			console.log('- Nome da sessão:', session.name);
			console.log('- State do sistema:', session.state);
			console.log('- Status da sessão:', session.status);
			//
		}
		//
		await updateStateDb(session.state, session.status, AuthorizationToken);
		//
		return session;
	} //start
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async addSesssion(socket, SessionName, AuthorizationToken, whatsappVersion) {
		console.log("- Adicionando sessão");
		var newSession = {
			AuthorizationToken: AuthorizationToken,
			name: SessionName,
			process: null,
			qrcode: null,
			client: false,
			result: null,
			tokenPatch: null,
			state: null,
			status: null,
			message: null,
			attempts: 1,
			funcoesSocket: null,
			wh_status: null,
			wh_message: null,
			wh_qrcode: null,
			wh_connect: null,
		}
		//
		Sessions.sessions.push(newSession);
		//setup session
		newSession.client = Sessions.initSession(socket, SessionName, AuthorizationToken, whatsappVersion);
		//
		return newSession;
	} //addSession
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static getSession(SessionName) {
		//console.log("- getSession");
		var foundSession = false;
		if (Sessions.sessions)
			Sessions.sessions.forEach(session => {
				if (SessionName == session.name) {
					foundSession = session;
				}
			});
		return foundSession;
	} //getSession
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static getSessions() {
		//console.log("- getSessions");
		if (Sessions.sessions) {
			return Sessions.sessions;
		} else {
			return [];
		}
	} //getSessions
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async initSession(socket, SessionName, AuthorizationToken, whatsappVersion) {
		//
		console.log("- Iniciando sessão");
		var session = Sessions.getSession(SessionName);
		session.AuthorizationToken = AuthorizationToken;
		session.state = 'STARTING';
		session.status = 'notLogged';
		//
		session.process = new pQueue({ concurrency: 1 });
		//
		//
		/*
			╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐┬    ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐  ╔═╗┌─┐┬─┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
			║ ║├─┘ │ ││ ││││├─┤│    ║  ├┬┘├┤ ├─┤ │ ├┤   ╠═╝├─┤├┬┘├─┤│││├┤  │ ├┤ ├┬┘└─┐
			╚═╝┴   ┴ ┴└─┘┘└┘┴ ┴┴─┘  ╚═╝┴└─└─┘┴ ┴ ┴ └─┘  ╩  ┴ ┴┴└─┴ ┴┴ ┴└─┘ ┴ └─┘┴└─└─┘
	 */
		//
		const store = makeInMemoryStore({
			logger: pino().child({
				level: 'debug',
				stream: 'store'
			})
		});
		//
		store.readFromFile(`${tokenPatch}/${SessionName}.store.json`);
		const contactsList = store.contacts;
		// save every 10s
		setInterval(() => {
			store.writeToFile(`${tokenPatch}/${SessionName}.store.json`);
		}, 10000);
		//
		const {
			state,
			saveState
		} = useSingleFileAuthState(`${tokenPatch}/${SessionName}.data.json`);
		//
		try {
			//
			const startSock = async (SessionName = null) => {
				//
				// fetch latest version of WA Web
				const { version, isLatest } = await fetchLatestBaileysVersion();
				console.log(`- Using WA v${version.join('.')}, isLatest: ${isLatest}`.yellow)
				//
				const client = makeWASocket({
					// provide an auth state object to maintain the auth state
					auth: state,
					// version to connect with
					//version: [`${config.WA_VERSION}`],
					// override browser config
					browser: [`${config.DEVICE_NAME}`, 'Chrome', release()],
					// the WS url to connect to WA
					//waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
					// Fails the connection if the connection times out in this time interval or no data is received
					connectTimeoutMs: 30000,
					// ping-pong interval for WS connection
					keepAliveIntervalMs: 25000,
					// pino logger
					logger: pino({
						level: 'silent'
					}),
					// should the QR be printed in the terminal
					printQRInTerminal: parseInt(config.VIEW_QRCODE_TERMINAL),
					//
					emitOwnEvents: true,
					// Default timeout for queries, undefined for no timeout
					defaultQueryTimeoutMs: 60000,
					// proxy agent
					agent: undefined,
					// agent used for fetch requests -- uploading/downloading media
					fetchAgent: undefined,
					//
					//fetch a message from your store
					//implement this so that messages failed to send (solves the "this message can take a while" issue) can be retried
					getMessage: undefined,
					//
					/** By default true, should history messages be downloaded and processed */
					downloadHistory: true,
					/** marks the client as online whenever the socket successfully connects */
					markOnlineOnConnect: true,
					/** width for link preview images */
					linkPreviewImageThumbnailWidth: 192,
					/** Should Baileys ask the phone for full history, will be received async */
					syncFullHistory: false
				});
				//
				store.bind(client.ev);
				//
				let relaunchSemaphore = 0;
				let relaunchError = 0;
				let attempts = 1;
				//
				client.ev.on('connection.update', async (conn) => {
					//
					const {
						connection,
						lastDisconnect,
						isNewLogin,
						qr,
						receivedPendingNotifications
					} = conn;
					//
					console.log("- Connection update".blue);
					//
					//
					if (qr) {
						//
						console.log('- QR Generated'.green);
						//
						const readQRCode = await QRCode.toDataURL(qr);
						const base64Code = readQRCode.replace('data:image/png;base64,', '');
						//
						console.log('- Número de tentativas de ler o qr-code:', attempts);
						//
						console.log("- Captura do QR-Code");
						//
						webhooks?.wh_qrcode(Sessions.getSession(SessionName), readQRCode, qr);
						this.exportQR(socket, readQRCode, SessionName, attempts);
						//
						session.state = "QRCODE";
						session.status = "qrRead";
						session.CodeurlCode = qr;
						session.qrcode = readQRCode;
						session.message = "Sistema aguardando leitura do QR-Code";
						//
						await updateStateDb(session.state, session.status, session.AuthorizationToken);
						//
						if (attempts >= 5) {
							//
							// close WebSocket connection
							client.ws.close();
							// remove all events
							client.ev.removeAllListeners();
							//
							attempts = 1;
							//
							session.client = false;
							session.state = "CLOSED";
							session.status = "notLogged";
							session.message = 'Sistema desconectado';
							//
							await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
							await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
							//
							console.log("- Navegador fechado automaticamente");
							//
							await updateStateDb(session.state, session.status, session.AuthorizationToken);
						}
						//
						attempts++;
						//
					}
					//
					if (connection === 'connecting') {
						//
						console.log(`- Connection ${connection}`.green);
						//
					} else if (connection === 'open') {
						//
						console.log('- Connected to WhatsApp'.green);
						//
						session.state = "CONNECTED";
						session.status = "inChat";
						session.qrcode = null;
						session.CodeurlCode = null;
						session.message = "Sistema iniciado e disponivel para uso";
						//
						attempts = 1;
						relaunchError = 0;
						//
						let phone = await client?.user?.id.split(":")[0];
						await updateStateDb(session.state, session.status, session.AuthorizationToken);
						webhooks?.wh_connect(Sessions.getSession(SessionName), 'CONNECTED', phone);
						//
						console.log("- Sessão criada com sucesso");
						console.log("- Telefone conectado:", phone?.split("@")[0]);
						//
						socket.emit('status',
							{
								status: session.status,
								SessionName: SessionName
							}
						);
						//
						if (phone) {
							await updateUserConDb(phone, session.AuthorizationToken);
						}
						//
						attempts = 1;
						relaunchError = 0;
						//
					} else if (connection === 'close') {
						//
						console.log("- Connection close".red);
						//
						console.log(`- Output: \n ${JSON.stringify(lastDisconnect?.error?.output, null, 2)}`);
						console.log(`- Data: \n ${JSON.stringify(lastDisconnect?.error?.data, null, 2)}`);
						console.log(`- loggedOut: \n ${JSON.stringify(DisconnectReason?.loggedOut, null, 2)}`);
						//
						// reconnect if not logged out
						if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason?.loggedOut) {
							//
							relaunchSemaphore++;
							//
							if (relaunchSemaphore == 1) {
								console.log('- Restarting connection');
								setTimeout(async function () {
									return await startSock(SessionName).then(async (result) => {
										session.client = result;
										return result;
									}).catch(async (erro) => {
										console.log(erro);
									});
								}, 500);
							}
							//
						} else if (lastDisconnect?.error?.output?.statusCode === DisconnectReason?.loggedOut) {
							//
							if (lastDisconnect?.error?.data?.content?.attrs?.type == 'device_removed') {
								//
								session.state = "DISCONNECTED";
								session.status = "notLogged";
								session.qrcode = null;
								session.message = "Dispositivo desconetado";
								//
								await updateStateDb(session.state, session.status, session.AuthorizationToken);
								webhooks?.wh_connect(Sessions.getSession(SessionName), 'DISCONNECTED', null);
								//
								await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
								await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
								//
								setTimeout(async function () {
									return await startSock(SessionName).then(async (result) => {
										session.client = result;
										return result;
									}).catch(async (erro) => {
										console.log(erro);
									});
								}, 500);
								//
							} else if (lastDisconnect?.error?.output?.payload?.message == 'Connection Failure') {
								//
								session.state = "DISCONNECTED";
								session.status = "notLogged";
								session.qrcode = null;
								session.message = "Dispositivo desconetado";
								//
								relaunchError++;
								//
								if (relaunchError == 1) {
									await updateStateDb(session.state, session.status, session.AuthorizationToken);
									webhooks?.wh_connect(Sessions.getSession(SessionName), session.state, null);
									//
									//await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
									//await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
									//
									setTimeout(async function () {
										return await startSock(SessionName).then(async (result) => {
											session.client = result;
											return result;
										}).catch(async (erro) => {
											console.log(erro);
										});
									}, 500);
								}
								//
							}
							//
						} else {
							//
							//
						}
						//
						attempts = 1;
						//
					} else if (typeof connection === undefined) {
						console.log("- Connection undefined".red);
					}
					//
				});
				//
				client.ev.on('contacts.upsert', async (contacts) => {
					//console.log(`- Contacts upsert: ${JSON.stringify(contacts, null, 2)}`);
				});
				//
				client.ev.on('contacts.update', async (contacts) => {
					//console.log(`- Contacts update: ${JSON.stringify(contacts, null, 2)}`);
				});
				//
				client.ev.on('messages.update', async (message) => {
					//console.log(`- Messages update: ${JSON.stringify(message, null, 2)}`);
				});
				//
				// auto save dos dados da sessão
				client.ev.on("creds.update", saveState);
				//
				events?.receiveMessage(Sessions.getSession(SessionName), client, socket);
				events?.statusMessage(Sessions.getSession(SessionName), client, socket);
				//events?.statusConnection(Sessions.getSession(SessionName), client, socket);
				//
				return client;
				//
			}
			//
			return await startSock(SessionName).then(async (result) => {
				session.client = result;
				return result;
			}).catch(async (erro) => {
				console.log(erro);
			});
			//
		} catch (error) {
			console.log("- SessionName:", AuthorizationToken);
			session.state = "NOTFOUND";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			console.log("- Instância não criada:", error.message);
			//
			socket.emit('status',
				{
					status: session.state,
					SessionName: SessionName
				}
			);
		}
		//
	} //initSession
	//
	static async exportQR(socket, qrCode, SessionName, attempts) {
		qrCode = qrCode.replace('data:image/png;base64,', '');
		const imageBuffer = Buffer.from(qrCode, 'base64');
		socket.emit('qrCode',
			{
				data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
				SessionName: SessionName,
				attempts: attempts,
				message: 'QRCode Iniciado, Escanei por favor...'
			}
		);
	};
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
		╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
		║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
		╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
	*/
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async restartToken(socket, SessionName, AuthorizationToken, whatsappVersion) {
		//
		console.log("- Resetando sessão");
		var session = Sessions.getSession(SessionName);
		//
		if (session) {
			//
			try {
				//
				await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
				await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
				//
				session.qrcode = null;
				session.qrRetry = null;
				session.client = false;
				session.result = null;
				session.state = 'STARTING';
				session.status = 'notLogged';
				session.message = null;
				//
				session.client = Sessions.initSession(socket, SessionName, AuthorizationToken, whatsappVersion);
				//
				return {
					"erro": false,
					"status": 200,
					"message": "Sistema esta reiniciado com sucesso"
				};
				//
			} catch (error) {
				console.log("Error when:", error); //return object error
				//
				session.client = false;
				//
				return {
					"erro": false,
					"status": 404,
					"message": 'Sistema Off-line'
				};
				//
			};
			//
		} else {
			return {
				"erro": false,
				"status": 404,
				"message": 'Sistema Off-line'
			};
		}
	} //restartToken
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async closeSession(SessionName) {
		//
		console.log("- Fechando navegador");
		//
		var session = Sessions.getSession(SessionName);
		try {
			//
			// close WebSocket connection
			await session.client.ws.close();
			// remove all events
			await session.client.ev.removeAllListeners();
			//
			session.state = "CLOSED";
			session.status = "notLogged";
			session.client = false;
			session.qrcode = null;
			console.log("- Sessão fechada");
			//
			webhooks?.wh_connect(Sessions.getSession(SessionName), 'CLOSE', null);
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Navegador fechado com sucesso"
			};
			//
			await updateStateDb(session.state, session.status, session.AuthorizationToken);
			//
			return result;
			//
		} catch (error) {
			//
			console.log("- Erro ao fechar navegador", error);
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
	static async logoutSession(SessionName) {
		//
		console.log("- Desconetando sessão");
		//
		var session = Sessions.getSession(SessionName);
		try {
			//
			await session.client.logout();
			// close WebSocket connection
			await session.client.ws.close();
			// remove all events
			await session.client.ev.removeAllListeners();
			//
			session.state = "DISCONNECTED";
			session.status = "notLogged";
			session.client = false;
			session.qrcode = null;
			console.log("- Sessão desconetada");
			//
			webhooks?.wh_connect(Sessions.getSession(SessionName), 'DISCONNECTED', null);
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Sessão desconetada com sucesso"
			};
			//
			await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
			await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
			//
			await updateStateDb(session.state, session.status, session.AuthorizationToken);
			//
			return result;
			//
		} catch (error) {
			console.log("- Erro ao desconetar sessão:", error);
			//
			let result = {
				"erro": true,
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
	/*
	╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
	╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤
	╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
	*/
	//
	// Enviar Contato
	static async sendContactVcard(
		SessionName,
		number,
		contact,
		namecontact
	) {
		//
		console.log("- Enviando contato.");
		//
		var session = Sessions.getSession(SessionName);
		// send a contact!
		const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
			+ 'VERSION:3.0\n'
			+ 'FN:' + namecontact + '\n' // full name
			+ 'ORG:' + namecontact + ';\n' // the organization of the contact
			+ 'TEL;type=CELL;type=VOICE;waid=' + contact + ':' + contact + '\n' // WhatsApp ID + phone number
			+ 'END:VCARD';
		//
		return await await session.client.sendMessage(
			number,
			{
				contacts: {
					displayName: namecontact,
					contacts: [{ vcard }]
				}
			}
		).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//
			var result = {
				"erro": false,
				"status": 200,
				"message": "Contato envido com sucesso."
			};
			//
			return result;
			//
		}).catch((erro) => {
			console.log("-Error when:", erro); //return object error
			//
			var result = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar contato"
			};
			//
			return result;
			//
		});
		//
	} //sendContactVcard
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar Audio
	static async sendPtt(
		SessionName,
		number,
		buffer,
		mimetype
	) {
		console.log("- Enviando audio.");
		//
		var session = Sessions.getSession(SessionName);
		// Send audio
		//let mimetype = getDevice(message.id) == 'ios' ? 'audio/mpeg' : 'audio/mp4';
		await session.client.sendPresenceUpdate('recording', number);
		return await session.client.sendMessage(number, {
			audio: buffer,
			mimetype: mimetype,
			ptt: true
		}).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Audio enviado com sucesso."
			};
			//
			await session.client.sendPresenceUpdate('available', number);
			return returnResult;
			//
		}).catch(async (erro) => {
			await session.client.sendPresenceUpdate('available', number);
			console.log("Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar audio"
			};
			//
			return returnResult;
			//
		});
	} //sendPtt
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar Audio
	static async sendPttFromBase64(
		SessionName,
		number,
		buffer,
		mimetype
	) {
		console.log("- Enviando audio.");
		//
		var session = Sessions.getSession(SessionName);
		// Send audio
		await session.client.sendPresenceUpdate('recording', number);
		return await session.client.sendMessage(number, {
			audio: buffer,
			mimetype: "audio/mpeg",
			mp3: true,
			ptt: true
		}).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Audio enviado com sucesso."
			};
			//
			await session.client.sendPresenceUpdate('available', number);
			//
			return returnResult;
			//
		}).catch(async (erro) => {
			await session.client.sendPresenceUpdate('available', number);
			console.log("Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar audio"
			};
			//
			return returnResult;
			//
		});
	} //sendPtt
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar Texto
	static async sendText(
		SessionName,
		number,
		msg
	) {
		console.log("- Enviando menssagem de texto.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			{ text: msg }
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
		});
		//
	} //sendText
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar localização
	static async sendLocation(
		SessionName,
		number,
		lat,
		long,
		local
	) {
		console.log("- Enviando localização.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			{
				location: {
					degreesLatitude: lat,
					degreesLongitude: long,
					comment: local
				}
			}
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
			//return (result);
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Localização envida com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("- Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar localização."
			};
			//
			return returnResult;
			//
		});
	} //sendLocation
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar links com preview
	static async sendLink(
		SessionName,
		number,
		link,
		detail
	) {
		console.log("- Enviando link.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			{
				text: link,
				caption: detail,
				detectLinks: true
			}
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
		});
		//
	} //sendLinkPreview
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar Imagem
	static async sendImage(
		SessionName,
		number,
		buffer,
		mimetype,
		originalname,
		caption
	) {
		console.log("- Enviando menssagem com imagem.");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.sendMessage(
			number, {
			image: buffer,
			fileName: originalname,
			mimetype: mimetype,
			caption: caption
		}).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//return (result);
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
			return returnResult;
			//
		});
	} //sendImage
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar arquivo
	static async sendFile(
		SessionName,
		from,
		buffer,
		originalname,
		mimetype,
		caption
	) {
		console.log("- Enviando arquivo.");
		//
		var session = Sessions.getSession(SessionName);
		//
		let mime = mimetype.split("/")[0];
		let ext = mimetype.split("/")[1];
		//
		switch (mime) {
			case 'image':
				//
				return await session.client.sendMessage(from, {
					image: buffer,
					mimetype: mimetype,
					fileName: originalname,
					caption: caption
				}).then((result) => {
					//console.log('Result: ', result); //return object success
					//return (result);
					//
					return {
						"erro": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					console.error('Error when sending: ', erro); //return object error
					//return (erro);
					//
					return {
						"erro": true,
						"status": 404,
						"message": "Erro ao enviar arquivo"
					};
					//
				});
				//
				break;
			case 'audio':
				//
				return await session.client.sendMessage(from, {
					audio: buffer,
					mimetype: mime,
					caption: caption,
					ptt: mime.split("/")[0] === 'audio' ? true : false
				}).then((result) => {
					//console.log('Result: ', result); //return object success
					//return (result);
					//
					return {
						"erro": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					console.error('Error when sending: ', erro); //return object error
					//return (erro);
					//
					return {
						"erro": true,
						"status": 404,
						"message": "Erro ao enviar arquivo"
					};
					//
				});
				//
				break;
			default:
				switch (ext) {
					case 'pdf':
						//
						mime = 'application/pdf';
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					case 'xls':
						//
						mime = 'application/excel';
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					case 'xlsx':
						//
						mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
						//
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					case 'docx':
						//
						mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					case 'doc':
						//
						mime = 'application/msword';
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					case 'zip':
						//
						mime = 'application/zip';
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					default:
						//
						return await session.client.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//console.log('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
							//return (erro);
							//
							return {
								"erro": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
					//
				}
		}
		//

		//
	} //sendFile
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar arquivo
	static async sendFileUrl(
		SessionName,
		number,
		filePath,
		originalname,
		mimetype,
		caption
	) {
		console.log("- Enviando arquivo.");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.sendMessage(
			number, {
			document: {
				url: filePath
			},
			fileName: originalname,
			mimetype: mimetype,
			caption: caption
		}).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//return (result);
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Arquivo envido com sucesso."
			};
			//
		}).catch((erro) => {
			console.log("Error when:", erro.output); //return object error
			//return (erro);
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar arquivo"
			};
			//
		});
	} //sendFileUrl
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar button
	static async sendButton(
		SessionName,
		number,
		buttonMessage
	) {
		console.log("- Enviando button.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			buttonMessage
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
			return returnResult;
			//
		});
	} //sendButton
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar button
	static async sendTemplate(
		SessionName,
		number,
		templateMessage
	) {
		console.log("- Enviando button.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			templateMessage
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
			return returnResult;
			//
		});
	} //sendButton
	//
	// ------------------------------------------------------------------------------------------------//
	//
	//Enviar lista
	static async sendListMessage(
		SessionName,
		number,
		listMessage
	) {
		console.log("- Enviando lista.");
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			listMessage
		).then(async (result) => {
			//console.log("Result: ", result); //return object success
			//
			var result = {
				"erro": false,
				"status": 200,
				"message": "Menssagem envida com sucesso."
			};
			//
			return result;
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			var result = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar menssagem"
			};
			//
			return result;
			//
		});
	} //sendListMessage
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐
	╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤
	╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴
	*/
	//
	// Recuperar contatos
	static async getAllContacts(
		SessionName
	) {
		console.log("- Obtendo todos os contatos!");
		var session = Sessions.getSession(SessionName);
		//
		try {
			var contacts = [];
			//
			if (fs.existsSync(`${tokenPatch}/${SessionName}.store.json`)) {
				let result = require(`${tokenPatch}/${SessionName}.store.json`);
				//
				const resContacts = Object.values(result.contacts);
				//
				for (let contact of resContacts) {
					//
					if (contact?.id.includes('s.whatsapp.net') || contact?.id?.split("@")[1] == 's.whatsapp.net') {
						contacts.push({
							"user": contact?.id?.split("@")[0],
							"name": contact?.notify,
							"notify": contact?.notify
						});
					}
					//
				}
			} else {
				//
				let returnResult = {
					"erro": true,
					"status": 404,
					"message": "Erro ao recuperar contatos"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"getAllContacts": contacts
			};
			//
			return returnResult;
			//
		} catch (erro) {
			console.log("Error when:", erro); //return object error
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao recuperar contatos"
			};
			//
			return returnResult;
			//
		};
		//
	} //getAllContacts
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Recuperar grupos
	static async getAllGroups(
		SessionName
	) {
		console.log("- Obtendo todos os grupos!");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupFetchAllParticipating().then(async (result) => {
			//console.log('Result:\n', result); //return object success
			//
			var getAllGroups = [];
			//
			//const resGroup = JSON.stringify(result, null, 2);
			//console.log(JSON.stringify(result));
			const resGroup = Object.values(result);
			//
			for (let group of resGroup) {
				//
				if (isJidGroup(group?.id) === true) {
					//
					getAllGroups.push({
						"user": group?.id.split("@")[0],
						"name": group?.subject,
						"formattedName": group?.subject,
						"creation": moment(group?.creation * 1000).format("YYYY-MM-DD HH:mm:ss"),
						"restrict": group?.restrict,
						"participants": group?.participants
					});
				}
				//
			}
			//
			/*
			await forEach(resGroup, async (value) => {
				//
					if(isJidGroup(group?.id) === true){
						getAllGroups.push({
							"groupId": group?.id.split("@")[0],
							"name": group?.subject,
							"creation": moment(group?.creation*1000).format("YYYY-MM-DD HH:mm:ss"),
							"restrict": group?.restrict,
							"participants": group?.participants
						});
						}
				//
			});
			*/
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Lista de grupos obtida com sucesso.",
				"getAllGroups": getAllGroups
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log('Error when sending: ', erro); //return object error
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao recuperar grupos"
			};
			//
			return returnResult;
			//
		});
		//
	} //getAllGroups
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Verificar o status do número
	static async checkNumberStatus(
		SessionName,
		number
	) {
		console.log("- Validando numero");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.onWhatsApp(number).then(([result]) => {
			//console.log('Result: ', result); //return object success
			//
			if (result?.exists == true) {
				//
				return {
					"erro": false,
					"status": 200,
					"number": result?.jid?.split("@")[0],
					"message": "O número informado pode receber mensagens via whatsapp"
				};
				//
			} else {
				//
				return {
					"erro": false,
					"status": 404,
					"number": number,
					"message": "O número informado não pode receber mensagens via whatsapp"
				};
				//
			}
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//
			return {
				"erro": true,
				"status": 200,
				"number": number,
				"message": "Erro ao verificar número informado"
			};
			//
		});
	} //checkNumberStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Obter a foto do perfil do servidor
	static async getProfilePicFromServer(
		SessionName,
		number
	) {
		console.log("- Obtendo a foto do perfil do servidor!");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.profilePictureUrl(number, 'image').then(async (result) => {
			//console.log('Result: ', result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"profilepicture": result,
				"message": "Foto do perfil obtido com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("- Error when:", erro); //return object error
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao obtendo a foto do perfil no servidor"
			};
			//
		});
		//
	} //getProfilePicFromServer
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐
	╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘
	*/
	//
	// Deixar o grupo
	static async leaveGroup(
		SessionName,
		groupId
	) {
		console.log("- Deixar o grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupLeave(groupId).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
				return {
					"erro": false,
					"status": 200,
					"message": "Grupo deixado com sucesso"
				};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				//
				return {
					"erro": true,
					"status": 404,
					"message": "Erro ao deixar o grupo"
				};
				//
			});
	} //leaveGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Criar grupo (título, participantes a adicionar)
	static async createGroup(
		SessionName,
		title,
		contactlistValid,
		contactlistInvalid
	) {
		console.log("- Criando grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupCreate(title, contactlistValid).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
				if (result?.id) {
					return {
						"erro": false,
						"status": 200,
						"groupId": result?.id,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Grupo criado com a lista de contatos validos"
					};
				} else {
					//
					return {
						"erro": true,
						"status": 404,
						"groupId": null,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao criar grupo"
					};
					//
				}
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"groupId": null,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao criar grupo"
					};
					//
			});
	} //createGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Atualizando titulo do grupo
	static async updateGroupTitle(
		SessionName,
		groupId,
		title
	) {
		console.log("- Atualizando titulo do grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupUpdateSubject(groupId, title).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
					return {
						"erro": false,
						"status": 200,
						"message": "Titulo do grupo atualizado com sucesso"
					};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"message": "Erro ao atualizar titulo do grupo"
					};
					//
			});
	} //updateGroupTitle
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Atualizando descrição do grupo
	static async updateGroupDesc(
		SessionName,
		groupId,
		desc
	) {
		console.log("- Atualizando descrição do grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupUpdateDescription(groupId, desc).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
					return {
						"erro": false,
						"status": 200,
						"message": "Descrição do grupo atualizado com sucesso"
					};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"message": "Erro ao atualizar descrição do grupo"
					};
					//
			});
	} //updateGroupDesc
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Obtenha membros do grupo
	static async getGroupMembers(
		SessionName,
		groupId
	) {
		console.log("- Obtendo membros do grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupMetadata(groupId).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
				var groupMembers = [];
				//
				await forEach(result?.participants, async (resultGroupMembers) => {
					//
						groupMembers.push({
							"user": resultGroupMembers?.id,
							"admin": resultGroupMembers?.admin
						});
					//
				});
				//
				var resultRes = {
					"erro": false,
					"status": 200,
					"groupId": groupId,
					"groupMembers": groupMembers,
					"message": 'Membros do grupo obtids com sucesso'
				};
				//
				return resultRes;
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				//
				return {
					"erro": true,
					"status": 404,
					"groupId": groupId,
					"message": "Erro ao obter membros do grupo"
				};
				//
			});
	} //getGroupMembers
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Gerar link de url de convite de grupo
	static async getGroupInviteLink(
		SessionName,
		groupId
	) {
		console.log("- Gerar link de convite do grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupInviteCode(groupId).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
				return {
					"erro": false,
					"status": 200,
					"inviteCode": result,
					"inviteUrl": 'https://chat.whatsapp.com/'+result,
					"message": "Link de convite obtido com sucesso"
				};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				//
				return {
					"erro": true,
					"status": 404,
					"inviteCode": null,
					"inviteUrl": null,
					"message": "Erro ao obter link de convite"
				};
				//
			});
	} //getGroupInviteLink
		//
	// ------------------------------------------------------------------------------------------------//
	//
	// Gerar link de url de convite de grupo
	static async getGroupRevokeInviteLink(
		SessionName,
		groupId
	) {
		console.log("- Gerar link de convite do grupo");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupRevokeInvite(groupId).then(async (result) => {
				//console.log('Result: ', result); //return object success
				//
				return {
					"erro": false,
					"status": 200,
					"inviteCode": result,
					"inviteUrl": 'https://chat.whatsapp.com/'+result,
					"message": "Link de convite obtido com sucesso"
				};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				//
				return {
					"erro": true,
					"status": 404,
					"inviteCode": null,
					"inviteUrl": null,
					"message": "Erro ao obter link de convite"
				};
				//
			});
	} //getGroupRevokeInviteLink
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Remove participante
	static async removeParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		console.log("- Removendo participante(s)");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupParticipantsUpdate(
				groupId, 
				contactlistValid,
				"remove"
				).then(async ([result]) => {
				//console.log('Result: ', result); //return object success
				//
				if (result?.status == 200) {
					return {
						"erro": false,
						"status": 200,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Participante(s) da lista valida removido(s) com sucesso"
					};
				} else {
					//
					return {
						"erro": true,
						"status": 404,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao remover participante(s) da lista valida"
					};
					//
				}
				//
			}).catch((erro) => {
				console.log("- Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao remover participante(s)"
					};
					//
			});
	} //removeParticipant
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Adicionar participante
	static async addParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		console.log("- Adicionando participante(s)");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupParticipantsUpdate(
				groupId, 
				contactlistValid,
				"add"
				).then(async ([result]) => {
				//console.log('Result: ', result); //return object success
				//
				if (result?.status == 200) {
					return {
						"erro": false,
						"status": 200,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Participante(s) da lista valida adicionado(s) com sucesso"
					};
				} else {
					//
					return {
						"erro": true,
						"status": 404,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao adicionar participante(s) da lista valida"
					};
					//
				}
				//
			}).catch((erro) => {
				console.log("- Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao adicionar participante(s)"
					};
					//
			});
	} //addParticipant
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Promote participante (Give admin privileges)
	static async promoteParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		console.log("- Promovendo participante(s)");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId, 
			contactlistValid,
			"promote"
			).then(async ([result]) => {
			//console.log('Result: ', result); //return object success
			//
			if (result?.status == 200) {
					return {
						"erro": false,
						"status": 200,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Participante(s) da lista valida promovido(s) com sucesso"
					};
				} else {
					//
					return {
						"erro": true,
						"status": 404,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao promover participante(s) da lista valida"
					};
					//
				}
				//
			}).catch((erro) => {
				console.log("- Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao promover particitante(s)"
					};
					//
			});
	} //createGroup

	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Depromote participant (Give admin privileges)
	static async demoteParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		console.log("- Promovendo participante(s)");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId, 
			contactlistValid,
			"demote"
			).then(async ([result]) => {
			//console.log('Result: ', result); //return object success
			//
			if (result?.status == 200) {
					return {
						"erro": false,
						"status": 200,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Participante(s) da lista valida depromote com sucesso"
					};
				} else {
					//
					return {
						"erro": true,
						"status": 404,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao depromote participante(s) da lista valida"
					};
					//
				}
				//
			}).catch((erro) => {
				console.log("- Error when:", erro); //return object error
					//
					return {
						"erro": true,
						"status": 400,
						"contactlistValid": contactlistValid,
						"contactlistInvalid": contactlistInvalid,
						"message": "Erro ao depromote particitante(s)"
					};
					//
			});
	} //createGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Retorna o status do grupo, jid, descrição do link de convite
	static async getGroupInfoFromInviteLink(
		SessionName,
		inviteCode
	) {
		console.log("- Obtendo status do grupo via link de convite");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupGetInviteInfo(inviteCode).then(async (result) => {
				//console.log('Result: ', result); //return object success
				return {
					"erro": false,
					"status": 200,
					"infoInvite": result,
					"message": "Informação do link de convite"
				};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				return {
					"erro": true,
					"status": 404,
					"message": "Erro ao obter informação do link de convite"
				};
				//
			});
	} //getGroupInfoFromInviteLink
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Junte-se a um grupo usando o código de convite do grupo
	static async joinGroup(
		SessionName,
		inviteCode
	) {
		console.log("- Join grupo via link de convite");
		//
		var session = Sessions.getSession(SessionName);
			return await session.client.groupAcceptInvite(inviteCode).then(async (result) => {
				//console.log('Result: ', result); //return object success
				return {
					"erro": false,
					"status": 200,
					"message": "Join grupo com sucesso"
				};
				//
			}).catch((erro) => {
				console.log("Error when:", erro); //return object error
				return {
					"erro": true,
					"status": 404,
					"message": "Erro ao Join grupo"
				};
				//
			});
	} //joinGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐
	╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘
	*/
	//
	// Recuperar status
	static async getPerfilStatus(
		SessionName,
		number
	) {
		console.log("- Obtendo status do perfil");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.fetchStatus(number).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"statusperfil": result,
				"message": "Status do perfil obtido com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			console.log("- Error when:", erro); //return object error
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao obtendo a foto do perfil no servidor"
			};
			//
		});
		//
	} //getStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Set client status
	static async setProfileStatus(
		SessionName,
		ProfileStatus
	) {
		console.log("- Mudando o estatus");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.updateProfileStatus(ProfileStatus).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Profile status alterado com sucesso."
			};
			//
		}).catch((erro) => {
			console.log("- Error when:", erro); //return object error
			//return erro;
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao alterar profile status."
			};
			//
		});
	} //setProfileStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Set client profile name
	static async setProfileName(
		SessionName,
		ProfileName
	) {
		console.log("- Mudando profile name");
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.updateProfileName(ProfileName).then(async (result) => {
			//console.log('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Profile name alterado com sucesso."
			};
			//
		}).catch((erro) => {
			console.log("Error when:", erro); //return object error
			//return erro;
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao alterar profile name."
			};
			//
		});
	} //setProfileName
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╔╦╗┌─┐┬  ┬┬┌─┐┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	 ║║├┤ └┐┌┘││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐
	═╩╝└─┘ └┘ ┴└─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘
	*/
	//
	// ------------------------------------------------------------------------------------------------//
	//

	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╔╦╗┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌┬┐┌─┐  ╦═╗┌─┐┌┬┐┌─┐┌─┐
	 ║ ├┤ └─┐ │ ├┤ └─┐   ││├┤   ╠╦╝│ │ │ ├─┤└─┐
	 ╩ └─┘└─┘ ┴ └─┘└─┘  ─┴┘└─┘  ╩╚═└─┘ ┴ ┴ ┴└─┘
	 */
	//
	// ------------------------------------------------------------------------------------------------//
	//

	//
	// ------------------------------------------------------------------------------------------------//
	//
}