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
const config = require('../config.global');
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	try {
		if (!resSessionName) {
			let resultRes = {
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
			let existSession = await Sessions.checkSession(resSessionName);
			if (existSession) {
				let data = await Sessions.getSession(resSessionName);
				switch (data?.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
						//
						let resultRes = {
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
	} else {
		var resSessionName = theSessionName;
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
				var Status = await instance.Status(resSessionName);
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
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/Close", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
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
				let Status = await instance.Status(resSessionName);
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
					case 'notLogged':
						//
						let resultClose = await Sessions.closeSession(resSessionName);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(resultClose.status).json({
							"Status": resultClose
						});
						//
						break;
					default:
						//
						let resultRes = {
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
			} catch (erro) {
				logger?.error(`- Erro ao fechar navegador\n ${erro}`);
				var resultRes = {
					"erro": true,
					"status": 400,
					"message": 'Erro ao fechar navegador, verifique e tente novamente'
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
		let resultRes = {
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
}); //Close
//
// ------------------------------------------------------------------------------------------------//
//
// Desconecta do whatsapp web
router.post("/Logout", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
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
			var Status = await instance.Status(resSessionName);
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var session = Sessions.getSession(resSessionName);
					var resultLogout = await Sessions.logoutSession(resSessionName);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultLogout.status).json({
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
}); //Logout
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/restartToken", verifyToken.verify, upload.none(''), async (req, res, next) => {
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
			let resultRes = {
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
			let resultRestart = await Sessions.restartToken(req.io, session.name, session.AuthorizationToken);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(resultRestart.status).json({
				"Status": resultRestart
			});
			//
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
});
//
// ------------------------------------------------------------------------------------------------//
//
// Gera o QR-Code
router.post("/QRCode", upload.none(''), verifyToken.verify, async (req, res, next) => {
	logger?.info(`- getQRCode`);
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
			var Status = await Sessions.ApiStatus(resSessionName);
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var resultRes = { "erro": false, "status_code": 200, ...Status };
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultRes.status_code).json({
						"Status": resultRes
					});
					//
					break;
				//
				case 'qrRead':
					//
					var session = Sessions.getSession(resSessionName);
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
							return res.status(200);
							res.end(imageBuffer);
							//
						} else {
							var resultRes = { "erro": true, "status_code": 400, ...Status };
							res.setHeader('Content-Type', 'application/json');
							return res.status(resultRes.status_code).json({
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
						return res.status(resultRes.status_code).json({
							"Status": resultRes
						});
						//
					}
					//
					break;
				case 'notLogged':
				case 'qrReadFail':
				case 'deviceNotConnected':
				case 'desconnectedMobile':
				case 'deleteToken':
					//
					var resultRes = {
						"erro": true,
						"status": 401,
						"message": 'Não foi possivel executar a ação, inicie o sistema'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultRes.status).json({
						"Status": resultRes
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
});
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSession", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
			var getSession = await Sessions.getSessions(resSessionName);
			//
			var resultRes = { "erro": false, "status": 200, "Session": getSession };
			res.setHeader('Content-Type', 'application/json');
			return res.status(resultRes.status).json({
				"Status": resultRes
			});
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
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSessions", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		var getSessions = await Sessions.getSessions();
		//
		if (getSessions) {
			//
			var resultRes = { "erro": false, "status": 200, "Sessions": getSessions };
			res.setHeader('Content-Type', 'application/json');
			return res.status(resultRes.status).json({
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
			return res.status(resultRes.status).json({
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
	logger?.info(`-getHardWare`);
	//
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
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
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	} catch (error) {
		//
		logger?.error(`${error}`);
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
}); //getHardWare
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