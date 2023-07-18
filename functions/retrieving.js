const fs = require('fs-extra');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const { isJidGroup } = require('@whiskeysockets/baileys');
//
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = class Retrieving {
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.fetchStatus(number).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"error": true,
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
				"error": true,
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
		try {
			var session = await Sessions?.getSession(SessionName);
			var contactsList = [];
			//
			if (fs.existsSync(`${session?.tokenPatch}/${SessionName}.contacts.json`)) {
				//let result = JSON.parse(fs.readFileSync(`${session?.tokenPatch}/${SessionName}.contacts.json`, 'utf-8'));
				let result = require(`${session?.tokenPatch}/${SessionName}.contacts.json`);
				//
				const resContacts = Object.values(JSON.parse(result));
				//
				for (var contact in resContacts) {
					//
					if (resContacts[contact]?.id?.includes('s.whatsapp.net') || resContacts[contact]?.id?.split("@")[1] == 's.whatsapp.net') {
						contactsList.push({
							"user": resContacts[contact]?.id?.split("@")[0],
							"name": resContacts[contact]?.name || null,
							"notify": resContacts[contact]?.notify || null,
							"verifiedName": resContacts[contact]?.verifiedName || null,
							"imgUrl": resContacts[contact]?.imgUrl || null,
							"status": resContacts[contact]?.status || null
						});
					}
					//
				}
				//
				if (!contactsList.length) {
					//
					let returnResult = {
						"error": true,
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
					"error": true,
					"status": 400,
					"message": "Nenhum contato recuperado"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
		try {
			var session = await Sessions?.getSession(SessionName);
			var allchat = [];
			//
			if (fs.existsSync(`${session?.tokenPatch}/${SessionName}.store.json`)) {
				//let result = require(`${session?.tokenPatch}/${SessionName}.store.json`);
				let result = JSON.parse(fs.readFileSync(`${session?.tokenPatch}/${SessionName}.store.json`, 'utf-8'));
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
					"error": true,
					"status": 404,
					"message": "Erro ao recuperar contatos"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
		try {
			var session = await Sessions?.getSession(SessionName);
			var allmessages = [];
			//
			if (fs.existsSync(`${session?.tokenPatch}/${SessionName}.store.json`)) {
				//let result = require(`${session?.tokenPatch}/${SessionName}.store.json`);
				let result = JSON.parse(fs.readFileSync(`${session?.tokenPatch}/${SessionName}.store.json`, 'utf-8'));
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
					"error": true,
					"status": 400,
					"message": "Erro ao recuperar mensagens"
				};
				//
				return returnResult;
				//
			}
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
	// Recuperar mensagem
	static async getMessage(
		SessionName,
		number,
		limit,
		cursor_id,
		cursor_fromMe
	) {
		logger?.info("- Obtendo todas as mensagens!");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		try {
			let session = await Sessions?.getSession(SessionName);
			let messages = [];
			let cursor = {};
			if (cursor_id) {
				cursor.before = {
					id: cursor_id,
					fromMe: Boolean(cursor_fromMe && cursor_fromMe === 'true'),
				}
			}
			//
			const useCursor = 'before' in cursor ? cursor : null
			messages = await session?.store?.loadMessages(number, limit, useCursor);
			//
			let returnResult = {
				"error": false,
				"status": 200,
				"getMessage": messages
			};
			//
			return returnResult;
			//
		} catch (erro) {
			logger?.error(`- Error when: ${erro}`);
			//
			let returnResult = {
				"error": true,
				"status": 404,
				"message": "Erro ao recuperar contatos"
			};
			//
			return returnResult;
			//
		};
		//
	} //getMessage
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupFetchAllParticipating().then(async (result) => {
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
						"size": group?.size,
						"creation": moment(group?.creation * 1000).format("YYYY-MM-DD HH:mm:ss"),
						"desc": group?.desc,
						"restrict": group?.restrict,
						"announce": group?.announce,
						"participants": group?.participants
					});
					//
				}
				//
			}
			//
			/*
			await forEach(resGroup, async (value) => {
					//
					getAllGroups.push({
						"user": group?.id.split("@")[0],
						"name": group?.subject,
						"size": group?.size,
						"creation": moment(group?.creation * 1000).format("YYYY-MM-DD HH:mm:ss"),
						"desc": group?.desc,
						"restrict": group?.restrict,
						"announce": group?.announce,
						"participants": group?.participants
					});
					//
			});
			*/
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.onWhatsApp(number).then(([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.exists == true) {
				//
				return {
					"error": false,
					"status": 200,
					"number": result?.jid,
					"message": "O número informado pode receber mensagens via whatsapp"
				};
				//
			} else {
				//
				return {
					"error": false,
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
				"error": true,
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
	// Verificar o status do número
	static async checkGroupStatus(
		SessionName,
		groipId
	) {
		logger?.info("- Validando numero");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.chatExists(groipId).then((result) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result) {
				//
				return {
					"error": false,
					"status": 200,
					"groipid": groipId + '@g.us',
					"message": "O grupo informado existe"
				};
				//
			} else {
				//
				return {
					"error": false,
					"status": 400,
					"groipid": groipId + '@g.us',
					"message": "O grupo informado não existe"
				};
				//
			}
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"error": true,
				"status": 404,
				"groipid": groipId + '@g.us',
				"message": "Erro ao verificar o grupo informado"
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
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.profilePictureUrl(number, 'image').then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			let returnResult = {
				"error": false,
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
				"error": true,
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
}