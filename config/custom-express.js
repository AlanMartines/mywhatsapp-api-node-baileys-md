//
// Configuração dos módulos
const fs = require('fs');
const express = require('express');
const app = express();
const consign = require('consign');
const cors = require('cors');
const path = require('path');
const config = require('../config.global');
//
const http = require('http').createServer({}, app);
// https://www.scaleway.com/en/docs/tutorials/socket-io/
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true
  },
});
//
app.use(cors());
//
const sistem = require("../controllers/sistem.controller");
const verifyToken = require("../middleware/verifyToken");
//
module.exports = () => {
  //
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  //
  // Express Parser
  app.use(express.json({
    limit: '50mb',
    extended: true
  }));
  //
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true
  }));
  // Rotas
  app.use("/sistema", sistem);
  //
  app.get('/', function(req, res) {
    //res.status(200).send('Server Baileys is running API. https://github.com/AlanMartines/mywhatsapp-api-node-baileys');
    res.sendFile(path.join(__dirname, '/index.html'));
  });
  //
  const sockets = {};
  //socket
  //
  //cria um callback para quando alguém conectar
  io.on('connection', (socket) => {
    //adiciona todas os id's do socket na variavel sockets
    sockets[socket.id] = socket;
    console.log('- Abriu conexão');
    console.log('- Socketid ' + socket.id);
  });
  //
  //socket
  io.on('connection', (socket) => {
    socket.on('disconnect', function() {
      console.log('- Fechou conexão');
      console.log('- Socketid ' + socket.id);
    });
  });
  //
  //
  return http
}