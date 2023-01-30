'use strict';
//
// Configuração dos módulos
const os = require('os');
const fs = require('fs-extra');
const express = require("express");
const multer = require('multer');
const validUrl = require('valid-url');
const mime = require('mime-types');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const upload = multer({});
const router = express.Router();
const Sessions = require("../sessions.js");
const config = require('../config.global');
const verifyToken = require("../middleware/verifyToken");
const { Tokens } = require('../models');
const { logger } = require("../utils/logger");
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
String.prototype.toHHMMSS = function () {
	var sec_num = parseInt(this, 10); // não se esqueça do segundo parâmetro
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);
	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var time = hours + ':' + minutes + ':' + seconds;
	return time;
}
//
// ------------------------------------------------------------------------------------------------//
//
const convertBytes = function (bytes) {
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	if (bytes == 0) {
		return "n/a"
	}
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	if (i == 0) {
		return bytes + " " + sizes[i]
	}
	return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
//
router.post("/Start", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
						"state": Status.state,
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
					var wh_status = null;
					var wh_message = null;
					var wh_qrcode = null;
					var wh_connect = null;
					//
					if (parseInt(config.VALIDATE_MYSQL) == true) {
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
									token: removeWithspace(req.body.SessionName)
								}
							}).then(async function (entries) {
								return entries;
							}).catch(async (err) => {
								logger?.error(`- Error: ${err}`);
								return false;
							});
							//
							if (row.webhook) {
								//
								const webHook = row.webhook;
								//
								wh_status = webHook || null;
								wh_message = webHook || null;
								wh_qrcode = webHook || null;
								wh_connect = webHook || null;
								//
							} else {
								wh_status = req.body.wh_status || null;
								wh_message = req.body.wh_message || null;
								wh_qrcode = req.body.wh_qrcode || null;
								wh_connect = req.body.wh_connect || null;
							}
						} catch (err) {
							logger?.error(`- Erro: ${err}`);
						}
					} else {
						wh_status = req.body.wh_status || null;
						wh_message = req.body.wh_message || null;
						wh_qrcode = req.body.wh_qrcode || null;
						wh_connect = req.body.wh_connect || null;
					}
					//
					await Sessions.Start(req.io, removeWithspace(req.body.SessionName), removeWithspace(req.body.SessionName));
					let session = Sessions.getSession(removeWithspace(req.body.SessionName));
					//
					session.wh_status = wh_status;
					session.wh_message = wh_message;
					session.wh_qrcode = wh_qrcode;
					session.wh_connect = wh_connect;
					//
					//
					//
					try {
						var startupRes = {
							"AuthorizationToken": removeWithspace(req.body.SessionName),
							"SessionName": removeWithspace(req.body.SessionName),
							"wh_connect": wh_connect || null,
							"wh_qrcode": wh_qrcode || null,
							"wh_status": wh_status || null,
							"wh_message": wh_message || null
						};
						//
						fs.writeJson(`${config.PATCH_TOKENS}/${removeWithspace(req.body.SessionName)}.startup.json`, startupRes, (err) => {
							if (err) {
								logger?.error(`- Erro: ${err}`);
							} else {
								logger?.info('- Success startup config for user file');
							}
						});
					} catch (error) {
						logger?.error('- Error startup config for user file');
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
		logger?.error(`${error}`);
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
	logger?.info("- Obtendo status");
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
				logger?.error(`- Erro ao obter status: ${erro}`);
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
		logger?.error(`${error}`);
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
						var session = Sessions.getSession(removeWithspace(req.body.SessionName));
						var resultClose = await Sessions.closeSession(removeWithspace(req.body.SessionName));
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
				logger?.error(`- Erro ao fechar navegador\n ${erro}`);
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
		logger?.error(`${error}`);
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
					var session = Sessions.getSession(removeWithspace(req.body.SessionName));
					var resultLogout = await Sessions.logoutSession(removeWithspace(req.body.SessionName));
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
		logger?.error(`${error}`);
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
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			var resultRestart = await Sessions.restartToken(req.io, session.name, session.AuthorizationToken);
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(resultRestart.status).json({
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
	logger?.info(`- getQRCode`);
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
					var session = Sessions.getSession(removeWithspace(req.body.SessionName));
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
		logger?.error(`${error}`);
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
		logger?.error(`${error}`);
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
	logger?.info(`-getHardWare`);
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
		logger?.error(`${error}`);
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
/*
╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
*/
//
// Enviar Contato
router.post("/sendContactVcard", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.contact || !req.body.namecontact) {
			var resultRes = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(result.status).json({
				"Status": result
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status == 200 && checkNumberStatus.erro == false) {
						//
						var sendContactVcard = await Sessions.sendContactVcard(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							soNumeros(req.body.contact),
							req.body.namecontact
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendContactVcard.status).json({
							"Status": sendContactVcard
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendContactVcard.status).json({
							"Status": sendContactVcard
						});
						//
					}
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
		//
		logger?.error(`${error}`);
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
}); //sendContactVcard
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
// https://www.mpi.nl/corpus/html/lamus2/apa.html
//
router.post("/sendVoice", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.file) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.file.mimetype.split('/')[0];
			if (acceptedTypes !== "audio") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendPtt = await Sessions.sendPtt(
								removeWithspace(req.body.SessionName),
								checkNumberStatus.number + '@s.whatsapp.net',
								req.file.buffer,
								req.file.mimetype,
								req.body.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(sendPtt.status).json({
								"Status": sendPtt
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(checkNumberStatus.status).json({
								"Status": checkNumberStatus
							});
							//
						}
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
}); //sendVoice
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
router.post("/sendVoiceBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.originalname) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var mimeType = mime.lookup(req.body.originalname);
						//
						var sendPtt = await Sessions.sendPtt(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							Buffer.from(req.body.base64, 'base64'),
							mimeType,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendPtt.status).json({
							"Status": sendPtt
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
		//
		logger?.error(`${error}`);
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
}); //sendVoice
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
router.post("/sendVoiceFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.body.mimetype.split('/')[0];
			if (acceptedTypes !== "audio") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendPtt = await Sessions.sendPtt(
								removeWithspace(req.body.SessionName),
								checkNumberStatus.number + '@s.whatsapp.net',
								Buffer.from(req.body.base64, 'base64'),
								req.body.mimetype
							);
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(sendPtt.status).json({
								"Status": sendPtt
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(checkNumberStatus.status).json({
								"Status": checkNumberStatus
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //sendPttFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Texto
router.post("/sendText", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.msg) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendText = await Sessions.sendText(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							req.body.msg
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendText.status).json({
							"Status": sendText
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
		//
		logger?.error(`${error}`);
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
}); //sendText
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar localização
router.post("/sendLocation", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.lat || !req.body.long || !req.body.local) {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendLocation = await Sessions.sendLocation(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							req.body.lat,
							req.body.long,
							req.body.local
						);
						//
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						res.status(sendLocation.status).json({
							"Status": sendLocation
						});
						//
					} else {
						//
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
		//
		logger?.error(`${error}`);
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
}); //sendLocation
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar links com preview
router.post("/sendLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.link || !req.body.descricao) {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					if (!validUrl.isUri(req.body.link)) {
						var validate = {
							"erro": true,
							"status": 401,
							"message": 'O link informado é invalido, corrija e tente novamente.'
						};
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(validate.status).json({
							"Status": validate
						});
						//
					}
					//
					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendLink = await Sessions.sendLink(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							req.body.link,
							req.body.descricao
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendLink.status).json({
							"Status": sendLink
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
}); //sendLinkPreview
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Imagem
router.post("/sendImage", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.file) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.file.mimetype.split('/')[0];
			if (acceptedTypes !== "image") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendPtt = await Sessions.sendImage(
								removeWithspace(req.body.SessionName),
								checkNumberStatus.number + '@s.whatsapp.net',
								req.file.buffer,
								req.file.mimetype,
								req.file.originalname,
								req.body.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(sendPtt.status).json({
								"Status": sendPtt
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							res.status(checkNumberStatus.status).json({
								"Status": checkNumberStatus
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendImageBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		//let ext = path.extname(file.originalname);
		//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
		//let ext = path.parse(req.file.originalname).ext;
		//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
		var mimeType = mime.lookup(req.body.originalname);
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFileBase64 = await Sessions.sendImage(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							Buffer.from(req.body.base64, 'base64'),
							req.body.originalname,
							mimeType,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendFileBase64.status).json({
							"Status": sendFileBase64
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
						});
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
	}
}); //sendFileBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendImageFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		//let ext = path.extname(file.originalname);
		//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
		//let ext = path.parse(req.file.originalname).ext;
		//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
		var mimeType = req.body.mimetype;
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var checkNumberStatus = await Sessions.checkNumberStatus(
						removeWithspace(req.body.SessionName),
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFileFromBase64 = await Sessions.sendImage(
							removeWithspace(req.body.SessionName),
							checkNumberStatus.number + '@s.whatsapp.net',
							Buffer.from(req.body.base64, 'base64'),
							req.body.originalname,
							req.body.mimetype,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendFileFromBase64.status).json({
							"Status": sendFileFromBase64
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
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
	}
	//
}); //sendFileFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFile", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.caption || !req.file) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendFile = await Sessions.sendFile(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						req.file.buffer,
						req.file.originalname,
						req.file.mimetype,
						req.body.caption
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFile.status).json({
						"Status": sendFile
					});
				} else {
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
					});
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
	//
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileUrl", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.url || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendFile = await Sessions.sendFileUrl(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						req.body.url,
						req.body.url.split('/').slice(-1)[0],
						mime.lookup(req.body.url.split('.').slice(-1)[0]),
						req.body.caption
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFile.status).json({
						"Status": sendFile
					});
				} else {
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
					});
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
}); //sendFileUrl
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				//var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'BLS-' + removeWithspace(req.body.SessionName) + '-'));
				//var filePath = path.join(folderName, req.body.originalname);
				//var base64Data = req.body.base64.replace(/^data:([A-Za-z-+/]+);base64,/,'');
				var mimeType = mime.lookup(req.body.originalname);
				//fs.writeFileSync(filePath, base64Data,  {encoding: 'base64'});
				//logger?.info(`- File ${filePath}`);
				//
				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendFileBase64 = await Sessions.sendFile(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						Buffer.from(req.body.base64, 'base64'),
						req.body.originalname,
						mimeType,
						req.body.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFileBase64.status).json({
						"Status": sendFileBase64
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
					});
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
}); //sendFileBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendFileFromBase64 = await Sessions.sendFile(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						Buffer.from(req.body.base64, 'base64'),
						req.body.originalname,
						req.body.mimetype,
						req.body.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFileFromBase64.status).json({
						"Status": sendFileFromBase64
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
	//
}); //sendFileFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar button
router.post("/sendButton", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.buttonMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendButton = await Sessions.sendButton(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						req.body.buttonMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendButton.status).json({
						"Status": sendButton
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //sendButton
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar template
router.post("/sendTemplate", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.templateMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendTemplate = await Sessions.sendTemplate(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						req.body.templateMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendTemplate.status).json({
						"Status": sendTemplate
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //sendButton
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar lista
router.post("/sendListMessage", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull || !req.body.listMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var sendListMessage = await Sessions.sendListMessage(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net',
						req.body.listMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendListMessage.status).json({
						"Status": sendListMessage
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //sendListMessage
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
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var getStatus = await Sessions.getStatus(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net'
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(getStatus.status).json({
						"Status": getStatus
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //getStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar contatos
router.post("/getAllContacts", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName)) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getAllContacts = await Sessions.getAllContacts(
					removeWithspace(req.body.SessionName)
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(getAllContacts.status).json({
					"Status": getAllContacts
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
}); //getAllContacts
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar chats
router.post("/getAllChats", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName)) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getAllChats = await Sessions.getAllChats(
					removeWithspace(req.body.SessionName)
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(getAllChats.status).json({
					"Status": getAllChats
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
}); //getAllChats
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar mensagens
router.post("/getAllMessage", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName)) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getAllMessage = await Sessions.getAllMessage(
					removeWithspace(req.body.SessionName)
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(getAllMessage.status).json({
					"Status": getAllMessage
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
}); //getAllMessage
//
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar grupos
router.post("/getAllGroups", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getAllGroups = await Sessions.getAllGroups(
					req.body.SessionName
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(getAllGroups.status).json({
					"Status": getAllGroups
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
}); //getAllGroups
//
// ------------------------------------------------------------------------------------------------------- //
//
// Obter o perfil do número
router.post("/getProfilePicFromServer", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var getProfilePicFromServer = await Sessions.getProfilePicFromServer(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net'
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(getProfilePicFromServer.status).json({
						"Status": getProfilePicFromServer
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //getProfilePicFromServer
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do número
router.post("/checkNumberStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //checkNumberStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
/*
╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
*/
//
// Enviar Contato
router.post("/sendContactVcardGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.contact || !req.body.namecontact) {
			var resultRes = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(result.status).json({
				"Status": result
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var sendContactVcard = await Sessions.sendContactVcard(
						removeWithspace(req.body.SessionName),
						req.body.groupId.trim() + '@g.us',
						soNumeros(req.body.contact),
						req.body.namecontact
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendContactVcard.status).json({
						"Status": sendContactVcard
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
		//
		logger?.error(`${error}`);
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
}); //sendContactVcardGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
// https://www.mpi.nl/corpus/html/lamus2/apa.html
//
router.post("/sendVoiceGrupo", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.file) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.file.mimetype.split('/')[0];
			if (acceptedTypes !== "audio") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var sendPtt = await Sessions.sendPtt(
							removeWithspace(req.body.SessionName),
							req.body.groupId.trim() + '@g.us',
							req.file.buffer,
							req.file.mimetype,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendPtt.status).json({
							"Status": sendPtt
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
}); //sendVoiceGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
router.post("/sendVoiceBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.originalname) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var mimeType = mime.lookup(req.body.originalname);
					//
					var sendPtt = await Sessions.sendPtt(
						removeWithspace(req.body.SessionName),
						req.body.groupId.trim() + '@g.us',
						Buffer.from(req.body.base64, 'base64'),
						mimeType,
						req.body.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendPtt.status).json({
						"Status": sendPtt
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
		//
		logger?.error(`${error}`);
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
}); //sendVoice
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
router.post("/sendVoiceFromBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.mimetype || !req.body.originalname) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.body.mimetype.split('/')[0];
			if (acceptedTypes !== "audio") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var sendPtt = await Sessions.sendPtt(
							removeWithspace(req.body.SessionName),
							req.body.groupId.trim() + '@g.us',
							Buffer.from(req.body.base64, 'base64'),
							req.body.mimetype
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendPtt.status).json({
							"Status": sendPtt
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //sendPttFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Texto em Grupo
router.post("/sendTextGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.msg) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendTextGrupo = await Sessions.sendText(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.msg
				);
				//
				//console?.log(result);
				res.setHeader('Content-Type', 'application/json');
				res.status(sendTextGrupo.status).json({
					"Status": sendTextGrupo
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
}); //sendTextGroup
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar localização no grupo
router.post("/sendLocationGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.lat || !req.body.long || !req.body.local) {
		//
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendLocationGroup = await Sessions.sendLocation(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.lat,
					req.body.long,
					req.body.local
				);
				//
				//console?.log(result);
				res.setHeader('Content-Type', 'application/json');
				res.status(sendLocationGroup.status).json({
					"Status": sendLocationGroup
				});
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
}); //sendLocationGroup
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar links com preview
router.post("/sendLinkGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.link || !req.body.descricao) {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					if (!validUrl.isUri(req.body.link)) {
						var validate = {
							"erro": true,
							"status": 401,
							"message": 'O link informado é invalido, corrija e tente novamente.'
						};
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(validate.status).json({
							"Status": validate
						});
						//
					}
					//
					var sendLink = await Sessions.sendLink(
						removeWithspace(req.body.SessionName),
						req.body.groupId.trim() + '@g.us',
						req.body.link,
						req.body.descricao
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendLink.status).json({
						"Status": sendLink
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
}); //sendLinkPreviewGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar imagen no grupo
router.post("/sendImageGrupo", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	try {
		if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.file) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			//let ext = path.extname(file.originalname);
			//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
			//let ext = path.parse(req.file.originalname).ext;
			//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
			let acceptedTypes = req.file.mimetype.split('/')[0];
			if (acceptedTypes !== "image") {
				//
				var validate = {
					"erro": true,
					"status": 400,
					"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(validate.status).json({
					"Status": validate
				});
				//
			} else {
				//
				var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
				var session = Sessions.getSession(removeWithspace(req.body.SessionName));
				switch (Status.status) {
					case 'inChat':
					case 'qrReadSuccess':
					case 'isLogged':
					case 'chatsAvailable':
						//

						var sendPtt = await Sessions.sendImage(
							removeWithspace(req.body.SessionName),
							req.body.groupId.trim() + '@g.us',
							req.file.buffer,
							req.file.mimetype,
							req.file.originalname,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						res.status(sendPtt.status).json({
							"Status": sendPtt
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
		}
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
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
}); //sendImageGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendImageBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		//let ext = path.extname(file.originalname);
		//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
		//let ext = path.parse(req.file.originalname).ext;
		//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
		var mimeType = mime.lookup(req.body.originalname);
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var sendFileBase64 = await Sessions.sendImage(
						removeWithspace(req.body.SessionName),
						req.body.groupId.trim() + '@g.us',
						Buffer.from(req.body.base64, 'base64'),
						req.body.originalname,
						mimeType,
						req.body.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFileBase64.status).json({
						"Status": sendFileBase64
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
	}
}); //sendFileBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendImageFromBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		//let ext = path.extname(file.originalname);
		//if (ext !== '.wav' || ext !== '.aifc' || ext !== '.aiff' || ext !== '.mp3' || ext !== '.m4a' || ext !== '.mp2' || ext !== '.ogg') {
		//let ext = path.parse(req.file.originalname).ext;
		//logger?.info(`- acceptedTypes: ${req.file.mimetype}`);
		var mimeType = req.body.mimetype;
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		} else {
			//
			var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
			var session = Sessions.getSession(removeWithspace(req.body.SessionName));
			switch (Status.status) {
				case 'inChat':
				case 'qrReadSuccess':
				case 'isLogged':
				case 'chatsAvailable':
					//

					var sendFileFromBase64 = await Sessions.sendImage(
						removeWithspace(req.body.SessionName),
						req.body.groupId.trim() + '@g.us',
						Buffer.from(req.body.base64, 'base64'),
						req.body.originalname,
						req.body.mimetype,
						req.body.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(sendFileFromBase64.status).json({
						"Status": sendFileFromBase64
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
	}
	//
}); //sendFileFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileGrupo", upload.single('file'), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.caption || !req.file) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendFile = await Sessions.sendFile(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.file.buffer,
					req.file.originalname,
					req.file.mimetype,
					req.body.caption
				);
				//
				//console?.log(result);
				res.setHeader('Content-Type', 'application/json');
				res.status(sendFile.status).json({
					"Status": sendFile
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
	//
}); //sendFileGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileUrlGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.url || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendFile = await Sessions.sendFileUrl(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.url,
					req.body.url.split('/').slice(-1)[0],
					mime.lookup(req.body.url.split('.').slice(-1)[0]),
					req.body.caption
				);
				//
				//console?.log(result);
				res.setHeader('Content-Type', 'application/json');
				res.status(sendFile.status).json({
					"Status": sendFile
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
}); //sendFileUrl
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var mimeType = mime.lookup(req.body.originalname);
				var sendFileBase64 = await Sessions.sendFile(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					Buffer.from(req.body.base64, 'base64'),
					req.body.originalname,
					mimeType,
					req.body.caption
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(sendFileBase64.status).json({
					"Status": sendFileBase64
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
}); //sendFileBase64Group
//
// ------------------------------------------------------------------------------------------------------- //
//
// Enviar arquivo/documento
router.post("/sendFileFromBase64Grupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendFileFromBase64 = await Sessions.sendFile(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					Buffer.from(req.body.base64, 'base64'),
					req.body.originalname,
					req.body.mimetype,
					req.body.caption
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(sendFileFromBase64.status).json({
					"Status": sendFileFromBase64
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
	//
}); //sendFileFromBase64Group
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar button
router.post("/sendButtonGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.buttonMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendButton = await Sessions.sendButton(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.buttonMessage,
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(sendButton.status).json({
					"Status": sendButton
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
}); //sendButton
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar template
router.post("/sendTemplateGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.templateMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendTemplate = await Sessions.sendTemplate(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.templateMessage,
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(sendTemplate.status).json({
					"Status": sendTemplate
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
}); //sendTemplateGrupo
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar lista
router.post("/sendListMessageGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.listMessage) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var sendListMessage = await Sessions.sendListMessage(
					removeWithspace(req.body.SessionName),
					req.body.groupId.trim() + '@g.us',
					req.body.listMessage,
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(sendListMessage.status).json({
					"Status": sendListMessage
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
}); //sendListMessageGrupo
//
// ------------------------------------------------------------------------------------------------------- //
//
//Deixar o grupo
router.post("/leaveGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var leaveGroup = await Sessions.leaveGroup(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us'
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(leaveGroup.status).json({
					"Status": leaveGroup
				});
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
}); //leaveGroup
//
// ------------------------------------------------------------------------------------------------------- //
//
// Criar grupo (título, participantes a adicionar)
router.post("/createGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.title || !req.body.participants) {
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
		if (req.body.title.length >= 25) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'O nome do grupo não pode exceder 25 caracter.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		}
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var contactlistValid = [];
				var contactlistInvalid = [];
				//
				var arrayNumbers = req.body.participants;
				//
				for (var i in arrayNumbers) {
					//console?.log(arrayNumbers[i]);
					var numero = soNumeros(arrayNumbers[i]);
					//
					if (numero.length !== 0) {
						//
						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(numero) + '@s.whatsapp.net'
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							contactlistValid.push(checkNumberStatus.number + '@s.whatsapp.net');
						} else {
							contactlistInvalid.push(numero + '@s.whatsapp.net');
						}
						//
					}
					//
				}
				//
				var createGroup = await Sessions.createGroup(
					removeWithspace(req.body.SessionName),
					req.body.title,
					contactlistValid,
					contactlistInvalid
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(createGroup.status).json({
					"Status": createGroup
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
}); //createGroup
//
// ------------------------------------------------------------------------------------------------------- //
//
// update Group Title
router.post("/updateGroupTitle", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.title) {
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
		if (req.body.title.length >= 25) {
			var validate = {
				"erro": true,
				"status": 400,
				"message": 'O nome do grupo não pode exceder 25 caracter.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		}
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var updateGroupTitle = await Sessions.updateGroupTitle(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					req.body.title,
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(updateGroupTitle.status).json({
					"Status": updateGroupTitle
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
}); //updateGroupTitle
//
// ------------------------------------------------------------------------------------------------------- //
//
// update Group desc
router.post("/updateGroupDesc", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.desc) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var updateGroupDesc = await Sessions.updateGroupDesc(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					req.body.desc,
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(updateGroupDesc.status).json({
					"Status": updateGroupDesc
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
}); //updateGroupDesc
//
// ------------------------------------------------------------------------------------------------//
//
// Obtenha membros do grupo
router.post("/getGroupMembers", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getGroupMembers = await Sessions.getGroupMembers(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us'
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(getGroupMembers.status).json({
					"Status": getGroupMembers
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
}); //getGroupMembers
//
// ------------------------------------------------------------------------------------------------//
//
// Gerar link de url de convite de grupo
router.post("/getGroupInviteLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var GroupInviteLink = await Sessions.getGroupInviteLink(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us'
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(GroupInviteLink.status).json({
					"Status": GroupInviteLink
				});
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
}); //getGroupInviteLink
//
// ------------------------------------------------------------------------------------------------//
//
// Gerar link de url de convite de grupo
router.post("/getGroupRevokeInviteLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var GroupInviteLink = await Sessions.getGroupRevokeInviteLink(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us'
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(GroupInviteLink.status).json({
					"Status": GroupInviteLink
				});
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
}); //getGroupRevokeInviteLink
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/removeParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.participants) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var contactlistValid = [];
				var contactlistInvalid = [];
				//
				var arrayNumbers = req.body.participants;
				//
				for (var i in arrayNumbers) {
					//console?.log(arrayNumbers[i]);
					var numero = soNumeros(arrayNumbers[i]);
					//
					if (numero.length !== 0) {
						//
						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(numero) + '@s.whatsapp.net'
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							contactlistValid.push(checkNumberStatus.number + '@s.whatsapp.net');
						} else {
							contactlistInvalid.push(numero + '@s.whatsapp.net');
						}
						//
					}
					//
				}
				//
				var removeParticipant = await Sessions.removeParticipant(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					contactlistValid,
					contactlistInvalid
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(removeParticipant.status).json({
					"Status": removeParticipant
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
	//
}); //removeParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Adicionar participante
router.post("/addParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.participants) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var contactlistValid = [];
				var contactlistInvalid = [];
				//
				var arrayNumbers = req.body.participants;
				//
				for (var i in arrayNumbers) {
					//console?.log(arrayNumbers[i]);
					var numero = soNumeros(arrayNumbers[i]);
					//
					if (numero.length !== 0) {
						//
						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(numero) + '@s.whatsapp.net'
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							contactlistValid.push(checkNumberStatus.number + '@s.whatsapp.net');
						} else {
							contactlistInvalid.push(numero + '@s.whatsapp.net');
						}
						//
					}
					//
				}
				//
				var addParticipant = await Sessions.addParticipant(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					contactlistValid,
					contactlistInvalid
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(addParticipant.status).json({
					"Status": addParticipant
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
	//
}); //addParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Promote participant (Give admin privileges)
router.post("/promoteParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.participants) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var contactlistValid = [];
				var contactlistInvalid = [];
				//
				var arrayNumbers = req.body.participants;
				//
				for (var i in arrayNumbers) {
					//console?.log(arrayNumbers[i]);
					var numero = soNumeros(arrayNumbers[i]);
					//
					if (numero.length !== 0) {
						//
						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(numero) + '@s.whatsapp.net'
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							contactlistValid.push(checkNumberStatus.number + '@s.whatsapp.net');
						} else {
							contactlistInvalid.push(numero + '@s.whatsapp.net');
						}
						//
					}
					//
				}
				//
				var promoteParticipant = await Sessions.promoteParticipant(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					contactlistValid,
					contactlistInvalid
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(promoteParticipant.status).json({
					"Status": promoteParticipant
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
	//
}); //promoteParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Depromote participant (Give admin privileges)
router.post("/demoteParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.groupId || !req.body.participants) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var contactlistValid = [];
				var contactlistInvalid = [];
				//
				var arrayNumbers = req.body.participants;
				//
				for (var i in arrayNumbers) {
					//console?.log(arrayNumbers[i]);
					var numero = soNumeros(arrayNumbers[i]);
					//
					if (numero.length !== 0) {
						//
						var checkNumberStatus = await Sessions.checkNumberStatus(
							removeWithspace(req.body.SessionName),
							soNumeros(numero) + '@s.whatsapp.net'
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							contactlistValid.push(checkNumberStatus.number + '@s.whatsapp.net');
						} else {
							contactlistInvalid.push(numero + '@s.whatsapp.net');
						}
						//
					}
					//
				}
				//
				var demoteParticipant = await Sessions.demoteParticipant(
					removeWithspace(req.body.SessionName),
					req.body.groupId + '@g.us',
					contactlistValid,
					contactlistInvalid
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(demoteParticipant.status).json({
					"Status": demoteParticipant
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
	//
}); //demoteParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Retorna o status do grupo, jid, descrição do link de convite
router.post("/getGroupInfoFromInviteLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.inviteCode) {
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
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getGroupInfoFromInviteLink = await Sessions.getGroupInfoFromInviteLink(
					removeWithspace(req.body.SessionName),
					req.body.inviteCode
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(getGroupInfoFromInviteLink.status).json({
					"Status": getGroupInfoFromInviteLink
				});
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
}); //getGroupInfoFromInviteLink
//
// ------------------------------------------------------------------------------------------------//
//
// Junte-se a um grupo usando o código de convite do grupo
router.post("/joinGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.inviteCode) {
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
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var getGroupInfoFromInviteLink = await Sessions.joinGroup(
					removeWithspace(req.body.SessionName),
					req.body.inviteCode
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(getGroupInfoFromInviteLink.status).json({
					"Status": getGroupInfoFromInviteLink
				});
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
}); //joinGroup
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
// Recuperar status de contato
router.post("/getPerfilStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.phonefull) {
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
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		//
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var checkNumberStatus = await Sessions.checkNumberStatus(
					removeWithspace(req.body.SessionName),
					soNumeros(req.body.phonefull).trim()
				);
				//
				if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
					//
					var getStatus = await Sessions.getPerfilStatus(
						removeWithspace(req.body.SessionName),
						checkNumberStatus.number + '@s.whatsapp.net'
					);
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(getStatus.status).json({
						"Status": getStatus
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(checkNumberStatus.status).json({
						"Status": checkNumberStatus
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
}); //getStatus
//
//
// ------------------------------------------------------------------------------------------------//
//
// Set client status
router.post("/setProfileStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.ProfileStatus) {
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(validate.status).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var setProfileStatus = await Sessions.setProfileStatus(
					removeWithspace(req.body.SessionName),
					req.body.ProfileStatus
				);
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(setProfileStatus.status).json({
					"Status": setProfileStatus
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
}); //setProfileStatus
//
// ------------------------------------------------------------------------------------------------//
//
// Set client profile name
router.post("/setProfileName", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	if (!removeWithspace(req.body.SessionName) || !req.body.ProfileName) {
		var validate = {
			result: "info",
			state: 'FAILURE',
			status: 'notProvided',
			message: 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(400).json({
			"Status": validate
		});
		//
	} else {
		//
		var Status = await Sessions.ApiStatus(removeWithspace(req.body.SessionName));
		var session = Sessions.getSession(removeWithspace(req.body.SessionName));
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//

				var setProfileName = await Sessions.setProfileName(
					removeWithspace(req.body.SessionName),
					req.body.ProfileName
				);
				res.setHeader('Content-Type', 'application/json');
				res.status(200).json({
					"Status": setProfileName
				});
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
}); //setProfileName
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', upload.none(''), async (req, res, next) => {
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