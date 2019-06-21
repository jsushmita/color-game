const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let roomOpen = 0;

app.use(express.static('.'));

server.listen(process.env.PORT || 5000);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

const connections = [null, null];
var playerNames = ["", ""];
var playerScores = [0,0];
var player1 = '';
var player2 = '';

io.on('connection', (socket) => {
    let playerIndex = -1;
    
    for (var i in connections) {
        if (connections[i] === null) {
            // connections[i] = i;
            playerIndex = i;
        }

        if(playerIndex === 1){
            console.log('players is emitted');
            $('.newBtn').css('display', 'none');
            $('.joinBtn').css('display', 'block');
            socket.broadcast.emit('players', { player1 : this.player1, player2 : this.player2 });
        }
    }

    socket.emit('player-number', playerIndex);

    if (playerIndex == -1){
        socket.emit('err', { message: 'Sorry, The game is full!' });
    }

    connections[playerIndex] = socket;

    socket.broadcast.emit('player-connect', playerIndex);
    
    socket.on('playGame', (data) => {
        if(playerIndex === 0){
            playerNames[playerIndex] = data.name;
            socket.emit('newGame', { name: data.name });
            player1 = data.name;
        }
        else{
            player2 = data.name;
            playerNames[playerIndex] = data.name;
            socket.broadcast.emit('players', { player1 : this.player1, player2 : this.player2 });
            socket.emit('joinGame', { name: data.name });
            console.log('players is emitted');
        }
        
    });

    /**
       * Handle the turn played by either player and notify the other.
       */
    socket.on('playTurn', (data) => {
        socket.broadcast.emit('turnPlayed', {
            tile: data.tile,
            name : data.name,
            playerNames : this.playerNames,
        });

    });

    // socket.on('points', (data) => {
    //     socket.broadcast.emit('playerPoints', {
    //         points: data.points
    //     });

    // });

    socket.broadcast.emit()

    /**
       * Notify the players about the victor.
       */
    socket.on('gameEnded', (data) => {
        socket.broadcast.emit('gameEnd', data);
    });

    socket.on('disconnect', function() {
        console.log(`Player ${playerIndex} Disconnected`);
        connections[playerIndex] = null;
      });
});

