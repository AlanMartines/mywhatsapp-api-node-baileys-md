require('dotenv').config();
const config = require('./config.global');
if (config.DOMAIN_SSL) {
	var serverURL = `https://${config.DOMAIN_SSL}`;
} else {
	var serverURL = `http://${config.HOST}:${config.PORT}`;
}
module.exports = {
	"openapi": "3.0.3",
	"info": {
		"description": "Esta Api, segue os mesmos termos de serviço do WhatsApp. É importante que você leia atentamente a estes termos. Você é responsável pelo uso da ferramenta e pelas conseqüências do mau uso. Reforçamos que a API não é destinada para prática de SPAM e que o envio de mensagens indesejadas, viola os termos de serviço do WhatsApp. A violação dos termos pode acarretar no bloqueio e banimento definitivo de sua conta no WhatsApp.",
		"version": "1.0.3",
		"title": "API - My WhatsApp"
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
			"url": `${serverURL}`,
			"description": ""
		}
	],
	"components": {
		"securitySchemes": {
			"ApiKeyAuth": {
				"type": "apiKey",
				"in": "header",
				"name": "AuthorizationToken"
			}
		},
		"schemas": {

		}
	},
	"paths": {
		"/sistema/Start": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Iniciar sessão",
				"description": "Comando que inicia a sessão.",
				"tags": [
				"Start"
				],
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"description": "Informe o nome da sessão",
										"type": "string",
										"default": "",
									}
								},
								"required": [
									"SessionName"
								]
							}
						},
						"application/json": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"type": "string",
										"default": "Informe o nome da sessão aqui",
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
						"ApiKeyAuth": []
					}
				],
				"responses": {
					"200": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": false,
											"status": 200,
											"message": "Sistema iniciado e disponivel para uso"
										}
									}
								}
							}
						}
					},

					"201": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": false,
											"status": 201,
											"message": "Sistema iniciando"
										}
									}
								}
							}
						}
					},

					"400": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 400,
											"message": 'Todos os valores deverem ser preenchidos, verifique e tente novamente.'
										}
									}
								}
							}
						}
					},

					"402": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 402,
											"message": 'Erro ao obter status, verifique e tente novamente.'
										}
									}
								}
							}
						}
					},

					"403": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 403,
											"message": "Não foi possivel executar a ação, verifique e tente novamente"
										}
									}
								}
							}
						}
					},

					"404": {
						"description": "Token não encontrado",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 404,
											"message": "Token não encontrado, verifique e tente novamente"
										}
									}
								}
							}
						}
					},

					"422": {
						"description": "Token não encontrado",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 422,
											"message": "Token não informado, verifique e tente novamente"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sistema/Status": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Status da sessão",
				"description": "Comando para retorno do status atual.",
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"description": "Informe seu token se acesso",
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
						"ApiKeyAuth": []
					}
				],
				"responses": {
					"200": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": false,
											"status": 200,
											"message": "Sistema iniciado e disponivel para uso"
										}
									}
								}
							}
						}
					},

					"400": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 400,
											"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
										}
									}
								}
							}
						}
					},

					"403": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 403,
											"message": "Não foi possivel executar a ação, verifique e tente novamente"
										}
									}
								}
							}
						}
					},

					"404": {
						"description": "Token não encontrado",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 404,
											"message": "Token não encontrado, verifique e tente novamente"
										}
									}
								}
							}
						}
					},

					"422": {
						"description": "Token não encontrado",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"erro": true,
											"status": 422,
											"message": "Token não informado, verifique e tente novamente"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sistema/Close": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Fechar a sessão",
				"description": "Comando que fecha a sessão.",
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"description": "Informe seu token se acesso",
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
						"ApiKeyAuth": []
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
				"description": "Comando que desloga a sessão.",
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"description": "Informe seu token se acesso",
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
						"ApiKeyAuth": []
					}
				],
				"responses": {

				}
			}
		},
		"/sistema/QRCode": {
			"post": {
				"tags": [
					"Getting started"
				],
				"summary": "Leitura do QR-Code",
				"description": "Comando usado para leitura do QR-Code.",
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"SessionName": {
										"description": "Informe seu token se acesso",
										"type": "string"
									},
									"View": {
										"description": "Exibir QR-Code",
										"type": "string",
										"in": "query",
										"default": true,
										"enum": [
											true,
											false
										],
									}
								},
								"required": [
									"SessionName",
									"View"
								]
							}
						}
					}
				},
				"security": [
					{
						"ApiKeyAuth": []
					}
				],
				"responses": {

				}
			}
		},

	}
};