//
// Configuração dos módulos
const express = require("express");
const multer = require('multer');
const upload = multer({});
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const getStatus = require("../functions/status");
const Command = require("../functions/commands");
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/Status", upload.none(''), verifyToken.verify, async (req, res, next) => {
	//
	console?.log("- Status");
	try {
		if (!Command.removeWithspace(req.body.SessionName)) {
			var resultRes = {
				"erro": true,
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
			try {
				var Status = await getStatus.ApiStatus(Command.removeWithspace(req.body.SessionName));
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(200).json({
					"Status": Status
				});
				//
			} catch (erro) {
				console?.log("- Erro ao obter status:", erro);
				var resultRes = {
					"erro": true,
					"status": 400,
					"message": 'Erro ao obter status'
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
		console?.log(error);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
}); //Status
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;