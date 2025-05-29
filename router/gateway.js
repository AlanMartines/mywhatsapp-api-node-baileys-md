//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const instance = require("../functions/instance");
const message = require("../functions/message");
const retrieving = require("../functions/retrieving");
const Sessions = require('../controllers/sessions');
const { logger } = require("../utils/logger");
const config = require('../config.global');
//
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	var string = string?.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
	return string;
}
//
// ------------------------------------------------------------------------------------------------//
//
function soNumeros(string) {
	var numbers = string.replace(/[^0-9]/g, '');
	return numbers;
}
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
// Recuperar status de contato
router.post("/mkauthPlaySms", upload.none(''), verifyToken.verify, async (req, res, next) => {
//
	const theTokenAuth = removeWithspace(req?.headers?.p);
	const theSessionName = removeWithspace(req?.body?.u);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	try {
		if (!resSessionName || !req?.body?.to || !req?.body?.msg) {
			var validate = {
				"error": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await instance?.Status(resSessionName);
			var session = await Sessions?.getSession(resSessionName);
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					await session.waqueue.add(async () => {
						var checkNumberStatus = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.to).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendText = await message?.sendText(
								resSessionName,
								checkNumberStatus.number,
								req?.body?.msg
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendText.status).json({
								"Status": sendText
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(checkNumberStatus.status).json({
								"Status": checkNumberStatus
							});
							//
						}
						//
					});
					break;
				default:
					//
					var resultRes = {
						"error": true,
						"status": 400,
						"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultRes.status).json({
						"Status": resultRes
					});
				//
			}
		}
	} catch (error) {
		//
		logger?.error(`${error}`);
		var resultRes = {
			"error": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //mkauthPlaySms
//
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', (req, res) => {
	//
	var resultRes = {
		"error": true,
		"status": 404,
		"message": 'GATEWAY: Não foi possivel executar a ação, verifique a url informada.'
	};
	//
	res.setHeader('Content-Type', 'application/json');
	res.status(resultRes.status).json({
		"Status": resultRes
	});
	//
});
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;