//
const { downloadMediaMessage, getAggregateVotesInPollMessage, proto } = require('@whiskeysockets/baileys');
//
const webhooks = require('./webhooks');
const Sessions = require('./sessions');
const { logger } = require("../utils/logger");
const { Statistics } = require('../models');
const config = require('../config.global');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
//
// ------------------------------------------------------------------------------------------------------- //
//
const convertBytes = async function (bytes) {
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	if (bytes == 0) {
		return null;
	}
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	if (i == 0) {
		return bytes + " " + sizes[i];
	}
	return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}
//
// ------------------------------------------------------------------------------------------------------- //
//
function convertHMS(value) {
	const sec = parseInt(value, 10); // convert value to number if it's string
	let hours = Math.floor(sec / 3600); // get hours
	let minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
	let seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
	// add 0 if value < 10; Example: 2 => 02
	if (hours < 10) { hours = "0" + hours; }
	if (minutes < 10) { minutes = "0" + minutes; }
	if (seconds < 10) { seconds = "0" + seconds; }
	return hours + ':' + minutes + ':' + seconds; // Return is HH : MM : SS
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateStatisticsDb(status, type, isGroup, SessionName) {
	//
	const date_now = moment(new Date())?.format('YYYY-MM-DD HH:mm:ss');
	//logger?.info(`- Date: ${date_now}`);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		logger?.info('- Atualizando statistics');
		//
		await Statistics.create({
			sessionname: SessionName,
			status: status,
			type: type,
			isgroup: isGroup,
			lastactivity: date_now,
		}).then(async (entries) => {
			logger?.info('- Statistics atualizado');
		}).catch(async (err) => {
			logger?.error('- Statistics não atualizado');
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
async function getMessage(dataSessions, key) {
	if (dataSessions?.client) {
		const msg = await dataSessions?.client?.loadMessage(key.remoteJid, key.id);
		return msg?.message || undefined;
	}

	// apenas se o store estiver presente
	return proto.Message.fromObject({});
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Events {
	//
	static async statusConnection(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
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
		}
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async statusMessage(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (events['messages.update']) {
				const messages = events['messages.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages update`);
				//logger?.info(`${JSON.stringify(message, null, 2)}`);
				//
				/*
				for (const { key, update } of messages) {
					if (update.pollUpdates) {
						const pollCreation = await getMessage(dataSessions, key);
						if (pollCreation) {
							const pollMessage = await getAggregateVotesInPollMessage({
								message: pollCreation,
								pollUpdates: update.pollUpdates,
							})
							const [messageCtx] = m;

							let payload = {
								...messageCtx,
								body: pollMessage.find(poll => poll.voters.length > 0)?.name || '',
								from: key.remoteJid,
								voters: pollCreation,
								type: 'poll'
							};
							logger?.info(`${JSON.stringify(payload, null, 2)}`);
						}
					}
				}
				*/
				//
				// logic of your application...
				let phone = dataSessions?.client?.user?.id?.split(":")[0];
				let onAck = messages[0]?.update?.status;
				//logger?.info(`- onAck: ${onAck}`);
				let status;
				switch (onAck) {
					case 5:
						status = 'PLAYED'
						break;
					case 4:
						status = 'READ'
						break;
					case 3:
						status = 'RECEIVED'
						break;
					case 2:
						status = 'SEND'
						break;
					case 1:
						status = 'PENDING'
						break;
					case 0:
						status = 'ERROR'
						break;
				}
				logger?.info(`- Listen to ack ${onAck}, status ${status}`);
				let response = {
					"wook": 'MESSAGE_STATUS',
					"status": status,
					"id": messages[0]?.key?.id,
					"from": messages[0]?.key?.fromMe == true ? phone : messages[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"to": messages[0]?.key?.fromMe == false ? phone : messages[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"dateTime": moment(new Date())?.format('YYYY-MM-DD HH:mm:ss')
				}

				if(status){
					dataSessions?.funcoesSocket?.ack(SessionName, response);
					await webhooks?.wh_status(SessionName, response);
				}
				//
			}
		} catch (error) {
			logger?.error(`- SessionName: ${SessionName}`);
			logger?.error(`- Error messages update event ${error}`);
		}
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async contactsEvents(SessionName, events) {
		let dataSessions = await Sessions.getSession(SessionName);
		//
		try {
			if (events['contacts.set']) {
				const contacts = JSON.parse(events['contacts.set']);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Contacts set`);
				//logger?.info(`${JSON.stringify(contacts, null, 2)}`);
				//

				//
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error contacts set event ${error}`);
		}
		//
		try {
			if (events['contacts.upsert']) {
				//const contacts = JSON.parse(events['contacts.upsert']);
				const contacts = events['contacts.upsert'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Contacts upsert`);
				//logger?.info(`${JSON.stringify(contacts, null, 2)}`);
				//
				/*
				try {
					fs.writeJson(`${config.PATCH_TOKENS}/${SessionName}.contacts.json`, `${JSON.stringify(contacts, null, 2)}`, (err) => {
						if (err) {
							logger?.error(`- Erro: ${err}`);
						} else {
							logger?.info('- Success create contacts file');
						}
					});
				} catch (error) {
					logger?.error(`- Error create contacts file: ${error}`);
				}
				//
				*/
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error contacts upsert event ${error}`);
		}
		//
		try {
			if (events['contacts.update']) {
				const contacts = events['contacts.update'];
				for (const contact of contacts) {
					if (typeof contact.imgUrl !== 'undefined') {
						const newUrl = contact.imgUrl === null ? null : dataSessions?.client?.profilePictureUrl(contact.id).catch(() => null);
						//logger?.info(` - Contact ${contact.id} has a new profile pic: ${newUrl}`,);
					}
				}
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Contacts update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message-receipt update event ${error}`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async messagesEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (events['messages.upsert']) {
				//
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages upsert`);
				//
				const m = events['messages.upsert'];
				const msg = m?.messages[0];
				//
				//logger?.info(`- receiveMessage\n ${JSON.stringify(msg, null, 2)}`);
				//
				let type = null;
				let response = {};
				let phone = dataSessions?.client?.user?.id?.split(":")[0];
				//
				if (msg?.key?.remoteJid != 'status@broadcast') {
					//
					//if (m.type === 'notify' || m.type === 'append') { }
					//
					logger?.info(`- Message of type: ${m?.type}`);
					//
					if (msg?.message?.locationMessage) {
						type = 'location';
					} else if (msg?.message?.liveLocationMessage) {
						type = 'liveLocation';
					} else if (msg?.message?.imageMessage) {
						type = 'image';
					} else if (msg?.message?.documentMessage) {
						type = 'document';
					} else if (msg?.message?.documentWithCaptionMessage) {
						type = 'documentWithCaptionMessage';
					} else if (msg?.message?.audioMessage) {
						type = 'audio';
					} else if (msg?.message?.contactMessage) {
						type = 'vcard';
					} else if (msg?.message?.conversation) {
						type = 'text';
					} else if (msg?.message?.extendedTextMessage) {
						type = 'extended';
					} else if (msg?.message?.videoMessage) {
						type = 'video';
					} else if (msg?.message?.viewOnceMessageV2?.message?.videoMessage) {
						type = 'videoV2';
					} else if (msg?.message?.stickerMessage) {
						type = 'sticker';
					} else if (msg?.message?.viewOnceMessage?.message?.buttonsMessage) {
						type = 'button';
					} else if (msg?.message?.buttonsResponseMessage) {
						type = 'buttonsResponse';
					} else if (msg?.message?.templateMessage) {
						type = 'templateMessage';
					} else if (msg?.message?.templateButtonReplyMessage) {
						type = 'templateResponse';
					} else if (msg?.message?.viewOnceMessage?.message?.listMessage) {
						type = 'listMessage';
					} else if (msg?.message?.listResponseMessage) {
						type = 'listResponseMessage';
					} else if (msg?.message?.protocolMessage?.historySyncNotification) {
						type = 'historySync';
					} else if (msg?.message?.reactionMessage) {
						type = 'reactionMessage';
					} else if (msg?.message?.pollCreationMessage) {
						type = 'poll';
					} else if (msg?.message?.pollCreationMessageV2) {
						type = 'poll';
					} else if (msg?.message?.pollUpdateMessage) {
						type = 'pollVote';
					} else {
						type = undefined;
						//
						logger?.info(`- Desculpe, estamos sem nenhuma resposta no momento.`);
						logger?.error(msg?.message);
						//
					}
					//
					/*
					switch (m?.type) {
						case 'location':
							type = 'location';
							break;
						case 'liveLocation':
							type = 'liveLocation';
							break;
						case 'image':
							type = 'image';
							break;
						case 'document':
							type = 'document';
							break;
						case 'documentWithCaptionMessage':
							type = 'documentWithCaptionMessage';
							break;
						case 'audio':
							type = 'audio';
							break;
						case 'vcard':
							type = 'vcard';
							break;
						case 'text':
							type = 'text';
							break;
						case 'extended':
							type = 'extended';
							break;
						case 'video':
							type = 'video';
							break;
						case 'sticker':
							type = 'sticker';
							break;
						case 'button':
							type = 'button';
							break;
						case 'buttonsResponse':
							type = 'buttonsResponse';
							break;
						case 'templateMessage':
							type = 'templateMessage';
							break;
						case 'templateResponse':
							type = 'templateResponse';
							break;
						case 'listMessage':
							type = 'listMessage';
							break;
						case 'listResponseMessage':
							type = 'listResponseMessage';
							break;
						case 'historySync':
							type = 'historySync';
							break;
						case 'reactionMessage':
							type = 'reactionMessage';
							break;
						case 'poll':
							type = 'poll';
							break;
						default:
							type = undefined;
							//
							logger?.info(`- Desculpe, estamos sem nenhuma resposta no momento.`);
							logger?.error(msg?.message);
							//
							break;
					}
					*/
					//
					switch (type) {
						case 'text':
							logger?.info('- Message type: text');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'text',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"content": msg?.message?.conversation,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'image':
							logger?.info('- Message type: image');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'image',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.imageMessage?.caption ? msg?.message?.imageMessage?.caption : '',
								"mimetype": msg?.message?.imageMessage?.mimetype ? msg?.message?.imageMessage?.mimetype : null,
								"fileLength": msg?.message?.imageMessage?.fileLength ? await convertBytes(msg?.message?.imageMessage?.fileLength) : null,
								"base64": string64,
								"height": msg?.message?.imageMessage?.height ? msg?.message?.imageMessage?.height : null,
								"width": msg?.message?.imageMessage?.width ? msg?.message?.imageMessage?.width : null,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'sticker':
							logger?.info('- Message type: sticker');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'image',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.stickerMessage?.caption ? msg?.message?.stickerMessage?.caption : '',
								"mimetype": msg?.message?.stickerMessage?.mimetype ? msg?.message?.stickerMessage?.mimetype : null,
								"fileLength": msg?.message?.stickerMessage?.fileLength ? await convertBytes(msg?.message?.stickerMessage?.fileLength) : null,
								"isAnimated": msg?.message?.stickerMessage?.isAnimated,
								"base64": string64,
								"height": msg?.message?.stickerMessage?.height ? msg?.message?.stickerMessage?.height : null,
								"width": msg?.message?.stickerMessage?.width ? msg?.message?.stickerMessage?.width : null,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'audio':
							logger?.info('- Message type: audio');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'audio',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"mimetype": msg?.message?.audioMessage?.mimetype ? msg?.message?.audioMessage?.mimetype : null,
								"fileLength": msg?.message?.audioMessage?.fileLength ? await convertBytes(msg?.message?.audioMessage?.fileLength) : null,
								"time": convertHMS(msg?.message?.audioMessage?.seconds),
								"base64": string64,
								"ptt": msg?.message?.audioMessage?.ptt,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'video':
							logger?.info('- Message type: video');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'video',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.videoMessage?.caption ? msg?.message?.videoMessage?.caption : '',
								"mimetype": msg?.message?.videoMessage?.mimetype ? msg?.message?.videoMessage?.mimetype : null,
								"fileLength": msg?.message?.videoMessage?.fileLength ? await convertBytes(msg?.message?.videoMessage?.fileLength) : null,
								"base64": string64,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'videoV2':
							logger?.info('- Message type: video');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'video',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.viewOnceMessageV2?.message?.videoMessage?.caption ? msg?.message?.viewOnceMessageV2?.message?.videoMessage?.caption : '',
								"mimetype": msg?.message?.viewOnceMessageV2?.message?.videoMessage?.mimetype ? msg?.message?.viewOnceMessageV2?.message?.videoMessage?.mimetype : null,
								"fileLength": msg?.message?.viewOnceMessageV2?.message?.videoMessage?.fileLength ? await convertBytes(msg?.message?.viewOnceMessageV2?.message?.videoMessage?.fileLength) : null,
								"seconds": msg?.message?.viewOnceMessageV2?.message?.videoMessage?.seconds ? msg?.message?.viewOnceMessageV2?.message?.videoMessage?.seconds : 0,
								"base64": string64,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'location':
							logger?.info('- Message type: location');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'location',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"lat": msg?.message?.locationMessage?.degreesLatitude,
								"long": msg?.message?.locationMessage?.degreesLongitude,
								"url": "https://maps.google.com/maps?q=" + msg?.message?.locationMessage?.degreesLatitude + "," + msg?.message?.locationMessage?.degreesLongitude,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'liveLocation':
							logger?.info('- Message type: liveLocation');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'liveLocation',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"lat": msg?.message?.liveLocationMessage?.degreesLatitude,
								"long": msg?.message?.liveLocationMessage?.degreesLongitude,
								"caption": msg?.message?.liveLocationMessage?.caption,
								"url": "https://maps.google.com/maps?q=" + msg?.message?.liveLocationMessage?.degreesLatitude + "," + msg?.message?.liveLocationMessage?.degreesLongitude,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'document':
							logger?.info('- Message type: document');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'document',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.documentMessage?.caption ? msg?.message?.documentMessage?.caption : '',
								"fileName": msg?.message?.documentMessage?.fileName ? msg?.message?.documentMessage?.fileName : null,
								"mimetype": msg?.message?.documentMessage?.mimetype ? msg?.message?.documentMessage?.mimetype : null,
								"fileLength": msg?.message?.documentMessage?.fileLength ? await convertBytes(msg?.message?.documentMessage?.fileLength) : null,
								"base64": string64,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'documentWithCaptionMessage':
							logger?.info('- Message type: documentWithCaptionMessage');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'document',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ? msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.caption : '',
								"fileName": msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName ? msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName : null,
								"mimetype": msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype ? msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype : null,
								"fileLength": msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.fileLength ? await convertBytes(msg?.message?.documentWithCaptionMessage?.message?.documentMessage?.fileLength) : null,
								"base64": string64,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'vcard':
							logger?.info('- Message type: vcard');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'vcard',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"displayName": msg?.message?.contactMessage?.displayName,
								"vcard": msg?.message?.contactMessage?.vcard,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'button':
							logger?.info('- Message type: button');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'button',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"buttonsMessage": msg?.message?.viewOnceMessage?.message?.buttonsMessage,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'buttonsResponse':
							logger?.info('- Message type: buttonsResponse');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'buttonsResponse',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"selectedButtonId": msg?.message?.buttonsResponseMessage.selectedButtonId,
								"selectedDisplayText": msg?.message?.buttonsResponseMessage.selectedDisplayText,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'templateMessage':
							logger?.info('- Message type: templateMessage');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'templateMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"templateMessage": msg?.message?.templateMessage?.hydratedTemplate?.hydratedButtons,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'templateResponse':
							logger?.info('- Message type: templateResponse');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'templateResponse',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"selectedId": msg?.message?.templateButtonReplyMessage?.selectedId,
								"selectedDisplayText": msg?.message?.templateButtonReplyMessage?.selectedDisplayText,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'listMessage':
							logger?.info('- Message type: listMessage');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'listMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"listMessage": msg?.message?.viewOnceMessage?.message?.listMessage,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'listResponseMessage':
							logger?.info('- Message type: listResponseMessage');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'listResponseMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"listResponseMessage": msg?.message?.listResponseMessage,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'extended':
							logger?.info('- Message type: extended');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'extended',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"content": msg?.message?.extendedTextMessage?.text,
								"matchedText": msg?.message?.extendedTextMessage?.matchedText,
								"canonicalUrl": msg?.message?.extendedTextMessage?.canonicalUrl,
								"description": msg?.message?.extendedTextMessage?.description,
								"title": msg?.message?.extendedTextMessage?.title,
								"content": msg?.message?.extendedTextMessage?.text,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'historySync':
							logger?.info('- Message type: historySync');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'historySync',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'reactionMessage':
							logger?.info('- Message type: reactionMessage');
							//
							response = {
								"wook": msg?.message?.reactionMessage?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.message?.reactionMessage?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'reactionMessage',
								"fromMe": msg?.message?.reactionMessage?.key?.fromMe,
								"id": msg?.message?.reactionMessage?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.message?.reactionMessage?.key?.fromMe == true ? phone : msg?.message?.reactionMessage?.key?.remoteJid?.split('@')[0],
								"to": msg?.message?.reactionMessage?.key?.fromMe == false ? phone : msg?.message?.reactionMessage?.key?.remoteJid?.split('@')[0],
								"content": msg?.message?.reactionMessage?.text,
								"datetime": moment(msg?.message?.reactionMessage?.senderTimestampMs * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'poll':
							logger?.info('- Message type: poll');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"type": 'poll',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"poll": msg?.message?.pollCreationMessage,
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'pollVote':
							logger?.info('- Message type: pollVote');
							//
							logger?.info(msg);
							//
							break;
						default:
						//
						/*
						logger?.info(`- Desculpe, estamos sem nenhuma resposta.`);
						logger?.error(msg?.message);
						//
						response = {
							"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
							"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
							"type": 'undefined',
							"fromMe": msg?.key?.fromMe,
							"id": msg?.key?.id,
							"name": msg?.pushName || msg?.verifiedBizName || null,
							"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
							"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
							"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
							"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
						}
						*/
						//
					}
					//
					if (Object.keys(response).length !== 0) {
						//
						dataSessions?.funcoesSocket?.message(SessionName, response);
						await webhooks?.wh_messages(SessionName, response);
						await updateStatisticsDb(response?.status, response?.type, response?.isGroup, SessionName);
						//
					}
					//
				} else {
					//
					logger?.info(`- SessionName: ${SessionName}`);
					logger?.info(`- Message type: status@broadcast`);
					//
				}
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error messages upsert: ${error}`);
		}
		//
		try {
			if (events['messages.delete']) {
				const messagesdelete = events['messages.delete'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Message delete`);
				//logger?.info(`${JSON.stringify(messagesdelete, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message delete event ${error}`);
		}
		//
		try {
			if (events['messages.media-update']) {
				const messagesmedia = events['messages.media-update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Message-media update`);
				//logger?.info(`- Message-media update: ${JSON.stringify(messagesmedia, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message-media update event ${error}`);
		}
		//
		try {
			if (events['messages.reaction']) {
				const reaction = events['messages.reaction'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages reaction`);
				//logger?.info(`- Messages reaction: ${JSON.stringify(receipt, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error messages reaction event ${error}`);
		}
		//
		try {
			// history received
			if (events['message-receipt.update']) {
				const messagereceipt = events['message-receipt.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages receipt`);
				//logger?.info(`- Messages receipt: ${JSON.stringify(messagereceipt, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error messages receipt event ${error}`);
		}
		//
		try {
			// history received
			if (events['messaging-history.set']) {
				const { chats, contacts, messages, isLatest } = events['messaging-history.set'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messaging History recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error history received event ${error}`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async chatsEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['chats.upsert']) {
				const chatsUpsert = events['chats.upsert'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats upsert`);
				//logger?.info(`${JSON.stringify(chatsUpsert, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats upsert event ${error}`);
		}
		//
		try {
			if (events['chats.update']) {
				const chatsUpdate = events['chats.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats update`);
				//logger?.info(`${JSON.stringify(chatsUpdate, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats update event ${error}`);
		}
		//
		try {
			if (events['chats.delete']) {
				const chatsDelete = events['chats.delete'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats deleted`);
				//logger?.info(`${JSON.stringify(chatsDelete, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async blocklistEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['blocklist.set']) {
				const blocklistSet = events['blocklist.set'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Blocklist set`);
				//logger?.info(`${JSON.stringify(blocklistSet, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error blocklist set event ${error}`);
		}
		//
		try {
			if (events['blocklist.update']) {
				const blocklistUpdate = events['blocklist.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Blocklist update`);
				//logger?.info(`${JSON.stringify(blocklistUpdate, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async groupsEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['groups.upsert']) {
				const groupsUpsert = events['groups.upsert'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Groups upsert`);
				//logger?.info(`${JSON.stringify(groupsUpsert, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error groups upsert event ${error}`);
		}
		//
		try {
			if (events['groups.update']) {
				const groupsUpdate = events['groups.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Groups update`);
				//logger?.info(`${JSON.stringify(groupsUpdate, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error groups update event ${error}`);
		}
		//
		try {
			if (events['group-participants.update']) {
				const participantsUpdate = events['group-participants.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Group participants update`);
				//logger?.info(`${JSON.stringify(participantsUpdate, null, 2)}`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error group participants update event ${error}`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
	static async extraEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['presence.update']) {
				const presenceUpdate = events['presence.update'];
				//logger?.info(`- Presence update: ${JSON.stringify(presenceUpdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Presence update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error presence update event ${error}`);
		}
		//
		try {
			// Listen when client has been added to a group
			if (events?.call) {
				const eventsCall = events?.call[0];
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Call event`);
				//logger?.info(`- Call: ${JSON.stringify(eventsCall, null, 2)}`);
				//
				let response = {
					"wook": "INCOMING_CALL",
					"type": 'call',
					"id": eventsCall?.id,
					"phone": eventsCall?.from?.split('@')[0],
					"datetime": moment(eventsCall?.date)?.format('YYYY-MM-DD HH:mm:ss'),
					"offline": eventsCall?.offline,
					"status": eventsCall?.status,
					"isVideo": eventsCall?.isVideo,
					"isGroup": eventsCall?.isGroup,
					"participants": eventsCall?.participants
				};
				//
				dataSessions?.funcoesSocket?.eventCall(SessionName, response);
				await webhooks?.wh_incomingCall(SessionName, response);
				//
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error recv call event ${error}`);
		}
	}
	//
	// ------------------------------------------------------------------------------------------------------- //
	//
}