//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const instance = require("../functions/instance");
const retrieving = require("../functions/retrieving");
const Sessions = require('../controllers/sessions');
const config = require('../config.global');
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
function soNumeros(string) {
	var numbers = string.replace(/[^0-9]/g, '');
	return numbers;
}
//
// ------------------------------------------------------------------------------------------------//
//
/*
╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐                
╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤                
╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴                
*/
//
// Recuperar status do contatos
router.post("/getStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull) {
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
						soNumeros(req?.body?.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var getStatus = await retrieving?.getStatus(
							resSessionName,
							checkNumberStatus.number
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(getStatus.status).json({
							"Status": getStatus
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
}); //getStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar contatos
router.post("/getAllContacts", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName) {
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
					var getAllContacts = await retrieving?.getAllContacts(
						resSessionName
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getAllContacts.status).json({
						"Status": getAllContacts
					});
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
}); //getAllContacts
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar chats
router.post("/getAllChats", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName) {
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
					var getAllChats = await retrieving?.getAllChats(
						resSessionName
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getAllChats.status).json({
						"Status": getAllChats
					});
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
}); //getAllChats
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar mensagens
router.post("/getAllMessage", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName) {
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
					var getAllMessage = await retrieving?.getAllMessage(
						resSessionName
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getAllMessage.status).json({
						"Status": getAllMessage
					});
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
}); //getAllMessage
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar mensagens
router.post("/getMessage", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.limit || !req?.body?.cursor_id || !req?.body?.cursor_fromMe) {
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
						soNumeros(req?.body?.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var getAllMessage = await retrieving?.getMessage(
							resSessionName,
							checkNumberStatus.number,
							req?.body?.limit,
							req?.body?.cursor_id,
							req?.body?.cursor_fromMe
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(getAllMessage.status).json({
							"Status": getAllMessage
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
}); //getMessage
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar grupos
router.post("/getAllGroups", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName) {
		var resultRes = {
			"error": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
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
					var getAllGroups = await retrieving?.getAllGroups(
						req?.body?.SessionName
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getAllGroups.status).json({
						"Status": getAllGroups
					});
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
}); //getAllGroups
//
// ------------------------------------------------------------------------------------------------------- //
//
// Obter o perfil do número
router.post("/getProfilePicFromServer", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull) {
		var resultRes = {
			"error": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
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
						soNumeros(req?.body?.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var getProfilePicFromServer = await retrieving?.getProfilePicFromServer(
							resSessionName,
							checkNumberStatus.number
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(getProfilePicFromServer.status).json({
							"Status": getProfilePicFromServer
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
}); //getProfilePicFromServer
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do número
router.post("/checkNumberStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull) {
		var resultRes = {
			"error": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
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
						soNumeros(req?.body?.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
}); //checkNumberStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do grupo
router.post("/checkGroupStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId) {
		var resultRes = {
			"error": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
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
					var checkGroup = await retrieving?.checkGroupStatus(
						resSessionName,
						req?.body?.groupId.trim()
					);
					//
					if (checkGroup.status === 200 && checkGroup.erro === false) {
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkGroup.status).json({
							"Status": checkGroup
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkGroup.status).json({
							"Status": checkGroup
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
}); //checkNumberStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// rota url erro
router.all('*', (req, res) => {
	//
	var resultRes = {
		"error": true,
		"status": 404,
		"message": 'RETRIEVING: Não foi possivel executar a ação, verifique a url informada.'
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