//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const instance = require("../functions/instance");
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
router.post("/Status", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	logger?.info("- Obtendo status");
	//
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
		var resTokenAuth = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
		var resTokenAuth = theTokenAuth;
	}
	//
	try {
		if (!resSessionName) {
			var resultRes = {
				"erro": true,
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
			try {
				var Status = await instance.Status(req, res, next);
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(200).json({
					"Status": Status
				});
				//
			} catch (erro) {
				logger?.error(`- Erro ao obter status: ${erro}`);
				var resultRes = {
					"erro": true,
					"status": 400,
					"message": 'Erro ao obter status'
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
		logger?.error(`${error}`);
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
}); //Status
/*
router.post('/Close', verifyToken.verify, Auth.closeSession);
router.post('/Logout', verifyToken.verify, Auth.logoutSession);
router.post('/restartToken', verifyToken.verify, Auth.getConnectionState);
router.get('/QRCode', Auth.getQrCode);
router.post('/deleteSession', verifyToken.verify, database.deleteSession);
router.post('/getAllSessions', verifyToken.verify, database.getAllSessions);
*/
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