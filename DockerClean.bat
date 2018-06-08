@echo off

docker stop fpm-plugin-mysql_phpmyadmin_1
docker stop fpm-plugin-mysql_db_1
docker rm fpm-plugin-mysql_phpmyadmin_1
docker rm fpm-plugin-mysql_db_1

