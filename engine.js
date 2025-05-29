'use strict';
// Configuração dos módulos
const os = require('os');
const { Boom } = require("@hapi/boom");
const path = require('path');
const fs = require('fs-extra');
const QRCode = require('qrcode');
const qrViewer = require('qrcode-terminal');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const pino = require("pino");
const rmfr = require('rmfr');
const { default: pQueue } = require('p-queue');
const { release } = require('os');
const NodeCache = require('node-cache');
const { logger } = require("./utils/logger");
const Sessions = require('./controllers/sessions');
const eventsSend = require('./controllers/events');
const webhooks = require('./controllers/webhooks');
const fnSocket = require('./controllers/fnSockets');
const config = require('./config.global');
//
// ------------------------------------------------------------------------------------------------------- //
//
const {
	makeWASocket,
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
	WAMessageKey,
	PHONENUMBER_MCC,
	BinaryInfo,
	downloadAndProcessHistorySyncNotification,
	encodeWAM,
	getHistoryMsg,
	isJidNewsletter,
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
	var data = new Date();
	var hr = data.getHours();
	var saudacao = '';
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
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	var string = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
	return string;
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
		const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
		const SessionName = removeWithspace(req?.body?.SessionName);
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
				"wh_incomingcall": req?.body?.wh_incomingcall ? req?.body?.wh_incomingcall : null
			};
			//
			fs.writeJson(`${tokenPatch}/${SessionName}.startup.json`, startupRes, (err) => {
				if (err) {
					logger?.error(`- Erro: ${err}`);
				} else {
					logger?.info('- Configuração de inicialização bem-sucedida para o arquivo do usuário.');
				}
			});
		} catch (error) {
			logger?.error('- Erro na configuração de inicialização para o arquivo do usuário.');
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
				wh_incomingcall: req?.body?.wh_incomingcall ? req?.body?.wh_incomingcall : null,
				state: 'STARTING',
				status: "notLogged",
				message: 'Iniciando WhatsApp. Aguarde...',
			};

			await Sessions?.checkAddUser(SessionName);
			await Sessions?.addInfoSession(SessionName, newSession);
			await this.initSession(req, res, next);
			//
		}
		//
	}
	//
	static async initSession(req, res, next) {
		//
		const SessionName = removeWithspace(req?.body?.SessionName);
		const setOnline = req?.body?.setOnline;
		const dataSessions = await Sessions?.getSession(SessionName);
		const waqueue = new pQueue({ concurrency: parseInt(config.CONCURRENCY) });
		await Sessions?.addInfoSession(SessionName, {
			waqueue: waqueue
		});
		//
		logger?.info(`- SessionName: ${SessionName}`);
		//
		/*
			╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐┬    ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐  ╔═╗┌─┐┬─┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
			║ ║├─┘ │ ││ ││││├─┤│    ║  ├┬┘├┤ ├─┤ │ ├┤   ╠═╝├─┤├┬┘├─┤│││├┤  │ ├┤ ├┬┘└─┐
			╚═╝┴   ┴ ┴└─┘┘└┘┴ ┴┴─┘  ╚═╝┴└─└─┘┴ ┴ ┴ └─┘  ╩  ┴ ┴┴└─┴ ┴┴ ┴└─┘ ┴ └─┘┴└─└─┘
	 */
		//
		//const loggerPino = pino({ level: 'trace' });
		const loggerPino = pino();
		//const loggerPino = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, pino.destination('./wa-logs.txt'));
		loggerPino.level = 'silent';
		//
		const useStore = !process.argv.includes('--no-store');
		const doReplies = process.argv.includes('--do-reply');
		const usePairingCode = process.argv.includes('--use-pairing-code');
		const useMobile = process.argv.includes('--mobile');
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
			logger?.error(`- Erro ao ler o arquivo de armazenamento: ${error}`);
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
				const waVersion = config?.WA_VERSION ? config?.WA_VERSION : version;
				logger?.info(`- Using WA v${version.join('.')}, isLatest: ${isLatest}`)
				//
				const AxiosRequestConfig = {};
				//const browser = Browsers.appropriate('Desktop');
				//
				const configWA = {
					/** URL do WS para conectar ao WhatsApp */
					//waWebSocketUrl: config.WA_URL,
					/** Falha a conexão se o socket expirar neste intervalo */
					connectTimeoutMs: 60000,
					/** Tempo limite padrão para consultas, undefined para nenhum tempo limite */
					defaultQueryTimeoutMs: undefined,
					/** Intervalo de ping-pong para conexão WS */
					keepAliveIntervalMs: 5000,
					/** Agente de proxy */
					agent: undefined,
					/** Logger do tipo pino */
					logger: loggerPino,
					/** Versão para conectar */
					version: version,
					/** Configuração do navegador */
					browser: [`${config.DEVICE_NAME}`, 'Chrome', release()],
					/** Agente usado para solicitações de busca - carregamento/download de mídia */
					fetchAgent: undefined,
					/** Deve o QR ser impresso no terminal */
					printQRInTerminal: false,
					//
					mobile: useMobile,
					/** Deve eventos serem emitidos para ações realizadas por esta conexão de soquete */
					emitOwnEvents: true,
					/** Fornece um cache para armazenar mídia, para que não precise ser reenviada */
					//mediaCache: NodeCache,
					/** Hospedeiros personalizados de upload de mídia */
					//customUploadHosts: MediaConnInfo['hosts'],
					/** Tempo de espera entre o envio de novas solicitações de repetição */
					retryRequestDelayMs: 5000,
					/** Tempo de espera para a geração do próximo QR em ms */
					qrTimeout: 15000,
					/** Forneça um objeto de estado de autenticação para manter o estado de autenticação */
					//auth: state,
					auth: {
						creds: state.creds,
						// O armazenamento em cache torna o armazenamento mais rápido para enviar/receber mensagens
						keys: makeCacheableSignalKeyStore(state.keys, loggerPino),
					},
					/** Gerencia o processamento do histórico com este controle; por padrão, sincronizará tudo */
					//shouldSyncHistoryMessage: boolean,
					/** Opções de capacidade de transação para SignalKeyStore */
					//transactionOpts: TransactionCapabilityOptions,
					/** Fornece um cache para armazenar a lista de dispositivos do usuário */
					//userDevicesCache: NodeCache,
					/** Marca o cliente como online sempre que o soquete se conecta com sucesso */
					markOnlineOnConnect: setOnline,
					/**
					 * Mapa para armazenar as contagens de repetição para mensagens com falha;
					 * usado para determinar se uma mensagem deve ser retransmitida ou não */
					msgRetryCounterCache: msgRetryCounterCache,
					/** Largura para imagens de visualização de link */
					linkPreviewImageThumbnailWidth: 192,
					/** O Baileys deve solicitar ao telefone o histórico completo, que será recebido assincronamente */
					syncFullHistory: true,
					/** O Baileys deve disparar consultas de inicialização automaticamente, padrão: true */
					fireInitQueries: true,
					/**
					 * Gerar uma visualização de link de alta qualidade,
					 * implica fazer upload do jpegThumbnail para o WhatsApp
					 */
					generateHighQualityLinkPreview: true,
					/** Opções para o axios */
					//options: AxiosRequestConfig || undefined,
					// Ignorar todas as mensagens de transmissão -- para receber as mesmas
					// comente a linha abaixo
					shouldIgnoreJid: jid => isJidBroadcast(jid),
					/** Por padrão, verdadeiro, as mensagens de histórico devem ser baixadas e processadas */
					downloadHistory: true,
					/**
					 * Busque uma mensagem em sua loja
					 * implemente isso para que mensagens com falha no envio (resolve o problema "esta mensagem pode levar um tempo" possam ser reenviadas
					 */
					// implemente para lidar com repetições
					getMessage,
					// Para o botão de correção, mensagem de lista de modelos
					patchMessageBeforeSending,
				};
				//
				const client = makeWASocket(configWA);
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
				//
				client.ev.process(
					async (events) => {
						// something about the connection changed
						// maybe it closed, or we received all offline message or connection opened
						if (events['connection.update']) {
							const conn = events['connection.update'];
							//
							const { connection, lastDisconnect, isNewLogin, qr, receivedPendingNotifications } = conn;
							//
							const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
							const statusCodeError = lastDisconnect?.error ? lastDisconnect.error?.output?.statusCode : 0;
							//
							logger?.info(`- Connection update`);
							//
							/*
							logger?.info(`- Output: \n ${JSON.stringify(lastDisconnect?.error?.output, null, 2)}`);
							logger?.info(`- Data: \n ${JSON.stringify(lastDisconnect?.error?.data, null, 2)}`);
							logger?.info(`- loggedOut: \n ${JSON.stringify(DisconnectReason?.loggedOut, null, 2)}`);
							logger?.info(`- PendingNotifications: ${JSON.stringify(receivedPendingNotifications, null, 2)}`);
							*/
							//
							if (qr) {
								//
								logger?.info(`- SessionName: ${SessionName}`);
								logger?.info('- Reading to WhatsApp');
								logger?.info(`- Connection status: ${connection}`);
								logger.warn(`- lastDisconnect: ${lastDisconnect?.error}`);
								//
								logger?.info('- QR Generated');
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
									//await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
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
								}
								//
								attempts++;
								//
							}
							//
							if (connection === 'connecting') {
								//
								logger?.info('- Connecting to WhatsApp');
								logger?.info(`- Connection status: ${connection}`);
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
								logger?.info('- Connected to WhatsApp');
								logger?.info(`- Connection status: ${connection}`);
								//
								let addJson = {};
								//
								// Wait 5 seg for linked qr process to whatsapp
								await delay(5);
								logger?.info(`- Started using WA v${version.join('.')}, isLatest: ${isLatest}`);
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
								logger?.info(`- Sessão criada com sucesso`);
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
								webhooks?.wh_connect(SessionName);
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
								// Banned status codes are 403 and 402 temporary
								// The status code 402 has a banned timetamp
								switch (statusCode) {
									case DisconnectReason.loggedOut:
										// Device Logged Out, Deleting Session
										logger?.error(`- SessionName: ${SessionName}`);
										logger?.error(`- Close: ${statusCode}`);
										logger?.error(`- Connection loggedOut`);
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
										//await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
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
										dataSessions?.funcoesSocket?.stateChange(SessionName, {
											SessionName: SessionName,
											state: addJson?.state,
											status: addJson?.status,
											message: addJson?.message,
										});
										//
										break;
									case DisconnectReason.bannedTemporary:
										//
										logger?.warn(`- SessionName: ${SessionName}`);
										logger?.warn(`- Close: ${statusCode}`);
										logger?.warn(`- User banned temporary`);
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
									case DisconnectReason.bannedTimetamp:
										//
										logger?.warn(`- SessionName: ${SessionName}`);
										logger?.warn(`- User banned timestamp`);
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
									case DisconnectReason.timedOut:
										//
										logger?.warn(`- SessionName: ${SessionName}`);
										logger?.warn('- Connection TimedOut');
										//
										addJson = {
											state: "CONNECTING",
											status: "desconnectedMobile",
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
									case DisconnectReason.connectionLost:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info(`- Connection Los`);
										//
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
										//
										break;
									case DisconnectReason.multideviceMismatch:
										//
										logger?.warn(`- SessionName: ${SessionName}`);
										logger?.warn('- Connection multideviceMismatch');
										//
										break;
									case DisconnectReason.connectionClosed:
										//
										logger?.error(`- SessionName: ${SessionName}`);
										logger?.error(`- Connection connectionClosed`);
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
									case DisconnectReason.connectionReplaced:
										//
										// Connection Replaced, Another New Session Opened, Please Close Current Session First
										logger?.warn(`- SessionName: ${SessionName}`);
										logger?.warn(`- Connection connectionReplaced`);
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
										//await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
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
									case DisconnectReason.badSession:
										//
										// Bad session file, delete and run again
										logger?.error(`- SessionName: ${SessionName}`);
										logger?.error(`- Connection badSession`);
										//
										// close WebSocket connection
										await client.ws.close();
										// remove all events
										await client.ev.removeAllListeners();
										//
										await deletaPastaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.data.json`);
										await deletaToken(`${tokenPatch}`, `${SessionName}.store.json`);
										//await deletaToken(`${tokenPatch}`, `${SessionName}.startup.json`);
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
									case DisconnectReason.restartRequired:
										//
										logger?.info(`- SessionName: ${SessionName}`);
										logger?.info('- Connection restartRequired');
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
									default:
										// code block
										logger?.info(`- Engine lastDisconnect: ${lastDisconnect?.error}`);
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
								logger?.error(`- Connection undefined`);
								//
							}
							//
						}
						//
						// auto save dos dados da sessão
						// credentials updated -- save them
						if (events['creds.update']) {
							//
							await saveCreds();
							logger?.info(`- SessionName: ${SessionName}`);
							logger?.info(`- Creds update`);
							//
						}
						//
						eventsSend.statusConnection(SessionName, events);
						eventsSend.statusMessage(SessionName, events);
						eventsSend.contactsEvents(SessionName, events);
						eventsSend.messagesEvents(SessionName, events);
						eventsSend.chatsEvents(SessionName, events);
						eventsSend.labelsEvents(SessionName, events);
						eventsSend.blocklistEvents(SessionName, events);
						eventsSend.groupsEvents(SessionName, events);
						eventsSend.extraEvents(SessionName, events);
						//
					}
				);
				return client;
				//
				async function getMessage(key) {
					if (store) {
						const msg = await store.loadMessage(key.remoteJid, key.id);
						return msg?.message || undefined;
					}
					// only if store is present
					return proto.Message.fromObject({});
				}
				//
				function patchMessageBeforeSending(message) {
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
										deviceListMetadata: {}
									},
									...message
								}
							}
						};
					}
					return message;
				}
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