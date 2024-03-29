const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const config = require('../config.global');
const { Tokens } = require('../models');
const { logger } = require("../utils/logger");
//
const todayDate = moment(new Date())?.format('YYYY-MM-DD');
//
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	var string = string?.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
	return string;
}
//
// ------------------------------------------------------------------------------------------------//
//
exports.verify = async (req, res, next) => {
	//
	let theTokenAuth;
	//
	if (!req?.headers?.authorizationtoken) {
		res.setHeader('Content-Type', 'application/json');
		return res.status(422).json({
			"Status": {
				"error": true,
				"status": 422,
				"message": "Token não informado, verifique e tente novamente"
			}
		});
	} else {
		theTokenAuth = removeWithspace(req?.headers?.authorizationtoken);
	}
	//
	//
	if (parseInt(config.VALIDATE_MYSQL) == true) {
		//
		try {
			//
			const row = await Tokens.findOne({
				limit: 1,
				attributes: ['AuthorizationToken', 'datafinal', 'active'],
				where: {
					AuthorizationToken: theTokenAuth
				}
			}).then(async (entries) => {
				return entries;
			}).catch(async (err) => {
				logger?.error(`- Error: ${err}`);
				return false;
			}).finally(async () => {
    		//Tokens.release();
  		});
			//
			if (row) {
				//
				const tokenToken = row.AuthorizationToken;
				const tokenEndDate = row.datafinal;
				const tokenActive = Boolean(row.active);
				//
				req.userToken = tokenToken;
				//
				if (!tokenActive) {
					res.setHeader('Content-Type', 'application/json');
					return res.status(401).json({
						"Status": {
							"error": true,
							"status": 401,
							"message": "Token não habilitado para uso, contate o administrador do sistema"
						}
					});
				}
				//
				if (todayDate > tokenEndDate) {
					res.setHeader('Content-Type', 'application/json');
					return res.status(408).json({
						"Status": {
							"error": true,
							"status": 408,
							"message": "Token vencido, contate o administrador do sistema"
						}
					});
				}
				//
				next();
			} else {
				res.setHeader('Content-Type', 'application/json');
				return res.status(404).json({
					"Status": {
						"error": true,
						"status": 404,
						"message": "Token não encontrado, verifique e tente novamente"
					}
				});
			}
		} catch (err) {
			logger?.error(`- Error: ${err}`);
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"error": true,
					"status": 400,
					"message": "Erro na verificação do token, contate o administrador do sistema"
				}
			});
		}
	} else {
		//
		if (config.SECRET_KEY != theTokenAuth) {
			res.setHeader('Content-Type', 'application/json');
			return res.status(408).json({
				"Status": {
					"error": true,
					"status": 404,
					"message": "Token invalido, verifique e tente novamente"
				}
			});
		}
		//
		next();
	}
}