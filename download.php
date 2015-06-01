<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: upload.php
-----------------------------------------------------
 Назначение: Обмен файлами
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if(empty($_GET['transferid']) or !is_numeric($_GET['transferid']) or empty($_GET['transferroot']) or empty($_GET['transferfile']) or empty($_GET['transfertype'])) exit;

//-- Название файла для текущего обмена
$filename = $_GET['transferfile'];
//-- Название файла для текущего обмена
$filetype = $_GET['transfertype'];
//-- Путь загрузки файла
$filepath = "uploads/transfer/".$_GET['transferroot']."/".$_GET['transferid']."/".$filename;

if($fsize = @filesize($filepath))
{
	$fd = fopen($filepath, "rb");
	if(isset($_SERVER["HTTP_RANGE"]))
	{
		$range = $_SERVER["HTTP_RANGE"];
		$range = str_replace(array("bytes=", "-"), "", $range);
		if($range) fseek($fd, $range);
	}
	if(isset($range)) header("HTTP/1.1 206 Partial Content");
	else
	{
		header("HTTP/1.1 200 OK");
		$range = 0;
	}
	
	header("Content-Type: ".$filetype);
	header("Content-Length: ".($fsize-$range));
	header("Content-Range: bytes $range-".($fsize - 1)."/".$fsize);
	header("Content-Disposition: attachment; filename=".$filename);
	
	ob_clean();
    flush();
	
	fpassthru($fd);
	fclose($fd);
}

?>