var express = require('express');
var morgan = require('morgan');
var path = require('path');
// var mysql = require('mysql');
// var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');
// var nodemailer = require('nodemailer');
// var generator = require('generate-password');
var http = require('http')
// var formidable = require('formidable');
// var fs = require('fs');


var app = express();
server = http.createServer(app);
var io = require('socket.io')(server);

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret: 'SomeRandomSecretValue',
    cookie: {
        maxAge: 1000 * 60 * 10
    } //maxAge: 10 minutes
}));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'ui', 'home.html'));
});


// Push to list when enqueued
// After pushing check index
// If index even, pair with previous element. Create gameroom class with these 2 players. Then remove both from queue.
// Individually communicate gamecode with each client in separate room


function generate_game_code(length=5) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    };
    for(i=0;i<gamerooms.length;i++) {
        if(result === gamerooms[i].code) {
            result = generate_game_code()
        }
    }
    return result;
};


class Gameroom {
    constructor(playerids, game_code = generate_game_code()) {
        this.code = game_code;
        this.playerids = playerids;

        this.player1 = randomIntFromInterval(0,1);
        this.board = [[],[]]

        this.default_time = 46
        this.timer = this.default_time;
        this.current_player_num = this.player1;

    }

    get_opponent_num(playernum) {
        return (playernum-1)*(-1);
    } 

    create_timer() {
        t = setTimeout
    }

    start_timer() {
        if(this.timer >=0) {
            console.log("timer "+this.timer);
            this.timer--;
            var thisroom = this;
            setTimeout(function() {
                thisroom.start_timer();
            }, 1000);
            return;
        } else {
            io.sockets.in(this.playerids[this.get_opponent_num(this.current_player_num)]).emit("timewin", {});
            io.sockets.in(this.playerids[this.current_player_num]).emit("timelose", {})
        }
    }

    reset_timer() {
        console.log("timer reset");
        this.timer = this.default_time;
        this.current_player_num = this.get_opponent_num(this.current_player_num);
    }

}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

app.post('/game-details', function(req, res) {
    for(i=0;i<gamerooms.length;i++) {
        var pIndex = gamerooms[i].playerids.indexOf(req.body.userid);
        if(pIndex>=0) {
            res.send({game_code: gamerooms[i].code, current_player_num: gamerooms[i].current_player_num, playernum: pIndex, board: gamerooms[i].board, timer: gamerooms[i].timer});
        }
    }   
});

var queue = [];
var gamerooms = [];

io.on('connection', function(socket) {
    console.log("A user connected.");
    socket.on('enqueue', function(data) {
        socket.username = data.userid
        queue.push(data.userid);
        console.log(queue);
        var index = queue.indexOf(data.userid);
        if((index+1) % 2 === 0) {
            var game_code = generate_game_code();
            userids = [queue[index], queue[index-1]]
            var gameroom = new Gameroom(userids, game_code);
            gamerooms.push(gameroom);
            queue.splice(index, 1);
            queue.splice(index-1, 1);
            console.log(queue);
            io.sockets.in(userids[0]).emit('game_code', {game_code: game_code});
            io.sockets.in(userids[1]).emit('game_code', {game_code: game_code});
            gameroom.start_timer();
        }
    });

    socket.on('join', function (data) {
        socket.join(data.userid); // We are using room of socket io
    });

    socket.on('move', function(data) {
        console.log("Move taken")
        for(i=0;i<gamerooms.length;i++) {
            console.log(gamerooms[i].playerids)
            console.log(data.userid)
            var pIndex = gamerooms[i].playerids.indexOf(data.userid)
            console.log(pIndex);
            if(pIndex>=0) {
                console.log("pindex satisfied")
                console.log(data.board);
                gamerooms[i].reset_timer()
                gamerooms[i].board = data.board;
                if((!gamerooms[i].board[1].includes(0)) && (!gamerooms[i].board[1].includes(null))) {
                    io.sockets.in(gamerooms[i].playerids[0]).emit('lose', {})
                    io.sockets.in(gamerooms[i].playerids[1]).emit('win', {})
                    delete gamerooms[i];
                    gamerooms.splice(i, 1)
                } else if((!gamerooms[i].board[1].includes(1)) && (!gamerooms[i].board[1].includes(null))) {
                    io.sockets.in(gamerooms[i].playerids[0]).emit('win', {})
                    io.sockets.in(gamerooms[i].playerids[1]).emit('lose', {})
                    delete gamerooms[i];
                    gamerooms.splice(i, 1)
                } else {
                    io.sockets.in(gamerooms[i].playerids[(pIndex-1)*(-1)]).emit('oppMove', {block: data.block, board: data.board})
                }
            }
        }
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected');
        // var userid = socket.username;
        // setTimeout(function() {
        //     console.log("Function1")
        //     check_client(userid);
        // }, 15000)
        var userid = socket.username;
        if(queue.includes(userid)) {
            queue.splice(queue.indexOf(userid), 1);
            console.log("Removed disconnected client from queue")
        }
    });
});
 

