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
      this.oppName = '';
      // this.playsArr = 0;
    }

    // Set the currentTurn for player to turn and update UI to reflect the same.
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Your turn' : 'Waiting for Opponent';
      $('#turn').text(message);
      // $('#score').text(player.getCurrentScore());
      // $('#oppScore').text(oppPoints);
    }

    setCurrentScore(score){
      this.currentScore = score;
      const message = 'Your score is : ';
      // $('#score').text(message);
    }

    setOppName(oppName) {
      return this.oppName = oppName;
    }

    getCurrentScore(){
      return this.currentScore; 
    }

    getPlayerName() {
      return this.name;
    }

    getOppName() {
      return this.oppName;
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
      // $('.menu').css('display', 'none');
      $('.screen-start').css('display', 'none');
      $('.board').css('display', 'block');
      $('#player1 svg').hide();
      $('#player1').html("<p>" + player.getPlayerName() + "</p>");
      $('#player2 svg').hide();
      $('#player2').html("<p>" + player.getOppName() + "</p>");
      this.createGameBoard();
    }
   
    updateBoard(type, pos, tile) {
      // $(`#${tile}`).text(type).prop('disabled', true);
      // if(playerNames !== null){
      //   player.setOppName(playerNames[type-1]);
      // }
      if(type === 1){
        $(`#${tile}`).css('background','#FFA000').prop('disabled', true);
      }
      if(type === 2){
        $(`#${tile}`).css('background','#42e2f4').prop('disabled', true);
      }
      // $('#player2 svg').hide();
      // $('#player2').html("<p>" + player.getOppName() + "</p>");
      // getPoints(pos);

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
        name : player.getPlayerName,
        // room: this.getRoomId(),
      });
    }
  

    getPoints(position){
      var score = player.getCurrentScore();
      if(this.board[position-1] === this.board[position]){
            score += 1;
      }
      if(this.board[position+1] === this.board[position]){
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
      if (this.moves === 10) {
          if(this.checkTie()){
            socket.emit('gameEnded', {
            message: tieMessage,
            });
          alert(tieMessage);
          location.reload();
          }
          else{
            player.getCurrentScore() > 3 ? game.announceWinner() : game.endGame('You have lost!');
          }  
        }
            
        
      }
    

    checkTie() {
      return player.getCurrentScore() === oppPoints && player.getCurrentScore() !== 0;
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
    
    socket.on('players', (data) => {
      var oppName = player.getPlayerName() === data.player1 ? data.player2 : data.player1;
      player.setOppName(oppName);
    });
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
      player : player.getPlayerType,
      // room: this.getRoomId(),
    });
    socket.on('oppPoints', (data) => {
      this.oppPoints = data.points;
    });

    game.checkWinner();
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
