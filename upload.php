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

if(empty($_POST['transferid']) or !is_numeric($_POST['transferid']) or empty($_FILES["file"]) or $_FILES['file']['error'] > 0) exit;

//-- Время жизни папки на два часа вперёд
$folderroot = mktime(date("H")+2, 0, 0);
//-- Название папки для текущего обмена
$foldername = $_POST['transferid'];
//-- Путь сохрения файла
$filepath = "uploads/transfer/".$folderroot."/".$foldername;
//-- Создание директорий
@mkdir($filepath, 0755, true);
//-- Загрузка в папку
move_uploaded_file($_FILES["file"]["tmp_name"], $filepath."/".$_FILES["file"]["name"]);
//-- Отправка данных
echo json_encode(array($folderroot, urlencode($_FILES["file"]["type"])));

?>