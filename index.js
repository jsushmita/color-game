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

io.on('connection', (socket) => {
    let playerIndex = -1;
    
    for (var i in connections) {
        if (connections[i] === null) {
            // connections[i] = i;
            playerIndex = i;
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
            socket.emit('newGame', { name: data.name });
        }
        else{
            socket.emit('joinGame', { name: data.name });
        }
        
    });

    /**
       * Handle the turn played by either player and notify the other.
       */
    socket.on('playTurn', (data) => {
        socket.broadcast.emit('turnPlayed', {
            tile: data.tile
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

