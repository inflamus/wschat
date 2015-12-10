/*
 * Client-side Socket.io
 * 
 * 
 * 
*/


if(typeof config == 'undefined') config = {};
config = $.extend(
	{
		host : 'vds745.sivit.org',
		port : 443,
		timeout : 5000, //5s
		max_reconnection_attempts: 10,
		imageUpload : {
			maxheight:350,
			maxwidth:500
		},
		canvas : {
			type:'image/png',
			quality:1
		},
		clearOnChannelChange:true
	}, config);

// console.log(config);

function clearChat()
{
	$('#conversation').empty();
}

var focusFlag = true;
function updateTitle(isNew)
{
	if(isNew && $('title').text().substr(0,1) != '*' && !focusFlag)
		return $('title').text('* '+$('title').text());
	if(!isNew && $('title').text().substr(0,1) == '*' && focusFlag)
		return $('title').text($('title').text().substr(2));
}

socket_port = config.port;
var socket = io.connect(config.host, {
  port: socket_port,
  'connect timeout': config.timeout,
  'flash policy port': 10843,
  'max reconnection attempts':config.max_reconnection_attempts
});

thissock = socket.socket;
try_other_port = function() {
//   if (socket_port !== 80) {
//     if (typeof console !== "undefined" && console !== null) {
//       console.log("Trying other port, instead of port " + socket_port + ", attempting port 80");
//     }
//     socket_port = 80;
//     thissock.options.port = socket_port;
//     thissock.options.transports = ['htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'];
//     return thissock.connect();
//   } else {
	$('#error').modal('show');
// 	.find('.modal-body').append(
// 		'<p>Host : '+config.host+'</p>'+
// 		'<p>Port : '+socket_port+'</p>');
	$('#connection [role=progressbar]').attr('aria-valuenow', 100).css('width', '100%').removeClass('progress-bar-*').addClass('progress-bar-danger');
	
     return false;
//   }
};
thissock.on('connect_failed', function() {
  if (typeof console !== "undefined" && console !== null) {
    console.log("Connect failed (port " + socket_port + ")");
  }
  return try_other_port();
});
thissock.on('error', function() {
  if (typeof console !== "undefined" && console !== null) {
    console.log("Socket.io reported a generic error");
  }
  return try_other_port();
});

abnormallylong = false;
progressbar = setInterval(function(){
	valuenow = $('#connection .progress-bar-info').attr('aria-valuenow');
	if(valuenow == 100) return;
	if(valuenow > 80)
	{
		$('#connection .progress-bar-info').addClass('progress-bar-danger');
		if(!abnormallylong)
		{
			$('#connection p.text-center').append(' abnormally long...');
			abnormallylong= true;
		}
	}
	newval = parseInt(valuenow) + (100/(config.timeout / 500));
	$('#connection [role=progressbar]').attr('aria-valuenow', newval).css('width', newval+'%');
	console.log(newval);
	return;
}, 500);
setTimeout(function(){	clearInterval(progressbar); }, config.timeout*2 +10);
// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	// call the server-side function 'adduser' and send one parameter (value of prompt)
	$('#connection')
		.find('[role=progressbar]').removeClass('progress-bar-info progress-bar-danger').addClass('progress-bar-success')
		.attr('aria-valuenow', 100).css('width', '100%')
		.end()
		.fadeOut(500, function(){ $('#login').modal({show: true, backdrop:'static', keyboard:false})});
	$('#pseudo').focus().keypress(function(e){
		if(e.which == 13) {
			$(this).blur();
			$('#loginvalid').focus().click();
		}
	});
	$('#loginvalid').click(function(){
		pseudo = $('#pseudo').val();
		if(pseudo)
		{
			socket.emit('adduser', pseudo);
			$('#login').modal('hide');
			$('.chat').removeClass('hide');
		}
	});
	// socket.emit('adduser', prompt('What\'s your name ?'));
});
socket.on('reconnecting', function(delay, attemptnumber){
// 	$('#connection, #error').modal('hide');
	console.log('reconnecting fired.' +attemptnumber);
	$('#reconnection').modal({backdrop:'static', show:true, keyboard:false})
		.find('div.progress-bar').attr('aria-valuenow', attemptnumber).text(attemptnumber +' / '+ config.max_reconnection_attempts)
		.css('width', Math.round((attemptnumber / config.max_reconnection_attempts)*100)+'%');
	if(attemptnumber == config.max_reconnection_attempts)
		$('#reconnection').find('.modal-dialog').removeClass('modal-sm')
			.find('h3.modal-title').removeClass('text-*').addClass('text-danger').html('<i class="glyphicon glyphicon-ban-circle"></i> Connection error').end()
			.find('.progress-bar-warning').removeClass('progress-bar-warning').addClass('progress-bar-danger').end()
			.find('.progress.active').fadeOut(1000, function(){
				$('<button>', {'class':'btn btn-block btn-lg btn-primary', html:'<i class="glyphicon glyphicon-refresh"></i> Refresh'})
				.on('click', function(){history.go(0)}).fadeIn().appendTo($(this).parent())
			}).end()
			.find('.modal-body p').replaceWith('<div class="alert alert-danger"><p><strong>Reconnection attempts failed.</strong> The server has been unreachable for '+delay/1000 +' seconds.</p><p>Check your internet connection and try again later by refreshing this page.</p></div>');

	return;
});

