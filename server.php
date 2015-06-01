<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: server.php
-----------------------------------------------------
 Назначение: Сервер
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

ini_set('display_errors', 1);
error_reporting(E_ALL);
//-- Устанавливает, необходимо ли прерывать работу скрипта при отключении клиента.
//ignore_user_abort(true);
//-- Заставляет работать php-скрипт как демон 
set_time_limit(0);
//-- отправляет информацию вне зависимости от того, закончил ли работать php-скрипт или нет
//ob_implicit_flush();

define('UNIOCHAT', true);

//-- Это наша завершающая функция
function shutdown()
{
	global $Server;
	
	$text = empty($Server->wsRead) ? 'Скрипт успешно завершён' : 'Скрипт завершён с ошибкой';
	file_put_contents(__DIR__.'/log.txt', date('r')."\n".$text."\n", FILE_APPEND);
}
//-- Функция на выключение
register_shutdown_function('shutdown');

// include the web sockets server script (the server is started at the far bottom of this file)
require 'class.PHPWebSocket.php';
require 'system/functions/uniochat.php';

//-- Когда клиент пресылает данные на сервер
function wsOnMessage($clientID, $data, $dataLength, $binary)
{
	global $Server;

	//-- Обработка бинарных данных
	/*if($binary == 2)
	{
		//-- Получаем тип соединения
		$type = ord(substr($data, 0, 1));
		//-- Получаем ID кому передавать
		$client = ord(substr($data, 1, 1));
		//-- Удаляем два байта
		$data = substr($data, 2);		
		//-- Вывод
		//var_dump($type, $client, $data);
		//var_dump(strlen($data));
		
		//-- Отправка файла
		switch($type)
		{
			case 1:
				//$Server->wsSendClientData($client, $binary, $data);
				$Server->wsSendClientData($clientID, $binary, $data);
		}
		
		return;
	}*/

	//-- Проверка на сообщение нулевой длины
	if($dataLength == 0)
	{
		$Server -> wsClose($clientID);
		return;
	}
	//-- Преобразование данных
	list($type, $data) = explode('|', $data, 2);
	//-- Элементы
	$type = intval($type);
	//-- Завершение работы
	if($data == '/stp')
	{
		$Server->wsStopServer();
		exit;
	}
	//-- Перезагрузка
	elseif($data == '/rtp') wsRebooting();
	//-- Создание массива
	switch($type)
	{
		case 0: case 4: case 12: case 13: case 14: break;
		default:
			$array = explode('|', $data);
			$to = array_shift($array);
	}
	//-- Тип данных
	switch($type)
	{
		//-- Отправка текста, если люди есть в чате
		case 0: $send = array($clientID, $data); break;
		//-- Смена ника
		case 4:
			//-- Сменить на новый
			$Server->wsUsers[$clientID][0] = $data;
			//-- Оповестить о смене всех
			$send = array($clientID, $data);
		break;
		//-- Запрос на приём файлов
		case 5:
			//-- Первую переменную переводим в интеджер
			$array[0] = intval($array[0]);
			//-- Добавляет хозяина пакета
			array_unshift($array, $clientID);
		break;
		case 7:
			//-- Создаём название директории
			if($array[0] == '1')
			{
				$array[0] = mt_rand();
				//-- ОТПРАВКА: Сообщаем автору пакета, id передачи (8)
				$Server->wsSend($clientID, $array[0], 8);
			}
			else $array[0] = 0;
			//-- Добавляет хозяина пакета
			array_unshift($array, $clientID);
		break;
		case 9:
		case 10:
			//-- Первую переменную переводим в интеджер
			$array[0] = intval($array[0]);
			$array[1] = intval($array[1]);
		break;
		case 12:
			list($to, $uid, $message) = explode('|', $data, 3);
			//-- Если получатель есть, проверяем ключи и
			if(array_key_exists($to, $Server->wsUsers) and $Server->wsUsers[$to][2] == $uid)
				//-- Назначаем уникальный UID для зачинщика и добавляем хозяина пакета
				$array = array($clientID, $Server->wsUsers[$clientID][2], $message);
			//-- Иначе, отменяем отправку
			else return;
		break;
		//-- Активность
		case 13:
			$Server->wsUsers[$clientID][3] = $data ? true : false;
			//-- Добавляет хозяина пакета
			$send = array($clientID, intval($data));
		break;
		//-- Смена темы
		case 14:
			list($channel, $topic) = explode('|', $data, 2);
			//-- Если канала нет, выходим
			if(!array_key_exists($channel, $Server->wsTopics)) return;
			//-- Добавляем автора смены темы
			if($topic != '') $topic .= ' ('.$Server->wsUsers[$clientID][0].")";
			//-- Заносим изменения в базу
			$Server->wsTopics[$channel] = $topic;
			//-- Составляем массив для отправки
			$send = array($clientID, $channel, $topic);
		break;
	}
	//-- Тип отправки данных
	if(sizeof($Server->wsClients) > 1) switch($type)
	{
		case 0:
		case 4:
		case 13:
		case 14:
			foreach($Server->wsClients as $id => $client)
				if($id != $clientID) $Server->wsSend($id, $send, $type);
		break;
		case 5:
		case 7:
		case 9:
		case 10:
		case 12:
			//var_dump($type, $array);
			$Server->wsSend($to, $array, $type);
		break;
		case 15:
			$Server->wsSend($to, false, $type);
		break;
		case 11:
			$Server->wsSend($to, $clientID, $type);
		break;
	}
}

//-- ПЕРЕДАЧА: (2), (3)
function wsOnOpen($clientID)
{
	global $Server;

	//-- ПЕРЕДАЧА: Текущему пользователю список пользователей (1)
	$Server->wsSend($clientID, array($clientID, $Server->wsUsers, $Server->wsTopics), 1);
	//-- ПЕРЕЛАЧА: Остальным пользователям информацию о подключении пользователя (2)
	foreach($Server->wsClients as $id => $client)
		if($id != $clientID) $Server->wsSend($id, array($clientID, $Server->wsUsers[$clientID]), 2);
}
//-- ПЕРЕДАЧА: Пользотель вышел (3)
function wsOnClose($clientID, $status) {
	global $Server;

	foreach($Server->wsClients as $id => $client)
		$Server->wsSend($id, $clientID, 3);
}
//-- ПЕРЕЗАПУСК
function wsRebooting()
{
	global $Server;
	
	$Server->wsStopServer();
	//pclose(popen('start /B c:/php/php '. __FILE__, 'r'));  
	//fwrite($Server->wsLog, "\n");
	//fclose($Server->wsLog);
	exec('nohup php '.__FILE__.' > /dev/null 2>&1 &');
	exit;
}

// start the server
$Server = new PHPWebSocket();
$Server->wsStartServer();



/**
  *    Returns an ASCII string containing 
  *    the binary representation of the input data .
 **/
 /*
function str2bin($str, $mode=0) {
     $out = false;
     for($a=0; $a < strlen($str); $a++) {
         $dec = ord(substr($str,$a,1));
         $bin = '';
         for($i=7; $i>=0; $i--) {
             if ( $dec >= pow(2, $i) ) {
                 $bin .= "1";
                 $dec -= pow(2, $i);
             } else {
                 $bin .= "0";
             }
         }
         // Default-mode 
         if ( $mode == 0 ) $out .= $bin;
         // Human-mode (easy to read) 
         if ( $mode == 1 ) $out .= $bin . " ";
         // Array-mode (easy to use) 
         if ( $mode == 2 ) $out[$a] = $bin;
     }
     return $out;
 }*/


?>