//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const engine = require("../engine");
const Sessions = require('../controllers/sessions');
const { logger } = require("../utils/logger");
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
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
router.post("/Start", verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName)) {
			var resultRes = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRes.status).json({
				"Status": resultRes
			});
			//
		} else {
			//
			let existSession = await Sessions.checkSession(removeWithspace(req.body.SessionName));
			if (existSession) {
				let data = await Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (data?.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
						//
						var resultRes = {
							"erro": false,
							"status": 200,
							"state": data?.state,
							"message": 'Sistema iniciado e disponivel para uso'
						};
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(resultRes.status).json({
							"Status": resultRes
						});
						break;
					case 'notLogged':
					case 'deviceNotConnected':
					case 'desconnectedMobile':
					case 'qrReadFail':
					case 'deleteToken':
					case 'browserClose':
					case 'autocloseCalled':
					case 'serverClose':
					case 'deleteToken':
					case 'CLOSED':
					case 'DISCONNECTED':
					case 'NOTFOUND':
						//
						engine.Start(req, res, next);
						//
						break;
					default:
						var resultRes = {
							"erro": true,
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
				//
			} else {
				//
				engine.Start(req, res, next);
				//
				//
				var resultRes = {
					"erro": false,
					"status": 200,
					"message": 'Sistema iniciando, por favor aguarde'
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
		logger?.error(error);
		//
		var resultRes = {
			"erro": true,
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
});
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', (req, res) => {
	//
	var resultRes = {
		"erro": true,
		"status": 404,
		"message": 'Não foi possivel executar a ação, verifique a url informada.'
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