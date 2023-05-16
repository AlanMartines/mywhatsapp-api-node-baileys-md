const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
//
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	var string = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
	return string;
}
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = class Groups {
	//
	// ------------------------------------------------------------------------------------------------//
	//
	/*
	╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐
	╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘
	*/
	//
	// Deixar o grupo
	static async leaveGroup(
		SessionName,
		groupId
	) {
		logger?.info("- Deixando o grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupLeave(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Grupo deixado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao deixar o grupo"
			};
			//
		});
	} //leaveGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Criar grupo (título, participantes a adicionar)
	static async createGroup(
		SessionName,
		title,
		contactlistValid,
		contactlistInvalid
	) {
		logger?.info("- Criando grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupCreate(title, contactlistValid).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.id) {
				return {
					"erro": false,
					"status": 200,
					"groupId": result?.id,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Grupo criado com a lista de contatos validos"
				};
			} else {
				//
				return {
					"erro": true,
					"status": 400,
					"groupId": null,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao criar grupo"
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
				"groupId": null,
				"contactlistValid": contactlistValid,
				"contactlistInvalid": contactlistInvalid,
				"message": "Erro ao criar grupo"
			};
			//
		});
	} //createGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Atualizando titulo do grupo
	static async updateGroupTitle(
		SessionName,
		groupId,
		title
	) {
		logger?.info("- Atualizando titulo do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupUpdateSubject(groupId, title).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Titulo do grupo atualizado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao atualizar titulo do grupo"
			};
			//
		});
	} //updateGroupTitle
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Atualizando descrição do grupo
	static async updateGroupDesc(
		SessionName,
		groupId,
		desc
	) {
		logger?.info("- Atualizando descrição do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupUpdateDescription(groupId, desc).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"message": "Descrição do grupo atualizado com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao atualizar descrição do grupo"
			};
			//
		});
	} //updateGroupDesc
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Obtenha membros do grupo
	static async getGroupMembers(
		SessionName,
		groupId
	) {
		logger?.info("- Obtendo membros do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupMetadata(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			var groupMembers = [];
			//
			await result?.participants.forEach(async (resultGroupMembers) => {
				//
				groupMembers.push({
					"user": resultGroupMembers?.id.split('@')[0],
					"admin": resultGroupMembers?.admin
				});
				//
			});
			//
			var resultRes = {
				"erro": false,
				"status": 200,
				"groupId": groupId,
				"groupMembers": groupMembers,
				"message": 'Membros do grupo obtids com sucesso'
			};
			//
			return resultRes;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"groupId": groupId,
				"message": "Erro ao obter membros do grupo"
			};
			//
		});
	} //getGroupMembers
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Gerar link de url de convite de grupo
	static async getGroupInviteLink(
		SessionName,
		groupId
	) {
		logger?.info("- Gerar link de convite do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupInviteCode(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"inviteCode": result,
				"inviteUrl": 'https://chat.whatsapp.com/' + result,
				"message": "Link de convite obtido com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"inviteCode": null,
				"inviteUrl": null,
				"message": "Erro ao obter link de convite"
			};
			//
		});
	} //getGroupInviteLink
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Gerar link de url de convite de grupo
	static async getGroupRevokeInviteLink(
		SessionName,
		groupId
	) {
		logger?.info("- Gerar link de convite do grupo");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupRevokeInvite(groupId).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"erro": false,
				"status": 200,
				"inviteCode": result,
				"inviteUrl": 'https://chat.whatsapp.com/' + result,
				"message": "Link de convite obtido com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"erro": true,
				"status": 404,
				"inviteCode": null,
				"inviteUrl": null,
				"message": "Erro ao obter link de convite"
			};
			//
		});
	} //getGroupRevokeInviteLink
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Remove participante
	static async removeParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		logger?.info("- Removendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"remove"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.status == 200) {
				return {
					"erro": false,
					"status": 200,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Participante(s) da lista valida removido(s) com sucesso"
				};
			} else {
				//
				return {
					"erro": true,
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao remover participante(s) da lista valida"
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
				"contactlistValid": contactlistValid,
				"contactlistInvalid": contactlistInvalid,
				"message": "Erro ao remover participante(s)"
			};
			//
		});
	} //removeParticipant
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Adicionar participante
	static async addParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		logger?.info("- Adicionando participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"add"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.status == 200) {
				return {
					"erro": false,
					"status": 200,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Participante(s) da lista valida adicionado(s) com sucesso"
				};
			} else {
				//
				return {
					"erro": true,
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao adicionar participante(s) da lista valida"
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
				"contactlistValid": contactlistValid,
				"contactlistInvalid": contactlistInvalid,
				"message": "Erro ao adicionar participante(s)"
			};
			//
		});
	} //addParticipant
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Promote participante (Give admin privileges)
	static async promoteParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		logger?.info("- Promovendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"promote"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.status == 200) {
				return {
					"erro": false,
					"status": 200,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Participante(s) da lista valida promovido(s) com sucesso"
				};
			} else {
				//
				return {
					"erro": true,
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao promover participante(s) da lista valida"
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
				"contactlistValid": contactlistValid,
				"contactlistInvalid": contactlistInvalid,
				"message": "Erro ao promover particitante(s)"
			};
			//
		});
	} //createGroup

	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Depromote participant (Give admin privileges)
	static async demoteParticipant(
		SessionName,
		groupId,
		contactlistValid,
		contactlistInvalid
	) {
		logger?.info("- Promovendo participante(s)");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupParticipantsUpdate(
			groupId,
			contactlistValid,
			"demote"
		).then(async ([result]) => {
			//logger?.info('Result: ', result); //return object success
			//
			if (result?.status == 200) {
				return {
					"erro": false,
					"status": 200,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Participante(s) da lista valida depromote com sucesso"
				};
			} else {
				//
				return {
					"erro": true,
					"status": 400,
					"contactlistValid": contactlistValid,
					"contactlistInvalid": contactlistInvalid,
					"message": "Erro ao depromote participante(s) da lista valida"
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
				"contactlistValid": contactlistValid,
				"contactlistInvalid": contactlistInvalid,
				"message": "Erro ao depromote particitante(s)"
			};
			//
		});
	} //createGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Retorna o status do grupo, jid, descrição do link de convite
	static async getGroupInfoFromInviteLink(
		SessionName,
		inviteCode
	) {
		logger?.info("- Obtendo status do grupo via link de convite");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupGetInviteInfo(inviteCode).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			return {
				"erro": false,
				"status": 200,
				"infoInvite": result,
				"message": "Informação do link de convite"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao obter informação do link de convite"
			};
			//
		});
	} //getGroupInfoFromInviteLink
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Junte-se a um grupo usando o código de convite do grupo
	static async joinGroup(
		SessionName,
		inviteCode
	) {
		logger?.info("- Join grupo via link de convite");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.groupAcceptInvite(inviteCode).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			return {
				"erro": false,
				"status": 200,
				"message": "Join grupo com sucesso"
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			return {
				"erro": true,
				"status": 404,
				"message": "Erro ao Join grupo"
			};
			//
		});
	} //joinGroup
	//
	// ------------------------------------------------------------------------------------------------//
	//
}