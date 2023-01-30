-- Copiando estrutura do banco de dados para mywhatsapp-api
CREATE DATABASE IF NOT EXISTS `mywhatsapp-api` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mywhatsapp-api`;

-- Copiando estrutura para tabela mywhatsapp-api.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `token` char(255) NOT NULL,
  `active` char(5) NOT NULL DEFAULT 'true',
  `state` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'DISCONNECTED',
  `status` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'notLogged',
  `webhook` varchar(255) DEFAULT NULL,
  `wh_status` varchar(255) DEFAULT NULL,
  `wh_message` varchar(255) DEFAULT NULL,
  `wh_qrcode` varchar(255) DEFAULT NULL,
  `wh_connect` varchar(255) DEFAULT NULL,
  `lastactivit` timestamp NULL DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=908 DEFAULT CHARSET=utf8mb3;