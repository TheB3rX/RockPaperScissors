// Load environment variables from a .env file
require('dotenv').config();
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const RpsGame = require('./rps-game');

const clientPath = `./client/`;
console.log(`Serving static from ${clientPath}`);

// Initialize an Express application
const app = express();
// Serve static files from the specified path
app.use(express.static(clientPath));

// Create an HTTP server based on the Express app
const server = http.createServer(app);
// Initialize Socket.io with the HTTP server
const io = socketio(server);

// Variables to track the waiting player and the number of connected clients
let waitingPlayer = null;
let connectedClients = 0;

// Handle new socket connections
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
        // Start a new game if there is already a waiting player
        if (waitingPlayer) {
            new RpsGame(waitingPlayer, sock);

            waitingPlayer = null;
    
        } else {
            waitingPlayer = sock;
            waitingPlayer.emit('message', 'Esperando por un oponente')
        }
    });

    sock.on('nextRoundInitiated', () => {
        io.emit('startNextRound');
    });

    // Handle client disconnection
    sock.on('disconnect', () => {
        connectedClients--;
        console.log(`Cliente desconectado, numero de clientes: ${connectedClients}`)
        io.emit('refreshClients')
    })
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

// Start the server on the specified port
server.listen(parseInt(process.env.PORT) || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });