//
// Configuração dos módulos
const express = require("express");
const multer = require('multer');
const upload = multer({});
const router = express.Router();
const Instace = require("../engine");
//
// ------------------------------------------------------------------------------------------------//
//
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