const config = require('../config.global');
const { logger } = require("../utils/logger");
//
// ------------------------------------------------------------------------------------------------//
//
function removeWithspace(string) {
	if (!string) return "";
	return string.replace(/\r?\n|\r|\s+/g, "");
}
//
// ------------------------------------------------------------------------------------------------//
//
exports.verify = (req, res, next) => {
	//
	const tokenHeader = req.headers.authorizationtoken;
	//
	if (!tokenHeader) {
		res.setHeader('Content-Type', 'application/json');
		return res.status(401).json({
			"Status": {
				"error": true,
				"status": 401,
				"message": "Token não informado, verifique e tente novamente"
			}
		});
	} else {
		const theTokenAuth = removeWithspace(tokenHeader);
		//
		if (config.SECRET_KEY !== theTokenAuth) {
			res.setHeader('Content-Type', 'application/json');
			return res.status(403).json({
				"Status": {
					"error": true,
					"statusCode": 403,
					"message": "Token invalido, verifique e tente novamente"
				}
			});
		}
		//
		next();
	}
}