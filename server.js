'use strict';
//
const os = require('os');
const fs = require('fs-extra');
const express = require('express');
require('express-async-errors');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express')
//const latest = require('github-latest-release'); // verifica a ultima release no github
const latest = require('latest-version'); // verifica a ultima release no npm
const { version } = require('./package.json');
const { logger } = require("./utils/logger");
const AllSessions = require('./startup');
const Sessions = require('./controllers/sessions');
const config = require('./config.global');
const swaggerDocument = require('./swagger');//
const http = require('http').Server(app);
// https://www.scaleway.com/en/docs/tutorials/socket-io/
const io = require('socket.io')(http, {
	cors: {
		origins: ["*"],
		methods: ["GET", "POST"],
		transports: ['websocket', 'polling'],
		credentials: true
	},
	allowEIO3: true
});
//
const {
	yo
} = require('yoo-hoo');
//
yo('My-WhatsApp', {
	color: 'rainbow',
	spacing: 1,
});
//
// ------------------------------------------------------------------------------------------------//
//
fs.access(".env", fs.constants.F_OK, async (err) => {
	if (err && err.code === 'ENOENT') {
		logger.error('- Arquivo ".env"');
		var modelo = `
NODE_EN=production
#
# Defina o HOST aqui caso voce utilize uma VPS deve ser colocado o IP da VPS
# Exemplos:
# HOST=204.202.54.2 => IP da VPS, caso esteja usando virtualização via hospedagem
# HOST=10.0.0.10 => IP da VM, caso esteja usando virtualização
# HOST=localhost => caso esteja usando na sua proprima maquina local
# HOST=.0.0.0.0 => caso esteja usando em um cotainer
HOST=localhost
#
# Defina o numero da porta a ser usada pela API.
PORT=9009
#
# CASO UTILIZE CERTIFICADO SSL COM REDIRECIONAMENTO DE PORTA, DEVE PREENCHER A VARIAVEL DOMAIN_SSL
# CASO DE NÃO SER CONFIGURADO UM DOMÍNIO MATENHA A VARIAVEL DOMAIN_SSL VAZIA
# Exemplos:
# DOMAIN_SSL=api.meudomai.com.br ou meudomai.com.br
# DOMAIN_SSL=
DOMAIN_SSL=
#
# Define se o qrcode vai ser mostrado no terminal
VIEW_QRCODE_TERMINAL=0
#
# Define a pasta para os tokens
PATCH_TOKENS=/usr/local/tokens
#
# Device name
DEVICE_NAME='My-Whatsapp'
#
# Host name
HOST_NAME='ApiBaileysMd'
#
# Defina a versão do whatsapp a ser usada.
# CASO DE NÃO SER CONFIGURADO UM VERSÂO MATENHA A VARIAVEL WA_VERSION VAZIA
# Exemplos:
# WA_VERSION='2.2204.13'
# WA_VERSION=
#
WA_VERSION=
#
# Auto close
AUTO_CLOSE=10
#
# Chave de segurança para validação
SECRET_KEY=096e402586e2faa8db20d6b033c60
#
# Validate in terminal false or true
VALIDATE_MYSQL=1
#
CONCURRENCY=5
#
# mysql ou mariabd
MYSQL_ENGINE=mysql
#
# Vesão
MYSQL_VERSION=latest
#
# O host do banco. Ex: localhost
MYSQL_HOST=localhost
#
# Port do banco. Ex: 3306
MYSQL_PORT=3306
#
# Um usuário do banco. Ex: user
MYSQL_USER=root
#
# A senha do usuário do banco. Ex: user123
MYSQL_PASSWORD='aG3JirkjCtAA@'
#
# A base de dados a qual a p-queue irá se conectar. Ex: node_mysql
MYSQL_DATABASE=mywhatsapp-api
#
# A base de dados a qual a aplicação irá se conectar. Ex: node_mysql
MYSQL_DATABASE_QUEUE=mywhatsapp-api-queue
#
# Time Zone
MYSQL_TIMEZONE='-04:00'
#
# Time Zone
TZ='America/Sao_Paulo'
#
# Gag image
TAG=1.0.0
#
# browserWSEndpoint Ex.: ws://127.0.0.1:3000
BROWSER_WSENDPOINT=
#
# Default 1
MAX_CONCURRENT_SESSIONS=1
#
# Set name instace for use ecosystem.config.js
NAME_INSTANCES=ApiWPPConnectCluster
#
# Set count instace for use ecosystem.config.js
INSTANCES=1
#
# Caso queira que ao iniciar a API todas as sessões salvas sejam inicializadas automaticamente
START_ALL_SESSIONS=1
#
# Caso queira forçar a reconexão da API em caso de desconexão do WhatsApp defina true
FORCE_CONNECTION_USE_HERE=0
#
`;
		logger?.info(`- Modelo do arquivo de configuração:\n ${modelo}`);
		process.exit(1);
	} else {
		//
		// ------------------------------------------------------------------------------------------------//
		//
		try {
			//
			const commands = require("./router/command");
			const groups = require("./router/group");
			const instance = require("./router/instance");
			const mensagens = require("./router/message");
			const status = require("./router//status");
			const sistem = require("./router/sistem.controller");
			//
			// Body Parser
			app.use(cors());
			app.use(bodyParser.json({
				limit: '50mb',
				type: 'application/json'
			}));
			//
			app.use(bodyParser.urlencoded({
				extended: true
			}));
			//
			// Express Parser
			app.use(express.json({
				limit: '50mb',
				extended: true
			}));
			//
			app.use(express.urlencoded({
				origin: '*',
				limit: '50mb',
				extended: true,
				parameterLimit: 50000
			}));
			// Rotas
			app.set('view engine', 'ejs');
			app.set('views', './views');
			app.set('json spaces', 2);
			app.use(express.static(__dirname + '/public'));
			//
			app.use((req, res, next) => {
				req.io = io;
				next();
			});
			//
			app.use((err, req, res, next) => {
				res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
				res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
				res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
				res.header('Access-Control-Allow-Credentials', true);
				//
				if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
					//
					//console.error(err);
					res.setHeader('Content-Type', 'application/json');
					return res.status(404).json({
						"Status": {
							"result": "error",
							"state": "FAILURE",
							"status": "notProvided",
							"message": "Json gerado de forma incorreta, efetue a correção e tente novamente"
						}
					});
				}
				//
				next();
			});
			//
			//
			app.get('/', (req, res) => {
				res.sendFile(path.join(__dirname, './views/index.html'));
			});
			//
			app.use("/instance", instance);
			app.use("/sistema", sistem);
			//
			const sockets = {};
			//socket
			//
			//cria um callback para quando alguém conectar
			io.on('connection', (socket) => {
				//adiciona todas os id's do socket na variavel sockets
				sockets[socket.id] = socket;
				logger?.info('- Abriu conexão');
				logger?.info(`- Socketid ${socket.id}`);
			});
			//
			//socket
			io.on('connection', (socket) => {
				socket.on('disconnect', function () {
					logger?.info('- Fechou conexão');
					logger?.info(`- Socketid ${socket.id}`);
				});
			});
			//
			app.get('/Start', function (req, res, next) {
				let host = config.HOST == '0.0.0.0' ? '127.0.0.1' : `${config.HOST}`;
				res.render('index', {
					port: config.PORT,
					host: host,
					host_ssl: config.DOMAIN_SSL,
					validate_mysql: parseInt(config.VALIDATE_MYSQL),
				});
			});
			//
			app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
			//
			// rota url erro
			app.all('*', (req, res) => {
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
			http.listen(config.PORT, config.HOST, async function (err) {
				if (err) {
					logger?.error(err);
				} else {
					let repoVersion = await latest('mywhatsapp-api-node-baileys-md')
					let hostUrl = config.HOST == '0.0.0.0' ? '127.0.0.1' : `${config.HOST}`;
					let host = config.DOMAIN_SSL == '' ? `http://${hostUrl}:${config.PORT}` : `https://${config.DOMAIN_SSL}`;
					logger?.info(`- HTTP Server running on`);
					logger?.info(`- To start: ${host}/Start`);
					logger?.info(`- To doc: ${host}/api-doc`);
					//
					logger?.info(`- Verificando Atualizações`);
					io.emit('version', {
						newVersion: undefined,
						message: `Verificando Atualizações`
					});

					if (Sessions.upToDate(version, repoVersion)) {
						logger?.info(`- Sua API esta Atualizada com a versão mais recente`);
						io.emit('version', {
							newVersion: false,
							message: `Sua API esta Atualizada com a versão mais recente`
						});
					} else {
						logger?.info(`- Há uma nova versão disponível`);
						io.emit('version', {
							newVersion: true,
							message: `Há uma nova versão disponível`
						});
						Sessions.logUpdateAvailable(version, repoVersion);
					}

				}
				//
				if (parseInt(config.START_ALL_SESSIONS) == true) {
					let result = await AllSessions.startAllSessions();
					if (result != undefined) {
						//logger.error(result);
						logger?.info(` - AllSessions:\n ${result}`);
					}
				}

			});
			//
		} catch (error) {
			logger?.error('- Não foi fossivel iniciar o sistema');
			logger?.error(error);
			process.exit(1);
		}
		//
		// ------------------------------------------------------------------------------------------------//
		//
	}
});
//
process.stdin.resume(); //so the program will not close instantly
//
async function exitHandler(options, exitCode) {

	if (options.cleanup) {
		logger?.info("- Cleanup");
	}

	if (exitCode || exitCode === 0) {
		logger?.info(exitCode);
	}
	//
	if (options.exit) {
		process.exit();
	}
} //exitHandler
//
// ------------------------------------------------------------------------------------------------//
//
//
//do something when sistema is closing
process.on('exit', exitHandler.bind(null, {
	cleanup: true
}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
	exit: true
}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
	exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
	exit: true
}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
	exit: true
}));
//
// ------------------------------------------------------------------------------------------------//
//