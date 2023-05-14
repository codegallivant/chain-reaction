// var username = document.getElementById('usernameinput').value;
var publicjoinbtn = document.getElementById("publicjoinbtn");
publicjoinbtn.onclick = function() {
    publicjoinbtn.disabled = true;
    publicjoinbtn.classList.remove('btn-warning');
    publicjoinbtn.classList.add('btn-secondary');
    publicjoinbtn.style.width = "auto";
    var socket = io.connect();
    socket.on('connect', function() {
        var userid = socket.id;
        console.log(userid);
        publicjoinbtn.value = "Joining queue...";
        socket.emit('enqueue', {userid: userid});
        publicjoinbtn.value = "Waiting for players...";
        socket.on('game_code', function(data) {
            console.log(data);
            var game_code = data.game_code;
            document.cookie = "userid="+userid+";";
            window.location = "./g/"+game_code;
        });
    });
};


// Old code - 

// var enqueue = function() {
//     return new Promise(function (resolve, reject) {
//         var register = document.getElementById("publicjoinbtn");
//         var username = document.getElementById('usernameinput').value;
//         register.value = "Joining queue...";
//         register.disabled = true;
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function() {
//             if (request.readyState === XMLHttpRequest.DONE) {
//                 console.log(request.status)
//                 status = request.status;
//                 resolve(status);
//             }
//         };

//         request.open('POST', '/create-user', true);
//         request.setRequestHeader('Content-Type', 'application/json');
//         request.send(JSON.stringify({
//             username: username
//         }));
//     });
// };


// var match = function() {
//     return new Promise(function (resolve, reject) {
//         var register = document.getElementById("publicjoinbtn");
//         register.disabled = false;
//         register.value = "Searching for players...";
//         register.disabled = true;
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function() {
//             if (request.readyState === XMLHttpRequest.DONE) {
//                 console.log(request.status);
//                 resolve(request.response);
//             }
//         };
//         request.open('POST', '/search-players', true);
//         request.setRequestHeader('Content-Type', 'application/json');
//         request.send();
//     });
// };

// var create_game = function(player_ids) {
//     return new Promise(function (resolve, reject) {
//         var register = document.getElementById("publicjoinbtn");
//         register.disabled = false;
//         register.value = "Searching for players...";
//         register.disabled = true;
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function() {
//             if (request.readyState === XMLHttpRequest.DONE) {
//                 console.log(request.status);
//                 resolve(request.response);
//             }
//         };
//         request.open('POST', '/create-game', true);
//         request.setRequestHeader('Content-Type', 'application/json');
//         request.send(JSON.stringify({
//             playerids: player_ids
//         }));
//     });
// }; 

// var get_game_code = function() {
//     return new Promise(function (resolve, reject) {
//         var register = document.getElementById("publicjoinbtn");
//         register.disabled = false;
//         register.value = "Searching for players...";
//         register.disabled = true;
//         var request = new XMLHttpRequest();
//         request.onreadystatechange = function() {
//             if (request.readyState === XMLHttpRequest.DONE) {
//                 if(request.status == 200) {
//                     console.log(request.response)
//                     game_code = JSON.parse(request.response)[0].game_code
//                     console.log(game_code)
//                     if (game_code === null) {setTimeout(get_game_code, 3000)}
//                     else {
//                         window.location = "./g/"+game_code
//                     }
//                 }
//             }
//         };
//         request.open('POST', '/get-game-code', true);
//         request.setRequestHeader('Content-Type', 'application/json');
//         request.send();
//     });
// };     



// var register = document.getElementById("publicjoinbtn");
// async function start_user() {
//     queue_status = await enqueue();
//     console.log(queue_status);
//     if(queue_status==="200") {
//         match_status = await match();
//         console.log(match_status);
//         if(match_status !== "false") {
//             match_status = JSON.parse(match_status)
//             if(match_status[0] > match_status[1]) {
//                 await create_game(JSON.stringify(match_status))
//             }
//         }
//     }
// };
// register.addEventListener("click", start_user);