//
// Configuração dos módulos
const osUtils = require('os-utils');
const os = require('os');
const fs = require('fs-extra');
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
	const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName) {
			var resultRes = {
				"error": true,
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
				let data = await instance?.Status(resSessionName);
				switch (data?.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(data.statusCode).json({
							"Status": data
						});
						//
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
					case 'serverWssNotConnected':
					case 'notFound':
						//
						await engine?.Start(req, res, next);
						//
						var resStatus = await instance?.Status(resSessionName);
						res.setHeader('Content-Type', 'application/json');
						return res.status(resStatus.statusCode).json({
							"Status": resStatus
						});
						//
						break;
					default:
						var resultRes = {
							statusCode: 404,
							"state": 'NOTFOUND',
							"status": 'notFound',
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
	} catch (error) {
		logger?.error(error);
		//
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
}); //Start
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/Status", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	logger?.info("- Obtendo status");
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			try {
				var Status = await instance?.Status(resSessionName);
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(Status.statusCode).json({
					"Status": Status
				});
				//
			} catch (erro) {
				logger?.error(`- Erro ao obter status: ${erro}`);
				var resultRes = {
					"error": true,
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
}); //Status
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/Close", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			try {
				let Status = await instance?.Status(resSessionName);
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
					case 'qrRead':
					case 'notLogged':
						//
						let resultClose = await instance?.closeSession(resSessionName);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(resultClose.status).json({
							"Status": resultClose
						});
						//
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
			} catch (erro) {
				logger?.error(`- Erro ao fechar navegador\n ${erro}`);
				var resultRes = {
					"error": true,
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
}); //Close
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/Logout", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			var Status = await instance.Status(resSessionName);
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var resultLogout = await instance.logoutSession(resSessionName);
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
		logger?.error(`${error}`);
		//
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
}); //Logout
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/restartToken", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			let resultRestart = await instance.restartToken(req, res, next);
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
}); //restartToken
//
// ------------------------------------------------------------------------------------------------//
//
// Gera o QR-Code
router.post("/QRCode", upload.none(''), verifyToken.verify, async (req, res, next) => {
	logger?.info(`- getQRCode`);
	//
	const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//
					var resultRes = { "error": false, "statusCode": 200, ...Status };
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultRes.statusCode).json({
						"Status": resultRes
					});
					//
					break;
				//
				case 'qrRead':
					//
					var session = await Sessions?.getSession(resSessionName);
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
							res.status(200);
							return res.end(imageBuffer);
							//
						} else {
							var resultRes = { "error": true, "statusCode": 400, ...Status };
							res.setHeader('Content-Type', 'application/json');
							return res.status(resultRes.statusCode).json({
								"Status": resultRes
							});
							//
						}
					} else if (req.body.View === false) {
						var resultRes = {
							"error": false,
							"statusCode": 200,
							"state": session.state,
							"status": session.status,
							"qrcode": session.qrcode,
							"message": "Aguardando leitura do QR-Code"
						};
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(resultRes.statusCode).json({
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
						"error": true,
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
		logger?.error(`${error}`);
		//
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
});
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSession", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
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
			var getSession = await instance?.getSession(resSessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(getSession.status).json({
				"Status": getSession
			});
		}
	} catch (error) {
		logger?.error(`${error}`);
		//
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
}); //getSession
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getAllSessions", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	var getSessions = await instance?.AllSessions();
	//
	if (getSessions?.session?.length) {
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(getSessions.status).json({
			"Status": getSessions
		});
		//
	} else {
		var resultRes = {
			"error": true,
			"status": 400,
			"message": 'Nenhuma sessão criada'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
	}
	//
}); //getSessions
//
// ------------------------------------------------------------------------------------------------//
//
// Dados de memoria e uptime
router.post("/getHardWare", upload.none(''), verifyToken.verify, async (req, res, next) => {
	logger?.info(`- getHardWare`);
	//
	try {
		const formatBytes = (bytes) => {
			const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
			if (bytes === 0) return "0 Bytes";
			const i = Math.floor(Math.log2(bytes) / 10);
			return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
		};

		const formatPercentage = (value) => `${Math.round(value * 100)}%`;

		const formatUptime = (seconds) => {
			const days = Math.floor(seconds / 86400);
			const hours = Math.floor((seconds % 86400) / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const remainingSeconds = seconds % 60;
			return `${days}d ${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
		};

		const cpuUsage = process.cpuUsage();

		const resultRes = {
			"error": false,
			"status": 200,
			"noformat": {
				"uptime": os.uptime(),
				"totalmem": os.totalmem(),
				"memusage": os.totalmem() - os.freemem(),
				"freemem": os.freemem(),
				"freeusagemem": (os.freemem() / os.totalmem()),
				"usagemem": (1 - os.freemem() / os.totalmem()),
				"cpuusage": (cpuUsage.user / (cpuUsage.user + cpuUsage.system)),
			},
			"format": {
				"uptime": formatUptime(os.uptime()).split('.')[0],
				"totalmem": formatBytes(os.totalmem()),
				"memusage": formatBytes(os.totalmem() - os.freemem()),
				"freemem": formatBytes(os.freemem()),
				"freeusagemem": formatPercentage(os.freemem() / os.totalmem()),
				"usagemem": formatPercentage(1 - os.freemem() / os.totalmem()),
				"cpuusage": formatPercentage(cpuUsage.user / (cpuUsage.user + cpuUsage.system)),
			},
		};

		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
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
}); //getHardWare
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', (req, res, next) => {
	//
	var resultRes = {
		"error": true,
		"status": 404,
		"message": 'Não foi possivel executar a ação, verifique a url informada.'
	};
	//
	res.setHeader('Content-Type', 'application/json');
	res.status(resultRes.status).json({
		"Status": resultRes
	});
	//
}); //All
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;