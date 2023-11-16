// Get required modules
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const RpsGame = require('./rps-game');

const clientPath = `./client/`;
console.log(`Serving static from ${clientPath}`);

const app = express();
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);


//Server and networking 

// Create Waiting player
// First set to null
let waitingPlayer = null;
let connectedClients = 0;

io.on('connection', (sock) => {

    if (connectedClients >= 2) {
        sock.emit('connectionRejected', "El servidor esta lleno")
        sock.disconnect();
        return;
    }

    connectedClients++;
    console.log((`Cliente conectado, total de clientes: ${connectedClients}`))

    sock.on('playerReady', (playerName) => {
        sock.playerName = playerName;
        
        if (waitingPlayer) {
            //start a game*
            new RpsGame(waitingPlayer, sock);

            // Set waiting player back to null because everyone is playing
            waitingPlayer = null;
    
        } else {
            //There's only player, waiting...
            waitingPlayer = sock;
            waitingPlayer.emit('message', 'Waiting for an opponent')
        }
    });

    sock.on('nextRoundInitiated', () => {
        io.emit('startNextRound');
    });

    sock.on('disconnect', () => {
        connectedClients--;
        console.log(`Cliente desconectado, numero de clientes: ${connectedClients}`)
        io.emit('refreshClients')
    })
    // Set element values
   sock.on('setEl', (el, text) => {
       io.emit('setEl', el, text);
   });
   sock.on('updateStreak', (player, score) => {
       io.emit('updateStreak', player, score);
   });
   sock.on('addPoint', (player, idx) => {
    io.emit('addPoint', player, idx);
   });
    sock.on('message', (text) => {
        io.emit('message', text);
    });
    sock.on('winMessage', (text, p1, p2) => {
        io.emit('winMessage', text, p1, p2);
    });
    sock.on('draw', (text, p1, p2) => {
        io.emit('draw', text, p1, p2);
    });
    sock.on('gameStarts', () => {
        io.emit('gameStarts');
    });
});

// Start server and log errors to console
server.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });