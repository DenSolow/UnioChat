<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: system/functions/cookie.php
-----------------------------------------------------
 Назначение: Функции кукисов
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if (!defined("UNIOCHAT")) exit("Not work!");

function clean_url($url)
{
	if($url == '' or stripos($url, "localhost") !== false) return NULL;
	
	$url = str_replace("http://", "", $url);
	if (strtolower(substr($url, 0, 4)) == 'www.')  $url = substr($url, 4);
	$url = explode('/', $url);
	$url = reset($url);
	$url = explode(':', $url);
	$url = reset($url);
	
	return ".".$url;
}

//-- Cookie для явы
function cookie_for_java($name, $value, $expires = 0)
{
	if($expires) $expires = time() + ($expires * 86400);

	setcookie($name, $value, $expires, "/");
}

define ('DOMAIN', clean_url($_SERVER['HTTP_HOST']));

function set_cookie($name, $value, $expires = 0)
{
	if($expires) $expires = time() + ($expires * 86400);

	setcookie($name, $value, $expires, "/", DOMAIN, NULL, TRUE);
}

?>