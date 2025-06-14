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
const group = require("../functions/group");
const retrieving = require("../functions/retrieving");
const Sessions = require('../controllers/sessions');
const { logger } = require("../utils/logger");
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
╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
*/
//
// Enviar Contato
router.post("/sendContactVcardGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req?.body?.contact || !req?.body?.namecontact) {
			var resultRes = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(result.statusCode).json({
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
						var sendContactVcard = await message?.sendContactVcard(
							resSessionName,
							req?.body?.groupId.trim() + '@g.us',
							soNumeros(req?.body?.contact),
							req?.body?.namecontact
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendContactVcard.statusCode).json({
							"Status": sendContactVcard
						});
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
					return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req.file) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
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
				return res.status(validate.statusCode).json({
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
							var sendPtt = await message?.sendPtt(
								resSessionName,
								req?.body?.groupId.trim() + '@g.us',
								req.file.buffer,
								req.file.mimetype,
								req?.body?.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendPtt.statusCode).json({
								"Status": sendPtt
							});
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
						return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.originalname) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
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
						var mimeType = mime.lookup(req?.body?.originalname);
						//
						var sendPtt = await message?.sendPtt(
							resSessionName,
							req?.body?.groupId.trim() + '@g.us',
							Buffer.from(req?.body?.base64, 'base64'),
							mimeType,
							req?.body?.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendPtt.statusCode).json({
							"Status": sendPtt
						});
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
					return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
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
				return res.status(validate.statusCode).json({
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
							var sendPtt = await message?.sendPtt(
								resSessionName,
								req?.body?.groupId.trim() + '@g.us',
								Buffer.from(req?.body?.base64, 'base64'),
								req?.body?.mimetype
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendPtt.statusCode).json({
								"Status": sendPtt
							});
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
						return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.msg) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var sendTextGrupo = await message?.sendText(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.msg
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendTextGrupo.statusCode).json({
						"Status": sendTextGrupo
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.lat || !req?.body?.long || !req?.body?.local) {
		//
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var sendLocationGroup = await message?.sendLocation(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.lat,
						req?.body?.long,
						req?.body?.local
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendLocationGroup.statusCode).json({
						"Status": sendLocationGroup
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req?.body?.link || !req?.body?.descricao) {
			//
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
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
							return res.status(validate.statusCode).json({
								"Status": validate
							});
							//
						}
						//
						var sendLink = await message?.sendLink(
							resSessionName,
							req?.body?.groupId.trim() + '@g.us',
							req?.body?.link,
							req?.body?.descricao
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendLink.statusCode).json({
							"Status": sendLink
						});
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
					return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	try {
		if (!resSessionName || !req?.body?.groupId || !req.file) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
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
				return res.status(validate.statusCode).json({
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
							var sendPtt = await message?.sendImage(
								resSessionName,
								req?.body?.groupId.trim() + '@g.us',
								req.file.buffer,
								req.file.mimetype,
								req.file.originalname,
								req?.body?.caption
							);
							//
							res.setHeader('Content-Type', 'application/json');
							return res.status(sendPtt.statusCode).json({
								"Status": sendPtt
							});
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
						return res.status(resultRes.statusCode).json({
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
		return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
			return res.status(validate.statusCode).json({
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
						var sendFileBase64 = await message?.sendImage(
							resSessionName,
							req?.body?.groupId.trim() + '@g.us',
							Buffer.from(req?.body?.base64, 'base64'),
							req?.body?.originalname,
							mimeType,
							req?.body?.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFileBase64.statusCode).json({
							"Status": sendFileBase64
						});
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
					return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
			return res.status(validate.statusCode).json({
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
						var sendFileFromBase64 = await message?.sendImage(
							resSessionName,
							req?.body?.groupId.trim() + '@g.us',
							Buffer.from(req?.body?.base64, 'base64'),
							req?.body?.originalname,
							req?.body?.mimetype,
							req?.body?.caption
						);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(sendFileFromBase64.statusCode).json({
							"Status": sendFileFromBase64
						});
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
					return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.caption || !req.file) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
					var sendFile = await message?.sendFile(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req.file.buffer,
						req.file.originalname,
						req.file.mimetype,
						req?.body?.caption
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendFile.statusCode).json({
						"Status": sendFile
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.url || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
					var sendFile = await message?.sendFileUrl(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.url,
						req?.body?.url.split('/').slice(-1)[0],
						mime.lookup(req?.body?.url.split('.').slice(-1)[0]),
						req?.body?.caption
					);
					//
					//console?.log(result);
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendFile.statusCode).json({
						"Status": sendFile
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
					var mimeType = mime.lookup(req?.body?.originalname);
					var sendFileBase64 = await message?.sendFile(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						Buffer.from(req?.body?.base64, 'base64'),
						req?.body?.originalname,
						mimeType,
						req?.body?.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendFileBase64.statusCode).json({
						"Status": sendFileBase64
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.base64 || !req?.body?.mimetype || !req?.body?.originalname || !req?.body?.caption) {
		var validate = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.statusCode).json({
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
					var sendFileFromBase64 = await message?.sendFile(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						Buffer.from(req?.body?.base64, 'base64'),
						req?.body?.originalname,
						req?.body?.mimetype,
						req?.body?.caption
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendFileFromBase64.statusCode).json({
						"Status": sendFileFromBase64
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.buttonMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var sendButton = await message?.sendButton(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.buttonMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendButton.statusCode).json({
						"Status": sendButton
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.templateMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var sendTemplate = await message?.sendTemplate(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.templateMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendTemplate.statusCode).json({
						"Status": sendTemplate
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.listMessage) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var sendListMessage = await message?.sendListMessage(
						resSessionName,
						req?.body?.groupId.trim() + '@g.us',
						req?.body?.listMessage,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(sendListMessage.statusCode).json({
						"Status": sendListMessage
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var leaveGroup = await group?.leaveGroup(
						resSessionName,
						req?.body?.groupId + '@g.us'
					);
					res.setHeader('Content-Type', 'application/json');
					return res.status(leaveGroup.statusCode).json({
						"Status": leaveGroup
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.title || !req?.body?.participants) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
			"Status": resultRes
		});
		//
	} else {
		//
		if (req?.body?.title.length >= 25) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'O nome do grupo não pode exceder 25 caracter.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
				"Status": validate
			});
			//
		}
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
					var contactlistValid = [];
					var contactlistInvalid = [];
					//
					var arrayNumbers = req?.body?.participants;
					//
					for (var i in arrayNumbers) {
						//console?.log(arrayNumbers[i]);
						var numero = soNumeros(arrayNumbers[i]);
						//
						if (numero.length !== 0) {
							//
							var checkNumberStatus = await retrieving.checkNumberStatus(
								resSessionName,
								soNumeros(numero)
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								contactlistValid.push(checkNumberStatus.number);
							} else {
								contactlistInvalid.push(numero);
							}
							//
						}
						//
					}
					//
					var createGroup = await group?.createGroup(
						resSessionName,
						req?.body?.title,
						contactlistValid,
						contactlistInvalid
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(createGroup.statusCode).json({
						"Status": createGroup
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.title) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
			"Status": resultRes
		});
		//
	} else {
		//
		if (req?.body?.title.length >= 25) {
			var validate = {
				"error": true,
				"statusCode": 400,
				"message": 'O nome do grupo não pode exceder 25 caracter.'
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(validate.statusCode).json({
				"Status": validate
			});
			//
		}
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
					var updateGroupTitle = await group?.updateGroupTitle(
						resSessionName,
						req?.body?.groupId + '@g.us',
						req?.body?.title,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(updateGroupTitle.statusCode).json({
						"Status": updateGroupTitle
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.desc) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var updateGroupDesc = await group?.updateGroupDesc(
						resSessionName,
						req?.body?.groupId + '@g.us',
						req?.body?.desc,
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(updateGroupDesc.statusCode).json({
						"Status": updateGroupDesc
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var getGroupMembers = await group?.getGroupMembers(
						resSessionName,
						req?.body?.groupId + '@g.us'
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(getGroupMembers.statusCode).json({
						"Status": getGroupMembers
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var GroupInviteLink = await group?.getGroupInviteLink(
						resSessionName,
						req?.body?.groupId + '@g.us'
					);
					res.setHeader('Content-Type', 'application/json');
					return res.status(GroupInviteLink.statusCode).json({
						"Status": GroupInviteLink
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var GroupInviteLink = await group?.getGroupRevokeInviteLink(
						resSessionName,
						req?.body?.groupId + '@g.us'
					);
					res.setHeader('Content-Type', 'application/json');
					return res.status(GroupInviteLink.statusCode).json({
						"Status": GroupInviteLink
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.participants) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var contactlistValid = [];
					var contactlistInvalid = [];
					//
					var arrayNumbers = req?.body?.participants;
					//
					for (var i in arrayNumbers) {
						//console?.log(arrayNumbers[i]);
						var numero = soNumeros(arrayNumbers[i]);
						//
						if (numero.length !== 0) {
							//
							var checkNumberStatus = await retrieving.checkNumberStatus(
								resSessionName,
								soNumeros(numero)
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								contactlistValid.push(checkNumberStatus.number);
							} else {
								contactlistInvalid.push(numero);
							}
							//
						}
						//
					}
					//
					var removeParticipant = await group?.removeParticipant(
						resSessionName,
						req?.body?.groupId + '@g.us',
						contactlistValid,
						contactlistInvalid
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(removeParticipant.statusCode).json({
						"Status": removeParticipant
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.participants) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var contactlistValid = [];
					var contactlistInvalid = [];
					//
					var arrayNumbers = req?.body?.participants;
					//
					for (var i in arrayNumbers) {
						//console?.log(arrayNumbers[i]);
						var numero = soNumeros(arrayNumbers[i]);
						//
						if (numero.length !== 0) {
							//
							var checkNumberStatus = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(numero)
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								contactlistValid.push(checkNumberStatus.number);
							} else {
								contactlistInvalid.push(numero);
							}
							//
						}
						//
					}
					//
					var addParticipant = await group?.addParticipant(
						resSessionName,
						req?.body?.groupId + '@g.us',
						contactlistValid,
						contactlistInvalid
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(addParticipant.statusCode).json({
						"Status": addParticipant
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.participants) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var contactlistValid = [];
					var contactlistInvalid = [];
					//
					var arrayNumbers = req?.body?.participants;
					//
					for (var i in arrayNumbers) {
						//console?.log(arrayNumbers[i]);
						var numero = soNumeros(arrayNumbers[i]);
						//
						if (numero.length !== 0) {
							//
							var checkNumberStatus = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(numero)
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								contactlistValid.push(checkNumberStatus.number);
							} else {
								contactlistInvalid.push(numero);
							}
							//
						}
						//
					}
					//
					var promoteParticipant = await group?.promoteParticipant(
						resSessionName,
						req?.body?.groupId + '@g.us',
						contactlistValid,
						contactlistInvalid
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(promoteParticipant.statusCode).json({
						"Status": promoteParticipant
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.groupId || !req?.body?.participants) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
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
					var contactlistValid = [];
					var contactlistInvalid = [];
					//
					var arrayNumbers = req?.body?.participants;
					//
					for (var i in arrayNumbers) {
						//console?.log(arrayNumbers[i]);
						var numero = soNumeros(arrayNumbers[i]);
						//
						if (numero.length !== 0) {
							//
							var checkNumberStatus = await retrieving?.checkNumberStatus(
								resSessionName,
								soNumeros(numero)
							);
							//
							if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
								//
								contactlistValid.push(checkNumberStatus.number);
							} else {
								contactlistInvalid.push(numero);
							}
							//
						}
						//
					}
					//
					var demoteParticipant = await group?.demoteParticipant(
						resSessionName,
						req?.body?.groupId + '@g.us',
						contactlistValid,
						contactlistInvalid
					);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(demoteParticipant.statusCode).json({
						"Status": demoteParticipant
					});
				});
				//
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.inviteCode) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
			"Status": resultRes
		});
		//
	} else {
		var Status = await instance?.Status(resSessionName);
		var session = await Sessions?.getSession(resSessionName);
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//
				await session.waqueue.add(async () => {
					var getGroupInfoFromInviteLink = await group?.getGroupInfoFromInviteLink(
						resSessionName,
						req?.body?.inviteCode
					);
					res.setHeader('Content-Type', 'application/json');
					return res.status(getGroupInfoFromInviteLink.statusCode).json({
						"Status": getGroupInfoFromInviteLink
					});
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
				return res.status(resultRes.statusCode).json({
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
const resSessionName = removeWithspace(req?.body?.SessionName);
	//
	if (!resSessionName || !req?.body?.inviteCode) {
		var resultRes = {
			"error": true,
			"statusCode": 400,
			"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.statusCode).json({
			"Status": resultRes
		});
		//
	} else {
		var Status = await instance?.Status(resSessionName);
		var session = await Sessions?.getSession(resSessionName);
		switch (Status.status) {
			case 'inChat':
			case 'qrReadSuccess':
			case 'isLogged':
			case 'chatsAvailable':
				//
				await session.waqueue.add(async () => {
					var getGroupInfoFromInviteLink = await group?.joinGroup(
						resSessionName,
						req?.body?.inviteCode
					);
					res.setHeader('Content-Type', 'application/json');
					return res.status(getGroupInfoFromInviteLink.statusCode).json({
						"Status": getGroupInfoFromInviteLink
					});
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
				return res.status(resultRes.statusCode).json({
					"Status": resultRes
				});
			//
		}
	}
}); //joinGroup
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', (req, res) => {
	//
	var resultRes = {
		"error": true,
		"statusCode": 404,
		"message": 'GROUP: Não foi possivel executar a ação, verifique a url informada.'
	};
	//
	res.setHeader('Content-Type', 'application/json');
	res.status(resultRes.statusCode).json({
		"Status": resultRes
	});
	//
});
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;