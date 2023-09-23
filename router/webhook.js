//
// Configuração dos módulos
const fs = require('fs-extra');
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const Sessions = require('../controllers/sessions');
const { logger } = require("../utils/logger");
const config = require('../config.global');
//
// ------------------------------------------------------------------------------------------------//
//
/*
╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═
║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗
╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩
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
router.post("/getConfig", verifyToken.verify, async (req, res, next) => {
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
			let existSession = await Sessions?.checkSession(resSessionName);
			if (existSession) {
				let dataSession = await Sessions?.getSession(resSessionName);
				//
				let resultRes = {
					"error": false,
					"status": 200,
					"webhook": {
							"wh_status": dataSession?.wh_status ? dataSession?.wh_status : null,
							"wh_message": dataSession?.wh_message ? dataSession?.wh_message : null,
							"wh_qrcode": dataSession?.wh_qrcode ? dataSession?.wh_qrcode : null,
							"wh_connect": dataSession?.wh_connect ? dataSession?.wh_connect : null
					},
					"message": 'Configuração obtida com sucesso'
				};
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(resultRes.status).json({
					"Status": resultRes
				});
				//
			} else {
				//
				var resultRes = {
					"error": true,
					"status": 404,
					"message": 'Não foi possivel obter configuração'
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
}); //getConfig
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/setConfig", upload.none(''), verifyToken.verify, async (req, res, next) => {
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
			let existSession = await Sessions?.checkSession(resSessionName);
			if (existSession) {
				let dataSession = await Sessions?.getSession(resSessionName);
				//
				try {
					//
					let startupRes = {
						"AuthorizationToken": theTokenAuth,
						"SessionName": resSessionName,
						"setOnline": dataSession?.setOnline ? dataSession?.setOnline : true,
						"wh_status": req?.body?.wh_status ? req?.body?.wh_status : null,
						"wh_message": req?.body?.wh_message ? req?.body?.wh_message : null,
						"wh_qrcode": req?.body?.wh_qrcode ? req?.body?.wh_qrcode : null,
						"wh_connect": req?.body?.wh_connect ? req?.body?.wh_connect : null
					};
					//
					fs.writeJson(`${config.PATCH_TOKENS}/${resSessionName}.startup.json`, startupRes, async (err) => {
						if (err) {
							logger?.error(`- Erro: ${err}`);
						} else {
							logger?.info('- Success startup config for user file');
							//
							let newSession = {
								"wh_status": req?.body?.wh_status ? req?.body?.wh_status : null,
								"wh_message": req?.body?.wh_message ? req?.body?.wh_message : null,
								"wh_qrcode": req?.body?.wh_qrcode ? req?.body?.wh_qrcode : null,
								"wh_connect": req?.body?.wh_connect ? req?.body?.wh_connect : null
							};
							await Sessions?.addInfoSession(resSessionName, newSession);
						}
					});
					//
					var resultRes = {
						"error": false,
						"status": 200,
						"webhook": {
								"wh_status": req?.body?.wh_status ? req?.body?.wh_status : null,
								"wh_message": req?.body?.wh_message ? req?.body?.wh_message : null,
								"wh_qrcode": req?.body?.wh_qrcode ? req?.body?.wh_qrcode : null,
								"wh_connect": req?.body?.wh_connect ? req?.body?.wh_connect : null
						},
						"message": 'Configuração atualizada com sucesso'
					};
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(resultRes.status).json({
						"Status": resultRes
					});
					//
				} catch (error) {
					logger?.error('- Error startup config for user file');
				}
				//
			} else {
				//
				var resultRes = {
					"error": true,
					"status": 404,
					"message": 'Não foi possivel executar a ação, verifique e tente vovamente.'
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
}); //setConfig
//
// ------------------------------------------------------------------------------------------------//
//
// rota url erro
router.all('*', (req, res) => {
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