app.get('/g/:game_code', function(req, res) {
    var game_code = req.params.game_code;
    // pool.query("SELECT `game_code` FROM `queue` WHERE `id`=?", [req.session.auth.userid], function(err, fields, result) {
    //     if(err) {
    //         res.status(500).send(err.toString())
    //         console.log(err)
    //     } else {
    //         console.log(fields)
    //     }
    // });
    var found = false;
    for(i=0;i<gamerooms.length;i++) {
        if(gamerooms[i].code === game_code) {
            found = true;
            res.sendFile(path.join(__dirname, 'ui', 'game.html'));
        }
    } 
    if(found === false) {
        res.send("<h1 style=\"font-family: serif;\">This game room doesnt exist.</h1>")
    }
});



// app.get('/loggedIn/:classifiedName', function(req, res) {
//     if (req.session && req.session.auth && req.session.auth.userId) {
//         var classifiedName = req.params.classifiedName;
//         if (classified[classifiedName]) {
//             res.send(createTemplate(classified[classifiedName]));
//         } else {
//             res.send('<h1 style="font-family:monospace;">ERROR 404 - Not Found</h1>')
//         }
//     } else {
//         res.status(403).send("Librarian, please log in first to access library information.");
//     }
// });



app.get('/ui/:fileName', function(req, res) {
    res.sendFile(path.join(__dirname, 'ui', req.params.fileName));
});

// pool.connect(function(err, result) {
//     if (err) {
//         console.log('Error in connecting to MySQL Database.');
//         console.log(result);
//     } else {
//         console.log("Connected!");
//         console.log(result);
//     }
// });

app.get('/ui/pace/pace-1.0.2/:fileName', function(req, res) {
    res.sendFile(path.join(__dirname, 'ui/pace/pace-1.0.2/', req.params.fileName));
});

app.get('/ui/pace/pace-1.0.2/themes/:colorName/:fileName', function(req, res) {
    res.sendFile(path.join(__dirname, 'ui/pace/pace-1.0.2/themes/', req.params.colorName, '/', req.params.fileName));
});

// var server = app.listen(8080, function() {
//     var port = server.address().port;
//     console.log('App listening at http://localhost:%s', port);

// });

server.listen(8080, function(){
   console.log('listening on localhost:8080');
});



// Old saved commented code - 


// var loggedIn = function(req) {
//     return req.session && req.session.auth && req.session.auth.userId;
// }

// app.post('/create-user', function(req, res) {
//     username = req.body.username
//     pool.query("INSERT INTO `queue`(`name`) VALUES ('" + username + "')", function(err, field, result) {
//         if (err) {
//             res.status(500).send(err.toString());
//             console.log("ERROR:")
//             console.log(err)
//         } else {
//             pool.query("SELECT * FROM `queue` WHERE name = ? ", [username], function(err, field, result) {
//                 if (err) {
//                     res.status(500).send(err.toString());
//                     console.log("ERROR:")
//                     console.log(err)
//                 } else {
//                     console.log(field)     
//                     req.session.auth = {
//                         "userid": field[0].id,
//                         "username": field[0].name
//                     };
//                     console.log(req.session.auth);
//                     res.status(200).send('User successfully created. ' + req.body.username);
//                 }
//             });
            
//         }
//     });
    
// });



// app.post('/search-players', function(req, res) {
//     pool.query("SELECT * FROM `queue` WHERE `game_code` IS NULL", [req.session.auth.userid], function(err, field, result) {
//         if(err) {
//             res.status(500).send(err.toString())
//         } else {
//             for(var i=field.length; i>=1; i--) {
//                 if(field[i-1].id === req.session.auth.userid) {
//                     if (i % 2 === 0 && i>=2) {
//                         res.status(200).send(JSON.stringify([field[i-1].id, field[i-2].id]))
//                     } else if (i%2!==0 && i<field.length) {
//                         res.status(200).send(JSON.stringify([field[i-1].id, field[i].id]))
//                     } else {
//                         res.status(200).send(false)
//                     }
//                     console.log("Matched.")
//                 }
//             };

