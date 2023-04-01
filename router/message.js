//
// Configuração dos módulos
const fs = require('fs-extra');
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const mime = require('mime-types');
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
/*
╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
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
function soNumeros(string) {
	var numbers = string.replace(/[^0-9]/g, '');
	return numbers;
}
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar Contato
router.post("/sendContactVcard", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.body.contact || !req.body.namecontact) {
			var resultRes = {
				"erro": true,
				"status": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(result.status).json({
				"Status": result
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status == 200 && checkNumberStatus.erro == false) {
							//
							var sendContactVcard = await message?.sendContactVcard(
								resSessionName,
								checkNumberStatus.number,
								soNumeros(req.body.contact),
								req.body.namecontact
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendContactVcard.status).json({
								"Status": sendContactVcard
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendContactVcard.status).json({
								"Status": sendContactVcard
							});
							//
						}
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
}); //sendContactVcard
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
// https://www.mpi.nl/corpus/html/lamus2/apa.html
//
router.post("/sendVoice", upload.single('file'), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.file) {
			var validate = {
				"erro": true,
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
								soNumeros(req.body.phonefull).trim()
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								var sendPtt = await message?.sendPtt(
									resSessionName,
									checkNumberStatus.number,
									req.file.buffer,
									req.file.mimetype,
									req.body.caption
								);
								//
								res.setHeader('Content-Type', 'application/json');
								return res.status(sendPtt.status).json({
									"Status": sendPtt
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
						return res.status(resultRes.status).json({
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
		return res.status(resultRes.status).json({
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
		if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.originalname) {
			var validate = {
				"erro": true,
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var mimeType = mime.lookup(req.body.originalname);
							//
							var sendPtt = await message?.sendPtt(
								resSessionName,
								checkNumberStatus.number,
								Buffer.from(req.body.base64, 'base64'),
								mimeType,
								req.body.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendPtt.status).json({
								"Status": sendPtt
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
}); //sendVoice
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar audio
router.post("/sendVoiceFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname) {
			var validate = {
				"erro": true,
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
								soNumeros(req.body.phonefull).trim()
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								var sendPtt = await message?.sendPtt(
									resSessionName,
									checkNumberStatus.number,
									Buffer.from(req.body.base64, 'base64'),
									req.body.mimetype
								);
								//
								res.setHeader('Content-Type', 'application/json');
								return res.status(sendPtt.status).json({
									"Status": sendPtt
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
		return res.status(resultRes.status).json({
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
		if (!resSessionName || !req.body.phonefull || !req.body.msg) {
			var validate = {
				"erro": true,
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendText = await message?.sendText(
								resSessionName,
								checkNumberStatus.number,
								req.body.msg
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
}); //sendText
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar localização
router.post("/sendLocation", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.body.lat || !req.body.long || !req.body.local) {
			//
			var validate = {
				"erro": true,
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendLocation = await message?.sendLocation(
								resSessionName,
								checkNumberStatus.number,
								req.body.lat,
								req.body.long,
								req.body.local
							);
							//
							//console?.log(result);
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendLocation.status).json({
								"Status": sendLocation
							});
							//
						} else {
							//
							//console?.log(result);
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
}); //sendLocation
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar links com preview
router.post("/sendLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.body.link || !req.body.descricao) {
			//
			var validate = {
				"erro": true,
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
						if (!await Sessions.isURL(req.body.link)) {
							var validate = {
								"erro": true,
								"status": 401,
								"message": 'O link informado é invalido, verifique e tente novamente.'
							};
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(validate.status).json({
								"Status": validate
							});
							//
						}
						//
						var checkNumberStatus = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendLink = await message?.sendLink(
								resSessionName,
								checkNumberStatus.number,
								req.body.link,
								req.body.descricao
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendLink.status).json({
								"Status": sendLink
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
}); //sendLinkPreview
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Imagem
router.post("/sendImage", upload.single('file'), verifyToken.verify, async (req, res, next) => {
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
		if (!resSessionName || !req.body.phonefull || !req.file) {
			var validate = {
				"erro": true,
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
								soNumeros(req.body.phonefull).trim()
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								var sendPtt = await message?.sendImage(
									resSessionName,
									checkNumberStatus.number,
									req.file.buffer,
									req.file.mimetype,
									req.file.originalname,
									req.body.caption
								);
								//
								res.setHeader('Content-Type', 'application/json');
								return res.status(sendPtt.status).json({
									"Status": sendPtt
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
		return res.status(resultRes.status).json({
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendFileBase64 = await message?.sendImage(
								resSessionName,
								checkNumberStatus.number,
								Buffer.from(req.body.base64, 'base64'),
								req.body.originalname,
								mimeType,
								req.body.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendFileBase64.status).json({
								"Status": sendFileBase64
							});
							//
						} else {
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(checkNumberStatus.status).json({
								"Status": checkNumberStatus
							});
						}
						//
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
					return res.status(resultRes.status).json({
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
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
							soNumeros(req.body.phonefull).trim()
						);
						//
						if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
							//
							var sendFileFromBase64 = await message?.sendImage(
								resSessionName,
								checkNumberStatus.number,
								Buffer.from(req.body.base64, 'base64'),
								req.body.originalname,
								req.body.mimetype,
								req.body.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendFileFromBase64.status).json({
								"Status": sendFileFromBase64
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
	}
	//
}); //sendFileFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFile", upload.single('file'), verifyToken.verify, async (req, res, next) => {
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
	if (!resSessionName || !req.body.phonefull || !req.body.caption || !req.file) {
		var validate = {
			"erro": true,
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFile = await message?.sendFile(
							resSessionName,
							checkNumberStatus.number,
							req.file.buffer,
							req.file.originalname,
							req.file.mimetype,
							req.body.caption
						);
						//
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFile.status).json({
							"Status": sendFile
						});
					} else {
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
						});
					}
					//
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
				return res.status(resultRes.status).json({
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	if (!resSessionName || !req.body.phonefull || !req.body.url || !req.body.caption) {
		var validate = {
			"erro": true,
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFile = await message?.sendFileUrl(
							resSessionName,
							checkNumberStatus.number,
							req.body.url,
							req.body.url.split('/').slice(-1)[0],
							mime.lookup(req.body.url.split('.').slice(-1)[0]),
							req.body.caption
						);
						//
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFile.status).json({
							"Status": sendFile
						});
					} else {
						//console?.log(result);
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
						});
					}
					//
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
				return res.status(resultRes.status).json({
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
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
					//var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'BLS-' + resSessionName + '-'));
					//var filePath = path.join(folderName, req.body.originalname);
					//var base64Data = req.body.base64.replace(/^data:([A-Za-z-+/]+);base64,/,'');
					var mimeType = mime.lookup(req.body.originalname);
					//fs.writeFileSync(filePath, base64Data,  {encoding: 'base64'});
					//logger?.info(`- File ${filePath}`);
					//
					var checkNumberStatus = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFileBase64 = await message?.sendFile(
							resSessionName,
							checkNumberStatus.number,
							Buffer.from(req.body.base64, 'base64'),
							req.body.originalname,
							mimeType,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFileBase64.status).json({
							"Status": sendFileBase64
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkNumberStatus.status).json({
							"Status": checkNumberStatus
						});
					}
					//
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
				return res.status(resultRes.status).json({
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
	const theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	const theSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		var resSessionName = theTokenAuth;
	} else {
		var resSessionName = theSessionName;
	}
	//
	if (!resSessionName || !req.body.phonefull || !req.body.base64 || !req.body.mimetype || !req.body.originalname || !req.body.caption) {
		var validate = {
			"erro": true,
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendFileFromBase64 = await message?.sendFile(
							resSessionName,
							checkNumberStatus.number,
							Buffer.from(req.body.base64, 'base64'),
							req.body.originalname,
							req.body.mimetype,
							req.body.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFileFromBase64.status).json({
							"Status": sendFileFromBase64
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
	//
}); //sendFileFromBase64
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar button
router.post("/sendButton", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
	if (!resSessionName || !req.body.phonefull || !req.body.buttonMessage) {
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendButton = await message?.sendButton(
							resSessionName,
							checkNumberStatus.number,
							req.body.buttonMessage,
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendButton.status).json({
							"Status": sendButton
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
}); //sendButton
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar template
router.post("/sendTemplate", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
	if (!resSessionName || !req.body.phonefull || !req.body.templateMessage) {
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendTemplate = await message?.sendTemplate(
							resSessionName,
							checkNumberStatus.number,
							req.body.templateMessage,
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendTemplate.status).json({
							"Status": sendTemplate
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
}); //sendButton
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar lista
router.post("/sendListMessage", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
	if (!resSessionName || !req.body.phonefull || !req.body.listMessage) {
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
						soNumeros(req.body.phonefull).trim()
					);
					//
					if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
						//
						var sendListMessage = await message?.sendListMessage(
							resSessionName,
							checkNumberStatus.number,
							req.body.listMessage,
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendListMessage.status).json({
							"Status": sendListMessage
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
}); //sendListMessage
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