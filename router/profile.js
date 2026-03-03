//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const instance = require("../functions/instance");
const retrieving = require("../functions/retrieving");
const profile = require("../functions/profile");
const Sessions = require('../controllers/sessions');
const config = require('../config.global');
//
// ------------------------------------------------------------------------------------------------ //
//
function removeWithspace(string) {
	var string = string.replace(/\r?\n|\r|\s+/g, ''); /* Replace all newlines and with a space */
	return string;
}
//
// ------------------------------------------------------------------------------------------------ //
//
function soNumeros(string) {
	var numbers = string.replace(/[^0-9]/g, '');
	return numbers;
}
//
// ------------------------------------------------------------------------------------------------ //
//
/*
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
// Recuperar status de contato
router.post("/getPerfilStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
			"Status": resultRes
		});
		//
	} else {
		//
		var Status = await instance?.Status(resSessionName);
		var session = await Sessions?.getSession(resSessionName);
		//
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//
				var checkNumberStatus = await retrieving?.checkNumberStatus(
					resSessionName,
					soNumeros(req?.body?.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var getStatus = await profile?.getPerfilStatus(
						resSessionName,
						checkNumberStatus.number
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getStatus.statusCode).json({
						"Status": getStatus
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(checkNumberStatus.statusCode).json({
						"Status": checkNumberStatus
					});
					//
				}
				//
				break;
			default:
				//
				var resultRes = {
					"error": true,
					"statusCode": 400,
					"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(resultRes.statusCode).json({
					"Status": resultRes
				});
			//
		}
	}
}); //getStatus
//
//
// ------------------------------------------------------------------------------------------------//
//
// Set client status
router.post("/setProfileStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.ProfileStatus) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
				var setProfileStatus = await profile?.setProfileStatus(
					resSessionName,
					req?.body?.ProfileStatus
				);
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(setProfileStatus.statusCode).json({
					"Status": setProfileStatus
				});
				//
				break;
			default:
				//
				var resultRes = {
					"error": true,
					"statusCode": 400,
					"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(resultRes.statusCode).json({
					"Status": resultRes
				});
			//
		}
	}
}); //setProfileStatus
//
// ------------------------------------------------------------------------------------------------//
//
// Set client profile name
router.post("/setProfileName", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.ProfileName) {
		var validate = {
			"error": true,
			"statusCode": 400,
			message: 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
				var setProfileName = await profile?.setProfileName(
					resSessionName,
					req?.body?.ProfileName
				);
				res.setHeader('Content-Type', 'application/json');
				return res.status(200).json({
					"Status": setProfileName
				});
				break;
			default:
				//
				var resultRes = {
					"error": true,
					"statusCode": 400,
					"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(resultRes.statusCode).json({
					"Status": resultRes
				});
			//
		}
	}
}); //setProfileName
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', upload.none(''), async (req, res, next) => {
	//
	var resultRes = {
		"error": true,
		"statusCode": 404,
		"message": 'PROFILE: Não foi possivel executar a ação, verifique a url informada.'
	};
	//
	res.setHeader('Content-Type', 'application/json');
	return res.status(resultRes.statusCode).json({
		"Status": resultRes
	});
	//
});
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;