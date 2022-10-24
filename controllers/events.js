//
const { downloadMediaMessage } = require('@adiwajshing/baileys');
//
const webhooks = require('./webhooks');
const Sessions = require('./sessions');
const mime = require('mime-types');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const transcription = require('../utils/transcription');
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
		var saudacao = "---";
		//
	}
	return saudacao;
}
//
// ------------------------------------------------------------------------------------------------------- //
//
const convertBytes = async function (bytes) {
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	if (bytes == 0) {
		return "n/a"
	}
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
	if (i == 0) {
		return bytes + " " + sizes[i]
	}
	return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
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
	static async receiveMessage(session, client, socket) {
		try {
			await client?.ev.on('messages.upsert', async (m) => {
				//
				const msg = m?.messages[0];
				//console?.log(`- receiveMessage\n ${JSON.stringify(msg, null, 2)}`);
				//
				let type = null;
				let response = [];
				//
				if (msg?.key?.remoteJid != 'status@broadcast') {
					//
					//if (m.type === 'notify' || m.type === 'append') {
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
					} else {
						type = undefined;
					}
					//
					// }
					//
					console?.log(`- Type message: ${type}`);
					let phone = await client?.user?.id.split(":")[0];
					//
					switch (type) {
						case 'text':
							//
							console.log('- Message text');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'image':
							console.log('- Message image');
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
								"fileLength": await convertBytes(msg?.message?.audioMessage?.fileLength),
								"base64": string64,
								"height": msg?.message?.imageMessage?.height != undefined ? msg?.message?.imageMessage?.height : null,
								"width": msg?.message?.imageMessage?.width != undefined ? msg?.message?.imageMessage?.width : null,
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'sticker':
							console.log('- Message sticker');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'audio':
							console.log('- Message audio');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							//await transcription.transAudio(response?.mimetype, response?.base64);
							//
							break;
						case 'video':
							console.log('- Message video');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'location':
							console.log('- Message location');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'liveLocation':
							console.log('- Message liveLocation');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'document':
							console.log('- Message document');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							//
							break;
						case 'vcard':
							console.log('- Message vcard');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
									"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
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
										"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
										"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
									}
									break;
						case 'extended':
							console.log('- Message extended');
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
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
							break;
						case 'historySync':
								console.log('- Message historySync');
								//
								response = {
									"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
									"type": 'historySync',
									"fromMe": msg?.key?.fromMe,
									"id": msg?.key?.id,
									"name": msg?.pushName || msg?.verifiedBizName || null,
									"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
									"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
									"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
									"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
								}
								//
							break;
						default:
							console.log("- Desculpe, estamos sem nenhuma resposta.");
							//
							console.log('- Message text');
							response = {
								"wook": msg?.key?.fromMe == true ? 'SEND_MESSAGE' : 'RECEIVE_MESSAGE',
								"type": 'undefined',
								"fromMe": msg?.key?.fromMe,
								"id": msg?.key?.id,
								"name": msg?.pushName || msg?.verifiedBizName || null,
								"from": msg?.key?.fromMe == true ? phone : msg?.key?.remoteJid?.split('@')[0],
								"to": msg?.key?.fromMe == false ? phone : msg?.key?.remoteJid?.split('@')[0],
								"isGroup": msg?.key?.remoteJid?.split('@')[1] == 'g.us' ? true : false,
								"status": msg?.key?.fromMe == true ? 'SENT' : 'RECEIVED',
								"datetime": moment(msg?.messageTimestamp * 1000)?.format('YYYY-MM-DD HH:mm:ss')
							}
					}
					//
					msg?.key?.fromMe == true ? socket?.emit('send-message', await response, true) : socket?.emit('received-message', await response, true);
					webhooks?.wh_messages(session, response);
					//
				}
			});
		} catch (error) {
			console?.log('- Nome da sessão:', session.name);
			console?.log("- Error onAnyMessage:", error);
		}
	}
	static statusMessage(session, client, socket) {
		let data = Sessions.getSession(session);
		try {
			client.ev.on('messages.update', async (message) => {
				console.log("- AuthorizationToken:", session.AuthorizationToken);
				//console.log(`- Messages update: ${JSON.stringify(message, null, 2)}`);
				// logic of your application...
				let phone = await client?.user?.id.split(":")[0];
				let onAck = message[0]?.update?.status;
				console.log(`- onAck: ${onAck}`);
				let status;
				switch (onAck) {
					case 4:
						status = 'READ'
						break;
					case 3:
						status = 'RECEIVED'
						break;
					case 2:
						status = 'SENT'
						break;
				}
				console?.log("- Listen to ack", onAck, "for status", status);
				let response = {
					"wook": 'MESSAGE_STATUS',
					"status": status,
					"id": message[0]?.key?.id,
					"from": message[0]?.key?.fromMe == true ? phone : message[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"to": message[0]?.key?.fromMe == false ? phone : message[0]?.key?.remoteJid?.split(':')[0].split('@')[0],
					"dateTime": moment(new Date())?.format('YYYY-MM-DD HH:mm:ss')
				}
				//data.funcoesSocket.ack(session, response);
				await webhooks?.wh_status(session, response);
				//
			});
		} catch (error) {
			console?.log('- Nome da sessão:', session.name);
			console?.log("- Error onAck:", error);
		}
	}
	static statusConnection(session, client, socket) {
		//
		//
	}
	static extraEvents(session, client, socket) {
		//
		/*
		// function to detect incoming call
		try {
			/*
			client.ws.on('CB:call', async (json) => {
				console?.log('- Nome da sessão:', session.name);
				console?.log('- onIncomingCall: ', call?.peerJid);
				console.log(json);
				const callerId = json.content[0].attrs['call-creator']
				const idCall = json.content[0].attrs['call-id']
				const Id = json.attrs.id
				const T = json.attrs.t
				client.sendNode({
					tag: 'call',
					attrs: {
						from: client.user.id,
						id: Id,
						t: T
					},
					content: [{
						tag: 'reject',
						attrs: {
							'call-creator': callerId,
							'call-id': idCall,
							count: '0'
						},
						content: null
					}]
				});
			});
		} catch (error) {
			console?.log('- Nome da sessão:', session.name);
			console?.log("- Error onIncomingCall:", error);
		}
		*/
		//
		try {
			// Listen when client has been added to a group
			client?.onAddedToGroup(async (chatEvent) => {
				console?.log('- Nome da sessão:', session.name);
				console?.log('- Listen when client has been added to a group:', chatEvent.name);
			});
		} catch (error) {
			console?.log('- Nome da sessão:', session.name);
			console?.log("- Error onAddedToGroup:", error);
		}
		//
	}
}