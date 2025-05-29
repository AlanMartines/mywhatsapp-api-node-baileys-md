const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = class Command {
	/*
	╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
	╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐
	╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘
	*/
	//
	// Recuperar status
	static async getPerfilStatus(
		SessionName,
		number
	) {
		logger?.info("- Obtendo status do perfil");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.fetchStatus(number).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			let returnResult = {
				"error": false,
				"statusCode": 200,
				"statusperfil": result,
				"message": "Status do perfil obtido com sucesso."
			};
			//
			return returnResult;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			return {
				"error": true,
				"statusCode": 404,
				"message": "Erro ao obtendo a foto do perfil no servidor"
			};
			//
		});
		//
	} //getStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Set client status
	static async setProfileStatus(
		SessionName,
		ProfileStatus
	) {
		logger?.info("- Mudando o estatus");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.updateProfileStatus(ProfileStatus).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"error": false,
				"statusCode": 200,
				"message": "Profile status alterado com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//return erro;
			return {
				"error": true,
				"statusCode": 404,
				"message": "Erro ao alterar profile status."
			};
			//
		});
	} //setProfileStatus
	//
	// ------------------------------------------------------------------------------------------------//
	//
	// Set client profile name
	static async setProfileName(
		SessionName,
		ProfileName
	) {
		logger?.info("- Mudando profile name");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = await Sessions?.getSession(SessionName);
		return await session?.client?.updateProfileName(ProfileName).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			return {
				"error": false,
				"statusCode": 200,
				"message": "Profile name alterado com sucesso."
			};
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//return erro;
			return {
				"error": true,
				"statusCode": 404,
				"message": "Erro ao alterar profile name."
			};
			//
		});
	} //setProfileName
	//
	// ------------------------------------------------------------------------------------------------//
	//
}