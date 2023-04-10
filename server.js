'use strict';
//
const fs = require('fs-extra');
const express = require('express');
require('express-async-errors');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express')
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
//console.log(boxen('My-WhatsApp', {padding: 1, margin: 1, borderStyle: 'double'}));
//
//
//
// ------------------------------------------------------------------------------------------------//
//
fs.access(".env", fs.constants.F_OK, async (err) => {
	if (err && err.code === 'ENOENT') {
		logger.error(`- Arquivo ".env" não encontrado, segue modelo de configuração:`);
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
			const profile = require("./router/profile");
			const group = require("./router/group");
			const instance = require("./router/instance");
			const message = require("./router/message");
			const retrieving = require("./router/retrieving");
			const webhook = require("./router/webhook");
			const gateway = require("./router/gateway");
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
			app.get('/', (req, res, next) => {
				res.sendFile(path.join(__dirname, './views/index.html'));
			});
			//
			app.use("/instance", instance);
			app.use("/message", message);
			app.use("/group", group);
			app.use("/retrieving", retrieving);
			app.use("/profile", profile);
			app.use("/gateway", gateway);
			app.use("/webhook", webhook);
			app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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
			http.listen(config.PORT, config.HOST, async function (err) {
				if (err) {
					logger?.error(err);
				} else {
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
					//
					let repoVersion = await latest('mywhatsapp-api-node-baileys-md');
					if (await Sessions.upToDate(version, repoVersion)) {
						logger?.info(`- API esta Atualizada com a versão mais recente`);
						io.emit('version', {
							newVersion: false,
							message: `API esta Atualizada com a versão mais recente`
						});
					} else {
						logger?.info(`- Há uma nova versão disponível`);
						io.emit('version', {
							newVersion: true,
							message: `Há uma nova versão disponível`
						});
						await Sessions.logUpdateAvailable(version, repoVersion);
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
// Emitido logo antes da saída de um processo do Node
process.on('beforeExit', code => {
	setTimeout(() => {
		logger?.info(`- Process will exit with code: ${code}`)
		process.exit(code)
	}, 100)
});
// Emitido na saída de um processo do Node
process.on('exit', code => {
	logger?.info(`- Process exited with code: ${code}`)
});
// Evento emitido pelo Sistema Operacional ou gerenciador de processos como PM2 envia sinal para terminar o processo node
process.on('SIGTERM', signal => {
	logger?.info(`- Process ${process.pid} received a SIGTERM signal`)
	process.exit(0);
});
// Evento emitido pelo Sistema Operacional ou gerenciador de processos como PM2 interrompe o processo node
process.on('SIGINT', signal => {
	logger?.info(`- Process ${process.pid} has been interrupted`)
	process.exit(0);
});
// Evento é emitido Quando um erro de JavaScript não é tratado corretamente
process.on('uncaughtException', err => {
	logger.error(`- Uncaught Exception: ${err.message}`)
	process.exit(1);
});
// Evento é emitido Quando uma Promise é rejeitada ou não é satisfeita
process.on('unhandledRejection', (reason, promise) => {
	logger.error('- Unhandled rejection at ', promise, `reason: ${err.message}`)
	process.exit(1);
});

process.on('<signal or error event>', _ => {
	server.close(() => {
		process.exit(0);
	})
	// Se o servidor não terminou em 1000ms, desligue o processo
	setTimeout(() => {
		process.exit(0);
	}, 1000).unref() // Evita que o tempo limite seja registrado no event loop
});