const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const Sessions = require("../controllers/sessions");
const { logger } = require("../utils/logger");
const { Tokens } = require('../models');
const webhooks = require('../controllers/webhooks');
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
module.exports = class Mensagens {
	/*
	╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
	╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤
	╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
	*/
	//
	// Enviar Contato
	static async sendContactVcard(
		SessionName,
		number,
		contact,
		namecontact
	) {
		//
		logger?.info("- Enviando contato.");
		logger?.info(`- SessionName: ${SessionName}`);
		//
		var session = Sessions.getSession(SessionName);
		// send a contact!
		const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
			+ 'VERSION:3.0\n'
			+ 'FN:' + namecontact + '\n' // full name
			+ 'ORG:' + namecontact + ';\n' // the organization of the contact
			+ 'TEL;type=CELL;type=VOICE;waid=' + contact + ':' + contact + '\n' // WhatsApp ID + phone number
			+ 'END:VCARD';
		//
		return await await session.client.sendMessage(
			number,
			{
				contacts: {
					displayName: namecontact,
					contacts: [{ vcard }]
				}
			}
		).then(async (result) => {
			//logger?.info('Result: ', result); //return object success
			//
			var result = {
				"erro": false,
				"status": 200,
				"message": "Contato envido com sucesso."
			};
			//
			return result;
			//
		}).catch((erro) => {
			logger?.error(`- Error when: ${erro}`);
			//
			var result = {
				"erro": true,
				"status": 404,
				"message": "Erro ao enviar contato"
			};
			//
			return result;
			//
		});
		//
	} //sendContactVcard
	//
	// ------------------------------------------------------------------------------------------------//
	//
}