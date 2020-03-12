var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var userlist = [];
var chat = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
}) ;

app.use('/client', express.static('client'));

io.on('connection', function(socket) {

    socket.on('no history', function() {
        var socketid = socket.id;

        var name = findname();

        var user = {
            username: name,
            colour: "white",
            id: socketid
        };

        userlist.push(user);
        socket.emit('create cookie', user.username);
        socket.emit('setup', user, chat, userlist);
        io.emit('user list update', userlist);
    });

    socket.on('history', function(username) {
        if (!uniquename(username)) {
            var name = findname();
        }
        else{
            var name = username;
        }

        socketid = socket.id;

        var user = {
            username: name,
            colour: "white",
            id: socketid
        };

        userlist.push(user);
        socket.emit('setup', user, chat, userlist);
        io.emit('user list update', userlist);
    });

    socket.on('disconnect', function() {
        for (let i=0; i<userlist.length; i++) {
            if (userlist[i].id === socket.id) {
                userlist.splice(i, 1);
                io.emit('user list update', userlist);
                return;
            }
        }
    });

    socket.on('send', function(username, message){
        for (var i=0; i<userlist.length; i++) {
            if (userlist[i].username === username) {
                var time = new Date().getTime();
                var colour = userlist[i].colour;
                io.emit('chat update', message, time, username, colour);
                addtochatlist(message, time, username, colour);
                break;
            }
        }
    });

    socket.on('nick', function(username, nickname) {
        
        if (uniquename(nickname)){
            for (var i=0; i<userlist.length; i++){
                if (userlist[i].username===username){
                    userlist[i].username = nickname;
                    socket.emit('nickname updated', nickname);
                    io.emit('user list update', userlist);
                    break;
                }
            }
        }
        else{
            socket.emit('nickname unavail');
        }
    });

    socket.on('nickcolor', function(username, colour) {
        for (var i = 0; i < userlist.length; i++) {
            if (userlist[i].username === username) {
                userlist[i].colour = colour;
            }
        }
    });

    function addtochatlist(msg, timestamp, name, msgcolour){
        var contents = {
            message: msg,
            username: name,
            time: timestamp,
            colour: msgcolour
        };
        chat.push(contents);

        if(chat.length > 500){
            chat.splice(0, stack.length - 205);
            io.emit('chat refresh', chat);
        }
    }

    function uniquename(nickname){
        for (var i=0; i<userlist.length; i++){
            if (userlist[i].username===nickname){
                return false;
            }
        }
        return true;
    }

    function findname(){
        var namecount = 0;
        var name = "User"+namecount;
        while (!uniquename(name)){
            namecount++;
            name = "User"+namecount;
        }
        return name;
    }

});

http.listen(3000, function() {
    console.log('listening on *: 3000');
});