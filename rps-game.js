class RpsGame {

    constructor(p1, p2) {
        p1.score = 0;
        p1.id = 0;

        p2.score = 0;
        p2.id = 1;

        // streak is the "high score streak", while onStreak is what they're currently at
        p1.streak = 0;
        p1.onStreak = 0;
        
        p2.streak = 0;
        p2.onStreak = 0;

        this._players = [p1, p2];
        this._turns = [null, null];

        // Game starts message
        // io.emit('gameStarts');
        this._players.forEach((player) => {
            player.emit('gameStarts');
        });

        // Set Score names
        this._players.forEach((player) => {
            this._players.forEach((name, idx) => {
                player.emit('setEl', '#player' + idx + ' > .name', name.playerName);
            });
        });

        // Event listener. When a player clicks on turn, do turn
        this._players.forEach((player, idx) => {
            player.on('turn', (turn) => {
                this._onTurn(idx, turn);
            });
            this._startTurnTimer(idx)
        });
    }

    _onTurn(playerIndex, turn) {
        this.turns[playerIndex] = turn;
        if (this.turns[0] && this.turns[1]) {
            this._checkGameOver();
        }
    }

    _startTurnTimer(playerIndex) {
        setTimeout(() => {
            if (this.turns[playerIndex] === null) {
                this._handleNoChoice(playerIndex);
            }
        }, 5000);
    }

    _handleNoChoice(playerIndex) {
        const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
        this.players[otherPlayerIndex].emit('winByDefault');
        this.players[playerIndex].emit('loseByDefault');
        this.turns = [null, null];
    }

    _checkGameOver() {
        // Aquí implementas la lógica para determinar el ganador de la ronda
        // y notificar a los jugadores
    }

    // Send message to single player
    _sendToPlayer(playerIndex, msg) {
        this._players[playerIndex].emit('message', msg);
    }

    _handleNoChoice(playerIndex) {
        this._players[playerIndex].emit('timeOut');
    }
    // Send message to players
    _sendToPlayers(msg) {
        this._players.forEach((player) => {
            player.emit('message', msg)
        });
    }

    // Turn, selecting rock, paper, or scissors
    _onTurn(playerIndex, turn) {
        this._turns[playerIndex] = turn;

        // Game over. Both players turns are selected
        if (this._turns[0] && this._turns[1]) {
            this._checkGameOver();
        } else {
            this._sendToPlayer(playerIndex, `Waiting for opponent`);
        }
    }

    // Checks if game is over
    _checkGameOver() {
        this._getGameResult();
        this._turns = [null, null];
    }

    _getGameResult(){
        // Gets rock, paper, or scissors 
        const p0 = this._decodeTurn(this._turns[0]);
        const p1 = this._decodeTurn(this._turns[1]);

        const distance = (p1 - p0 + 3) % 3;

        switch (distance) {
            case 0:
                // draw
                this._players.forEach((player) => {
                    player.emit('winMessage', 'Draw', this._turns[0], this._turns[1]);
                });
                break;

                case 1:
                    // p0 won
                    this._postWin(this._players[0], this._players[1], this._turns[0], this._turns[1]);
                    this._addPoint(this._players[0] ,0);
                    break;
    
                case 2:
                    // p1 won
                    this._postWin(this._players[1], this._players[0], this._turns[0], this._turns[1]);
                    this._addPoint(this._players[1] ,1);
                    break;
        }
    }

    _postWin(winner, loser, p1, p2) {
        // Send Message to winner and loser.
        winner.emit('winMessage', 'You won!', p1, p2);
        loser.emit('winMessage', 'You lost.', p1, p2);

        // Check streaks
        winner.onStreak++;
        // this._sendToPlayers(winner.onStreak);
        
        // // If the winner is currently on a win streak.
        if (winner.onStreak > winner.streak) {
            winner.streak++;


            // update client streak status
            this._players.forEach((player) => {
                player.emit('updateStreak', winner.id, winner.streak);
            });
        }
        loser.onStreak = 0;
    }

    _addPoint(winner, idx) {
        winner.score++;
        let score = winner.score;
        this._players.forEach((player) => {
            player.emit('addPoint', score, idx);
        });
    }

    _decodeTurn(turn){

        switch (turn) {
            case 'rock':
                return 0;
            case 'scissors':
                return 1;
            case 'paper':
                return 2;
            default:
                throw new Error(`Could not decode turn ${turn}`);
        }
    }

}

// Export RpsGame Class
module.exports = RpsGame;