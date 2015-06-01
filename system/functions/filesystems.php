<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: system/functions/filesystems.php
-----------------------------------------------------
 Назначение: Функции файловой системы
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if (!defined("UNIOCHAT")) exit("Not work!");

//-- Перекодировка win в utf-8
function winToUtf8($s)
{
	global $cfg;
	
	//-- Если конвертация не требуется
	if($cfg['rus']) return $s;
	
	static $table = array
	(
		"\xC0"=>"\xD0\x90","\xC1"=>"\xD0\x91","\xC2"=>"\xD0\x92","\xC3"=>"\xD0\x93","\xC4"=>"\xD0\x94",
		"\xC5"=>"\xD0\x95","\xA8"=>"\xD0\x81","\xC6"=>"\xD0\x96","\xC7"=>"\xD0\x97","\xC8"=>"\xD0\x98",
		"\xC9"=>"\xD0\x99","\xCA"=>"\xD0\x9A","\xCB"=>"\xD0\x9B","\xCC"=>"\xD0\x9C","\xCD"=>"\xD0\x9D",
		"\xCE"=>"\xD0\x9E","\xCF"=>"\xD0\x9F","\xD0"=>"\xD0\xA0","\xD1"=>"\xD0\xA1","\xD2"=>"\xD0\xA2",
		"\xD3"=>"\xD0\xA3","\xD4"=>"\xD0\xA4","\xD5"=>"\xD0\xA5","\xD6"=>"\xD0\xA6","\xD7"=>"\xD0\xA7",
		"\xD8"=>"\xD0\xA8","\xD9"=>"\xD0\xA9","\xDA"=>"\xD0\xAA","\xDB"=>"\xD0\xAB","\xDC"=>"\xD0\xAC",
		"\xDD"=>"\xD0\xAD","\xDE"=>"\xD0\xAE","\xDF"=>"\xD0\xAF","\xAF"=>"\xD0\x87","\xB2"=>"\xD0\x86",
		"\xAA"=>"\xD0\x84","\xA1"=>"\xD0\x8E","\xE0"=>"\xD0\xB0","\xE1"=>"\xD0\xB1","\xE2"=>"\xD0\xB2",
		"\xE3"=>"\xD0\xB3","\xE4"=>"\xD0\xB4","\xE5"=>"\xD0\xB5","\xB8"=>"\xD1\x91","\xE6"=>"\xD0\xB6",
		"\xE7"=>"\xD0\xB7","\xE8"=>"\xD0\xB8","\xE9"=>"\xD0\xB9","\xEA"=>"\xD0\xBA","\xEB"=>"\xD0\xBB",
		"\xEC"=>"\xD0\xBC","\xED"=>"\xD0\xBD","\xEE"=>"\xD0\xBE","\xEF"=>"\xD0\xBF","\xF0"=>"\xD1\x80",
		"\xF1"=>"\xD1\x81","\xF2"=>"\xD1\x82","\xF3"=>"\xD1\x83","\xF4"=>"\xD1\x84","\xF5"=>"\xD1\x85",
		"\xF6"=>"\xD1\x86","\xF7"=>"\xD1\x87","\xF8"=>"\xD1\x88","\xF9"=>"\xD1\x89","\xFA"=>"\xD1\x8A",
		"\xFB"=>"\xD1\x8B","\xFC"=>"\xD1\x8C","\xFD"=>"\xD1\x8D","\xFE"=>"\xD1\x8E","\xFF"=>"\xD1\x8F",
		"\xB3"=>"\xD1\x96","\xBF"=>"\xD1\x97","\xBA"=>"\xD1\x94","\xA2"=>"\xD1\x9E"
	);

	return strtr($s, $table);
}
//-- Удаление директории
function deleteDirectory($dir)
{
	if(!file_exists($dir)) return true;
	if(!is_dir($dir)) return unlink($dir);
	foreach(scandir($dir) as $item)
	{
		if($item == '.' || $item == '..') continue;
		if(!deleteDirectory($dir.DIRECTORY_SEPARATOR.$item)) return false;
	}
	return rmdir($dir);
}
//-- Очищаем директории
function cleanDirectory($dir)
{
	if(!file_exists($dir)) return mkdir($dir);
	foreach(scandir($dir) as $item)
	{
		if($item == '.' || $item == '..') continue;
		if(!deleteDirectory($dir.DIRECTORY_SEPARATOR.$item)) return false;
	}
	return true;
}
//-- Размер удалённого файла
function fsize($path)
{
	$scheme = parse_url($path, PHP_URL_SCHEME);
	
	if(($scheme == "http") || ($scheme == "https"))
	{
		$headers = get_headers($path, 1);
		//var_dump($headers);
		if(strpos($headers[0], "404") !== false or strpos($headers[0], "403") !== false) return array(0, false);
		//-- Размер
		if(array_key_exists("Content-Length", $headers)) $size = (is_array($headers["Content-Length"])) ? end($headers["Content-Length"]) : $headers["Content-Length"];
		else $size = 0;
		//-- Mime
		if(array_key_exists("Content-Type", $headers)) $mime = (is_array($headers["Content-Type"])) ? end($headers["Content-Type"]) : $headers["Content-Type"];
		else $mime = false;
		
		return array($size, $mime);
	}
	else if(($scheme == "ftp") || ($scheme == "ftps"))
	{
		$url = parse_url($path);

		if(!$url['user']) $url['user'] = "anonymous";
		if(!$url['pass']) $url['pass'] = "phpos@";
		
		$ftpid = ($scheme == "ftp") ? ftp_connect($url['host']) : ftp_ssl_connect($url['host']);
		if(!$ftpid) return array(0, false);
		$login = ftp_login($ftpid, $url['user'], $url['pass']);
		if(!$login) return array(0, false);
		
		$ftpsize = ftp_size($ftpid, $url['path']);
		
		ftp_close($ftpid);
		
		if($ftpsize == -1) return array(0, false);
		
		return array($ftpsize, false);
	}
	
	return array(0, false);
}
//-- Название удалённого файла
function fname($path)
{
	$pathinfo = pathinfo($path);
	//echo preg_match("/[^a-z]/i", $pathinfo['extension']);
	//-- Если расширения файла есть и оно явное
	if(array_key_exists('extension', $pathinfo) and !preg_match("/[^a-z]/i", $pathinfo['extension']) and $pathinfo['extension'] != "php" and stripos($pathinfo['dirname'], "sourceforge") === false)
	{
		list($size, $mime) = fsize($path);
		return array($pathinfo['basename'], $size, $mime);
	}
	
	//-- Переходим по ссылке
	$headers = get_headers($path, 1);
	//var_dump($headers);

	//-- Получаем размер файла
	if(strpos($headers[0], "404") === false and array_key_exists("Content-Length", $headers)) $size = (is_array($headers["Content-Length"])) ? end($headers["Content-Length"]) : $headers["Content-Length"];
	else $size = 0;
	if(array_key_exists("Content-Type", $headers)) $mime = (is_array($headers["Content-Type"])) ? end($headers["Content-Type"]) : $headers["Content-Type"];
	else $mime = false;

	//-- Ищем location
	$key = false;
	if(array_key_exists("location", $headers)) $key = "location";
	elseif(array_key_exists("Location", $headers)) $key = "Location";
	if($key)
	{
		$location = (is_array($headers[$key])) ? end($headers[$key]) : $headers[$key];
		return array(pathinfo($location, PATHINFO_BASENAME), $size, $mime);
	}
	//-- Получаем реальное имя файла
	$headers_text = implode($headers);
	//-- Ищем filename
	if(strpos($headers_text, "filename=") !== false)
	{
		if(preg_match('/filename="(.+)"/isU', $headers_text, $found)) return array($found[1], $size, $mime);
		//-- Если не было найдено, последний этап
		preg_match('/filename=(.+)$/isU', $headers["Content-Disposition"], $found);	
		return array($found[1], $size, $mime);
	}
}
//-- Убираем пустые строки
function array_clean($array)
{
	foreach($array as $value) if(!empty($value)) $new_array[] = $value;
	
	return $new_array;
}

?>