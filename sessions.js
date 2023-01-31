'use strict';
// Configuração dos módulos
const config = require('./config.global');
const eventsSend = require('./controllers/events');
const webhooks = require('./controllers/webhooks.js');
const fnSocket = require('./controllers/fnSockets');
const fs = require('fs-extra');
const rmfr = require('rmfr');
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
const { logger } = require("./utils/logger");
const MAIN_LOGGER = require("./utils/loggerinstance");
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
	WAUrlInfo,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
	isJidBroadcast,
	MessageRetryMap
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
// ------------------------------------------------------------------------------------------------------- //
//
async function updateStateDb(state, status, AuthorizationToken) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando status');
		//
		const updatedRows = await Tokens.update(
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
			logger?.info('- Status atualizado');
		} else {
			logger?.info('- Status não atualizado');
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
	logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando User Connected');
		//
		const updatedRows = await Tokens.update(
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
			logger?.info('- User connection atualizado');
		} else {
			logger?.info('- User connection não atualizado');
		}
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
module.exports = class Sessions {
	//
	static async ApiStatus(SessionName) {
		var session = Sessions.getSession(SessionName);
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
	} //status
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async Start(socket, SessionName, AuthorizationToken, setOnline) {
		Sessions.sessions = Sessions.sessions || []; //start array
		var session = Sessions.getSession(SessionName);
		//
		if (session == false) {
			//create new session
			session = await Sessions.addSesssion(socket, SessionName, AuthorizationToken, setOnline);
			//
		} else if (["CLOSED"].includes(session.state)) {
			//
			logger?.info("- State: CLOSED");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = "Sistema iniciando e indisponivel para uso";
			session.prossesid = null;
			//
			logger?.info(`- Nome da sessão: ${session.name}`);
			logger?.info(`- State do sistema: ${session.state}`);
			logger?.info(`- Status da sessão: ${session.status}`);
			//
			session.client = await Sessions.initSession(socket, SessionName, AuthorizationToken, setOnline);
			//
		} else if (["DISCONNECTED"].includes(session.state)) {
			//
			logger?.info("- State: DISCONNECTED");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			session.prossesid = null;
			//
			logger?.info(`- Nome da sessão: ${session.name}`);
			logger?.info(`- State do sistema: ${session.state}`);
			logger?.info(`- Status da sessão: ${session.status}`);
			//
			session.client = await Sessions.initSession(socket, SessionName, AuthorizationToken, setOnline);
			//
		} else if (["NOTFOUND"].includes(session.state)) {
			//
			logger?.info("- State: NOTFOUND");
			session.state = "STARTING";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			session.prossesid = null;
			//
			logger?.info(`- Nome da sessão: ${session.name}`);
			logger?.info(`- State do sistema: ${session.state}`);
			logger?.info(`- Status da sessão: ${session.status}`);
			//
			session = await Sessions.addSesssion(socket, SessionName, AuthorizationToken);
			//
		} else {
			//
			logger?.info("- State: OTHER");
			logger?.info(`- Nome da sessão: ${session.name}`);
			logger?.info(`- State do sistema: ${session.state}`);
			logger?.info(`- Status da sessão: ${session.status}`);
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
	static async addSesssion(socket, SessionName, AuthorizationToken, setOnline) {
		logger?.info("- Adicionando sessão");
		var newSession = {
			AuthorizationToken: AuthorizationToken,
			name: SessionName,
			waqueue: null,
			qrcode: null,
			client: false,
			tokenPatch: config.PATCH_TOKENS,
			state: null,
			status: null,
			message: null,
			attempts: 1,
			wh_status: null,
			wh_message: null,
			wh_qrcode: null,
			wh_connect: null,
		}
		//
		Sessions.sessions.push(newSession);
		//setup session
		newSession.client = Sessions.initSession(socket, SessionName, AuthorizationToken, setOnline);
		//
		return newSession;
	} //addSession
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static getSession(SessionName) {
		//logger?.info("- getSession");
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
		//logger?.info("- getSessions");
		if (Sessions.sessions) {
			return Sessions.sessions;
		} else {
			return [];
		}
	} //getSessions
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async initSession(socket, SessionName, AuthorizationToken, setOnline) {
		//
		logger?.info("- Iniciando sessão");
		var session = Sessions.getSession(SessionName);
		session.AuthorizationToken = AuthorizationToken;
		session.state = 'STARTING';
		session.status = 'notLogged';
		//
		session.waqueue = new pQueue({ concurrency: parseInt(config.CONCURRENCY) });
		//
		//
		/*
			╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐┬    ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐  ╔═╗┌─┐┬─┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
			║ ║├─┘ │ ││ ││││├─┤│    ║  ├┬┘├┤ ├─┤ │ ├┤   ╠═╝├─┤├┬┘├─┤│││├┤  │ ├┤ ├┬┘└─┐
			╚═╝┴   ┴ ┴└─┘┘└┘┴ ┴┴─┘  ╚═╝┴└─└─┘┴ ┴ ┴ └─┘  ╩  ┴ ┴┴└─┴ ┴┴ ┴└─┘ ┴ └─┘┴└─└─┘
	 */
		//
		//const loggerPino = pino({ level: 'trace' });
		const loggerPino = pino({ level: 'silent' });
		//
		const useStore = !process.argv.includes('--no-store');
		const doReplies = !process.argv.includes('--no-reply');
		//
		// external map to store retry counts of messages when decryption/encryption fails
		// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
		//const MessageRetryMap = {};
		//
		const store = useStore ? makeInMemoryStore({ loggerPino }) : undefined;
		//
		try {
			//
			store?.readFromFile(`${tokenPatch}/${SessionName}.store.json`);
			//
		} catch (error) {
			logger?.error(`- Error read store file: ${error}`);
		};
		//
		// save every 10s
		setInterval(async () => {
			try {
				//
				store?.writeToFile(`${tokenPatch}/${SessionName}.store.json`);
				//
			} catch (error) {
				logger?.error(`- Error write store file: ${error}`);
			};
			//
		}, 10000);
		//
		//const { state, saveState } = await useSingleFileAuthState(`${tokenPatch}/${SessionName}.data.json`);
		//
		const { state, saveCreds } = await useMultiFileAuthState(`${tokenPatch}/${SessionName}.data.json`);
		//
		try {
			//
			const startSock = async (SessionName = null) => {
				//
				// fetch latest version of WA Web
				const { version, isLatest } = await fetchLatestBaileysVersion();
				logger?.info(`- Using WA v${version.join('.')}, isLatest: ${isLatest}`)
					//
				const AxiosRequestConfig = {};
				//
				const SocketConfig = {
					/** the WS url to connect to WA */
					//waWebSocketUrl: undefined
					/** Fails the connection if the socket times out in this interval */
					connectTimeoutMs: 30000,
					/** Default timeout for queries, undefined for no timeout */
					defaultQueryTimeoutMs: undefined,
					/** ping-pong interval for WS connection */
					keepAliveIntervalMs: 5000,
					/** proxy agent */
					agent: undefined,
					/** pino logger */
					logger: loggerPino,
					/** version to connect with */
					version: version || undefined,
					/** override browser config */
					browser: [`${config.DEVICE_NAME}`, 'Chrome', release()],
					/** agent used for fetch requests -- uploading/downloading media */
					fetchAgent: undefined,
					/** should the QR be printed in the terminal */
					printQRInTerminal: parseInt(config.VIEW_QRCODE_TERMINAL),
					/** should events be emitted for actions done by this socket connection */
					emitOwnEvents: true,
					/** provide a cache to store media, so does not have to be re-uploaded */
					//mediaCache: NodeCache,
					/** custom upload hosts to upload media to */
					//customUploadHosts: MediaConnInfo['hosts'],
					/** time to wait between sending new retry requests */
					retryRequestDelayMs: 5000,
					/** time to wait for the generation of the next QR in ms */
					qrTimeout: 15000,
					/** provide an auth state object to maintain the auth state */
					//auth: state,
					auth: {
						creds: state.creds,
						//caching makes the store faster to send/recv messages
						keys: makeCacheableSignalKeyStore(state.keys, loggerPino),
					},
					/** manage history processing with this control; by default will sync up everything */
					//shouldSyncHistoryMessage: boolean,
					/** transaction capability options for SignalKeyStore */
					//transactionOpts: TransactionCapabilityOptions,
					/** provide a cache to store a user's device list */
					//userDevicesCache: NodeCache,
					/** marks the client as online whenever the socket successfully connects */
					markOnlineOnConnect: parseInt(setOnline),
					/**
					 * map to store the retry counts for failed messages;
					 * used to determine whether to retry a message or not */
					msgRetryCounterMap: MessageRetryMap,
					/** width for link preview images */
					linkPreviewImageThumbnailWidth: 192,
					/** Should Baileys ask the phone for full history, will be received async */
					syncFullHistory: true,
					/** Should baileys fire init queries automatically, default true */
					fireInitQueries: true,
					/**
					 * generate a high quality link preview,
					 * entails uploading the jpegThumbnail to WA
					 * */
					generateHighQualityLinkPreview: true,
					/** options for axios */
					//options: AxiosRequestConfig || undefined,
					// ignore all broadcast messages -- to receive the same
					// comment the line below out
					shouldIgnoreJid: jid => isJidBroadcast(jid),
					/** By default true, should history messages be downloaded and processed */
					downloadHistory: true,
					/**
					 * fetch a message from your store
					 * implement this so that messages failed to send (solves the "this message can take a while" issue) can be retried
					 * */
					// implement to handle retries
					getMessage: async (key) => {
						if (store) {
							const msg = await store?.loadMessage(key?.remoteJid, key?.id);
							return msg?.message || undefined;
						}
						//
						// only if store is present
						return {
							conversation: 'hello'
						}
					},
					// For fix button, template list message
					patchMessageBeforeSending: (message) => {
						const requiresPatch = !!(
							message.buttonsMessage ||
							message.templateMessage ||
							message.listMessage
						);
						if (requiresPatch) {
							message = {
								viewOnceMessage: {
									message: {
										messageContextInfo: {
											deviceListMetadataVersion: 2,
											deviceListMetadata: {},
										},
										...message,
									},
								},
							};
						}

						return message;
					},
				};
				//
				// ------------------------------------------------------------------------------------------------------- //
				//
				const client = makeWASocket(
					//
					SocketConfig
					//
				);
				//
				store?.bind(client.ev);
				//
				let attempts = 1;
				//
				// the process function lets you process all events that just occurred
				// efficiently in a batch
				client.ev.process(
					async (events) => {
						// something about the connection changed
						// maybe it closed, or we received all offline message or connection opened
						if (events['connection.update']) {
							const conn = events['connection.update'];
							//
							const {
								connection,
								lastDisconnect,
								isNewLogin,
								qr,
								receivedPendingNotifications
							} = conn;
							//
							logger?.info(`- Connection update`.green);
							//
							/*
							logger?.info(`- Output: \n ${JSON.stringify(lastDisconnect?.error?.output, null, 2)}`);
							logger?.info(`- Data: \n ${JSON.stringify(lastDisconnect?.error?.data, null, 2)}`);
							logger?.info(`- loggedOut: \n ${JSON.stringify(DisconnectReason?.loggedOut, null, 2)}`);
							*/
							//
							if (qr) {
								//
								logger?.info('- Reading to WhatsApp'.blue);
								logger?.info(`- Connection status: ${connection}`.blue);
								//
								logger?.info('- QR Generated'.green);
								//
								const readQRCode = await QRCode.toDataURL(qr);
								const base64Code = readQRCode.replace('data:image/png;base64,', '');
								//
								logger?.info(`- Número de tentativas de ler o qr-code: ${attempts}`);
								//
								logger?.info("- Captura do QR-Code");
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
									await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
									//
									socket.emit('status',
										{
										SessionName: SessionName,
										status: session.status
										}
									);
									//
									logger?.info("- Navegador fechado automaticamente");
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
								logger?.info('- Connecting to WhatsApp'.yellow);
								logger?.info(`- Connection status: ${connection}`.yellow);
								//
								session.state = "CONNECTING";
								session.status = "notLogged";
								session.message = 'Dispositivo conectando';
								//
								socket.emit('status',
									{
										SessionName: SessionName,
										status: session.status
									}
								);
								//
							} else if (connection === 'open') {
								//
								logger?.info('- Connected to WhatsApp'.green);
								logger?.info(`- Connection status: ${connection}`.green);
								//
								// Wait 5 seg for linked qr process to whatsapp
								await delay(5);
								logger?.info(`- Started using WA v${version.join('.')}, isLatest: ${isLatest}`.green);
								//
								session.client = client;
								session.state = "CONNECTED";
								session.status = "inChat";
								session.qrcode = null;
								session.CodeurlCode = null;
								session.message = "Sistema iniciado e disponivel para uso";
								//
								attempts = 1;
								//
								let phone = await client?.user?.id.split(":")[0];
								await updateStateDb(session.state, session.status, session.AuthorizationToken);
								webhooks?.wh_connect(Sessions.getSession(SessionName), 'CONNECTED', phone);
								//
								logger?.info("- Sessão criada com sucesso");
								logger?.info(`- Telefone conectado: ${phone?.split("@")[0]}`);
								//
								socket.emit('status',
									{
										SessionName: SessionName,
										status: session.status
									}
								);
								//
								if (phone) {
									await updateUserConDb(phone, session.AuthorizationToken);
								}
								//
								attempts = 1;
								//
								await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `app-*.json`);
								await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `pre-*.json`);
								await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `sender-*.json`);
								await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `session-*.json`);
								//
							} else if (connection === 'close') {
								//
								let resDisconnectReason = {
									loggedOut: 401,
									timedOut: 408,
									connectionLost: 408,
									multideviceMismatch: 411,
									connectionClosed: 428,
									connectionReplaced: 440,
									badSession: 500,
									restartRequired: 515,
								};
								//
								const statusCode = lastDisconnect.error ? lastDisconnect.error?.output?.statusCode : 0;
								switch (statusCode) {
									case resDisconnectReason.loggedOut:
										// Device Logged Out, Deleting Session
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection loggedOut'.red);
										//
										// close WebSocket connection
										await client.ws.close();
										// remove all events
										await client.ev.removeAllListeners();
										//
										session.client = false;
										session.state = "DISCONNECTED";
										session.status = "notLogged";
										session.message = 'Dispositivo desconectado';
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										await updateStateDb(session.state, session.status, session.AuthorizationToken);
										//
										socket.emit('status',
											{
												SessionName: SessionName,
												status: session.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									case resDisconnectReason.timedOut:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection TimedOut'.yellow);
										//
										session.state = "CONNECTING";
										session.status = "desconnectedMobile";
										session.message = 'Dispositivo conectando';
										//
										await updateStateDb(session.state, session.status, session.AuthorizationToken);
										//
										socket.emit('status',
											{
												SessionName: SessionName,
												status: session.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									case resDisconnectReason.connectionLost:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection Los`.red);
										//
										/*
										//
										session.state = "CONNECTING";
										session.status = "desconnectedMobile";
										session.message = 'Dispositivo conectando';
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										*/
										//
										break;
									case resDisconnectReason.multideviceMismatch:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection multideviceMismatch'.blue);
										//
										break;
									case resDisconnectReason.connectionClosed:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection connectionClosed`.red);
										//
										/*
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										*/
										//
										break;
									case resDisconnectReason.connectionReplaced:
										//
										// Connection Replaced, Another New Session Opened, Please Close Current Session First
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection connectionReplaced`.yellow);
										//
										// close WebSocket connection
										await client.ws.close();
										// remove all events
										await client.ev.removeAllListeners();
										//
										session.client = false;
										session.state = "DISCONNECTED";
										session.status = "notLogged";
										session.message = 'Dispositivo desconectado';
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										await updateStateDb(session.state, session.status, session.AuthorizationToken);
										//
										socket.emit('status',
											{
												SessionName: SessionName,
												status: session.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									case resDisconnectReason.badSession:
										//
										// Bad session file, delete and run again
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection badSession`.red);
										//
										// close WebSocket connection
										await client.ws.close();
										// remove all events
										await client.ev.removeAllListeners();
										//
										session.client = false;
										session.state = "DISCONNECTED";
										session.status = "notLogged";
										session.message = 'Dispositivo desconectado';
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										await updateStateDb(session.state, session.status, session.AuthorizationToken);
										//
										socket.emit('status',
											{
												SessionName: SessionName,
												status: session.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									case resDisconnectReason.restartRequired:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection restartRequired');
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												session.client = result;
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									default:
									// code block
									logger?.info(`- lastDisconnect: ${lastDisconnect?.error}`);
								}
								//
							} else if (typeof connection === undefined) {
								//
								logger?.info(`- SessionName: ${SessionName}`);
								logger?.error(`- Connection undefined`.yellow);
								//
							}
							//
						}
						//
						// auto save dos dados da sessão
						// credentials updated -- save them
						if (events['creds.update']) {
							await saveCreds();
						}
						//
						eventsSend?.statusConnection(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.statusMessage(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.contactsEvents(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.messagesEvents(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.chatsEvents(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.blocklistEvents(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.groupsEvents(Sessions.getSession(SessionName), client, socket, events);
						eventsSend?.extraEvents(Sessions.getSession(SessionName), client, socket, events);
						//
					}
				);
				return client;
				//
			}
			//
			return await startSock(SessionName).then(async (result) => {
				session.client = result;
				return result;
			}).catch(async (erro) => {
				logger?.error(`- startSock ${erro}`);
			});
			//
		} catch (error) {
			logger?.info(`- SessionName: ${AuthorizationToken}`);
			session.state = "NOTFOUND";
			session.status = "notLogged";
			session.qrcode = null;
			session.message = 'Sistema desconectado';
			logger?.error(`- Instância não criada: ${error.message}`);
			//
			socket.emit('status',
				{
					status: session.status,
					SessionName: SessionName
				}
			);
			//
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
		logger?.info("- Resetando sessão");
		logger?.info(`- SessionName: ${SessionName}`);
		var session = Sessions.getSession(SessionName);
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
				await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
				await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
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
				logger?.error(`- Error when: ${error}`);
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
		logger?.info("- Fechando navegador");
		logger?.info(`- SessionName: ${SessionName}`);
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
			logger?.info("- Sessão fechada");
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
	static async logoutSession(SessionName) {
		//
		logger?.info("- Desconetando sessão");
		logger?.info(`- SessionName: ${SessionName}`);
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
			logger?.info("- Sessão desconetada");
			//
			webhooks?.wh_connect(Sessions.getSession(SessionName), 'DISCONNECTED', null);
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Sessão desconetada com sucesso"
			};
			//
			await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
			await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
			await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
			await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
			await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
			//
			await updateStateDb(session.state, session.status, session.AuthorizationToken);
			//
			return result;
			//
		} catch (error) {
			logger?.error(`- Error ao desconetar sessão: ${error}`);
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
		logger?.info("- Enviando contato.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info('Result: ', result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando audio.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info("Result: ", result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando audio.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info("Result: ", result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando menssagem de texto.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			{ text: msg }
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando localização.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info("Result: ", result); //return object success
			//return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
			//return (result);
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Localização enviada com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando link.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info("Result: ", result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando menssagem com imagem.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.sendMessage(
			number, {
			image: buffer,
			fileName: originalname,
			mimetype: mimetype,
			caption: caption
		}).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//return (result);
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando arquivo.");
		logger?.info(`- SessionName: ${SessionName}`);
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
					//logger?.info('Result: ', result); //return object success
					//return (result);
					//
					return {
						"erro": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					logger?.error('- Error when sending: ', erro);
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
					//logger?.info('Result: ', result); //return object success
					//return (result);
					//
					return {
						"erro": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"erro": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
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
		logger?.info("- Enviando arquivo.");
		logger?.info(`- SessionName: ${SessionName}`);
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
			//logger?.info('Result: ', result); //return object success
			//return (result);
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Arquivo envido com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro.output}`);
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
		logger?.info("- Enviando button.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			buttonMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando button.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			templateMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Enviando lista.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		// Send basic text
		return await session.client.sendMessage(
			number,
			listMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			var result = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			return result;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
	static async getStatus(
		SessionName,
		number
	) {
		logger?.info("- Validando numero");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.fetchStatus(number).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": true,
				"status": 200,
				"number": number,
				"message": "Status do número informado obtido com sucesso",
				"result": result
			};
			//
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"number": number,
				"message": "Erro ao verificar status do número informado"
			};
			//
		});
	}//getStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Recuperar contatos
	static async getAllContacts(
		SessionName
	) {
		logger?.info("- Obtendo todos os contatos!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		//
		try {
			var contactsList = [];
			//
			if (fs.existsSync(`${tokenPatch}/${SessionName}.contacts.json`)) {
				//let result = require(`${tokenPatch}/${SessionName}.contacts.json`);
				let result = JSON.parse(fs.readFileSync(`${tokenPatch}/${SessionName}.contacts.json`, 'utf-8'));
				//let result = fs.readFileSync(`${tokenPatch}/${SessionName}.contacts.json`, 'utf-8');
				//
				const resContacts = Object.values(result);
				//
				resContacts.forEach((contact) => {
					//
					if (contact?.id.includes('s.whatsapp.net') || contact?.id?.split("@")[1] == 's.whatsapp.net') {
						contactsList.push({
							"user": contact?.id?.split("@")[0],
							"name": contact?.name || null,
							"notify": contact?.notify || null
						});
					}
					//
				});
				//
				//
				if (!contactsList.length) {
					//
					let returnResult = {
						"erro": true,
						"status": 400,
						"message": "Nenhum contato recuperado"
					};
					//
					return returnResult;
					//
				}
			} else if (fs.existsSync(`${tokenPatch}/${SessionName}.store.json`)) {
				let result = require(`${tokenPatch}/${SessionName}.store.json`);
				//
				const resContacts = Object.values(result.contacts);
				//
				resContacts.forEach((contact) => {
					//
					if (contact?.id.includes('s.whatsapp.net') || contact?.id?.split("@")[1] == 's.whatsapp.net') {
						contactsList.push({
							"user": contact?.id?.split("@")[0],
							"name": contact?.name || null,
							"notify": contact?.notify || null
						});
					}
					//
				});
				//
				if (!contactsList.length) {
					//
					let returnResult = {
						"erro": true,
						"status": 400,
						"message": "Nenhum contato recuperado"
					};
					//
					return returnResult;
					//
				}
			} else {
				//
				let returnResult = {
					"erro": true,
					"status": 400,
					"message": "Nenhum contato recuperado"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"getAllContacts": contactsList
			};
			//
			return returnResult;
			//
		} catch (erro) {
			logger?.error(`- Error when: ${erro}`);
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
	// Recuperar chats
	static async getAllChats(
		SessionName
	) {
		logger?.info("- Obtendo todos os chats!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		//
		try {
			var allchat = [];
			//
			if (fs.existsSync(`${tokenPatch}/${SessionName}.store.json`)) {
				//let result = require(`${tokenPatch}/${SessionName}.store.json`);
				let result = JSON.parse(fs.readFileSync(`${tokenPatch}/${SessionName}.store.json`, 'utf-8'));
				//
				//
				const resChats = Object.values(result.chats);
				//
				/*
				for (let chat of resChats) {
					//
					if (chat?.id.includes('s.whatsapp.net') || chat?.id?.split("@")[1] == 's.whatsapp.net') {
						allchat.push({
							"user": chat?.id?.split("@")[0],
							"name": chat?.notify,
							"notify": chat?.notify
						});
					}
					//
				}
				*/
				//
				allchat.push({ "chats": result.chats });
				//
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
				"getAllChats": allchat
			};
			//
			return returnResult;
			//
		} catch (erro) {
			logger?.error(`- Error when: ${erro}`);
			//
			let returnResult = {
				"erro": true,
				"status": 404,
				"message": "Erro ao recuperar chats"
			};
			//
			return returnResult;
			//
		};
		//
	} //getAllChats
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Recuperar mensagem
	static async getAllMessage(
		SessionName
	) {
		logger?.info("- Obtendo todas as mensagens!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		//
		try {
			var allmessages = [];
			//
			if (fs.existsSync(`${tokenPatch}/${SessionName}.store.json`)) {
				//let result = require(`${tokenPatch}/${SessionName}.store.json`);
				let result = JSON.parse(fs.readFileSync(`${tokenPatch}/${SessionName}.store.json`, 'utf-8'));
				//
				const resMessages = Object.values(result.messages);
				//
				/*
				for (let chat of resChats) {
					//
					if (chat?.id.includes('s.whatsapp.net') || chat?.id?.split("@")[1] == 's.whatsapp.net') {
						allmessages.push({
							"user": chat?.id?.split("@")[0],
							"name": chat?.notify,
							"notify": chat?.notify
						});
					}
					//
				}
				*/
				//
				allmessages.push({ "messages": result.messages });
				//
			} else {
				//
				let returnResult = {
					"erro": true,
					"status": 400,
					"message": "Erro ao recuperar mensagens"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"erro": false,
				"status": 200,
				"getAllMessage": allmessages
			};
			//
			return returnResult;
			//
		} catch (erro) {
			logger?.error(`- Error when: ${erro}`);
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
	} //getAllMessage
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Recuperar grupos
	static async getAllGroups(
		SessionName
	) {
		logger?.info("- Obtendo todos os grupos!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupFetchAllParticipating().then(async (result) => {
			//logger?.info('Result:\n', result); //return object success
			//
			var getAllGroups = [];
			//
			//const resGroup = JSON.stringify(result, null, 2);
			//logger?.info(JSON.stringify(result));
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
			logger?.info('Error when sending: ', erro);
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
		logger?.info("- Validando numero");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.onWhatsApp(number).then(([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.exists == true) {
				//
				return {
					"erro": false,
					"status": 200,
					"number": result?.jid,
					"message": "O número informado pode receber mensagens via whatsapp"
				};
				//
			} else {
				//
				return {
					"erro": false,
					"status": 400,
					"number": number,
					"message": "O número informado não pode receber mensagens via whatsapp"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Obtendo a foto do perfil do servidor!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.profilePictureUrl(number, 'image').then(async (result) => {
			//logger?.info('Result: ', result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Deixando o grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupLeave(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Grupo deixado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Criando grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupCreate(title, contactlistValid).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
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
					"status": 400,
					"groupId": null,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao criar grupo"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Atualizando titulo do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupUpdateSubject(groupId, title).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Titulo do grupo atualizado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Atualizando descrição do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupUpdateDescription(groupId, desc).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Descrição do grupo atualizado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Obtendo membros do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupMetadata(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Gerar link de convite do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupInviteCode(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"inviteCode": result,
				"inviteUrl": 'https://chat.whatsapp.com/' + result,
				"message": "Link de convite obtido com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Gerar link de convite do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupRevokeInvite(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"inviteCode": result,
				"inviteUrl": 'https://chat.whatsapp.com/' + result,
				"message": "Link de convite obtido com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Removendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"remove"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
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
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao remover participante(s) da lista valida"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Adicionando participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"add"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
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
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao adicionar participante(s) da lista valida"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Promovendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"promote"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
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
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao promover participante(s) da lista valida"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Promovendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"demote"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
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
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao depromote participante(s) da lista valida"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
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
		logger?.info("- Obtendo status do grupo via link de convite");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupGetInviteInfo(inviteCode).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			return {
				"erro": false,
				"status": 200,
				"infoInvite": result,
				"message": "Informação do link de convite"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Join grupo via link de convite");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.groupAcceptInvite(inviteCode).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			return {
				"erro": false,
				"status": 200,
				"message": "Join grupo com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Obtendo status do perfil");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.fetchStatus(number).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
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
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Mudando o estatus");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.updateProfileStatus(ProfileStatus).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Profile status alterado com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
		logger?.info("- Mudando profile name");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		return await session.client.updateProfileName(ProfileName).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Profile name alterado com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
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
}