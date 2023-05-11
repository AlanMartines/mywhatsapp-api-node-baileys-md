//
const { downloadMediaMessage } = require('@adiwajshing/baileys');
//
const webhooks = require('./webhooks');
const Sessions = require('./sessions');
const { logger } = require("../utils/logger");
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
	static async statusMessage(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (events['messages.update']) {
				const message = events['messages.update'];
				logger?.info(`- SessionName: ${SessionName}`);
				//logger?.info(`- Messages update: ${JSON.stringify(message, null, 2)}`);
				// logic of your application...
				let phone = dataSessions?.client?.user?.id?.split(":")[0];
				let onAck = message[0]?.update?.status;
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
					"id": message[0]?.key?.id,
					"from": message[0]?.key?.fromMe == true ? phone : message[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"to": message[0]?.key?.fromMe == false ? phone : message[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"dateTime": moment(new Date())?.format('YYYY-MM-DD HH:mm:ss')
				}
				dataSessions?.funcoesSocket?.ack(SessionName, response);
				await webhooks?.wh_status(SessionName, response);
				//
			}
		} catch (error) {
			logger?.error(`- SessionName: ${SessionName}`);
			logger?.error(`- Error onAck ${error}`);
		}
	}
	//
	static async contactsEvents(SessionName, events) {
		let dataSessions = await Sessions.getSession(SessionName);
		//
		try {
			if (events['contacts.set']) {
				const contacts = JSON.parse(events['contacts.set']);
				//logger?.info(`- Contacts upsert: ${JSON.stringify(contacts, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Contacts set`);
				//

				//
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message-receipt update event ${error}`);
		}
		//
		try {
			if (events['contacts.upsert']) {
				const contacts = JSON.parse(events['contacts.upsert']);
				//logger?.info(`- Contacts upsert: ${JSON.stringify(contacts, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Contacts upsert`);
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
			logger?.error(`- Error message-receipt update event ${error}`);
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
	static async messagesEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		try {
			if (events['messages.upsert']) {
				const m = events['messages.upsert'];
				//
				const msg = m?.messages[0];
				//logger?.info(`- receiveMessage\n ${JSON.stringify(msg, null, 2)}`);
				//
				let type = null;
				let response = {};
				//
				if (msg?.key?.remoteJid != 'status@broadcast') {
					//
					//if (m.type === 'notify' || m.type === 'append') {
					logger?.info(`- Type: ${SessionName}`);
					//
					if (msg?.message?.locationMessage) {
						type = 'location';
					} else if (msg?.message?.liveLocationMessage) {
						type = 'liveLocation';
					} else if (msg?.message?.imageMessage) {
						type = 'image';
					} else if (msg?.message?.documentMessage) {
						type = 'document';
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
					} else {
						type = undefined;
						//
						logger?.info(`- Desculpe, estamos sem nenhuma resposta.`);
						logger?.error(msg?.message);
						//
					}
					//
					// }
					//
					logger?.info(`- Type message: ${type}`);
					let phone = dataSessions?.client?.user?.id?.split(":")[0];
					//
					switch (type) {
						case 'text':
							logger?.info('- Message text');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'text',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"content": msg?.message?.conversation,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'image':
							logger?.info('- Message image');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'image',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.imageMessage?.caption != undefined ? msg?.message?.imageMessage?.caption : null,
								"mimetype": msg?.message?.imageMessage?.mimetype != undefined ? msg?.message?.imageMessage?.mimetype : null,
								"fileLength": msg?.message?.imageMessage?.fileLength ? await convertBytes(msg?.message?.imageMessage?.fileLength) : null,
								"base64": string64,
								"height": msg?.message?.imageMessage?.height != undefined ? msg?.message?.imageMessage?.height : null,
								"width": msg?.message?.imageMessage?.width != undefined ? msg?.message?.imageMessage?.width : null,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'sticker':
							logger?.info('- Message sticker');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'image',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.stickerMessage?.caption != undefined ? msg?.message?.stickerMessage?.caption : null,
								"mimetype": msg?.message?.stickerMessage?.mimetype != undefined ? msg?.message?.stickerMessage?.mimetype : null,
								"isAnimated": msg?.message?.stickerMessage?.isAnimated,
								"base64": string64,
								"height": msg?.message?.stickerMessage?.height != undefined ? msg?.message?.stickerMessage?.height : null,
								"width": msg?.message?.stickerMessage?.width != undefined ? msg?.message?.stickerMessage?.width : null,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'audio':
							logger?.info('- Message audio');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'audio',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"mimetype": msg?.message?.audioMessage?.mimetype != undefined ? msg?.message?.audioMessage?.mimetype : null,
								"fileLength": await convertBytes(msg?.message?.audioMessage?.fileLength),
								"time": convertHMS(msg?.message?.audioMessage?.seconds),
								"base64": string64,
								"ptt": msg?.message?.audioMessage?.ptt,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							//await transcription.transAudio(response?.mimetype, response?.base64);
							//
							break;
						case 'video':
							logger?.info('- Message video');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'video',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.videoMessage?.caption != undefined ? msg?.message?.videoMessage?.caption : null,
								"mimetype": msg?.message?.videoMessage?.mimetype != undefined ? msg?.message?.videoMessage?.mimetype : null,
								"fileLength": await convertBytes(msg?.message?.videoMessage?.fileLength),
								"base64": string64,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'location':
							logger?.info('- Message location');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'location',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"loc": msg?.message?.locationMessage?.degreesLatitude,
								"lat": msg?.message?.locationMessage?.degreesLongitude,
								"url": "https://maps.google.com/maps?q=" + msg?.message?.locationMessage?.degreesLatitude + "," + msg?.message?.locationMessage?.degreesLongitude,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'liveLocation':
							logger?.info('- Message liveLocation');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'liveLocation',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"loc": msg?.message?.liveLocationMessage?.degreesLatitude,
								"lat": msg?.message?.liveLocationMessage?.degreesLongitude,
								"caption": msg?.message?.liveLocationMessage?.caption,
								"url": "https://maps.google.com/maps?q=" + msg?.message?.liveLocationMessage?.degreesLatitude + "," + msg?.message?.liveLocationMessage?.degreesLongitude,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'document':
							logger?.info('- Message document');
							//
							var buffer = await downloadMediaMessage(msg, 'buffer');
							var string64 = buffer.toString('base64');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'document',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"caption": msg?.message?.documentMessage?.caption != undefined ? msg?.message?.documentMessage?.caption : null,
								"mimetype": msg?.message?.documentMessage?.mimetype != undefined ? msg?.message?.documentMessage?.mimetype : null,
								"base64": string64,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'vcard':
							logger?.info('- Message vcard');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'vcard',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"displayName": msg?.message?.contactMessage?.displayName,
								"vcard": msg?.message?.contactMessage?.vcard,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'button':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'button',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"buttonsMessage": msg?.message?.viewOnceMessage?.message?.buttonsMessage,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'buttonsResponse':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'buttonsResponse',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"selectedButtonId": msg?.message?.buttonsResponseMessage.selectedButtonId,
								"selectedDisplayText": msg?.message?.buttonsResponseMessage.selectedDisplayText,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'templateMessage':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'templateMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"templateMessage": msg?.message?.templateMessage?.hydratedTemplate?.hydratedButtons,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'templateResponse':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'templateResponse',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"selectedId": msg?.message?.templateButtonReplyMessage?.selectedId,
								"selectedDisplayText": msg?.message?.templateButtonReplyMessage?.selectedDisplayText,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'listMessage':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'listMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"listMessage": msg?.message?.viewOnceMessage?.message?.listMessage,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'listResponseMessage':
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'listResponseMessage',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"listResponseMessage": msg?.message?.listResponseMessage,
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'extended':
							logger?.info('- Message extended');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
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
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'historySync':
							logger?.info('- Message historySync');
							//
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'historySync',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'reactionMessage':
							logger?.info('- Message reactionMessage');
							//
							response = {
								"wook": msg?.message?.reactionMessage?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'reactionMessage',
								"fromMe": msg?.message?.reactionMessage?.key?.fromMe,
								"id": msg?.message?.reactionMessage?.key?.id,
								"from": msg?.message?.reactionMessage?.key?.fromMe == true ? phone : msg?.message?.reactionMessage?.key?.remoteJid?.split('@')[0],
								"to": msg?.message?.reactionMessage?.key?.fromMe == false ? phone : msg?.message?.reactionMessage?.key?.remoteJid?.split('@')[0],
								"content": msg?.message?.reactionMessage?.text,
								"status": msg?.message?.reactionMessage?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
								"datetime": moment(msg?.message?.reactionMessage?.senderTimestampMs * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
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
							"type": 'undefined',
							"fromMe": msg?.key?.fromMe,
							"id": msg?.key?.id,
							"name": msg?.pushName || msg?.verifiedBizName || null,
							"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
							"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
							"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
							"status": msg?.key?.fromMe == true ? 'SEND' : 'RECEIVED',
							"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
						}
						*/
						//
					}
					//
					if (Object.keys(response).length !== 0) {
						//
						dataSessions?.funcoesSocket?.message(SessionName, response);
						webhooks?.wh_messages(SessionName, response);
						//
					}
					//
				}
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error onAnyMessage: ${error}`);
		}
		//
		try {
			if (events['messages.delete']) {
				const messagesdelete = events['messages.delete'];
				//logger?.info(`- Message delete: ${JSON.stringify(messagesdelete, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Message delete`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message delete event ${error}`);
		}
		//
		try {
			if (events['message.update']) {
				const messageupdate = events['message.update'];
				//logger?.info(`- Message update: ${JSON.stringify(messageupdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Message update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message update event ${error}`);
		}
		//
		try {
			if (events['messages.media-update']) {
				const messagesmedia = events['messages.media-update'];
				//logger?.info(`- Message-media update: ${JSON.stringify(messagesmedia, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Message-media update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error message-media update event ${error}`);
		}
		//
		try {
			if (events['messages.reaction']) {
				const reaction = events['messages.reaction'];
				//logger?.info(`- Messages reaction: ${JSON.stringify(receipt, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages reaction`);
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
				//logger?.info(`- Messages receipt: ${JSON.stringify(messagereceipt, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Messages receipt`);
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
				//logger?.info(`- Recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`);
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
	static async chatsEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['chats.upsert']) {
				const chatsUpsert = events['chats.upsert'];
				//logger?.info(`- Chats upsert: ${JSON.stringify(chatsUpsert, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats upsert`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats upsert event ${error}`);
		}
		//
		try {
			if (events['chats.update']) {
				const chatsUpdate = events['chats.update'];
				//logger?.info(`- Chats update: ${JSON.stringify(chatsUpdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats update event ${error}`);
		}
		//
		try {
			if (events['chats.delete']) {
				const chatsDelete = events['chats.delete'];
				//logger?.info(`- Chats deleted: ${JSON.stringify(chatsDelete, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Chats deleted`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
	}
	//
	static async blocklistEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['blocklist.set']) {
				const blocklistSet = events['blocklist.set'];
				//logger?.info(`- Blocklist: ${JSON.stringify(blocklistSet, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Blocklist set`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error blocklist set event ${error}`);
		}
		//
		try {
			if (events['blocklist.update']) {
				const blocklistUpdate = events['blocklist.update'];
				//logger?.info(`- Blocklist update: ${JSON.stringify(blocklistUpdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Blocklist update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
	}
	//
	static async groupsEvents(SessionName, events) {
		let dataSessions = await Sessions?.getSession(SessionName);
		//
		try {
			if (events['groups.upsert']) {
				const groupsUpsert = events['groups.upsert'];
				//logger?.info(`- Groups upsert: ${JSON.stringify(groupsUpsert, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Groups upsert`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error blocklist set event ${error}`);
		}
		//
		try {
			if (events['groups.update']) {
				const groupsUpdate = events['groups.update'];
				//logger?.info(`- Groups update: ${JSON.stringify(groupsUpdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Groups update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
		try {
			if (events['group-participants.update']) {
				const participantsUpdate = events['group-participants.update'];
				//logger?.info(`- Proup-participants update: ${JSON.stringify(participantsUpdate, null, 2)}`);
				logger?.info(`- SessionName: ${SessionName}`);
				logger?.info(`- Proup-participants update`);
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error chats deleted event ${error}`);
		}
		//
	}
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
				webhooks?.wh_incomingCall(SessionName, response);
				//
			}
		} catch (error) {
			logger?.info(`- SessionName: ${SessionName}`);
			logger?.error(`- Error recv call event ${error}`);
		}
	}
}