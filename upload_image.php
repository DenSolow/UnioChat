<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: upload_image.php
-----------------------------------------------------
 Назначение: Обмен файлами
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if(empty($_FILES['file']) or $_FILES['file']['error'] > 0) exit;
//-- Размер файла 20 МБ
if($_FILES['file']['size'] > 20971520)
{
	echo json_encode(array(false, 'Файл слишком большого размера.'));
	exit;
}

//-- Время жизни папки на два часа вперёд
$folderroot = mktime(date('H')+2, 0, 0);
//-- Название папки для текущего обмена
$foldername = mt_rand();
//-- Путь сохрения файла
$filepath = 'uploads/transfer/'.$folderroot.'/'.$foldername;
//-- Создание директорий
@mkdir($filepath, 0755, true);
//-- Подключение конфигурации
define('UNIOCHAT', true);
include 'config.php';
//-- Нуждается ли в конвертации кодировки
if(!$cfg['rus']) $_FILES['file']['name'] = mb_convert_encoding($_FILES['file']['name'], 'Windows-1251', 'UTF-8');
//-- Загрузка в папку
move_uploaded_file($_FILES['file']['tmp_name'], $filepath.'/'.$_FILES['file']['name']);
//-- Отправка данных
echo json_encode(array(true, 'http://'.$_SERVER['SERVER_NAME'].$cfg['path'].$filepath.'/'));

?>