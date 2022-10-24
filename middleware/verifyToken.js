const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const config = require('../config.global');
const { Tokens } = require('../models');
const { logger } = require("../utils/logger");
//
//
const todayDate = moment(new Date())?.format('YYYY-MM-DD');
//
exports.verify = async (req, res, next) => {
	//
	if (!req.body.SessionName) {
		res.setHeader('Content-Type', 'application/json');
		res.status(422).json({
			"Status": {
				"erro": true,
				"status": 422,
				"message": "SessionName não informado, verifique e tente novamente"
			}
		});
	} else {
		if (parseInt(config.VALIDATE_MYSQL) == true) {
			//const conn = require('../config/dbConnection').promise();
			const theTokenAuth = req.body.SessionName.replace(/\r?\n|\r|\s+/g, "");
			//
			try {
				//
				if (theTokenAuth) {
					console?.log("- SessionName:", theTokenAuth);
				} else {
					res.setHeader('Content-Type', 'application/json');
					res.status(422).json({
						"Status": {
							"erro": true,
							"status": 422,
							"message": "Token não informado, verifique e tente novamente"
						}
					});
				}
				//
				const row = await Tokens.findOne({
					limit: 1,
					attributes: ['token', 'datafinal', 'active'],
					where: {
						token: theTokenAuth
					}
				}).then(async function (entries) {
					return entries;
				}).catch(async (err) => {
					console?.log('- Error:', err);
					return false;
				});
				//
				if (row) {
					//
					const tokenToken = row.token;
					const tokenEndDate = row.datafinal;
					const tokenActive = Boolean(row.active);
					//
					req.userToken = tokenToken;
					//
					if (!tokenActive) {
						res.setHeader('Content-Type', 'application/json');
						return res.status(401).json({
							"Status": {
								"erro": true,
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
								"erro": true,
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
							"erro": true,
							"status": 404,
							"message": "Token não encontrado, verifique e tente novamente"
						}
					});
				}
			} catch (err) {
				console?.log("- Error:", err);
				res.setHeader('Content-Type', 'application/json');
				return res.status(400).json({
					"Status": {
						"erro": true,
						"status": 400,
						"message": "Erro na verificação do token, contate o administrador do sistema"
					}
				});
			}
		} else {
			next();
		}
	}
}