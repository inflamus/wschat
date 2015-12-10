var WEBSOCKET_PORT = 443;
var HTTP_PORT = [8080];
var express = require('express')
  , minify = require('express-minify')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
var jade = require('jade');
var servers = [];

server.listen(WEBSOCKET_PORT);

HTTP_PORT.forEach(function(port){
	servers.push(http.createServer(app).listen(port));
});


app.enable('trust proxy'); //enable proxy on express to use 3G smartphone connections

//gzip compression
app.use(express.compress());

// minify sources
app.use(minify({
	cache: __dirname + '/cache',
	js_match: /javascript/,
	css_match: /css/
}));

var cacheDuration = 31536000; //one year
// routing
app.get('/', function (req, res) {
	res.set('Content-Type', 'text/html');
	res.setHeader('cache-control', 'private, max-age='+cacheDuration/1000);
	res.send(jade.renderFile(__dirname + '/index.jade'));
});
app.get('/js/allinone.jade', function(req, res){
	res.set('Content-type', 'text/javascript');
	res.setHeader('cache-control', 'private, max-age='+cacheDuration/1000);
	res.send(jade.renderFile(__dirname + '/js/allinone.jade'));
});

//routing modern -- with js and css :p
app.use(express.static(__dirname + '/', {maxAge: cacheDuration}));


var usernames_colors = [
	'#add8e6', //lightblue
	'#f08080', //lightcoral
	'#90ee90', //lightgreen
	'#ffb6c1', //lightpink
	'#ffa07a', //lightsalmon
	'#20b2aa', //lightseagreen
	'#87cefa', //lightskyblue
	'#778899', //lightslategray
	'#b0c4de', //lightsteelblue
	'#ffd700', //gold
	'#8A2BE2', 
	'#A52A2A', 
	'#DEB887', 
	'#5F9EA0', 
	'#D2691E', 
	'#FF7F50', 
	'#6495ED', 
	'#DC143C', 
	'#008B8B', 
	'#B8860B', 
	'#8B008B', 
	'#556B2F', 
	'#9932CC', 
	'#FF8C00', 
	'#8B0000', 
	'#E9967A', 
	'#8FBC8F', 
	'#483D8B', 
	'#2F4F4F', 
	'#00CED1', 
	'#9400D3', 
	'#FF1493', 
	'#00BFFF', 
	'#696969', 
	'#1E90FF', 
	'#B22222', 
	'#DAA520', 
	'#ADFF2F', 
	'#FF69B4', 
	'#CD5C5C', 
	'#4B0082', 
	'#808000', 
	'#6B8E23', 
	'#FFA500', 
	'#FF4500', 
	'#DA70D6', 
	'#EEE8AA', 
	'#98FB98', 
	'#AFEEEE', 
	'#DB7093', 
	'#FFEFD5', 
	'#FFDAB9', 
	'#CD853F', 
	'#FFC0CB', 
	'#DDA0DD', 
	'#B0E0E6', 
	'#FFFF00', 
	'#9ACD32', 
	'#00FF7F', 
	'#4682B4', 
	'#D2B48C', 
	'#008080', 
	'#D8BFD8', 
	'#FF6347', 
	'#40E0D0', 
	'#EE82EE', 
	'#F5DEB3', 
	'#A0522D', 
	'#C0C0C0', 
	'#87CEEB', 
	'#6A5ACD', 
	'#708090', 
	'#F4A460', 
	'#2E8B57', 
	'#8B4513', 
	'#FA8072', 
	];

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['Canal Général'];

Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)]
}

io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = '<span style="color:'+usernames_colors.randomElement()+';">'+username+'</span>';
		// store the room name in the socket session for this client
		socket.room = rooms[0];
		// add the client's username to the global list
		usernames[username] = '<span style="color:'+usernames_colors.randomElement()+';">'+username+'</span>';
		// send client to room 1
		socket.join(rooms[0]);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to '+rooms[0]);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(rooms[0]).emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.broadcast.to(rooms[0]).emit('updateroomsusers', io.sockets.clients(rooms[0]).length);
		socket.emit('updaterooms', rooms, rooms[0], io.sockets.clients(rooms[0]).length);
		// console.log(usernames);
		// console.log(rooms);
	});
	
	socket.on('addroom', function(room){
		rooms.push(room);
		socket.broadcast.emit('newroom', room);
		// console.log(this);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('user image', function(data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data, 'img');
	});
	
	socket.on('switchRoom', function(newroom){
		oldroom = socket.room;
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.broadcast.to(newroom).emit('updateroomsusers', io.sockets.clients(newroom).length);
		//the channel is empty, we'll remove it
		if(io.sockets.clients(oldroom).length == 0 && rooms.indexOf(oldroom)>0)
		{
			rooms.splice(rooms.indexOf(oldroom), 1);
			io.sockets.emit('removeroom', oldroom);
		}
		socket.broadcast.to(oldroom).emit('updateroomsusers', io.sockets.clients(oldroom).length);
		socket.emit('updaterooms', rooms, newroom, io.sockets.clients(newroom).length);
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		//io.sockets.emit('updateusers', usernames);
		socket.broadcast.to(socket.room).emit('updateroomsusers', io.sockets.clients(socket.room).length);
		// echo globally that this client has left
		if(socket.username != undefined)
			socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
