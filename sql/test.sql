--
-- 表的结构 `rw_event`
--

DROP TABLE IF EXISTS `rw_event`;
CREATE TABLE IF NOT EXISTS `rw_event` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(100) CHARACTER SET utf8 NOT NULL,
  `delflag` tinyint(4) NOT NULL DEFAULT 0,
  `createAt` bigint(20) NOT NULL,
  `updateAt` bigint(20) NOT NULL,
  `clientId` varchar(100) CHARACTER SET utf8 NOT NULL,
  `status` varchar(100) CHARACTER SET utf8 DEFAULT NULL,
  `sensor` varchar(100) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8;