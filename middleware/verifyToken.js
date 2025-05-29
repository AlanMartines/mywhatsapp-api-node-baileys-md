const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const config = require('../config.global');
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
		//
		if (config.SECRET_KEY != theTokenAuth) {
			res.setHeader('Content-Type', 'application/json');
			return res.status(408).json({
				"Status": {
					"error": true,
					"statusCode": 404,
					"message": "Token invalido, verifique e tente novamente"
				}
			});
		}
		//
		next();
	}
}