socket.on('reconnect', function(){
	console.log('reconnect fired.');
	reconnecting_att_i = 0;
	$('#reconnection')
	.find('div.progress-bar').css('width', '100%').addClass('progress-bar-success')
	.end().modal('hide');
	return; 
});
// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	if(arguments.length == 3)
	{
		type = arguments[2];
		if(type=='img')
			data = '<img class="img-responsive img-rounded" alt="image" src="'+data+'" />';
	}
	if(username=='SERVER')
		$('#conversation').append('<dt class="text-muted">'+username+'</dt><dd style="margin-bottom:5px;" class="text-muted">'+data+'</dd>');
	else
		$('#conversation').append('<dt>'+username + '</dt><dd style="margin-bottom:5px;">' + data + '</dd>');
	//autoscroll to bottom
	$(window).scrollTop($(document).height());
	updateTitle(true);
	//autoremove old messages (200)
	if($('#conversation > dt').length ==200)
		$('#conversation').find('dt:first').add('dd:first').remove();
});
// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on('updaterooms', function(rooms, current_room, numberofusers) {
	$('#rooms').empty();
	$.each(rooms, function(key, value) {
		if(value == current_room){
			$('#rooms').append('<a class="list-group-item active" href="#"><span class=badge>'+numberofusers+'</span>' + value + '</a>');
		}
		else {
			$('#rooms').append('<a class="list-group-item" href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a>');
		}
	});
});
socket.on('updateroomsusers', function(number){
	$('#rooms > a.active > span.badge').text(number);
});
socket.on('newroom', function(room){
	$('#rooms').append('<a class="list-group-item" href="#" onclick="switchRoom(\''+room+'\')">'+ room +'</a>');
});
socket.on('removeroom', function(room){
	$('#rooms').find('a:contains('+room+')').remove();
})
// on load of page
$(function(){
	// when the client clicks SEND
	$('#datasend').click( function() {
		if($('#data').val()=='')
			return false;
		var message = $('<div>', {text:$('#data').val()}).html();
		$('#data').val('');
		//Handle special commands
		if(message.substr(0,6)=='/join ')
			return switchRoom(message.substr(6));
		if(message.substr(0,9)=='/addroom ')
		{
			socket.emit('addroom', message.substr(9));
			return switchRoom(message.substr(9));
		}
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
	});
	$('#clear').click(function(){clearChat()});
	$('#addchannelbtn').click(function(){
		$('#data').val('/addroom ').focus();
	});
	$('#joinchannel').click(function(){
		$('#data').val('/join ').focus();
	})
	$('#sendpicture').click(function(){
		$('<input>', {'name':'file', 'type':'file', 'accept':'image/*'})
		.on('change', function(){
			var	file = this.files[0],
			reader = new FileReader();
			if(!file.type.match('image/*'))
				return false;
			reader.onload = (function(evt){
				var img = document.createElement('img');
				img.src = evt.target.result;
					// console.log(ctx);
					// console.log(canvas);
					//We put a timeout because the browser has to parse the image to get the inner width and height.
					//there some bug without.
					setTimeout(function(){
						socket.emit('user image', resizeImg(img, config.imageUpload.maxwidth, config.imageUpload.maxheight))
					}, 500);
					delete img;
					// socket.emit('user image', evt.target.result);
				});
				reader.readAsDataURL(file); //flush data
			}).trigger('click');
	});
	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
			$('#data').focus();
		}
	});
	$(window).add('body').focus(function(){
		focusFlag = true;
		updateTitle(false);
		// console.log(true);
	}).blur(function(){
		// console.log(false);
		focusFlag = false;
	})
});
function switchRoom(room){
	if(config.clearOnChannelChange) clearChat();
	socket.emit('switchRoom', room);
}
//Arguments : documentElement('img') object, max_width int, max_height int
function resizeImg(img, maxwidth, maxheight)
{
	// console.log(img);
	var canvas = document.createElement('canvas');
	var height 		= img.height;
	var width 		= img.width;
	console.log(height);
	console.log(width);
	if (width > height) {
		if (width > maxwidth) {
			height *= maxwidth / width;
			width = maxwidth;
		}
	} else {
		if (height > maxheight) {
			width *= maxheight / height;
			height = maxheight;
		}
	}
	canvas.width = width;
	canvas.height = height;
	var ctx=canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height);
	return canvas.toDataURL(config.canvas.type, config.canvas.quality);
}
