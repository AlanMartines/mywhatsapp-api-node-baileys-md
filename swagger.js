require('dotenv').config();
const config = require('./config.global');
if (config.DOMAIN_SSL) {
	var serverURL = `https://${config.DOMAIN_SSL}`;
} else {
	var serverURL = `http://${config.HOST}/${config.PORT}`;
}
module.exports = {
	"openapi": "3.0.0",
	"info": {
		"description": "Esta Api, segue os mesmos termos de serviço do WhatsApp. É importante que você leia atentamente a estes termos. Você é responsável pelo uso da ferramenta e pelas conseqüências do mau uso. Reforçamos que a API não é destinada para prática de SPAM e que o envio de mensagens indesejadas, viola os termos de serviço do WhatsApp. A violação dos termos pode acarretar no bloqueio e banimento definitivo de sua conta no WhatsApp.",
		"version": "1.0.0",
		"title": "API My WhatsApp"
	},
	"tags": [
		{
			"name": "Getting started",
			"description": "✔️"
		},
		{
			"name": "Basic Functions (usage)",
			"description": "✔️"
		},
		{
			"name": "Retrieving Data",
			"description": "✔️"
		},
		{
			"name": "Group Functions",
			"description": "✔️"
		},
		{
			"name": "Profile Functions",
			"description": "✔️"
		},
		{
			"name": "Device Functions",
			"description": "✔️"
		},
		{
			"name": "Phone connection verification",
			"description": "✔️"
		}
	],
	"servers": [
		{
			"description": "",
			"url": `${serverURL}`
		}
	],
	"components": {
		"securitySchemes": {

		}
	},
	"paths": {
		"/sistema/Start": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Iniciar sessão",
				"description": "",
				"requestBody": {
					"description": "Informe seu token se acesso.",
					"required": true,
					"requestBody": null,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"type": "string"
									}
								},
								"required": [
									"SessionName"
								]
							}
						}
					}
				},
				"security": [
					{
						"bearerAuth": []
					}
				],
				"responses": {
				}
			}
		},
		"/sistema/Status": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Status da sessão",
				"description": "Rota para verificar o estatus atual se uma sessão",
				"requestBody": {
					"description": "Informe seu token se acesso.",
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"type": "string"
									}
								},
								"required": [
									"SessionName"
								]
							}
						}
					}
				},
				"security": [
					{
						"bearerAuth": []
					}
				],
				"responses": {

				}
			}
		},
		"/sistema/Close": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Fechar a sessão",
				"description": "Rota para fechar a sessão",
				"requestBody": {
					"description": "Informe seu token se acesso.",
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"type": "string"
									}
								},
								"required": [
									"SessionName"
								]
							}
						}
					}
				},
				"security": [
					{
						"bearerAuth": []
					}
				],
				"responses": {

				}
			}
		},
		"/sistema/Logout": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Deslogar a sessão",
				"description": "Rota para deslogar a sessão",
				"requestBody": {
					"description": "Informe seu token se acesso.",
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"type": "string"
									}
								},
								"required": [
									"SessionName"
								]
							}
						}
					}
				},
				"security": [
					{
						"bearerAuth": []
					}
				],
				"responses": {

				}
			}
		}
	}
};