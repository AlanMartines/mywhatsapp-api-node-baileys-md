-- Copiando estrutura do banco de dados para mywhatsapp-api
CREATE DATABASE IF NOT EXISTS `mywhatsapp-api` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mywhatsapp-api`;

-- Copiando estrutura para tabela mywhatsapp-api.sessionwa
CREATE TABLE IF NOT EXISTS `sessionwa` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `sessionname` char(255) COLLATE utf8mb4_general_ci NOT NULL,
  `state` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'DISCONNECTED',
  `status` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'notLogged',
  `userconnected` char(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `profilepicture` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `wh_status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_message` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_qrcode` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_connect` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando estrutura para tabela mywhatsapp-api.statistics
CREATE TABLE IF NOT EXISTS `statistics` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sessionname` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` char(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `isgroup` tinyint NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando estrutura para tabela mywhatsapp-api.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `datafinal` date NOT NULL,
  `active` char(5) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'true',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `token` (`authorizationtoken`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- Copiando dados para a tabela mywhatsapp-api.tokens: ~2 rows (aproximadamente)
INSERT INTO `tokens` (`ID`, `authorizationtoken`, `datafinal`, `active`, `created`, `modified`) VALUES
	(1, 'TOKENTESTE123', '9999-12-31', '1', '2023-06-27 02:24:55', '2023-09-23 18:30:07');