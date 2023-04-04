//
// Configuração dos módulos
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({});
const verifyToken = require("../middleware/verifyToken");
const instance = require("../functions/instance");
const retrieving = require("../functions/retrieving");
const gateway = require("../functions/gateway");
const Sessions = require('../controllers/sessions');
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
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
// Recuperar status de contato
router.post("/mkauthPlaySms", upload.none(''), async (req, res, next) => {
	//
	console.log(req.body);
	//
}); //mkauthPlaySms
//
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