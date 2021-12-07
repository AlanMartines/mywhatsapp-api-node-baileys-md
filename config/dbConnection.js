const mysql = require("mysql2");
const config = require('../config.global');
//
// connect to the db
const dbConnection = {
  host: config.MYSQL_HOST, // O host do banco. Ex: localhost
  port: config.MYSQL_PORT, // Port do banco. Ex: 3306
  user: config.MYSQL_USER, // Um usuário do banco. Ex: user 
  password: config.MYSQL_PASSWORD, // A senha do usuário. Ex: user123
  database: config.MYSQL_DATABASE // A base de dados a qual a aplicação irá se conectar, deve ser a mesma onde foi executado o Código 1. Ex: node_mysql
};
//
// connect to the db
const dbConnectionPool = {
  host: config.MYSQL_HOST, // O host do banco. Ex: localhost
  port: config.MYSQL_PORT, // Port do banco. Ex: 3306
  user: config.MYSQL_USER, // Um usuário do banco. Ex: user 
  password: config.MYSQL_PASSWORD, // A senha do usuário. Ex: user123
  database: config.MYSQL_DATABASE, // A base de dados a qual a aplicação irá se conectar, deve ser a mesma onde foi executado o Código 1. Ex: node_mysql
  waitForConnections: true, // Determina a ação do pool quando nenhuma conexão está disponível e o limite foi atingido.
  connectionLimit: 10, // O número máximo de conexões a serem criadas de uma vez. (Padrão: 10)
  queueLimit: 0 // O número máximo de solicitações de conexão que o pool irá enfileirar antes de retornar um erro
  //getConnection: 0 //Se definido como 0, não há limite para o número de solicitações de conexão na fila. (Padrão: 0)
};
//
/*
//For mysql single connection
//Create mysql connection
var dbconnection = mysql.createConnection(
  dbConnection
);
*/
//
//Create mysql connection pool
var dbconnection = mysql.createPool(
  dbConnectionPool
);
//
dbconnection.on('connection', function(connection) {
  console.log('- MySQL Connection established');
  //
  dbconnection.on('error', function(err) {
    console.error(new Date(), '- MySQL error', err.code);
  });
  //
  dbconnection.on('enqueue', function() {
    console.log('- MySQL Waiting for available connection slot');
  });
  //
  /*
  dbconnection.end(function(err) {
    console.log('- All connections the have ended');
  });
	*/
});
//
module.exports = dbconnection;