//         }
//     });
// });




// app.post('/create-game', function(req, res) {
//     game_code = generate_game_code()
//     pool.query("INSERT INTO `games` SET `game_code`= ?", [game_code], function(err, field, result) {
//         if(err) {
//             res.send(err)
//             console.log(err)
//         } else{
//             // res.status(200).send("Successfully created game room.")
//             console.log("Successfully created game room.")
//             playerids = JSON.parse(req.body.playerids)
//             pool.query("UPDATE `queue` SET `game_code`=? WHERE `id` IN (?, ?)", [game_code, playerids[0], playerids[1]], function(err, field, result) {
//                 if(err) {
//                     res.send(err)
//                     console.log(err)
//                 } else{
//                     res.status(200).send(game_code)
//                     console.log("Successfully matched.")
//                 }
//             });

//         }
//     });
// });

// app.post('/get-game-code', function(req, res) {
//     pool.query("SELECT `game_code` FROM `queue` WHERE `id`= ?", [req.session.auth.userid], function(err, field, result) {
//         if(err) {
//             res.send(err);
//             console.log(err);
//         } else {
//             res.status(200).send(field)
//             console.log(field)
//         }
//     });
// });

// app.post('/update-progress', function(req, res) {   
//     pool.query("UPDATE `games` SET `progress`=? WHERE `game_code`=?", [req.body.progress, req.body.game_code], function(err, field, result) {
//         if(err) {
//             res.send(err)
//             console.log(err)
//         } else{
//             res.status(200).send("Successfully updated progress.")
//         }
//     });
// });

// app.post('/delete-account', function(req, res) {
//     if(!loggedIn(req)) {
//         res.status(403).send();
//         return
//     }
//     pool.query('DELETE FROM `librarians` WHERE `username` = ?', [req.session.auth.userId], function(err, fields, result) {
//         if (err) {
//             res.send('Error');
//         } else {
//             delete req.session.auth;
//             res.send("window.location.reload();");
//         }
//     });
//     console.log("Deleted user: " + (req.session.auth.userId).toString());
// });




// class Node{
//     // Each node has three properties, its value, a pointer that indicates the node that follows and a pointer that indicates the previous node
//     constructor(val){
//         this.val = val;
//         this.next = null;
//         this.prev = null;
//     }
// }

// // We create a class for the list
// class DoublyLinkedList {
//     // The list has three properties, the head, the tail and the list size
//     constructor(){
//         this.head = null
//         this.tail = null
//         this.length = 0
//     }
//     // The push method takes a value as parameter and assigns it as the tail of the list
//     push(val){
//         const newNode = new Node(val)
//         if(this.length === 0){
//             this.head = newNode
//             this.tail = newNode
//         } else {
//             this.tail.next = newNode
//             newNode.prev = this.tail
//             this.tail = newNode
//         }
//         this.length++
//         return this
//     }
//     // The pop method removes the tail of the list
//     pop(){
//         if(!this.head) return undefined
//         const poppedNode = this.tail
//         if(this.length === 1){
//             this.head = null
//             this.tail = null
//         } else {
//             this.tail = poppedNode.prev
//             this.tail.next = null
//             poppedNode.prev = null
//         }
//         this.length--
//         return poppedNode
//     }
//     // The shift method removes the head of the list
//     shift(){
//         if(this.length === 0) return undefined
//         const oldHead = this.head
//         if(this.length === 1){
//             this.head = null
//             this.tail = null
//         } else{
//             this.head = oldHead.next
//             this.head.prev = null
//             oldHead.next = null
//         }
//         this.length--
//         return oldHead
//     }
//     // The unshift method takes a value as parameter and assigns it as the head of the list
//     unshift(val){
//         const newNode = new Node(val)
//         if(this.length === 0) {
//             this.head = newNode
//             this.tail = newNode
//         } else {
//             this.head.prev = newNode
//             newNode.next = this.head
//             this.head = newNode
//         }
//         this.length++
//         return this
//     }
//     // The get method takes an index number as parameter and returns the value of the node at that index
//     get(index){
//         if(index < 0 || index >= this.length) return null
//         let count, current
//         if(index <= this.length/2){
//             count = 0
//             current = this.head
//             while(count !== index){
//                 current = current.next
//                 count++
//             }
//         } else {
//             count = this.length - 1
//             current = this.tail
//             while(count !== index){
//                 current = current.prev
//                 count--
//             }
//         }
//         return current
//     }
//     // The set method takes an index number and a value as parameters, and modifies the node value at the given index in the list
//     set(index, val){
//         var foundNode = this.get(index)
//         if(foundNode != null){
//             foundNode.val = val
//             return true
//         }
//         return false
//     }
//     // The insert method takes an index number and a value as parameters, and inserts the value at the given index in the list
//     insert(index, val){
//         if(index < 0 || index > this.length) return false
//         if(index === 0) return !!this.unshift(val)
//         if(index === this.length) return !!this.push(val)

