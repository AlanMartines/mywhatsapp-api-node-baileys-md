'use strict';
// Configuração dos módulos
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const QRCode = require('qrcode');
const qrViewer = require('qrcode-terminal');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const pino = require("pino");
const rmfr = require('rmfr');
const colors = require('colors');
const { default: pQueue } = require('p-queue');
const { release } = require('os');
const NodeCache = require('node-cache');
const { logger } = require("./utils/logger");
const { Sessionwa } = require('./models');
const Sessions = require('./controllers/sessions');
const eventsSend = require('./controllers/events');
const webhooks = require('./controllers/webhooks');
const fnSocket = require('./controllers/fnSockets');
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
	loadMessages,
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
	MessageRetryMap,
	getAggregateVotesInPollMessage,
	WAMessageContent,
	WAMessageKey
} = require('@whiskeysockets/baileys');
//
const tokenPatch = parseInt(config.INDOCKER) ? path.join(config.PATCH_TOKENS, os.hostname()) : config.PATCH_TOKENS;
//
// ------------------------------------------------------------------------------------------------------- //
//
if (!fs.existsSync(tokenPatch)) { // verifica se o diretório já existe
	fs.mkdirSync(tokenPatch, { recursive: true }); // cria o diretório recursivamente
}
//
// ------------------------------------------------------------------------------------------------//
//
async function saudacao() {
	//
	let data = new Date();
	let hr = data.getHours();
	let saudacao;
	//
	if (hr >= 6 && hr < 12) {
		saudacao = `- Bom dia`;
		//
	} else if (hr >= 12 && hr < 18) {
		saudacao = `- Boa tarde`;
		//
	} else if (hr >= 18 && hr < 23) {
		saudacao = `- Boa noite`;
		//
	} else {
		saudacao = `- Boa madrugada`;
		//
	}
	logger?.info(`${saudacao}`);
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function addUserConDb(AuthorizationToken, SessionName, wh_status, wh_message, wh_qrcode, wh_connect) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	//logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando User Connected');
		//
		await Sessionwa.findOrCreate({
			where: {//object containing fields to found
				authorizationtoken: AuthorizationToken,
				sessionname: SessionName
			},
			defaults: {//object containing fields and values to apply
				authorizationtoken: AuthorizationToken,
				sessionname: SessionName,
				wh_status: wh_status,
				wh_message: wh_message,
				wh_qrcode: wh_qrcode,
				wh_connect: wh_connect
			},
		}).then(async (entries) => {
			logger?.info('- User connection adicionado');
		}).catch(async (err) => {
			logger?.error('- User connection não adicionado');
			logger?.error(`- Error: ${err}`);
		}).finally(() => {
			//Sessionwa.release();
		});
		//
	}
	//
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateUserConDb(userconnected, profilepicture, AuthorizationToken, SessionName) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	//logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando User Connected');
		//
		await Sessionwa.update({
			userconnected: userconnected,
			profilepicture: profilepicture,
		},
			{
				where: {
					authorizationtoken: AuthorizationToken,
					sessionname: SessionName
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
async function updateStateDb(state, status, AuthorizationToken, SessionName) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	//logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando status');
		//
		await Sessionwa.update({
			state: state,
			status: status
		},
			{
				where: {
					authorizationtoken: AuthorizationToken,
					sessionname: SessionName
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
async function updateWebhookDb(wh_status, wh_message, wh_qrcode, wh_connect, AuthorizationToken, SessionName) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	//logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando status');
		//
		await Sessionwa.update({
			wh_status: wh_status,
			wh_message: wh_message,
			wh_qrcode: wh_qrcode,
			wh_connect: wh_connect
		},
			{
				where: {
					authorizationtoken: AuthorizationToken,
					sessionname: SessionName
				},
			}).then(async (entries) => {
				logger?.info('- Webhook atualizado');
			}).catch(async (err) => {
				logger?.error('- Webhook não atualizado');
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
async function resContacts(SessionName, contacts) {
	//
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
		//
		const theTokenAuth = req?.headers?.authorizationtoken;
		const SessionName = req?.body?.SessionName;
		//
		try {
			//
			let startupRes = {
				"AuthorizationToken": theTokenAuth,
				"SessionName": SessionName,
				"setOnline": req?.body?.setOnline ? req?.body?.setOnline : true,
				"wh_status": req?.body?.wh_status ? req?.body?.wh_status : null,
				"wh_message": req?.body?.wh_message ? req?.body?.wh_message : null,
				"wh_qrcode": req?.body?.wh_qrcode ? req?.body?.wh_qrcode : null,
				"wh_connect": req?.body?.wh_connect ? req?.body?.wh_connect : null,
			};
			//
			await addUserConDb(theTokenAuth, SessionName, startupRes?.wh_status, startupRes?.wh_message, startupRes?.wh_qrcode, startupRes?.wh_connect);
			//
			fs.writeJson(`${tokenPatch}/${SessionName}.startup.json`, startupRes, (err) => {
				if (err) {
					logger?.error(`- Erro: ${err}`);
				} else {
					logger?.info('- Success startup config for user file');
				}
			});
		} catch (error) {
			logger?.error('- Error startup config for user file');
		}
		//
		let data = await Sessions?.getSession(SessionName);
		const funcoesSocket = new fnSocket(req.io);
		//
		funcoesSocket.start(SessionName, {
			AuthorizationToken: theTokenAuth,
			SessionName: SessionName,
			state: 'STARTING',
			status: "notLogged",
			message: 'Iniciando WhatsApp. Aguarde...',
		});
		//
		if (data) {
			await saudacao();
			logger?.info(`- Carregando sessão`);
			await this.initSession(req, res, next);
		} else {
			await saudacao();
			logger?.info(`- Iniciando sessão`);
			//
			let newSession = {
				funcoesSocket: funcoesSocket,
				tokenPatch: tokenPatch,
				wh_status: req?.body?.wh_status ? req?.body?.wh_status : null,
				wh_message: req?.body?.wh_message ? req?.body?.wh_message : null,
				wh_qrcode: req?.body?.wh_qrcode ? req?.body?.wh_qrcode : null,
				wh_connect: req?.body?.wh_connect ? req?.body?.wh_connect : null,
				state: 'STARTING',
				status: "notLogged"
			};

			await Sessions?.checkAddUser(SessionName);
			await Sessions?.addInfoSession(SessionName, newSession);
			await this.initSession(req, res, next);
			//
		}
	}
	//
	static async initSession(req, res, next) {
		//
		let theTokenAuth = req?.headers?.authorizationtoken;
		let SessionName = req?.body?.SessionName;
		let setOnline = req?.body?.setOnline;
		let dataSessions = await Sessions?.getSession(SessionName);
		logger?.info(`- SessionName: ${SessionName}`);
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
		const msgRetryCounterCache = new NodeCache();
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
					//waWebSocketUrl: config.WA_URL,
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
					markOnlineOnConnect: setOnline,
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
						//
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
				let addJson = {
					store: store
				};
				//
				await Sessions?.addInfoSession(SessionName, addJson);
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
								logger?.info(`- SessionName: ${SessionName}`);
								logger?.info('- Reading to WhatsApp'.blue);
								logger?.info(`- Connection status: ${connection}`.blue);
								//
								logger?.info('- QR Generated'.green);
								//
								logger?.info(`- Número de tentativas de ler o qr-code: ${attempts}`);
								//
								logger?.info("- Captura do QR-Code");
								//
								if (parseInt(config.VIEW_QRCODE_TERMINAL)) {
									qrViewer.generate(qr, { small: true });
								}
								//
								const readQRCode = await QRCode.toDataURL(qr);
								const base64Code = readQRCode.replace('data:image/png;base64,', '');
								//
								let addJson = {
									urlCode: qr,
									qrcode: readQRCode,
									message: "Sistema aguardando leitura do QR-Code",
									state: "QRCODE",
									status: "qrRead"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
								//
								webhooks?.wh_qrcode(SessionName);
								//this.exportQR(req.io, readQRCode, SessionName, attempts);
								//
								dataSessions?.funcoesSocket?.qrCode(SessionName, {
									SessionName: SessionName,
									state: addJson?.state,
									status: addJson?.status,
									data: readQRCode,
									attempts: attempts,
									message: 'QRCode Iniciado, Escanei por favor...'
								});
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
										state: "CLOSED",
										status: "notLogged",
										message: "Navegador fechado automaticamente"
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
									dataSessions?.funcoesSocket?.stateChange(SessionName, {
										SessionName: SessionName,
										state: addJson?.state,
										status: addJson?.status,
										message: addJson?.message,
									});
									//
									logger?.info("- Navegador fechado automaticamente");
									//
									await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
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
									state: "CONNECTING",
									status: "notLogged",
									message: "Dispositivo conectando"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								dataSessions?.funcoesSocket?.stateChange(SessionName, {
									SessionName: SessionName,
									state: addJson?.state,
									status: addJson?.status,
									message: addJson?.message,
								});
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
								const ppUrl = await client?.profilePictureUrl(`${phone}@s.whatsapp.net`, 'image').then(async (result) => {
									//
									return result;
									//
								}).catch(async (erro) => {
									logger?.error(`- Error profilePictureUrl in Full-Res image: ${erro?.message}`);
									//
									return await client?.profilePictureUrl(`${phone}@s.whatsapp.net`).then(async (result) => {
										//
										return result;
										//
									}).catch((erro) => {
										logger?.error(`- Error profilePictureUrl: ${erro?.message}`);
										//
										return 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png';
										//
									});
								});
								//
								attempts = 1;
								//
								logger?.info("- Sessão criada com sucesso");
								logger?.info(`- Telefone conectado: ${phone?.split("@")[0]}`);
								logger?.info(`- Profile Picture Url: ${ppUrl}`);
								//
								addJson = {
									client: client,
									qrcode: null,
									CodeurlCode: null,
									phone: phone,
									profilepicture: ppUrl,
									state: "CONNECTED",
									status: "inChat",
									message: "Sistema iniciado e disponivel para uso"
								};
								//
								await Sessions?.addInfoSession(SessionName, addJson);
								//
								dataSessions?.funcoesSocket?.stateChange(SessionName, {
									SessionName: SessionName,
									phone: addJson?.phone,
									profilepicture: addJson?.profilepicture,
									state: addJson?.state,
									status: addJson?.status,
									message: addJson?.message,
								});
								//
								await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
								//
								await updateWebhookDb(dataSessions?.wh_status, dataSessions?.wh_message, dataSessions?.wh_qrcode, dataSessions?.wh_connect, theTokenAuth, SessionName);
								webhooks?.wh_connect(SessionName);
								//
								if (phone) {
									await updateUserConDb(phone, addJson?.profilepicture, theTokenAuth, SessionName);
								}
								//
								attempts = 1;
								//
								if (parseInt(config.DELETE_FILE_UNUSED)) {
									await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `app-*.json`);
									await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `pre-*.json`);
									await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `sender-*.json`);
									await deletaToken(`${tokenPatch}/${SessionName}.data.json`, `session-*.json`);
								}
								//
							} else if (connection === 'close') {
								//
								let addJson = {};
								//
								let resDisconnectReason = {
									loggedOut: 401,
									bannedTimetamp: 402,
									bannedTemporary: 403,
									timedOut: 408,
									connectionLost: 408,
									multideviceMismatch: 411,
									connectionClosed: 428,
									connectionReplaced: 440,
									badSession: 500,
									restartRequired: 515,
								};
								// Banned status codes are 403 and 402 temporary
								// The status code 402 has a banned timetamp
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
											state: "CLOSED",
											status: "notLogged",
											message: "Sistema desconectado"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
										//
										break;
									case resDisconnectReason.bannedTemporary:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- User banned temporary`.red);
										//
										addJson = {
											client: false,
											state: "BANNED",
											status: "notLogged",
											message: "Sistema desconectado"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
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
									case resDisconnectReason.bannedTimetamp:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- User banned timestamp`.red);
										//
										addJson = {
											client: false,
											state: "BANNED",
											status: "notLogged",
											message: "Sistema desconectado"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
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
									case resDisconnectReason.timedOut:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection TimedOut'.yellow);
										//
										addJson = {
											state: "CONNECTING",
											status: "desconnectedMobile",
											message: "Dispositivo conectando"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
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
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
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
											state: "DISCONNECTED",
											status: "notLogged",
											message: "Dispositivo desconectado"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
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
											state: "DISCONNECTED",
											status: "notLogged",
											message: "Dispositivo desconectado"
										};
										//
										await Sessions?.addInfoSession(SessionName, addJson);
										//
										await updateStateDb(addJson?.state, addJson?.status, theTokenAuth, SessionName);
										//
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
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
						eventsSend?.statusConnection(theTokenAuth, SessionName, events);
						eventsSend?.statusMessage(theTokenAuth, SessionName, events);
						eventsSend?.contactsEvents(theTokenAuth, SessionName, events);
						eventsSend?.messagesEvents(theTokenAuth, SessionName, events);
						eventsSend?.chatsEvents(theTokenAuth, SessionName, events);
						eventsSend?.blocklistEvents(theTokenAuth, SessionName, events);
						eventsSend?.groupsEvents(theTokenAuth, SessionName, events);
						eventsSend?.extraEvents(theTokenAuth, SessionName, events);
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
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Instância não criada: ${error.message}`);
			//
			let addJson = {
				client: false,
				qrcode: null,
				state: "NOTFOUND",
				status: "notLogged",
				message: "Sistema desconectado"
			};
			//
			await Sessions?.addInfoSession(SessionName, addJson);
			//
			dataSessions?.funcoesSocket?.stateChange(SessionName, {
				SessionName: SessionName,
				state: addJson?.state,
				status: addJson?.status,
				message: addJson?.message,
			});
			//
		}
		//
	}
	//
	static async exportQR(socket, readQRCode, SessionName, attempts) {
		socket.emit('qrCode',
			{
				SessionName: SessionName,
				data: readQRCode,
				attempts: attempts,
				message: 'QRCode Iniciado, Escanei por favor...'
			}
		);
	};
}