/*
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 UnioChat Engine
-----------------------------------------------------
 Copyright (c) 2012,2013 Create New Unlimited
-----------------------------------------------------
 Author: Den Solow (http://densolow.com)
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 Файл: template/js/engine.js
-----------------------------------------------------
 Назначение: JavaScript Document
-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/

var ajaxDir = baseUrl+'system/ajax/', title = document.title,
	socket = false, transferid = false, transfer = false, transfer_image = false, active = true, topic_stop = false, muted = ("sMuted" in localStorage) ? true : false,
	user = 0, file_to = 0, menuTarget = 0, channelTarget = 0, icon_blink = 0,
	nick = $.cookie('uc_nick'),
	files = [], xhr = [], users = [], uids = {}, topics = {"Main": ""}, fileText = ["Принять", "Отмена", "Отправить", "Закрыть"], talkText = [" - Разговор", "Восстанавливаем соединение..."], topicText = ["сменил тему", "очистил тему"];
var audio;
var interface = {
	wUserBox: (("wUserBox" in localStorage) ? localStorage['wUserBox'] : 180),
	hMessageBox: (("hMessageBox" in localStorage) ? localStorage['hMessageBox'] : 28),
	wTalkDialog: (("wTalkDialog" in localStorage) ? localStorage['wTalkDialog'] : 350),
	hTalkDialog: (("hTalkDialog" in localStorage) ? localStorage['hTalkDialog'] : Math.round($(window).height() / 2)),
	hTalkBox: (("hTalkBox" in localStorage) ? localStorage['hTalkBox'] : 50)
};

function connect()
{
	if(socket === false)
	{
		try
		{
			socket = new WebSocket("ws://localhost:8169");
			status(socket.readyState);
			setInterval(function()
			{
				//-- ОТПРАВКА: ПИНГА (6)
				if(!active && socket) socket.send('6|');
			}, 15000);
			
			socket.onopen = function(msg)
			{
				status(socket.readyState);
			};
			socket.onmessage = function(msg)
			{
				var t = typeof(msg.data);
				if(t == "string")
				{
					var o = $.parseJSON(msg.data);
					switch(o.type)
					{
						//-- Сообщение
						case 0:
							text = text_do(o.data[1], o.data[0]);
							if(!text) return;
							message(o.data[0], text);
							break;
						//-- Список пользователей и тем
						case 1:	userslist(o.data); break;
						//-- Пользователь вошёл
						case 2:	userslist_add(o.data); break;
						//-- Пользователь вышел
						case 3: userslist_del(o.data); break;
						//-- Пользователь сменил ник
						case 4:	user_nick(o.data[0], o.data[1]); break;
						//-- Запрос на приём файлов
						case 5:	files_incoming(o.data);	break;
						//-- Вопрос о приёме файлов
						case 15:
							$("#dialog-files").unbind("dialogclose").dialog({buttons:[{text: fileText[3],	click: function(){$(this).dialog("close");}}]});
							transfer = false;
						break;
						//-- Согласие приёма файлов
						case 7:	files_agree(o.data[0], o.data[1]); break;
						//-- ID передачи
						case 8:	transferid = o.data; break;
						//-- Прогресс передачи файла
						case 9:	file_progress(o.data[0], o.data[1]); break;
						//-- Завершение передачи файла
						case 10: file_finish(o.data); break;
						//-- Звуковой сигнал
						case 11: beep_in(o.data); break;
						//-- Разговор
						case 12: talk_recive(o.data); break;
						//-- Активность
						case 13: activity(o.data[0], o.data[1]); break;
						//-- Смена темы:
						case 14: topic_recive(o.data[0], o.data[1], o.data[2]); break;
					}
				}
				else if(t == "object")
				{
					var file = msg.data;
					console.log(file);
				}
			};
			socket.onclose = function(msg)
			{
				status(socket.readyState);
				if(this.readyState === 3) socket = false;
				$('#usersbox dd').remove();
				$('#uMain dt span > span').text('0');
				if(msg.code === 3001)
				{
					print("Уже открыта одна копия чата. Пожалуйста, проверьте свои вкладки.", "error");
					return;
				}
				reconnect();
			};
		}
		catch(ex) {reconnect();}
	}
}
//-- СИСЬЕМА: Переподключение
function reconnect()
{
	print("Не удаётся подключиться к сетевому сервису. Возможно, из-за неполадок с интернет соединением.", "error");
	setTimeout(connect, 20000);
}
//-- ОТПРАВКА: Сообщения в чат (0)
function message_send(e)
{
	if(e.shiftKey || e.keyCode != 13) return true;

	var txt = $("#message");
	var msg = $.trim($(txt).val());

	if(msg == "") return false;
	
	$(txt).val("").focus();
	
	socket.send('0|'+msg);
	msg = text_do(msg);
	if(msg) print(escapeHtml('<'+nick+'> ')+msg);

	return false;
}
//-- ПРИЁМ: Сообщения в чат (0)
function message(uid, text)
{
	text = escapeHtml('<'+users[uid][0]+'> ')+text;
	print(text, "message");
	soundPlay('chat_line');
	icon_toogle();
}
//-- ФУНКЦИОНАЛ: Подготовка текста
function text_do(text, uid)
{
	uid = uid || false;
	//-- Проверка на ссылку
	var regexp = /^https?:\/\/[^\ ]+$/i;
	text = $.trim(text);
	if(!regexp.test(text)) return escapeHtml(text).replace(/(https?:\/\/[^\ ]+)/ig, '<a href="$1"  target="_blank">$1</a>');
	//-- Проверка на Ютуб
	youtube = text.match(/youtu.be\/(.+)|youtube.com\/watch\?[^\ ]*v=([^&]+|$)/i);
	console.log(youtube)
	if(youtube !== null)
	{
		var output = (youtube[1] === undefined) ? youtube[2] : youtube[1];
		return '<br /><iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/'+output+'" frameborder="0" allowfullscreen>';
	}
	//-- Проверка на изображение и музыку
	if(!uid)
	{
		print(escapeHtml('<'+nick+'> ')+' <a href="'+text+'" target="_blank" class="images">'+text+'</a>');
		var href = text;
	}
	
	$("<img/>").attr("src", text)
	.load(function()
	{
		var w = Math.round($(window).width() * 0.5);
		var width = this.width;
		var height = this.height;
		if(width > w)
		{
			var k = width/height;
			width = w;
			height = Math.floor(width/k);
		}
		text = '<br /><a href="'+text+'" target="_blank"><img src="'+text+'" width="'+width+'" height="'+height+'" /></a>';
		uid ? message(uid, text) : text_replace(href, text);
	})
	.error(function()
	{
		var tempAudio = new Audio();
		$(tempAudio).bind(
		{
			'loadedmetadata': function(e)
			{
				text = '<audio src="'+text+'" controls></audio>';
				uid ? message(uid, text) : text_replace(href, text);
			},
			'error': function()
			{
				text = '<a href="'+text+'" target="_blank">'+text+'</a>';
				uid ? message(uid, text) : text_replace(href);
			}
		});
		tempAudio.src = text;
	});
	return false;
}
//-- ФУНКЦИОНАЛ: Замена ссылки на картинку
function text_replace(href, text)
{
	text = text || false;
	
	$('a.images[href="'+href+'"]').each(function(index, a)
	{
        if(text)
		{
			$(a).replaceWith(text);
			$('.chat').scrollTop($(this).scrollTop() + 9999);
		}
		else $(a).removeAttr('class');
    });
}
//-- ПРИЁМ: Список пользователей (1)
function userslist(users)
{
	var list = '', count = 0;
	user = users[0];
	$.each(users[1], function(id, val)
	{
		list += user_format(id, val);
		count++;
    });
	$('#uMain').append(list).find('dt > span').text(count);
	topics = users[2];
	$.each(topics, function(channel, topic)
	{
		if(topic != "")
		{
			soundPlay('topic_change');
			topic_change(channel);
			print('Текущая тема канала: "'+escapeHtml(topic)+'"', "topic");
		}
    });
}
//-- ПРИЁМ: Пользователь вошёл (2)
function userslist_add(user, channel)
{
	channel = channel || "Main";
	$('#u'+channel).append(user_format(user[0], user[1]));
	var count = $('#u'+channel+' > dd').length;
	$('#u'+channel+' dt > span').text(count);
	
	print("Пользователь "+escapeHtml(user[1][0])+" зашёл в чат", "network");
	soundPlay('join_network');
}
//-- ПРИЁМ: Пользователь вышел (3)
function userslist_del(user, channel)
{
	channel = channel || "Main";
	$('#u'+channel+' #user-'+user).remove();
	var count = $('#u'+channel+' > dd').length;
	$('#u'+channel+' dt > span').text(count);
	
	print("Пользователь "+escapeHtml(users[user][0])+" вышел из чата", "network");
	soundPlay('leave_network');
	if(uids[users[user][2]] == user) delete uids[users[user][2]];
	delete users[user];
	if(menuTarget == user) menuTarget = 0;
}
//-- ОТПРАВКА: Смена ника (4)
function nick_change(value)
{
	value = $.trim(value);
	if(nick != value && value != "")
	{
		socket.send('4|'+value);
		$.cookie('uc_nick', value, {expires: 365, path: '/'});
		user_nick(user, value);
		nick = value;
		$('#nick').blur();
	}
}
//-- ПРИЁМ: Смена ника (4)
function user_nick(uid, nick)
{
	var old_nick = users[uid][0];
	users[uid][0] = nick;
	$('#usersbox #user-'+uid+' div:last').text(nick);
	print(escapeHtml(old_nick+" сменил псевдоним на "+nick), "nickchange");
}
//-- ФУНКЦИОНАЛ: Отправка в окно чата
function print(text, style, channel)
{
	style = style || "self";
	channel = channel || "Main";
	var time = new Date();
	var minutes = time.getMinutes();
	var timestamp = '['+time.getHours()+':'+((minutes < 10) ? '0'+minutes : minutes)+'] ';
	
	$('#'+channel).append('<p class="'+style+'">'+timestamp+text+'</p>').scrollTop($('#'+channel).scrollTop() + 9999);
}
//-- ФУНКЦИОНАЛ: Шаблон пользователя
function user_format(id, array)
{
	users[id] = array;
	uids[array[2]] = parseInt(id);
	var opticity = array[3] ? '' : ' style="opacity:0.5"';
	return '<dd id="user-'+id+'"><div'+opticity+'></div><div title="= Информация о пользователе = \nПсевдоним: '+array[0]+' \nIP: '+array[1]+' \nUID: '+array[2]+' \nБраузер: '+array[4]+'">'+array[0]+'</div></dd>';
}
//-- СИСТЕМА: Выход (НЕ НАЗНАЧЕНО)
function quit()
{
	conlose.log("Goodbye!");
	socket.close();
	socket = false;
}
//-- ОТПРАВКА: Запрос на передачу файлов (5), Отмена передачи (15)
function FileSelectHandler(e)
{
	var to = menuTarget;
	if(to == user || to === false) return;

	transfer = true;
	files = e.target.files || e.originalEvent.dataTransfer.files;
	var meta = "", fileslist = "";
	
	// process all File objects
	$.each(files, function(key, file)
	{
		//-- Мета данные
		if(meta != "") meta += '|';
		meta += file.name+'|'+file.size;
		//-- Составление списка файлов
		fileslist += files_list(key, file.name, file.size);
	});
	//-- Настройка и открытие диалога
	$('#dialog-ufiles .fileslist').html(fileslist);
	$("#dialog-ufiles").dialog({buttons:[{text: fileText[1], click: function(){$(this).dialog("close");}}]}).dialog("open")
	.bind("dialogclose", function()
	{
		socket.send('15|'+to);
		files_cancel();
	});
	//-- Отправка запроса на передачу файлов
	socket.send('5|'+to+'|'+files.length+'|'+meta);
}
//-- ФУНКЦИОНАЛ: Отмена передачи
function files_cancel()
{
	if(xhr.length > 0)
	{
		$.each(xhr, function()
		{
			this.abort();
		});
	}
	transfer = false;
	files = [];
	$("#dialog-ufiles").unbind("dialogclose");
}
//-- ФУНКЦИОНАЛ: Создание списка файлов
function files_list(id, name, size)
{
	return '<div class="file-'+id+'"><div>'+name+'</div><progress max="100" value="0"></progress></div>';
}
//-- ПРИЁМ: Запрос на передачу файлов (5)
//-- ОТПРАВКА: Ответ о передачи (7)
function files_incoming(data)
{
	transfer = true;
	//-- От кого и сколько
	$("#dialog-files .user").text(users[data[0]][0]).next().text(data[1]);
	//-- Счётчик
	var q = 2,	
		fileslist = "";

	for(var i=0;i<data[1];i++)
	{
		files[i] = true;
		fileslist += files_list(i, data[q], data[q+1]);
		q+=2;
	}

	$("#dialog-files .fileslist").html(fileslist);
	$("#dialog-files").dialog(
	{
		buttons:
		[
			{text: fileText[0],	click: function()
			{
				$(this).unbind("dialogclose").dialog({buttons:[{text: fileText[1], click: function(){$(this).dialog("close");}}]}).one("dialogclose", function()
				{
					socket.send('7|'+data[0]+'|0');
					transfer = false;
				});
				socket.send('7|'+data[0]+'|1');
			}},
			{text: fileText[1], click: function(){$(this).dialog("close");}}
		]
	})
	.dialog("open")
	.one("dialogclose", function()
	{
		socket.send('7|'+data[0]+'|0');
	});
	soundPlay('file-transfer');
}
//-- ПРИЁМ: Ответ о передачи (7)
//-- ОТПРАВКА: Отмена передачи (15), Прогресса передачи файла (9), Завершение передачи файла (10)
function files_agree(from, approve)
{
	//-- Отправка файлов
	if(approve)
	{
		$("#dialog-ufiles").unbind("dialogclose").bind("dialogclose", function()
		{
			socket.send('15|'+from);
			files_cancel();
		});
		$.each(files, function(key, file)
		{
			var fd = new FormData();
			xhr[key] = new XMLHttpRequest();
			xhr[key].open('POST', 'upload.php', true);
			  
			xhr[key].upload.onprogress = function(e)
			{
				if(e.lengthComputable)
				{
					var percentComplete = Math.round((e.loaded / e.total) * 100);
					$('#dialog-ufiles .file-'+key+'>progress').val(percentComplete);
					socket.send('9|'+from+'|'+key+'|'+percentComplete);
					//console.log(percentComplete)
				}
			};
			xhr[key].onload = function()
			{			
				if(this.status == 200)
				{
					if($('#dialog-ufiles .file-'+key+'>progress').val() != 100) $('#dialog-ufiles .file-'+key+'>progress').val(100);
					var o = $.parseJSON(this.response);
					socket.send('10|'+from+'|'+key+'|1|'+o[0]+'|'+o[1]);
				}
				else socket.send('10|'+from+'|'+key+'|0');
				
				xhr.splice(key, 1);
				delete files[key];
				
				$('#dialog-ufiles .file-'+key).slideUp('slow', function()
				{
					$(this).remove();
					if($('#dialog-ufiles > .fileslist > div').length == 0)
					{
						files_cancel();
						$('#dialog-ufiles').dialog("close");
						$.post(ajaxDir+'a_transferclean.php', {action: "cleanANDclear"}).error(function(data) {alert(data.responseText);});
					}
				});				
			};
			
			fd.append("transferid", approve);
			fd.append("file", file);
			xhr[key].send(fd);
		});
		//socket.send(BinaryPack.pack([1, from, files[0]]));
	}
	else
	{
		$("#dialog-ufiles").dialog({buttons:[{text: fileText[3], click: function(){$(this).dialog("close");}}]});
		files_cancel();
	}
}
//-- ПРИЁМ: Проценты загрузки файлов (9)
function file_progress(key, value)
{
	$('#dialog-files .file-'+key+'>progress').val(value);
}
//-- ПРИЁМ: Ссылки на скачивание файлов (10)
function file_finish(data)
{
	files.splice(0, 1);
	
	if(data[1])
	{
		var element = $('#dialog-files .file-'+data[0]);
		var filename = $(element).children().first().text();
		var blank = (navigator.userAgent.indexOf("Firefox") === -1) ? '' : ' target="_blank"';
		
		if($('#dialog-files .file-'+data[0]+'>progress').val() != 100) file_progress(data[0], 100);
		$(element).append('<a href="download.php?transferid='+transferid+'&transferroot='+data[2]+'&transferfile='+encodeURIComponent(filename)+'&transfertype='+data[3]+'"'+blank+'>Скачать</a>');
	}
	if(files.length === 0)
	{
		$("#dialog-files").dialog({buttons:[{text: fileText[3],	click: function(){$(this).dialog("close");}}]});
		soundPlay('file-transfer-done');
	}
}
//-- ОТПРАВКА: Звуковой сигнал (11)
function beep()
{
	if(menuTarget <= 0) return false;
	
	print("Звуковой сигнал для "+escapeHtml(users[menuTarget][0])+" отправлен", "nickchange");
	socket.send("11|"+menuTarget);
}
//-- ПРИЁМ: Звуковой сигнал (11)
function beep_in(from)
{
	print("Получен звуковой сигнал от "+escapeHtml(users[menuTarget][0]), "nickchange");
	soundPlay('beep');	
}
//-- ФУНКЦИОНАЛ: Создание или открытие диалога
function talk(uid)
{
	if(menuTarget <= 0) return false;
	
	var sound = uid ? true : false;
	uid = uid || users[menuTarget][2];
	var element = $('#talk-'+uid);
	
	if($(element).length > 0)
	{
		if(!$(element).dialog("isOpen"))
		{
			$(element).dialog({show: "highlight"}).dialog("open");
			if(sound) soundPlay('message');
		}
		else if(!active) soundPlay('message');
		return element;
	}
	var target = menuTarget;
	
	$('#dialog-talk').clone().appendTo("body").attr('id', 'talk-'+uid)
	.dialog(
	{
		title: users[menuTarget][0]+talkText[0],
		width: interface.wTalkDialog,
		height: interface.hTalkDialog,
		resize: function()
		{
			talk_resize($(this));
		},
		resizeStop: function(event, ui)
		{
			localStorage['wTalkDialog'] = ui.size.width;
			localStorage['hTalkDialog'] = ui.size.height;
		}
	})
	var element = $('#talk-'+uid);
	
	$(element).show()
	.find('.mainbox').height(interface.hTalkBox).resizable(
	{
		minHeight: 20,
		maxHeight: 100,
		handles: "n",
		resize: function(event, ui)
		{
			$(this).css('top', '');
			talk_resize($(this).parent());
		},
		stop: function(event, ui)
		{
			localStorage['hTalkBox'] = ui.size.height;
		}
	});
	talk_resize(element);
	talk_events(element, target, uid);
	$('button:last', element).click(function(){$(element).dialog("close");});
	if(sound) soundPlay('message');
	icon_toogle();

	return element;
}
//-- ФУНКЦИОНАЛ: События на нажатие
function talk_events(element, target, uid)
{
	$('textarea', element).unbind().keydown(function(e)
	{
		if(!e.ctrlKey || e.keyCode != 13) return true;
		
		talk_send(target, uid, $(this).val());
	});
	$('button:first', element).unbind().click(function()
	{
		talk_send(target, uid, $(this).parent().parent().find('textarea').val());
	});
}
//-- ФУНКЦИОНАЛ: Размеры в окне разговора
function talk_resize(element)
{
	$('.talkbox', element).height($(element).height() - $('.mainbox', element).outerHeight(true) - $('footer', element).outerHeight(true));
}
//-- ОТПРАВКА: Сообщения в разговор (12)
function talk_send(to, uid, text)
{
	text = $.trim(text);
	if(text == "")
	{
		$('textarea', element).val("").focus();
		return false;
	}
	
	var element = $('#talk-'+uid);

	if(users[to] === undefined || users[to][2] != uid)
	{
		$('.talkbox', element).append('<p class="recover">'+talkText[1]+'</p>');

		if(uids[uid] === undefined) return false;
		
		to = uids[uid];
		talk_events(element, to, uid);
	}

	talk_print(element, text, 0);
	$('textarea', element).val("").focus();
	socket.send('12|'+to+'|'+uid+'|'+text);
}
//-- ПРИЁМ: Сообщения в разговор (12)
function talk_recive(data)
{
	menuTarget = data[0];
	var element = talk(data[1]);
	talk_print(element, data[2], data[0]);
	icon_toogle();
}
//-- ПРИЁМ: Активность
function activity(user, active)
{
	var opacity = active ? 1 : 0.5;
	$('#usersbox #user-'+user+' div:first').fadeTo(0, opacity);
}
//-- ФУНКЦИОНАЛ: Стили и формат сообщения
function talk_print(element, text, from)
{
	var time = new Date();
	var minutes = time.getMinutes();
	var timestamp = '['+time.getHours()+':'+((minutes < 10) ? '0'+minutes : minutes)+'] ';
	if(from)
	{
		style = "from";
		var author = users[from][0];
	}
	else
	{
		style = "me";
		var author = nick;
	}
	text = escapeHtml(text).replace(/(https?:\/\/[^\ ]+)/ig, '<a href="$1"  target="_blank">$1</a>');
	
	$('.talkbox', element).append('<p class="'+style+'">'+timestamp+' '+author+':</p><p>'+text+'</p>').scrollTop($('.talkbox', element).scrollTop() + 9999);
}
//-- ФУНКЦИОНАЛ: Открытие диалога сообщения
function status(type)
{
	var status = "";
	switch(type)
	{
		case 0: status = "Подключение..."; break;
		case 1: status = "Готов."; break;
		case 3: status = "Отключён."; break;
	}
	$('.footer span').text(status);
}
//-- ОТПРАВКА: Смена темы (14)
function topic_submit()
{
	if(!topic_stop)
	{
		$('#dialog-topic').dialog("close");
		
		var tab = $("#tabs").tabs("option", "active");
		var channel = $("#tabs div.chat:eq("+tab+")").attr('id');
		var topic = $.trim($('#dialog-topic input').val());
		
		socket.send("14|"+channel+"|"+topic);
		if(topic != "") topic += ' ('+nick+')';
		topic_recive(user, channel, topic);
	}
}
//-- ПРИЁМ: Смена темы (14)
function topic_recive(user, channel, topic)
{
	if(!topic_stop)
	{
		var button = $('#dialog-topic button:first');
		$(button).prop('disabled', topic_stop);
		topic_stop = true;
		setTimeout(function()
		{
			topic_stop = false;
			$(button).prop('disabled', topic_stop);
		}, 60000);
	}
	
	topics[channel] = topic;
	topic_change(channel);
	var text = users[user][0]+' ';
	text += (topic == "") ? topicText[1] : topicText[0]+': "'+topic+'"';
	print(text, "topic");
	soundPlay('topic_change');
	icon_toogle();
}
//-- ФУНКЦИОНАЛ: Действите с вкладками
function title_tabs(event, ui)
{
	topic_change(ui.panel.selector.substr(1));
}
//-- ФУНКЦИОНАЛ: Смена заголовка
function topic_change(channel)
{
	if(channel in topics)
	{
		var topic = (topics[channel] == "") ? "" : ': '+topics[channel];
		document.title = '[#'+channel+topic+'] - '+title;
	}
}
//-- ФУНКЦИОНАЛ: Открытие диалога смены темы
function topic_dialog()
{
	var tab = $("#tabs").tabs("option", "active");
	var channel = $("#tabs div.chat:eq("+tab+")").attr('id');
	
	$('#dialog-topic').dialog(
	{
		title: '#'+channel
	}).dialog("open")
	.find('button:first').prop('disabled', topic_stop);
	$('#dialog-topic input').val(topics[channel]).select();
}
//-- ФУНКЦИОНАЛ: Включение/Отключение звука
function mute_toogle()
{
	if(muted)
	{
		muted = false;
		localStorage.removeItem('sMuted');
	}
	else
	{
		muted = true;
		localStorage['sMuted'] = true;
	}
}
function icon_set(url)
{
	$('link[rel="shortcut icon"]').replaceWith('<link rel="shortcut icon" type="image/x-icon" href="'+url+'" />');
}
function icon_toogle()
{
	if(active || icon_blink) return;

	var info = 'template/icons/chat.ico';
	var toogle = true;
	
	icon_blink = setInterval(function()
	{
		if(toogle)
		{
			icon_set(info);
			toogle = false;
		}
		else
		{
			icon_set('favicon.ico');
			toogle = true;
		}
	}, 1000);
}
function icon_normal()
{
	if(!icon_blink) return;
	
	icon_set('favicon.ico');
	clearInterval(icon_blink);
	icon_blink = 0;
}
function soundPlay(name)
{
	if(!muted) audio.src = baseUrl+'sounds/'+name+'.wav';
}
function setInterface()
{
	var height = $('#checkheight').height();
	$('#leftside').width($('#checkheight').width() - $('#userbox').width() - interface.pAside);
	$('#chatbox').height(height - $('#messagebox').innerHeight() - interface.pContent);
	$('#userbox').height(height);
	$('#usersbox').height(height - $('#userbox > form').innerHeight() - 2)
	$('#tabs').tabs("refresh");
}
function escapeHtml(unsafe)
{
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n{5,}|\n/g, "<br />");
}
function chatline_nick()
{
	if(menuTarget <= 0 || !(menuTarget in users)) return false;
	
	var message = users[menuTarget][0]+': '+$('#message').val();
	$('#message').val(message).focus();
}
function chatbox_clean()
{
	var tab = $('#tabs').tabs('option', 'active');
	$('#tabs div.chat:eq('+tab+')').empty();
}
//-- ФУНКЦИОНАЛ: Информация в окне канала
function channel_info(channel, text)
{
	$('#channel-info').stop().slideDown().find('span:last').text(text).parent().parent().delay(5000).slideUp();
	transfer_image = false;
	channelTarget = 0;
}
//-- ОТПРАВКА: Изображения в канал (1)
function channel_image(e)
{
	if(transfer_image) return false;
	
	transfer_image = true;
	var channel = channelTarget;
	files = e.target.files || e.originalEvent.dataTransfer.files;
	
	if(files.length > 1) return channel_info(channel, 'Отправляйте по одному файлу.');
	if(files[0].type.indexOf('image') === -1 && files[0].type.indexOf('audio') === -1) return channel_info(channel, 'Разрешены только изображения и музыка.');
	//-- Показ прогресс бара
	$('#channel-progress').slideDown().find('progress').val(0);
	//-- Отправка файлов
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'upload_image.php', true);
			  
	xhr.upload.onprogress = function(e)
	{
		if(e.lengthComputable)
		{
			var percentComplete = Math.round((e.loaded / e.total) * 100);
			$('#channel-progress > progress').val(percentComplete);
		}
	};
	xhr.onload = function()
	{	
		$('#channel-progress').slideUp();
		if(this.status == 200)
		{
			var result = $.parseJSON(this.response);
			if(result[0])
			{
				msg = result[1];
				msg += encodeURI(files[0].name);
				
				socket.send('0|'+msg);
				msg = text_do(msg);
				if(msg) print(escapeHtml('<'+nick+'> ')+msg);
				
				transfer_image = false;
				channelTarget = 0;
			}
			else return channel_info(channel, result[1]);
		}
		else return channel_info(channel, 'Ошибка при отправки файла.');
	};
	
	fd.append("file", files[0]);
	xhr.send(fd);
}

$(document).ready(function()
{
	//-- JQueryUI
	$("nav.second > button").button({icons: {secondary: "ui-icon-triangle-1-s"}});
	$("#tabs").tabs(
	{
		heightStyle: "fill",
		create: title_tabs,
		activate: title_tabs
	});
	$("#userbox").resizable(
	{
		minWidth: 100,
		maxWidth: 300,
		handles: "w",
		resize: function(event, ui)
		{
			$('#leftside').width($('#checkheight').width() - ui.size.width - interface.pAside);
		},
		stop: function(event, ui)
		{
			localStorage['wUserBox'] = ui.size.width;
		}
	});
	$("#messagebox > div").resizable(
	{
		minHeight: 28,
		maxHeight: 100,
		handles: "n",
		resize: function(event, ui)
		{
			$(this).css('top', '');
			$('#messagebox').height(ui.size.height);
			$('#chatbox').height($('#checkheight').height() - ui.size.height - 15);
			$('#tabs').tabs("refresh");
		},
		stop: function(event, ui)
		{
			localStorage['hMessageBox'] = ui.size.height;
		}
	});
	$("#nickbox button:first").button()
	.next().button(
	{
		text: false,
		icons: {primary: "ui-icon-triangle-1-s"}
	})
	.parent().buttonset();	
	
	//-- Подключение
    connect();
	
	$("#dialog-files, #dialog-ufiles").dialog(
	{
		width: "30%",
		autoOpen: false,
		resizable: false,
		position: {at: "right top"},
		show: {effect: "highlight", duration: 2000}
    });
	
	$("#messagebox, #messagebox > div").height(interface.hMessageBox);
	$("aside, #userbox").width(interface.wUserBox);
	interface['pContent'] = parseInt($('#checkheight').css("padding-left"));
	interface['pAside'] = parseInt($('aside').css("right")) + parseInt($('#userbox').css("padding-left"));
	setInterface();
	
	//var audioEl	= $('<audio></audio>');
	//$('body').prepend(audioEl);
	//audio = audioEl.get(0);
	audio = new Audio();
	audio.volume = 0.1;
	audio.autoplay = true;
	
	$('#usersbox').on(
	{
		click: function(e)
		{
			menuTarget = e.target.parentElement.id.substr(5);
		},
		contextmenu: function(e)
		{
			menuTarget = e.target.parentElement.id.substr(5);
			if(menuTarget == user) return true;
			e.preventDefault();
			
			var x = e.pageX;
			var w = $(window).width() - x;
			var y = e.pageY;
			
			$('#usermenu').show();		
			var len = $('#usermenu > ul').outerWidth() - w;
			if(len > 0) x -= len;
			$('#usermenu').css({'left': x, 'top': y})
			$(document).unbind("click").one("click", function()
			{
				$('#usermenu').hide();
			});
		},
		dblclick: function(e)
		{
			menuTarget = e.target.parentElement.id.substr(5);
			if(menuTarget == user) return true;
			
			talk();
		}
	}, "dd > div");
	$('#filechoose').change(FileSelectHandler);
	$('#dialog-topic').dialog(
	{
		width: "40%",
		autoOpen: false,
		resizable: false,
		close: function(){$('#dialog-topic button:first').unbind();}
    });
	$('#Main').dblclick(topic_dialog);
	
	print("Добро пожаловать в Unio Chat, "+nick+"!", "welcome");
})
.bind(
{
	keydown: function(e)
	{
		if(!e.ctrlKey && !e.shiftKey) return;

		if(e.ctrlKey)
			switch(e.keyCode)
			{
				case 89: chatline_nick(); return false;
			}
		if(e.shiftKey)
		{
			switch(e.keyCode)
			{
				case 27: chatbox_clean(); return false;
			}
		}
	},
	dragover: function(e)
	{
		e.stopPropagation();
		e.preventDefault();
		
		//-- Окно чата
		if(e.target.className.indexOf('chat') >= 0)
		{
			$('#'+e.target.id).addClass('files');
		}
		else if(e.target.parentNode.className.indexOf('chat') >= 0)
		{
			$('#'+e.target.parentNode.id).addClass('files');
		}
		//-- Окно пользователей
		else if(e.target.localName == 'dd' && e.target.offsetParent.id == 'userbox')
		{
			if(transfer) return;
			if(e.target.id.substr(5) != user) e.target.className = "files";
		}
		else if(e.target.parentNode.localName == 'dd' && e.target.parentNode.offsetParent.id == 'userbox')
		{
			if(transfer) return;
			if(e.target.parentNode.id.substr(5) != user) e.target.parentNode.className = "files";
		}
	},
	dragleave: function(e)
	{
		e.stopPropagation();
		e.preventDefault();
		//-- Окно канала
		if(e.target.className.indexOf('chat') >= 0)
			$('#'+e.target.id).removeClass('files');		
		else if(e.target.parentNode.className.indexOf('chat') >= 0)
			$('#'+e.target.parentNode.id).removeClass('files');
		//-- Окно пользователей
		else if(e.target.localName == 'dd' && e.target.offsetParent.id == 'userbox')
			e.target.className = "";
		else if(e.target.parentNode.localName == 'dd' && e.target.parentNode.offsetParent.id == 'userbox')
			e.target.parentNode.className = "";
	},
	drop: function(e)
	{
		e.stopPropagation();
		e.preventDefault();
		
		$('div.files').each(function(){$(this).removeClass('files');});
		$('dd.files').each(function(){$(this).removeAttr('class');});
		
		var type = 0;
		
		//-- Окно канала
		if(e.target.className.indexOf('chat') >= 0)
		{
			type = 1;
			channelTarget = e.target.id;
		}
		else if(e.target.parentNode.className.indexOf('chat') >= 0)
		{
			type = 1;
			channelTarget = e.target.parentNode.id;
		}
		//-- Окно пользователей
		else if(e.target.localName == 'dd' && e.target.offsetParent.id == 'userbox')
		{
			if(transfer) return;
			type = 2;
			menuTarget = e.target.id.substr(5);
		}
		else if(e.target.parentNode.localName == 'dd' && e.target.parentNode.offsetParent.id == 'userbox')
		{
			if(transfer) return;
			type = 2;
			menuTarget = e.target.parentNode.id.substr(5);
		}
		//-- Тип отправки
		if(type == 1) channel_image(e);
		else if(type == 2) FileSelectHandler(e);
	}
});
$(window).bind(
{
	resize: function(e)
	{
		if(!e.target.tagName) setInterface();
	},
	focus: function()
	{
		if(socket) socket.send('13|1');
		activity(user, 1);
		active = true;
		icon_normal();
	},
	blur: function()
	{
		if(socket) socket.send('13|0');
		activity(user, 0);
		active = false;
	},
	beforeunload: function(){return 'Вы хотите выйти из Unio Chat?';}
});
