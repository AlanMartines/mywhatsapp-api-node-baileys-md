-- Copiando estrutura do banco de dados para mywhatsapp-api
CREATE DATABASE IF NOT EXISTS `mywhatsapp-db` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mywhatsapp-db`;

-- Copiando estrutura para tabela mywhatsapp-api.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `token` char(255) NOT NULL,
  `sessionToken` text DEFAULT NULL,
  `datafinal` date NOT NULL,
  `active` char(5) NOT NULL DEFAULT 'true',
  `state` char(20) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT 'DISCONNECTED',
  `status` char(20) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT 'notLogged',
  `userconnected` char(50) DEFAULT NULL,
  `profilepicture` text DEFAULT NULL,
  `wh_status` varchar(255) DEFAULT NULL,
  `wh_message` varchar(255) DEFAULT NULL,
  `wh_qrcode` varchar(255) DEFAULT NULL,
  `wh_connect` varchar(255) DEFAULT NULL,
  `lastactivity` timestamp NULL DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

INSERT INTO `tokens` (`ID`, `token`, `sessionToken`, `datafinal`, `active`, `state`, `status`, `userconnected`, `profilepicture`, `wh_status`, `wh_message`, `wh_qrcode`, `wh_connect`, `lastactivity`, `created`, `modified`) VALUES
	(1, 'HDFTRE88776SBHGHFGYYT', NULL, '9999-12-31', 1, 'DISCONNECTED', 'notLogged', NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW(), NOW());