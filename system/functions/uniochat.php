<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: system/functions/uniochat.php
-----------------------------------------------------
 Назначение: Функции юнио чата
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if (!defined("UNIOCHAT")) exit("Not work!");

//-- Определение браузера
function getbrowser($useragent = "")
{
	if(empty($useragent)) return "??";
	if(stripos($useragent, "opera") !== false) return "Opera";
	if(stripos($useragent, "chrome") !== false) return "Chrome";
	if(stripos($useragent, "firefox") !== false) return "Firefox";
	if(stripos($useragent, "safari") !== false) return "Safari";
	if(stripos($useragent, "msie") !== false) return "Internet Explorer";
	return "??";
}

?>