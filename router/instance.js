//
// Configuração dos módulos
const express = require("express");
const multer = require('multer');
const upload = multer({});
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const getStatus = require("../functions/status");
const getInstance = require("../functions/instance");
const Command = require("../functions/commands");
const Instace = require("../engine");
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/Start", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!Command.removeWithspace(req.body.SessionName)) {
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
			var Status = await getStatus.ApiStatus(Command.removeWithspace(req.body.SessionName));
			//
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
				case 'qrRead':
					//
					var resultRes = {
						"erro": false,
						"status": 200,
						"message": 'Sistema iniciado e disponivel para uso'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(resultRes.status).json({
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
					await Instace.Start(req.io, Command.removeWithspace(req.body.SessionName));
					var session = await Sessions.getSession(Command.removeWithspace(req.body.SessionName));
					if (parseInt(config.VALIDATE_MYSQL) == true) {;
						try {
							//
							const row = await Tokens.findOne({
								limit: 1,
								attributes: [
									'webhook', 
									'wh_status', 
									'wh_message', 
									'wh_qrcode', 
									'wh_connect'
								],
								where: {
									token: Command.removeWithspace(req.body.SessionName)
								}
							}).then(async function (entries) {
								return entries;
							}).catch(async (err) => {
								console?.log('- Error:', err);
								return false;
							});
							//
							if (row.webhook) {
								//
								const webHook = row.webhook;
								//
									session.wh_status = webHook;
									session.wh_message = webHook;
									session.wh_qrcode = webHook;
									session.wh_connect = webHook;
									//
							} else {
								session.wh_status = req.body.wh_status;
								session.wh_message = req.body.wh_message;
								session.wh_qrcode = req.body.wh_qrcode;
								session.wh_connect = req.body.wh_connect;
							}
						} catch (err) {
							console?.log("- erro:", err);
						}
					} else {
						session.wh_status = req.body.wh_status;
						session.wh_message = req.body.wh_message;
						session.wh_qrcode = req.body.wh_qrcode;
						session.wh_connect = req.body.wh_connect;
					}
					//
					var resultRes = {
						"erro": false,
						"status": 200,
						"message": 'Sistema iniciando'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(resultRes.status).json({
						"Status": resultRes
					});
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
router.post("/Status", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	console?.log("- Status");
	try {
		if (!Command.removeWithspace(req.body.SessionName)) {
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
				var Status = await Sessions.ApiStatus(Command.removeWithspace(req.body.SessionName));
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
		if (!Command.removeWithspace(req.body.SessionName)) {
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
				var Status = await Sessions.ApiStatus(Command.removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
					case 'notLogged':
						//
						var session = await Sessions.getSession(Command.removeWithspace(req.body.SessionName));
						var resultClose = await session.process.add(async () => await Sessions.closeSession(Command.removeWithspace(req.body.SessionName)));
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
		if (!Command.removeWithspace(req.body.SessionName)) {
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
			var Status = await Sessions.ApiStatus(Command.removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var session = await Sessions.getSession(Command.removeWithspace(req.body.SessionName));
					var resultLogout = await session.process.add(async () => await Sessions.logoutSession(res, Command.removeWithspace(req.body.SessionName)));
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
		if (!Command.removeWithspace(req.body.SessionName)) {
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
			var session = await Sessions.getSession(Command.removeWithspace(req.body.SessionName));
			var resultRestart = await Sessions.restartToken(req.io, session.name, session.AuthorizationToken);
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
		if (!Command.removeWithspace(req.body.SessionName)) {
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
			var Status = await Sessions.ApiStatus(Command.removeWithspace(req.body.SessionName));
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
					var session = await Sessions.getSession(Command.removeWithspace(req.body.SessionName));
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
		if (!Command.removeWithspace(req.body.SessionName)) {
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
			var getSession = await Sessions.getSessions(Command.removeWithspace(req.body.SessionName));
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
	if (!Command.removeWithspace(req.body.SessionName)) {
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
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;