import express from 'express';
// import http from 'http';
import https from 'https';
import { Server as socketIo } from 'socket.io';
import cors from 'cors';
import { GameState } from './models/GameState.js';
import pkg from 'lodash';
import { Card } from './models/Card.js';
import fs from 'fs';

// Load SSL certificates
const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/123456712345.asia/privkey.pem',
  'utf8'
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/123456712345.asia/fullchain.pem',
  'utf8'
);

const credentials = {
  key: privateKey,
  cert: certificate,
};

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://poker-app-client.pages.dev'], // Allow requests from these origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);

// const server = http.createServer(app);
const server = https.createServer(credentials, app);
const io = new socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://poker-app-client.pages.dev'], // Allow requests from this origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

const gameState = new GameState();

export const broadcastGameState = () => {
  if (gameState.players.length === 0) return;

  if (gameState.stage === 'showdown') {
    io.emit('gameState', gameState);
    return;
  }

  gameState.players.forEach((player) => {
    const partialGameState = pkg.cloneDeep(gameState);
    // hide deck
    partialGameState.deck = [];

    // hide other players' cards
    partialGameState.players.forEach((p) => {
      if (p.id !== player.id && p.cards.length) {
        p.cardRank = 'unknown';
        p.cards = [new Card(), new Card()];
      }
    });
    io.to(player.id).emit('gameState', partialGameState);
  });
};

io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);

  // initialize the game state for the new player
  gameState.addNewPlayer(socket.id);

  broadcastGameState();

  socket.on('playerAction', (action) => {
    const targetPlayerIndex = gameState.players.findIndex(
      (player) => player.id === socket.id
    );

    const targetPlayer = gameState.players[targetPlayerIndex];

    if (action.type === 'ready') {
      targetPlayer.ready = true;
      targetPlayer.name = action.value;

      if (
        gameState.players.every(
          (player) => player.ready && gameState.players.length > 1
        )
      ) {
        // game starts
        gameState.startGame();
      }

      broadcastGameState();
      return;
    }

    if (!targetPlayer.onTurn) {
      return;
    }

    switch (action.type) {
      case 'fold':
        targetPlayer.fold();
        break;
      case 'check':
        targetPlayer.check();
        break;
      case 'call':
        targetPlayer.call(gameState.maxChipsOnTable);
        break;
      case 'raise':
        gameState.resetPlayersActed();
        targetPlayer.raise(action.value);

        // limit raise amount in frontend
        gameState.maxChipsOnTable = targetPlayer.chipsOnTable;
        break;
      default:
      // do nothing
    }

    gameState.afterPlayerAction(targetPlayerIndex);
  });

  socket.on('disconnect', () => {
    const targetPlayerIndex = gameState.players.findIndex(
      (player) => player.id === socket.id
    );
    if (gameState.started) {
      gameState.players[targetPlayerIndex].fold();
      gameState.afterPlayerAction(targetPlayerIndex);
    }
    gameState.players.splice(targetPlayerIndex, 1);

    console.log('Client disconnected');
    broadcastGameState();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
