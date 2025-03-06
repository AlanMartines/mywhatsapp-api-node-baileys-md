const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = class Mensagens {
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
		var session = await Sessions?.getSession(SessionName);
		// send a contact!
		const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
			+ 'VERSION:3.0\n'
			+ 'FN:' + namecontact + '\n' // full name
			+ 'ORG:' + namecontact + ';\n' // the organization of the contact
			+ 'TEL;type=CELL;type=VOICE;waid=' + contact + ':' + contact + '\n' // WhatsApp ID + phone number
			+ 'END:VCARD';
		//
		return await await session?.client?.sendMessage(
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
				"error": false,
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
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send audio
		//let mimetype = getDevice(message.id) == 'ios' ? 'audio/mpeg' : 'audio/mp4';
		await session?.client?.sendPresenceUpdate('recording', number);
		return await session?.client?.sendMessage(number, {
			audio: buffer,
			mimetype: mimetype,
			ptt: true
		},
			{ presence: 'recording', delay: 1000 }
		).then(async (result) => {
				//logger?.info("Result: ", result); //return object success
				//
				let returnResult = {
					"error": false,
					"status": 200,
					"message": "Audio enviado com sucesso."
				};
				//
				await session?.client?.sendPresenceUpdate('available', number);
				return returnResult;
				//
			}).catch(async (erro) => {
				await session?.client?.sendPresenceUpdate('available', number);
				logger?.error(`- Error when: ${erro}`);
				//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
				//return (erro);
				//
				let returnResult = {
					"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send audio
		await session?.client?.sendPresenceUpdate('recording', number);
		return await session?.client?.sendMessage(number, {
			audio: buffer,
			mimetype: "audio/mpeg",
			mp3: true,
			ptt: true
		},
			{ presence: 'recording', delay: 1000 }
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			let returnResult = {
				"error": false,
				"status": 200,
				"message": "Audio enviado com sucesso."
			};
			//
			await session?.client?.sendPresenceUpdate('available', number);
			//
			return returnResult;
			//
		}).catch(async (erro) => {
			await session?.client?.sendPresenceUpdate('available', number);
			logger?.error(`- Error when: ${erro}`);
			//return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
			//return (erro);
			//
			let returnResult = {
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
			number,
			{ text: msg },
			{ presence: 'composing', delay: 1000 }
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			return {
				"error": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
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
				"error": false,
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
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
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
				"error": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.sendMessage(
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
				"error": false,
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
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		//
		let mime = mimetype.split("/")[0];
		let ext = mimetype.split("/")[1];
		//
		switch (mime) {
			case 'image':
				//
				return await session?.client?.sendMessage(from, {
					image: buffer,
					mimetype: mimetype,
					fileName: originalname,
					caption: caption
				}).then((result) => {
					//logger?.info('Result: ', result); //return object success
					//return (result);
					//
					return {
						"error": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					logger?.error('- Error when sending: ', erro);
					//return (erro);
					//
					return {
						"error": true,
						"status": 404,
						"message": "Erro ao enviar arquivo"
					};
					//
				});
				//
				break;
			case 'audio':
				//
				return await session?.client?.sendMessage(from, {
					audio: buffer,
					mimetype: mime,
					caption: caption,
					ptt: mime.split("/")[0] === 'audio' ? true : false
				}).then((result) => {
					//logger?.info('Result: ', result); //return object success
					//return (result);
					//
					return {
						"error": false,
						"status": 200,
						"message": "Arquivo enviado com sucesso."
					};
					//
				}).catch((erro) => {
					logger?.error('- Error when sending: ', erro);
					//return (erro);
					//
					return {
						"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
								"status": 404,
								"message": "Erro ao enviar arquivo"
							};
							//
						});
						//
						break;
					default:
						//
						return await session?.client?.sendMessage(from, {
							document: buffer,
							mimetype: mime,
							fileName: originalname,
							caption: caption
						}).then((result) => {
							//logger?.info('Result: ', result); //return object success
							//return (result);
							//
							return {
								"error": false,
								"status": 200,
								"message": "Arquivo enviado com sucesso."
							};
							//
						}).catch((erro) => {
							logger?.error('- Error when sending: ', erro);
							//return (erro);
							//
							return {
								"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.sendMessage(
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
				"error": false,
				"status": 200,
				"message": "Arquivo envido com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//return (erro);
			//
			return {
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
			number,
			buttonMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
			number,
			templateMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
		data
	) {
		logger?.info("- Enviando lista.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		// Send list
		//
    const listMessage = {
        text: data.title,
        title: data.title,
        description: data.description,
        buttonText: data.buttonText,
        footerText: data.footerText,
        sections: data.sections,
        listType: 2,
    };
		//
		return await session?.client?.sendMessage(
			number,
			listMessage
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			var result = {
				"error": false,
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
				"error": true,
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
	//Enviar enquete
	static async sendPoll(
		SessionName,
		number,
		poll
	) {
		logger?.info("- Enviando lista.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		// Send basic text
		return await session?.client?.sendMessage(
			number,
			{ poll: poll }
		).then(async (result) => {
			//logger?.info("Result: ", result); //return object success
			//
			var result = {
				"error": false,
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
				"error": true,
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
}