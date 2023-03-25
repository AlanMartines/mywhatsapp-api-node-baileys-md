const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const { Tokens } = require('../models');
const webhooks = require('../controllers/webhooks');
const config = require('../config.global');
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
		try {
			var contactsList = [];
			//
			if (fs.existsSync(`${tokenPatch}/${SessionName}.contacts.json`)) {
				//let result = JSON.parse(fs.readFileSync(`${tokenPatch}/${SessionName}.contacts.json`, 'utf-8'));
				let result = require(`${tokenPatch}/${SessionName}.contacts.json`);
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
		var session = await Sessions?.getSession(SessionName);
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
		var session = await Sessions?.getSession(SessionName);
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
		var session = await Sessions?.getSession(SessionName);
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
}