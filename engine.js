'use strict';
//
const QRCode = require('qrcode');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const pino = require("pino");
const { default: pQueue } = require('p-queue');
const { release } = require('os');
const { logger } = require("./utils/logger");
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
	AnyWASocket
} = require('@adiwajshing/baileys');
//
const tokenPatch = config.PATCH_TOKENS;
const config = require('./config.global');
//
// ------------------------------------------------------------------------------------------------------- //
//
const events = require('./controllers/events');
const webhooks = require('./controllers/webhooks.js');
const Sessions = require('./controllers/sessions.js');
const fnSocket = require('./controllers/fnSockets');
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Instace {

	static async Start(socket, SessionName, AuthorizationToken) {
		//
		logger.info("- Iniciando sessão");
		//
		const process = new pQueue({ concurrency: parseInt(config.CONCURRENCY) });
		const funcoesSocket = new fnSocket(socket);
		funcoesSocket.events(session, {
			message: 'Iniciando WhatsApp. Aguarde...',
			state: 'STARTING',
			session: SessionName
		})
		//
		const loggerWa = pino({
			level: 'silent'
		});
		//
		const useStore = !process.argv.includes('--no-store');
		const doReplies = !process.argv.includes('--no-reply');
		//
		// external map to store retry counts of messages when decryption/encryption fails
		// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
		const MessageRetryMap = {};
		//
		const store = useStore ? makeInMemoryStore({ loggerWa }) : undefined;
		//
		store?.readFromFile(`${tokenPatch}/${SessionName}.store.json`);
		// save every 10s
		setInterval(() => {
			store?.writeToFile(`${tokenPatch}/${SessionName}.store.json`);
		}, 10000);
		//
		const { state, saveCreds } = await useMultiFileAuthState(`${tokenPatch}/${SessionName}.data.json`);
		//
		try {
			//
			const startSock = async (SessionName = null) => {
				//
				// fetch latest version of WA Web
				const { version, isLatest } = await fetchLatestBaileysVersion();
				logger.info(`- Using WA v${version.join('.')}, isLatest: ${isLatest}`);
				//
				const SocketConfig = {
					/** the WS url to connect to WA */
					//waWebSocketUrl: undefined,
					/** Fails the connection if the socket times out in this interval */
					connectTimeoutMs: 30000,
					/** Default timeout for queries, undefined for no timeout */
					defaultQueryTimeoutMs: undefined,
					/** ping-pong interval for WS connection */
					keepAliveIntervalMs: 10000,
					/** proxy agent */
					agent: undefined,
					/** pino logger */
					logger: loggerWa,
					/** version to connect with */
					//version: undefined,
					/** override browser config */
					browser: [`${config.DEVICE_NAME}`, 'Chrome', release()],
					/** agent used for fetch requests -- uploading/downloading media */
					fetchAgent: undefined,
					/** By default true, should history messages be downloaded and processed */
					downloadHistory: true,
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
					qrTimeout: 10000,
					/** provide an auth state object to maintain the auth state */
					auth: state,
					/** manage history processing with this control; by default will sync up everything */
					//shouldSyncHistoryMessage: boolean,
					/** transaction capability options for SignalKeyStore */
					//transactionOpts: TransactionCapabilityOptions,
					/** provide a cache to store a user's device list */
					userDevicesCache: NodeCache,
					/** marks the client as online whenever the socket successfully connects */
					markOnlineOnConnect: true,
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
					//
					/** options for axios */
					//options: AxiosRequestConfig,
					/**
					 * fetch a message from your store
					 * implement this so that messages failed to send (solves the "this message can take a while" issue) can be retried
					 * */
					getMessage: undefined
					/*
					getMessage: async (key) => {
						if (store) {
							const msg = await store?.loadMessage(key?.remoteJid, key?.id)
							return msg?.message || undefined
						}
						//
						// only if store is present
						return {
							conversation: 'hello'
						}
					}
					*/
				}
				//
				const client = makeWASocket(
					//
					SocketConfig
					//
				);
				//
				store?.bind(client?.ev);
				//
				let relaunchSemaphore = 0;
				let relaunchError = 0;
				let attempts = 1;
				//
				// the process function lets you process all events that just occurred
				// efficiently in a batch
				client.ev.process(
					// events is a map for event name => event data
					async (events) => {
						if (events['connection.update']) {
							console.log('- AuthorizationToken:', session.AuthorizationToken);
							//
							const {
								connection,
								lastDisconnect,
								isNewLogin,
								qr,
								receivedPendingNotifications
							} = events['connection.update'];
							//
							logger.info("- Connection update");
							//
							//
							if (qr) {
								//
								logger.info('- QR Generated');
								//
								const readQRCode = await QRCode.toDataURL(qr);
								const base64Code = readQRCode.replace('data:image/png;base64,', '');
								//
								logger.info('- Número de tentativas de ler o qr-code:', attempts);
								//
								logger.info("- Captura do QR-Code");
								//
								webhooks?.wh_qrcode(Sessions.getSession(SessionName), readQRCode, qr);
								this.exportQR(socket, base64Code, SessionName, attempts);
								Sessions.addInfoSession(SessionName, {
										state: "QRCODE",
										status: "qrRead",
										codeurlcode: qr,
										qrcode: readQRCode,
										base64code: base64Code,
										message: "Sistema aguardando leitura do QR-Code",
								});
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
								Sessions.addInfoSession(session, {
										status: statusSession
								});
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
									if (lastDisconnect?.error?.output?.payload?.error == 'Forbidden') {
										//
										relaunchError++;
										//
										if (relaunchError >= 5) {
											// remove all events
											await client.ev.removeAllListeners();
											//
											session.client = false;
											session.state = "DISCONNECTED";
											session.status = "notLogged";
											session.message = 'Dispositivo desconectado';
											//
											await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
											await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
											//
											await updateStateDb(session.state, session.status, session.AuthorizationToken);
											//
											relaunchSemaphore = 0;
											//
											console?.log('- Restarting connection');
											console?.log('- SessionName:', SessionName);
											setTimeout(async function () {
												return await startSock(SessionName).then(async (result) => {
													session.client = result;
													return result;
												}).catch(async (erro) => {
													console?.log(erro);
												});
											}, 500);
											//
										}
									}
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

									//
								} else {
									//
									console.log('Connection closed. You are logged out.'.red)
									//
								}
								//
								attempts = 1;
								//
							} else if (typeof connection === undefined) {
								console.log("- Connection undefined".red);
							}
							//
						}
						//
						// auto save dos dados da sessão
						// credentials updated -- save them
						// credentials updated -- save them
						if (events['creds.update']) {
							await saveCreds();
						}
						//
						event?.receiveMessage(Sessions.getSession(SessionName), events, client, socket);
						event?.statusMessage(Sessions.getSession(SessionName), events, client, socket);
						event?.extraEvents(Sessions.getSession(SessionName), events, client, socket);
						//event?.statusConnection(Sessions.getSession(SessionName), client, socket);
						//event?.statusConnection(Sessions.getSession(SessionName), client, socket);
						//
					});
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
	}

	static async exportQR(socket, base64Code, SessionName, attempts) {
		socket.emit('qrCode',
			{
				data: base64Code,
				SessionName: SessionName,
				attempts: attempts,
				message: 'QRCode Iniciado, Escanei por favor...'
			}
		);
	};
}