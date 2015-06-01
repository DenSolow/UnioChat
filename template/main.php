<?php
/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: template/main.php
-----------------------------------------------------
 Назначение: Шаблон главной страницы
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

if (!defined("UNIOCHAT")) exit("Not work!");

?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Unio Chat</title>

<link rel="stylesheet" type="text/css" href="<?= TPL_DIR ?>css/jquery-ui-1.10.0.custom.css" media="screen">
<link rel="stylesheet" type="text/css" href="<?= TPL_DIR ?>css/style.css?3" media="all">
<link rel="shortcut icon" href="favicon.ico" />

<script type="text/javascript" src="<?= TPL_DIR ?>js/jquery-1.9.1.min.js"></script>
<script type="text/javascript" src="<?= TPL_DIR ?>js/jquery-ui-1.10.0.custom.min.js"></script>
<script type="text/javascript" src="<?= TPL_DIR ?>js/jquery.cookie.js"></script>
<script type="text/javascript">
var baseUrl = "<?= $cfg['path'] ?>";
</script>
<script type="text/javascript" src="<?= TPL_DIR ?>js/engine.js?10"></script>
<script type="text/javascript" src="<?= TPL_DIR ?>js/filetransfer.js"></script>
<script type="text/javascript" src="<?= TPL_DIR ?>js/FileSaver.js"></script>
</head>
<body>
<table id="UnioChat" class="box" cellspacing="0" cellpadding="0">
<tr height="64">
	<td valign="top">
    <nav class="first">
    	<ul id="menubox" class="menubox">
            <li>Разговор
            <ul>
                <li onClick="topic_dialog()">Смена темы...</li>
            </ul>
            </li>
            <li>Правка
            <ul>
                <li onClick="chatbox_clean()">Очистить чат</li>
            </ul>
            </li>
            <li>Настройка
            <ul>
                <li onClick="mute_toogle()">Выключить/Включить звук</li>
            </ul>
            </li>
        </ul>
    </nav>
    <nav class="second">
        <button>Активен</button>
    </nav>
    </td>
</tr>
<tr>
	<td id="checkheight" valign="top" style="padding:5px;background-color:#f0f0f0;">
    <div id="content">
    
    <div id="leftside">
        <div id="chatbox">
            <div id="tabs">
                <ul class="channel">
                    <li><a href="#Main"><img src="<?= TPL_DIR ?>images/channel.png" />#Main</a></li>
                </ul>
                <div id="Main" class="chat">
                </div>
            </div>
            
            <div id="channel-info" class="ui-state-highlight ui-corner-all"><p><span class="ui-icon ui-icon-info" style="float:left;margin 0 7px 0 0;"></span><span></span></p></div>
            <div id="channel-progress" class="ui-state-highlight ui-corner-all"><progress max="100" value="0"></progress></div>
        </div>
        <div id="messagebox">
            <div><textarea id="message" onKeyDown="return message_send(event)" maxlength="960"></textarea></div>
        </div>
    </div>
    <aside>
        <div id="userbox">
        <form onSubmit="nick_change(nick.value);return false" action="">
       	<div><label for="nick">Псевдоним:</label></div>
        <div id="nickbox"><div><div><button type="submit"><img src="<?= TPL_DIR ?>images/change-nick.png" /></button><button>Изменить псевдоним</button></div></div><input id="nick" name="nick" type="text" value="<?= $nick ?>" maxlength="35" /></div>
        <div style="margin-top:9px;overflow:hidden;white-space:nowrap">Пользователи в сети:</div>
        </form>
        <div id="usersbox">
        <dl id="uMain">
            <dt>#Main (<span>0</span>)</dt>
        </dl>
        </div>
        </div>
	</aside>

    </div>
    </td>
</tr>
<tr class="footer">
    <td>
    <span>Готов.</span>
    <div>&copy; C.N.U. 2013</div>
    </td>
</tr>
</table>
<div id="dialog-ufiles" title="Исходящие файлы" class="dialog">
<div class="fileslist"></div>
<div class="status"></div>
</div>
<div id="dialog-files" title="Входящие файлы" class="dialog">
<p><span class="ui-icon ui-icon-transferthick-e-w" style="float: left; margin: 0 7px 20px 0;"></span>Пользователь <span class="user"></span> ожидает отправки <span></span> файла(ов).</p>
<div class="fileslist"></div>
</div>
<div id="dialog-talk" class="dialog-talk dialog">
	<div class="talkbox"></div>
    <div class="mainbox"><textarea maxlength="960"></textarea></div>
    <footer><div class="statusbox">Готов.</div><button>Отправить</button><button>Закрыть</button></footer>
</div>
<div id="usermenu" class="menubox dialog">
<ul>
	<li onClick="talk()"><strong>Сообщение...</strong></li>
    <li onClick="chatline_nick()">Обратиться в чате<div>Ctrl+Y</div></li>
    <li onClick="beep()">Сигнал</li>
    <li onClick="$('#filechoose').click()">Отправить файл(ы)...</li>
</ul>
</div>
<div id="dialog-topic" class="dialog">
<form onSubmit="topic_submit();return false" action="">
<p><strong>Тема канала:</strong></p>
<div class="form"><input type="text" maxlength="500" /></div>
<div class="buttons"><button type="submit">ОК</button><button type="button" onClick="$('#dialog-topic').dialog('close')">Отмена</button></div>
</form>
</div>

<div style="width:0;height:0;overflow:hidden"><input id="filechoose" type="file" multiple /></div>
<iframe src="offline.html" style="display:none"></iframe>
</body>
</html>
