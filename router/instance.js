//
// Configuração dos módulos
const express = require("express");
const multer = require('multer');
const upload = multer({});
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const engine = require("../engine");
const Sessions = require('../controllers/sessions');
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
			let existSession = Sessions.checkSession(removeWithspace(req.body.SessionName));
			if (existSession) {
				let data = Sessions.getSession(removeWithspace(req.body.SessionName));
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
			}
		}
	} catch (error) {
		console?.log(error);
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
	console?.log("- Status");
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
			try {
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(200).json({
					"Status": Status
				});
				//
			} catch (erro) {
				console?.log("- Erro ao obter status:", erro);
				var resultRes = {
					"erro": true,
					"status": 400,
					"message": 'Erro ao obter status'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(resultRes.status).json({
					"Status": resultRes
				});
				//
			}
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //Status
//
// ------------------------------------------------------------------------------------------------//
//
// Fecha a sessão
router.post("/Close", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
			try {
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
					case 'notLogged':
						//
						var session = await Sessions.getSession(removeWithspace(req.body.SessionName));
						var resultClose = await session.process.add(async () => await Sessions.closeSession(removeWithspace(req.body.SessionName)));
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(resultClose.status).json({
							"Status": resultClose
						});
						//
						break;
					default:
						//
						var resultRes = {
							"erro": true,
							"status": 400,
							"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
						};
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(resultRes.status).json({
							"Status": resultRes
						});
					//
				}
			} catch (erro) {
				console?.log("- Erro ao fechar navegador\n", erro);
				var resultRes = {
					"erro": true,
					"status": 400,
					"message": 'Erro ao fechar navegador, verifique e tente novamente'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(resultRes.status).json({
					"Status": resultRes
				});
				//
			}
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //Close
//
// ------------------------------------------------------------------------------------------------//
//
// Desconecta do whatsapp web
router.post("/Logout", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var session = await Sessions.getSession(removeWithspace(req.body.SessionName));
					var resultLogout = await session.process.add(async () => await Sessions.logoutSession(res, removeWithspace(req.body.SessionName)));
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(resultLogout.status).json({
						"Status": resultLogout
					});
					//
					break;
				default:
					//
					var resultRes = {
						"erro": true,
						"status": 400,
						"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(resultRes.status).json({
						"Status": resultRes
					});
				//
			}
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //Logout
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/restartToken", verifyToken.verify, upload.none(''), async (req, res, next) => {
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
			var session = await Sessions.getSession(removeWithspace(req.body.SessionName));
			var resultRestart = await Sessions.restartToken(req.io, session.name, session.AuthorizationToken, session.whatsappVersion);
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRestart.status).json({
				"Status": resultRestart
			});
			//
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
});
//
// ------------------------------------------------------------------------------------------------//
//
// Gera o QR-Code
router.post("/QRCode", upload.none(''), verifyToken.verify, async (req, res, next) => {
	console?.log("- getQRCode");
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
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var resultRes = { "erro": false, "status_code": 200, ...Status };
					res.setHeader('Content-Type', 'application/json');
					res.status(resultRes.status_code).json({
						"Status": resultRes
					});
					//
					break;
				//
				case 'notLogged':
				case 'qrReadFail':
				case 'deviceNotConnected':
				case 'desconnectedMobile':
				case 'deleteToken':
				case 'qrRead':
					//
					var session = await Sessions.getSession(removeWithspace(req.body.SessionName));
					if (req.body.View === true) {
						var qrcode = session.qrcode;
						if (qrcode) {
							const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,', ''), 'base64');
							//
							res.writeHead(200, {
								'Content-Type': 'image/png',
								'Content-Length': imageBuffer.length
							});
							//
							res.status(200).end(imageBuffer);
							//
						} else {
							var resultRes = { "erro": true, "status_code": 400, ...Status };
							res.setHeader('Content-Type', 'application/json');
							res.status(resultRes.status_code).json({
								"Status": resultRes
							});
							//
						}
					} else if (req.body.View === false) {
						var resultRes = {
							"erro": false,
							"status_code": 200,
							"state": session.state,
							"status": session.status,
							"qrcode": session.qrcode,
							"message": "Aguardando leitura do QR-Code"
						};
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(resultRes.status_code).json({
							"Status": resultRes
						});
						//
					}
					//
					break;
				default:
					//
					var resultRes = {
						"erro": true,
						"status": 400,
						"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(resultRes.status).json({
						"Status": resultRes
					});
				//
			}
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
});
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSession", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
			var getSession = await Sessions.getSessions(removeWithspace(req.body.SessionName));
			//
			var resultRes = { "erro": false, "status": 200, "Session": getSession };
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRes.status).json({
				"Status": resultRes
			});
		}
	} catch (error) {
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //Status
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSessions", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
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
		var getSessions = await Sessions.getSessions();
		//
		if (getSessions) {
			//
			var resultRes = { "erro": false, "status": 200, "Sessions": getSessions };
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRes.status).json({
				"Status": resultRes
			});
			//
		} else {
			var resultRes = {
				"erro": true,
				"status": 400,
				"message": 'Nenhuma sessão criada'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRes.status).json({
				"Status": resultRes
			});
			//
		}
	}
}); //getSessions
//
// ------------------------------------------------------------------------------------------------//
//
// Dados de memoria e uptime
router.post("/getHardWare", upload.none(''), verifyToken.verify, async (req, res, next) => {
	console?.log("- getHardWare");
	//
	try {
		var resultRes = {
			"erro": false,
			"status": 200,
			"noformat": {
				uptime: os.uptime(),
				freemem: os.freemem(),
				memusage: (os.totalmem() - os.freemem()),
				totalmem: os.totalmem(),
				freeusagemem: `${Math.round((os.freemem() * 100) / os.totalmem()).toFixed(0)}`,
				usagemem: `${Math.round(((os.totalmem() - os.freemem()) * 100) / os.totalmem()).toFixed(0)}`
			},
			"format": {
				uptime: (os.uptime() + "").toHHMMSS(),
				freemem: convertBytes(os.freemem()),
				memusage: convertBytes((os.totalmem() - os.freemem())),
				totalmem: convertBytes(os.totalmem()),
				freeusagemem: `${Math.round((os.freemem() * 100) / os.totalmem()).toFixed(0)} %`,
				usagemem: `${Math.round(((os.totalmem() - os.freemem()) * 100) / os.totalmem()).toFixed(0)} %`
			}
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	} catch (error) {
		//
		console?.log(error);
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //getHardWare
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