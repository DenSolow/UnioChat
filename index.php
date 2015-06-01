<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2015 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: index.php
-----------------------------------------------------
 Назначение: Движок
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/
error_reporting(E_ALL);
ini_set('display_errors', true);
ini_set('html_errors', true);

//-- Начало сессии
session_name("UnioChat");
session_start();

//-- Время выполнение скрипта
$time_start = microtime();

define('UNIOCHAT', true);
define('TPL_DIR', 'template/');

//-- Подключение файла конфигурации
require "config.php";
require "system/functions/cookie.php";
require "system/functions/uniochat.php";

//-- Включить/выключить gZip сжатие
if($cfg['gzip'] == 1) ob_start("ob_gzhandler");

//-- Подключение к базе данных и выбор активной базы
/*mysql_connect($dbhostname,$dbusername,$dbpassword) or die(mysql_error());
mysql_select_db($database);
mysql_query("SET NAMES UTF8");
unset($dbpassword);

//-- Название таблицы
$tablechats = $prefix . "chats";
//-- Запрос записей из чата
$finger = mysql_query("SELECT * FROM $tablechats ORDER BY date DESC");
//-- Создание чата
if(mysql_num_rows($finger) > 0)
{
	while($array = mysql_fetch_assoc($finger))
	{
		$output .= '<p><strong>'.$array['author'].':</strong> '.$array['text'].'</p>';
	}
}
else $output = "";*/
//-- Пользователи

//-- Ники
if(empty($_COOKIE['uc_nick']))
{
	//-- Определение браузера
	$nick = getbrowser($_SERVER['HTTP_USER_AGENT']);
	//-- Запись в кукисы
	cookie_for_java('uc_nick', $nick, 365);
}
else $nick = $_COOKIE['uc_nick'];
//-- Уникальный ID пользователя
if(empty($_COOKIE['uc_uid']))
{
	$uid = mt_rand();
	set_cookie('uc_uid', $uid);
}
else $uid = $_COOKIE['uc_uid'];
//-- Подключение шаблона
require TPL_DIR . 'main.php';

//-- Показ времени генерации страницы
$time_end = microtime();
$temp = explode(' ', $time_start.' '.$time_end);
$duration=sprintf('%.8f',($temp[2]+$temp[3])-($temp[0]+$temp[1]));
//echo "\nGenerated in $duration seconds.";

?>