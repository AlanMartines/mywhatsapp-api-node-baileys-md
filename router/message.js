//
// Configuração dos módulos
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
	try {
		//logger.info(`- Removendo todas as quebras de linha e espaços`);
		let result = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
		return result;
	} catch (error) {
		//logger.error(`- Erro ao remover todas as quebras de linha e espaços: ${error?.message}`);
		return string;
	}
}
//
// ------------------------------------------------------------------------------------------------//
//
function soNumeros(string) {
	try {
		logger.info(`- Removendo todos os caracteres que não são números`);
		let result = string.replace(/[^0-9]/g, '');
		return result;
	} catch (error) {
		logger.error(`- Erro ao remover todos os caracteres que não são números: ${error?.message}`);
		return string;
	}
}
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar Contato
router.post("/sendContactVcard", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.contact || !req?.body?.namecontact) {
			var resultRes = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status == 200 && checkNumber.error == false) {
							//
							var sendContactVcard = await message?.sendContactVcard(
								resSessionName,
								checkNumber.number,
								soNumeros(req?.body?.contact),
								req?.body?.namecontact
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
						"error": true,
						"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req.file) {
			var validate = {
				"error": true,
				"statusCode": 400,
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
					"error": true,
					"statusCode": 400,
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
							var checkNumber = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(req?.body?.phonefull)
							);
							//
							if (checkNumber.status === 200 && checkNumber.error === false) {
								//
								var sendPtt = await message?.sendPtt(
									resSessionName,
									checkNumber.number,
									req.file.buffer,
									req.file.mimetype,
									req?.body?.caption
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
								return res.status(checkNumber.status).json({
									"Status":  checkNumber
								});
								//
							}
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.originalname) {
			var validate = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var mimeType = mime.lookup(req?.body?.originalname);
							//
							var sendPtt = await message?.sendPtt(
								resSessionName,
								checkNumber.number,
								Buffer.from(req?.body?.base64, 'base64'),
								mimeType,
								req?.body?.caption
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
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
						"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname) {
			var validate = {
				"error": true,
				"statusCode": 400,
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
			let acceptedTypes = req?.body?.mimetype.split('/')[0];
			if (acceptedTypes !== "audio") {
				//
				var validate = {
					"error": true,
					"statusCode": 400,
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
							var checkNumber = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(req?.body?.phonefull)
							);
							//
							if (checkNumber.status === 200 && checkNumber.error === false) {
								//
								var sendPtt = await message?.sendPtt(
									resSessionName,
									checkNumber.number,
									Buffer.from(req?.body?.base64, 'base64'),
									req?.body?.mimetype
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
								return res.status(checkNumber.status).json({
									"Status":  checkNumber
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
							"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.msg) {
			var validate = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var sendText = await message?.sendText(
								resSessionName,
								checkNumber.number,
								req?.body?.msg
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
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
						"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.lat || !req?.body?.long || !req?.body?.local) {
			//
			var validate = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var sendLocation = await message?.sendLocation(
								resSessionName,
								checkNumber.number,
								req?.body?.lat,
								req?.body?.long,
								req?.body?.local
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
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
						"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req?.body?.link || !req?.body?.descricao) {
			//
			var validate = {
				"error": true,
				"statusCode": 400,
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
						if (!await Sessions.isURL(req?.body?.link)) {
							var validate = {
								"error": true,
								"statusCode": 401,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var sendLink = await message?.sendLink(
								resSessionName,
								checkNumber.number,
								req?.body?.link,
								req?.body?.descricao
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
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
						"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.phonefull || !req.file) {
			var validate = {
				"error": true,
				"statusCode": 400,
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
					"error": true,
					"statusCode": 400,
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
							var checkNumber = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(req?.body?.phonefull)
							);
							//
							if (checkNumber.status === 200 && checkNumber.error === false) {
								//
								var sendPtt = await message?.sendImage(
									resSessionName,
									checkNumber.number,
									req.file.buffer,
									req.file.mimetype,
									req.file.originalname,
									req?.body?.caption
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
								return res.status(checkNumber.status).json({
									"Status":  checkNumber
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
							"statusCode": 400,
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
			"error": true,
			"statusCode": 403,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
		var mimeType = mime.lookup(req?.body?.originalname);
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var sendFileBase64 = await message?.sendImage(
								resSessionName,
								checkNumber.number,
								Buffer.from(req?.body?.base64, 'base64'),
								req?.body?.originalname,
								mimeType,
								req?.body?.caption
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
							});
						}
						//
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
		var mimeType = req?.body?.mimetype;
		let acceptedTypes = mimeType.split('/')[0];
		if (acceptedTypes !== "image") {
			//
			var validate = {
				"error": true,
				"statusCode": 400,
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
						var checkNumber = await retrieving?.checkNumberStatus(
							resSessionName,
							soNumeros(req?.body?.phonefull)
						);
						//
						if (checkNumber.status === 200 && checkNumber.error === false) {
							//
							var sendFileFromBase64 = await message?.sendImage(
								resSessionName,
								checkNumber.number,
								Buffer.from(req?.body?.base64, 'base64'),
								req?.body?.originalname,
								req?.body?.mimetype,
								req?.body?.caption
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
							return res.status(checkNumber.status).json({
								"Status":  checkNumber
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
						"statusCode": 400,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.caption || !req.file) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendFile = await message?.sendFile(
							resSessionName,
							checkNumber.number,
							req.file.buffer,
							req.file.originalname,
							req.file.mimetype,
							req?.body?.caption
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
						});
					}
					//
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.url || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendFile = await message?.sendFileUrl(
							resSessionName,
							checkNumber.number,
							req?.body?.url,
							req?.body?.url.split('/').slice(-1)[0],
							mime.lookup(req?.body?.url.split('.').slice(-1)[0]),
							req?.body?.caption
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
						});
					}
					//
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
					//var filePath = path.join(folderName, req?.body?.originalname);
					//var base64Data = req?.body?.base64.replace(/^data:([A-Za-z-+/]+);base64,/,'');
					var mimeType = mime.lookup(req?.body?.originalname);
					//fs.writeFileSync(filePath, base64Data,  {encoding: 'base64'});
					//logger?.info(`- File ${filePath}`);
					//
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendFileBase64 = await message?.sendFile(
							resSessionName,
							checkNumber.number,
							Buffer.from(req?.body?.base64, 'base64'),
							req?.body?.originalname,
							mimeType,
							req?.body?.caption
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
						});
					}
					//
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendFileFromBase64 = await message?.sendFile(
							resSessionName,
							checkNumber.number,
							Buffer.from(req?.body?.base64, 'base64'),
							req?.body?.originalname,
							req?.body?.mimetype,
							req?.body?.caption
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
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
					"statusCode": 400,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.buttonMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendButton = await message?.sendButton(
							resSessionName,
							checkNumber.number,
							req?.body?.buttonMessage,
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
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
					"statusCode": 400,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.templateMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendTemplate = await message?.sendTemplate(
							resSessionName,
							checkNumber.number,
							req?.body?.templateMessage,
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
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
					"statusCode": 400,
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.listMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendListMessage = await message?.sendListMessage(
							resSessionName,
							checkNumber.number,
							req?.body?.listMessage,
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
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
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
					"statusCode": 400,
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
//Enviar lista
router.post("/sendPoll", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.phonefull || !req?.body?.poll) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
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
					var checkNumber = await retrieving?.checkNumberStatus(
						resSessionName,
						soNumeros(req?.body?.phonefull)
					);
					//
					if (checkNumber.status === 200 && checkNumber.error === false) {
						//
						var sendPoll = await message?.sendPoll(
							resSessionName,
							checkNumber.number,
							req?.body?.poll,
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendPoll.status).json({
							"Status": sendPoll
						});
						//
					} else {
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(checkNumber.status).json({
							"Status":  checkNumber
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
					"statusCode": 400,
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
		"error": true,
		"statusCode": 404,
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