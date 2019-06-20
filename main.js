(function init() {
  const P1 = 1;
  const P2 = 2;
  var oppPoints = 0;
  let player;
  let game;

  const socket = io.connect('http://localhost:5000');

  class Player {
    constructor(name, type, score) {
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.currentScore = score;
      // this.playsArr = 0;
    }

    // Set the currentTurn for player to turn and update UI to reflect the same.
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Your turn' : 'Waiting for Opponent';
      $('#turn').text(message);
      $('#score').text(player.getCurrentScore());
      $('#oppScore').text(oppPoints);
    }

    setCurrentScore(score){
      this.currentScore = score;
      const message = 'Your score is : ';
      $('#score').text(message);
    }

    getCurrentScore(){
      return this.currentScore; 
    }

    getPlayerName() {
      return this.name;
    }

    getPlayerType() {
      return this.type;
    }

    getCurrentTurn() {
      return this.currentTurn;
    }
  }

  // roomId Id of the room in which the game is running on the server.
  class Game {
    constructor(name) {
      // this.roomId = roomId;
      this.name = name;
      this.board = [5,5,5,5,5,5,5,5,5,5];
      this.moves = 0;
    }

    // Create the Game board by attaching event listeners to the buttons.
    createGameBoard() {
      function tileClickHandler() {
        const position = parseInt(this.id.split('_')[1], 10);
        if (!player.getCurrentTurn() || !game) {
          alert('Its not your turn!');
          return;
        }

        if ($(this).prop('disabled')) {
          alert('This tile has already been played on!');
          return;
        }

        // Update board after your turn.
        game.playTurn(this);
        game.updateBoard(player.getPlayerType(), position, this.id);

        player.setCurrentTurn(false);
        // player.updatePlaysArr(position);
        game.getPoints(position);
        game.checkWinner();
        $('#score').text(player.getCurrentScore());
        $('#oppScore').text(oppPoints);
      }

      for (let i = 0; i <= 9; i++) {
        // this.board.push(['', '', '']);
        // for (let j = 0; j < 3; j++) {
          $(`#button_${i}`).on('click', tileClickHandler);
        // }
      }
    }
    // Remove the menu from DOM, display the gameboard and greet the player.
    displayBoard(message) {
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#userHello').html(message);
      this.createGameBoard();
    }
   
    updateBoard(type, pos, tile) {
      $(`#${tile}`).text(type).prop('disabled', true);
      $('#score').text(player.getCurrentScore());
      $('#oppScore').text(oppPoints);
      this.board[pos] = type;
      this.moves++;
    }

    getRoomId() {
      return this.roomId;
    }

    // Send an update to the opponent to update their UI's tile
    playTurn(tile) {
      const clickedTile = $(tile).attr('id');

      // Emit an event to update other player that you've played your turn.
      socket.emit('playTurn', {
        tile: clickedTile,
        points : player.getCurrentScore(),
        // room: this.getRoomId(),
      });
    }
  

    getPoints(position){
      var score = player.getCurrentScore();
      if(board[position-1] === board[position]){
            score += 1;
      }
      if(board[position+1] === board[position]){
        score += 1;
      }
      player.setCurrentScore(score);
      console.log(player.getCurrentScore());
      // Emit an event to update other player that you've played your turn.
      // socket.emit('points', {
      //   points: player.getCurrentScore(),
      //   // room: this.getRoomId(),
      // });
    }
    checkWinner() {
      // const currentPlayerPositions = player.getPlaysArr();

      // Player.wins.forEach((winningPosition) => {
      //   if ((winningPosition & currentPlayerPositions) === winningPosition) {
      //     game.announceWinner();
      //   }
      // });

      const tieMessage = 'Game Tied :(';
      if (this.checkTie()) {
        socket.emit('gameEnded', {
          // room: this.getRoomId(),
          message: tieMessage,
        });
        alert(tieMessage);
        location.reload();
      }
    }

    checkTie() {
      return P1.getCurrentScore() === P2.getCurrentScore();
    }

    // Announce the winner if the current client has won. 
    // Broadcast this on the room to let the opponent know.
    announceWinner() {
      const message = `${player.getPlayerName()} wins!`;
      socket.emit('gameEnded', {
        room: this.getRoomId(),
        message,
      });
      alert(message);
      location.reload();
    }

    // End the game if the other player won.
    endGame(message) {
      alert(message);
      location.reload();
    }
  }

  var playerType = P1;

  socket.on('player-number', (data) => {
    if(data.playerIndex === 1) {
      playerType = P2;
    }
  });

  // Create a new game. Emit newGame event.
  $('#new').on('click', () => {
    const name = $('#nameNew').val();
    if (!name) {
      alert('Please enter your name.');
      return;
    }
    socket.emit('playGame', { name });
    player = new Player(name, playerType, 0);
  });

  // Join an existing game on the entered roomId. Emit the joinGame event.
  // $('#join').on('click', () => {
  //   const name = $('#nameJoin').val();
  //   const roomID = $('#room').val();
  //   if (!name || !roomID) {
  //     alert('Please enter your name and game ID.');
  //     return;
  //   }
  //   socket.emit('joinGame', { name, room: roomID });
  //   player = new Player(name, P2);
  // });

  // New Game created by current client. Update the UI and create new Game var.
  socket.on('newGame', (data) => {
    const message = `Hi! Your game will start soon. Waiting for Player 2`
      // `Hello, ${data.name}. Please ask your friend to enter Game ID: 
      // ${data.room}. Waiting for player 2...`;

    // Create game for player 1
    game = new Game(data.name);
    game.displayBoard(message);
  });

  socket.on('joinGame', (data) => {
    const message = `Hi! Your game will start soon. Waiting for Player 2`
      
    game = new Game(data.name);
    game.displayBoard(message);
  });


  socket.on('player1', (data) => {
    const message = `Hello, ${player.getPlayerName()}`;
    $('#userHello').html(message);
    player.setCurrentTurn(true);
  });

  socket.on('player2', (data) => {
    const message = `Hello, ${data.name}`;

    // Create game for player 2
    game = new Game(data.name);
    game.displayBoard(message);
    player.setCurrentTurn(false);
  });

  socket.on('turnPlayed', (data) => {
    const cell = data.tile.split('_')[1];
    const opponentType = player.getPlayerType() === P1 ? P2 : P1;

    game.updateBoard(opponentType, cell, data.tile);
    player.setCurrentTurn(true);

    socket.emit('oppPoints', {
      points: player.getCurrentScore(),
      // room: this.getRoomId(),
    });

  });

  socket.on('oppPoints', (data) => {
      this.oppPoints = data.points;
  });

  // If the other player wins, this event is received. Notify user game has ended.
  socket.on('gameEnd', (data) => {
    game.endGame(data.message);
    // socket.leave(data.room);
  });

  /**
	 * End the game on any err event. 
	 */
  socket.on('err', (data) => {
    game.endGame(data.message);
  });
}());
