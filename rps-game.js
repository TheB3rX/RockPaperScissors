/**
 * Class representing a Rock-Paper-Scissors game.
 */
class RpsGame {

    /**
     * Create a RpsGame instance.
     * @param {Object} p1 - The first player object.
     * @param {Object} p2 - The second player object.
     */
    constructor(p1, p2) {
        p1.score = 0;
        p1.id = 0;

        p2.score = 0;
        p2.id = 1;

        p1.streak = 0;
        p1.onStreak = 0;

        p2.streak = 0;
        p2.onStreak = 0;

        this._players = [p1, p2];
        this._turns = [null, null];

        // Notify both players that the game has started
        this._players.forEach((player) => {
            player.emit('gameStarts');
        });

        // Set the player names in the game interface
        this._players.forEach((player) => {
            this._players.forEach((name, idx) => {
                player.emit('setEl', '#player' + idx + ' > .name', name.playerName);
            });
        });

        // Listen for 'turn' events from each player
        this._players.forEach((player, idx) => {
            player.on('turn', (turn) => {
                this._onTurn(idx, turn);
            });
        });

        // Timer for player choice timeout
        this.choiceTimer = null
    }

    /**
     * Send a message to a specific player.
     * @param {number} playerIndex - The index of the player to send the message to.
     * @param {string} msg - The message to send.
     */
    _sendToPlayer(playerIndex, msg) {
        this._players[playerIndex].emit('message', msg);
    }

    /**
     * Send a message to both players.
     * @param {string} msg - The message to send.
     */
    _sendToPlayers(msg) {
        this._players.forEach((player) => {
            player.emit('message', msg)
        });
    }

    /**
     * Handle a player's turn.
     * @param {number} playerIndex - The index of the player.
     * @param {string} turn - The player's turn (rock, paper, or scissors).
     */
    _onTurn(playerIndex, turn) {
        this._turns[playerIndex] = turn;

        // Emitir evento para iniciar la cuenta regresiva en ambos clientes
        // si uno de los jugadores ha hecho una elección y el otro aún no.
        if ((this._turns[0] !== null && this._turns[1] === null) || (this._turns[0] === null && this._turns[1] !== null)) {
            this._players.forEach((player) => {
                player.emit('startCountdownClient');
            });
            this._startChoiceTimer(playerIndex);
        }

        // Comprobar si ambos jugadores han hecho una elección
        if (this._turns[0] !== null && this._turns[1] !== null) {
            // Si ambos jugadores han elegido, detener el temporizador y comprobar el resultado del juego
            clearTimeout(this.choiceTimer);
            this._checkGameOver();
        }
    }


    /**
     * Start a timer for a player to make a choice.
     * @param {number} playerIndex - The index of the player who made a choice.
     */
    _startChoiceTimer(playerIndex) {
        this.choiceTimer = setTimeout(() => {
            const otherPlayerIndex = (playerIndex === 0) ? 1 : 0;
            if (this._turns[otherPlayerIndex] === null) {
                this._players[playerIndex].emit('winByDefault');
                this._players[otherPlayerIndex].emit('loseByDefault');
                this._addPoint(this._players[playerIndex], playerIndex);
                this._turns = [null, null];
            }
        }, 3000);
    }

    /**
     * Check if the game is over and handle the result.
     */
    _checkGameOver() {
        this._getGameResult();
        this._turns = [null, null];
    }

    /**
     * Determine the result of the game.
     */
    _getGameResult(){
        const p0 = this._decodeTurn(this._turns[0]);
        const p1 = this._decodeTurn(this._turns[1]);

        const distance = (p1 - p0 + 3) % 3;

        switch (distance) {
            case 0:
                this._players.forEach((player) => {
                    player.emit('winMessage', 'Empate', this._turns[0], this._turns[1]);
                });
                break;

            case 1:
                this._postWin(this._players[0], this._players[1], this._turns[0], this._turns[1]);
                this._addPoint(this._players[0] ,0);
                break;

            case 2:
                this._postWin(this._players[1], this._players[0], this._turns[0], this._turns[1]);
                this._addPoint(this._players[1] ,1);
                break;
        }
    }

    /**
     * Handle the post-win logic.
     * @param {Object} winner - The winning player object.
     * @param {Object} loser - The losing player object.
     * @param {string} p1 - The choice of player 1.
     * @param {string} p2 - The choice of player 2.
     */
    _postWin(winner, loser, p1, p2) {
        winner.emit('winMessage', 'Ganaste!', p1, p2);
        loser.emit('winMessage', 'Perdiste :(', p1, p2);

        winner.onStreak++;
        if (winner.onStreak > winner.streak) {
            winner.streak++;


            this._players.forEach((player) => {
                player.emit('updateStreak', winner.id, winner.streak);
            });
        }
        loser.onStreak = 0;
    }

    /**
     * Add a point to the winner's score.
     * @param {Object} winner - The winning player object.
     * @param {number} idx - The index of the winning player.
     */
    _addPoint(winner, idx) {
        winner.score++;
        let score = winner.score;
        this._players.forEach((player) => {
            player.emit('addPoint', score, idx);
        });
    }

    /**
     * Decode a player's turn from string to number.
     * @param {string} turn - The player's turn (rock, paper, or scissors).
     * @returns {number} - The numerical representation of the turn.
     */
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

module.exports = RpsGame;