//         var newNode = new Node(val)
//         var beforeNode = this.get(index-1)
//         var afterNode = beforeNode.next

//         beforeNode.next = newNode, newNode.prev = beforeNode
//         newNode.next = afterNode, afterNode.prev = newNode
//         this.length++
//         return true
//     }
// }




// gamerooms = [];
// queue = new DoublyLinkedList();
// players = [];

// io.on('connection', function(socket) {
//     console.log("A user connected.");
//     socket.on('enqueue', function(data) {
//         data.userid


            
//             // for(i=0;i<2;i++) {
//             //     socket.join(userid.toString())
//             //     io.sockets.in(userid.toString()).emit('match', {game_code: gameroom.code})
//             //     socket.leave(userid.toString())
//             // }
//         }
//     });

//     socket.on('join-game', function (data) {
//         socket.join(data.userid); // We are using room of socket io
//         for(i=0;i<queue.length;i++) {
//             a = queue.get(i)
//             if(a === data.userid) {
//                 game_code = userid.game_code;
//             }
//         }
//         io.sockets.in(data.userid).emit('game_code', {game_code: gameroom.code});
//     });

//     socket.on('clientmove', function(data){
//       console.log(data);
//     });

//     socket.on('disconnect', function () {
//       console.log('A user disconnected');
//     });

//     // io.sockets.in(game_code).emit('playermove', "");
// });

// io.on("connection", (socket) => {
//     socket.on('enqueue', ({ name, room }, callback) => {
 
//         const { error, user } = addUser(
//             { id: socket.id, name, room });
 
//         if (error) return callback(error);
 
//         // Emit will send message to the user
//         // who had joined
//         socket.emit('message', { user: 'admin', text:
//             `${user.name},
//             welcome to room ${user.room}.` });
 
//         // Broadcast will send message to everyone
//         // in the room except the joined user
//         socket.broadcast.to(user.room)
//             .emit('message', { user: "admin",
//             text: `${user.name}, has joined` });
 
//         socket.join(user.room);
 
//         io.to(user.room).emit('roomData', {
//             room: user.room,
//             users: getUsersInRoom(user.room)
//         });
//         callback();
//     })
 
//     socket.on('sendMessage', (message, callback) => {
 
//         const user = getUser(socket.id);
//         io.to(user.room).emit('message',
//             { user: user.name, text: message });
 
//         io.to(user.room).emit('roomData', {
//             room: user.room,
//             users: getUsersInRoom(user.room)
//         });
//         callback();
//     })
 
//     socket.on('disconnect', () => {
//         const user = removeUser(socket.id);
//         if (user) {
//             io.to(user.room).emit('message',
//             { user: 'admin', text:
//             `${user.name} had left` });
//         }
//     })
 
// });



// app.posts('/ping', function(req, res) {
//     connection_safe.push(req.body.userid)
// });




// function check_client(userid) {
//     console.log(connection_safe)
//     console.log(userid)
//     console.log("Function2")
//     if(connection_safe.includes(userid)) {
//         console.log(userid)
//         connection_safe.splice(connection_safe.indexOf(userid));
//         console.log("Reconnected");
//     } else {
//         console.log("Function3")
//         if(queue.includes(userid)) {
//             queue.splice(queue.indexOf(userid), 1);
//             console.log("Removed disconnected client from queue")
//         } else {
//             for(i=0;i<gamerooms.length;i++) {
//                 if(gamerooms[i].playerids.includes(userid)) {
//                     var duIndex = gamerooms[i].playerids.indexOf(userid);
//                     io.sockets.in(gamerooms[i].playerids[(duIndex-1)*(-1)]).emit('oppDisconnect', {})
//                     delete gamerooms[i];
//                     gamerooms.splice(i, 1)
//                     console.log("Dissolved disconnected client's gameroom")
//                 }
//             }
//         }
//     }   
// }