DROP TABLE IF EXISTS `area`;
CREATE TABLE IF NOT EXISTS `area` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `createAt` bigint(20) NOT NULL DEFAULT '0',
  `updateAt` bigint(20) NOT NULL DEFAULT '0',
  `delflag` tinyint(4) NOT NULL DEFAULT '0',
  `name` varchar(200) NOT NULL,
  `code` varchar(200) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

INSERT INTO `area` (`id`, `createAt`, `updateAt`, `delflag`, `name`, `code`) VALUES
(1, 1525245044356, 1525245044356, 0, '广陵区', ''),
(2, 1525245044356, 1525245044356, 0, '邗江区', ''),
(3, 1525245044356, 1525243102083, 0, '江都区', '');