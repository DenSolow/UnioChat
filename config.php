<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: index.php
-----------------------------------------------------
 Назначение: Движок
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if(!defined("UNIOCHAT")) exit();

$dbhostname = "127.0.0.1";// Адрес
$dbusername = "root";	  // Логин
$dbpassword = "";		  // Пароль
$database = "p2pChat";  // Имя бызы
$prefix = "pc_";		  // Префикс

//-- Кодировка
mb_internal_encoding("UTF-8");

//-- Параметры
$cfg = array(
	'gzip'			=> 1,
	'rus'			=> false,
	'path'			=> "/UnioChat/",
	'site_url'		=> '/PLSite/',
);

?>