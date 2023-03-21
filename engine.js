'use strict';
// Configuração dos módulos
const fs = require('fs-extra');
const QRCode = require('qrcode');
const qrViewer = require('qrcode-terminal');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const pino = require("pino");
const colors = require('colors');
const { default: pQueue } = require('p-queue');
const { release } = require('os');
const NodeCache = require('node-cache');
const msgRetryCounterCache = new NodeCache();
const { logger } = require("./utils/logger");
const { Tokens } = require('./models');
const Sessions = require('./controllers/sessions.js');
const eventsSend = require('./controllers/events');
const webhooks = require('./controllers/webhooks.js');
const config = require('./config.global');
//
// ------------------------------------------------------------------------------------------------------- //
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
// ------------------------------------------------------------------------------------------------------- //
//
if (!fs.existsSync(tokenPatch)) { // verifica se o diretório já existe
	fs.mkdirSync(tokenPatch, { recursive: true }); // cria o diretório recursivamente
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function saudacao() {
	//
	let data = new Date();
	let hr = data.getHours();
	let saudacao;
	//
	if (hr >= 6 && hr < 12) {
		saudacao = "- Bom dia";
		//
	} else if (hr >= 12 && hr < 18) {
		saudacao = "- Boa tarde";
		//
	} else if (hr >= 18 && hr < 23) {
		saudacao = "- Boa noite";
		//
	} else {
		saudacao = "- Boa madrugada";
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
async function updateUserConDb(userconnected, AuthorizationToken) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando User Connected');
		//
		await Tokens.update({
			userconnected: userconnected,
			lastactivity: date_now,
		},
			{
				where: {
					token: AuthorizationToken
				},
			}).then(async (entries) => {
				logger?.info('- User connection atualizado');
			}).catch(async (err) => {
				logger?.error('- User connection não atualizado');
				logger?.error(`- Error: ${err}`);
			}).finally(() => {
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
async function resContacts(SessionName, contacts) {
	//
	//logger?.info(`- SessionName: ${SessionName}`);
	try {
		fs.writeJson(`${tokenPatch}/${SessionName}.contacts.json`, `${JSON.stringify(contacts, null, 2)}`, (err) => {
			if (err) {
				logger?.error(`- Erro: ${err}`);
			} else {
				//logger?.info('- Success create contacts file');
			}
		});
	} catch (error) {
		logger?.error(`- Error create contacts file: ${error}`);
	}
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Instace {
	static async Start(req, res, next) {
		let SessionName = req.body.SessionName;
		let data = await Sessions?.getSession(SessionName);

		if (data) {
			this.initSession(req, res, next);
		} else {
			if (data == false) {
				await Sessions?.checkAddUser(SessionName);
				//
				let newSession = {
					AuthorizationToken: req.headers['AuthorizationToken'],
					waqueue: null,
					qrcode: null,
					client: null,
					tokenPatch: tokenPatch,
					wh_status: req.body.wh_status,
					wh_message: req.body.wh_message,
					wh_qrcode: req.body.wh_qrcode,
					wh_connect: req.body.wh_connect,
					state: 'STARTING',
					status: "notLogged"
				}
				//
				await Sessions?.addInfoSession(SessionName, newSession);
				this.initSession(req, res, next);
			}
		}
	}
	//
	static async initSession(req, res, next) {
		//
		logger?.info(saudacao());
		logger?.info("- Iniciando sessão");
		let SessionName = req.body.SessionName;
		let data = await Sessions?.getSession(SessionName);
		let waqueue = new pQueue({ concurrency: parseInt(config.CONCURRENCY) });
		await Sessions?.addInfoSession(SessionName, {
			waqueue: waqueue
		});
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
			//
			store?.writeToFile(`${tokenPatch}/${SessionName}.store.json`);
			//
			await resContacts(SessionName, store?.contacts);
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
					connectTimeoutMs: 60000,
					/** Default timeout for queries, undefined for no timeout */
					defaultQueryTimeoutMs: undefined,
					/** ping-pong interval for WS connection */
					keepAliveIntervalMs: 5000,
					/** proxy agent */
					agent: undefined,
					/** pino logger */
					logger: pino({ level: 'error' }),
					/** version to connect with */
					version: version || undefined,
					/** override browser config */
					browser: [`${config.DEVICE_NAME}`, 'Chrome', release()],
					/** agent used for fetch requests -- uploading/downloading media */
					fetchAgent: undefined,
					/** should the QR be printed in the terminal */
					printQRInTerminal: false,
					/** should events be emitted for actions done by this socket connection */
					emitOwnEvents: false,
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
					msgRetryCounterCache: msgRetryCounterCache,
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
								webhooks?.wh_qrcode(await Sessions?.getSession(SessionName), readQRCode, qr);
								this.exportQR(socket, readQRCode, SessionName, attempts);
								//
								if (parseInt(config.VIEW_QRCODE_TERMINAL)) {
									qrViewer.generate(qr, { small: true });
								}
								//
								let addJson = {
									CodeurlCode: qr,
									qrcode: readQRCode,
									message: "Sistema aguardando leitura do QR-Code",
									state: "QRCODE",
									status: "qrRead"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
								//
								if (attempts >= 5) {
									//
									try {
										// close WebSocket connection
										await client.ws.close();
									} catch (erro) {
										logger?.error(`- Error close: ${erro}`);
									}
									//
									try {
										// End WebSocket connection
										//await client.ws.end();
									} catch (erro) {
										logger?.error(`- Error end: ${erro}`);
									}
									//
									try {
										// remove all events
										await client.ev.removeAllListeners();
									} catch (erro) {
										logger?.error(`- Error removeAllListeners: ${erro}`);
									}
									//
									attempts = 1;
									//
									let addJson = {
										client: false,
										message: "Sistema desconectado",
										state: "CLOSED",
										status: "notLogged"
									};
									//
									await Sessions?.addInfoSession(SessionName, addJson);
									//
									await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
									await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
									//
									req.io.emit('status',
										{
											SessionName: SessionName,
											status: addJson?.status
										}
									);
									//
									logger?.info("- Navegador fechado automaticamente");
									//
									//await updateStateDb(session.state, session.status, session.AuthorizationToken);
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
								let addJson = {
									message: "Dispositivo conectando",
									state: "CONNECTING",
									status: "notLogged"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								req.io.emit('status',
									{
										SessionName: SessionName,
										status: addJson?.status
									}
								);
								//
							} else if (connection === 'open') {
								//
								logger?.info('- Connected to WhatsApp'.green);
								logger?.info(`- Connection status: ${connection}`.green);
								//
								let addJson = {};
								//
								// Wait 5 seg for linked qr process to whatsapp
								await delay(5);
								logger?.info(`- Started using WA v${version.join('.')}, isLatest: ${isLatest}`.green);
								//
								let phone = await client?.user?.id.split(":")[0];
								//
								attempts = 1;
								//
								logger?.info("- Sessão criada com sucesso");
								logger?.info(`- Telefone conectado: ${phone?.split("@")[0]}`);
								//
								addJson = {
									client: client,
									qrcode: null,
									CodeurlCode: null,
									phone: phone,
									message: "Sistema iniciado e disponivel para uso",
									state: "CONNECTED",
									status: "inChat"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								req.io.emit('status',
									{
										SessionName: SessionName,
										status: addJson?.status
									}
								);
								//
								await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
								webhooks?.wh_connect(await Sessions?.getSession(SessionName), addJson?.state, phone);
								//
								if (phone) {
									await updateUserConDb(phone, addJson?.AuthorizationToken);
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
								let addJson = {};
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
										try {
											// close WebSocket connection
											await client.ws.close();
										} catch (erro) {
											logger?.error(`- Error close: ${erro}`);
										}
										//
										try {
											// End WebSocket connection
											//await client.ws.end();
										} catch (erro) {
											logger?.error(`- Error end: ${erro}`);
										}
										//
										try {
											// remove all events
											await client.ev.removeAllListeners();
										} catch (erro) {
											logger?.error(`- Error removeAllListeners: ${erro}`);
										}
										//
										//await Sessions?.deleteSession(SessionName);
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										addJson = {
											client: false,
											message: "Sistema desconectado",
											state: "CLOSED",
											status: "notLogged"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
										//
										req.io.emit('status',
											{
												SessionName: SessionName,
												status: addJson?.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
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
										addJson = {
											message: "Dispositivo conectando",
											state: "CONNECTING",
											status: "desconnectedMobile"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
										//
										req.io.emit('status',
											{
												SessionName: SessionName,
												status: addJson?.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
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
										addJson = {
											message: "Dispositivo conectando",
											state: "CONNECTING",
											status: "desconnectedMobile"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
																//
											let addJson = {
												client: result
											};
											//
											await Sessions?.addInfoSession(SessionName, addJson);
											//
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
										addJson = {
											client: false,
											message: "Sistema desconectado",
											state: "CLOSED",
											status: "notLogged"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
										//
										break;
									case resDisconnectReason.connectionReplaced:
										//
										// Connection Replaced, Another New Session Opened, Please Close Current Session First
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection connectionReplaced`.yellow);
										//
										try {
											// close WebSocket connection
											await client.ws.close();
										} catch (erro) {
											logger?.error(`- Error close: ${erro}`);
										}
										//
										try {
											// End WebSocket connection
											//await client.ws.end();
										} catch (erro) {
											logger?.error(`- Error end: ${erro}`);
										}
										//
										try {
											// remove all events
											await client.ev.removeAllListeners();
										} catch (erro) {
											logger?.error(`- Error removeAllListeners: ${erro}`);
										}
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										addJson = {
											client: false,
											message: "Dispositivo desconectado",
											state: "DISCONNECTED",
											status: "notLogged"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
										//
										req.io.emit('status',
											{
												SessionName: SessionName,
												status: addJson?.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
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
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.contacts.json`);
										//
										addJson = {
											client: false,
											message: "Dispositivo desconectado",
											state: "DISCONNECTED",
											status: "notLogged"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, data?.AuthorizationToken);
										//
										req.io.emit('status',
											{
												SessionName: SessionName,
												status: session.status
											}
										);
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
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
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
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
										//
										setTimeout(async function () {
											return await startSock(SessionName).then(async (result) => {
												//
												let addJson = {
													client: result
												};
												//
												await Sessions?.addInfoSession(SessionName, addJson);
												//
												return result;
											}).catch(async (erro) => {
												logger?.error(`- Error reconnecting connection: ${erro}`);
											});
										}, 500);
									//
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
						eventsSend?.statusConnection(data, client, socket, events);
						eventsSend?.statusMessage(data, client, socket, events);
						eventsSend?.contactsEvents(data, client, socket, events);
						eventsSend?.messagesEvents(data, client, socket, events);
						eventsSend?.chatsEvents(data, client, socket, events);
						eventsSend?.blocklistEvents(data, client, socket, events);
						eventsSend?.groupsEvents(data, client, socket, events);
						eventsSend?.extraEvents(data, client, socket, events);
						//
					}
				);
				return client;
				//
			}
			//
			return await startSock(SessionName).then(async (result) => {
				//
				let addJson = {
					client: result
				};
				//
				await Sessions?.addInfoSession(SessionName, addJson);
				//
				return result;
			}).catch(async (erro) => {
				logger?.error(`- startSock ${erro}`);
			});
			//
		} catch (error) {
			logger?.info(`- SessionName: ${AuthorizationToken}`);
			logger?.error(`- Instância não criada: ${error.message}`);
			//
			let addJson = {
				client: false,
				qrcode: null,
				message: "Sistema desconectado",
				state: "NOTFOUND",
				status: "notLogged"
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			req.io.emit('status',
				{
					SessionName: SessionName,
					status: addJson?.status
				}
			);
			//
		}
		//
	}
	//
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