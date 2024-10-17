import { Card } from './Card.js';
import { Player } from './Player.js';
import { determineWinner, getBestHand } from '../utils/gameLogic.js';
import { evaluateHand } from '../utils/handEvaluator.js';
import { broadcastGameState } from '../server.js';

export const BB = 20;
const CHIPS = 2000;

export class GameState {
  constructor() {
    this.players = [];
    this.communityCards = [];
    this.pot = [0];
    this.started = false;
    this.gameIndex = 0;
    this.maxChipsOnTable = 0;
    this.deck = [];
    this.stage = 'preflop';
    this.winners = [];
  }

  drawCard() {
    return this.deck.splice(Math.floor(Math.random() * this.deck.length), 1)[0];
  }

  addNewPlayer(id) {
    this.players.push(new Player(id, CHIPS));
  }

  startGame() {
    this.started = true;
    this.gameIndex++;

    const suits = ['S', 'D', 'C', 'H'];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 1);
    this.deck = suits.flatMap((suit) =>
      ranks.map((rank) => new Card(rank, suit))
    );

    // Deal cards to players
    this.players.forEach((player) => {
      player.cards = [this.drawCard(), this.drawCard()];
    });
    this.checkRank();

    this.players.forEach((player) => {
      player.ready = false;
    });
    this.resetPlayersActed();
    this.resetPlayersActionsThisTurn();

    // Determining the dealer, bb, sb position
    const dealerIndex = this.gameIndex % this.players.length;
    const sbIndex = (this.gameIndex + 1) % this.players.length;
    const bbIndex = (this.gameIndex + 2) % this.players.length;
    const utgIndex = (this.gameIndex + 3) % this.players.length;

    this.players[dealerIndex].setDealer();
    this.players[sbIndex].setSB();
    this.players[bbIndex].setBB();
    this.playerTakeTurn(utgIndex);

    this.maxChipsOnTable = BB;
  }

  nextStage() {
    this.resetPlayersActed();
    this.resetPlayersActionsThisTurn();
    this.collectChipsToPot();

    const sbPlayerIndex = this.players.findIndex(
      (player) => player.position === 'sb'
    );

    switch (this.stage) {
      case 'preflop':
        this.stage = 'flop';
        this.communityCards = [
          this.drawCard(),
          this.drawCard(),
          this.drawCard(),
        ];
        break;
      case 'flop':
        this.stage = 'turn';
        this.communityCards.push(this.drawCard());
        break;
      case 'turn':
        this.stage = 'river';
        this.communityCards.push(this.drawCard());
        break;
      case 'river':
        this.stage = 'showdown';
        this.winners = determineWinner(this.players, this.communityCards);
        setTimeout(() => {
          for (let i = 0; i < this.pot.length; i++) {
            for (let j = 0; j < this.winners.length; j++) {
              const winnersSplitPot = this.winners[j].filter(
                (winner) => winner.potIndex >= i
              );

              if (winnersSplitPot.length > 0) {
                const amount = this.pot[i] / winnersSplitPot.length;
                winnersSplitPot.forEach((winner) => {
                  winner.get(amount);
                });
                break;
              }
            }
          }

          this.resetGame();

          broadcastGameState();
        }, 5000);
        return;
      default:
      // do nothing
    }

    this.checkRank();

    // all in
    if (this.players.filter((player) => !player.acted).length <= 1) {
      this.nextStage();
      return;
    }

    this.playerTakeTurn(sbPlayerIndex);
  }

  collectChipsToPot() {
    const playerChipsAscend = [...this.players].sort(
      (a, b) => a.chipsOnTable - b.chipsOnTable
    );

    const chipsPerPot = [playerChipsAscend[0].chipsOnTable];
    const potLastIndex = this.pot.length - 1;
    this.pot[potLastIndex] += playerChipsAscend[0].chipsOnTable;
    playerChipsAscend[0].potIndex = potLastIndex;

    for (let i = 1; i < playerChipsAscend.length; i++) {
      if (
        playerChipsAscend[i].chipsOnTable >
        playerChipsAscend[i - 1].chipsOnTable
      ) {
        this.pot.push(0);
        chipsPerPot.push(
          playerChipsAscend[i].chipsOnTable -
            playerChipsAscend[i - 1].chipsOnTable
        );
      }

      for (let j = 0; j < chipsPerPot.length; j++) {
        this.pot[potLastIndex + j] += chipsPerPot[j];
      }

      playerChipsAscend[i].potIndex = this.pot.length - 1;
    }

    this.players.forEach((player) => {
      player.chipsOnTable = 0;
    });

    this.maxChipsOnTable = 0;
  }

  findNextPlayerIndex(targetPlayerIndex) {
    for (let i = targetPlayerIndex + 1; i < this.players.length; i++) {
      if (this.players[i].cards.length > 0) return i;
    }

    for (let i = 0; i < targetPlayerIndex; i++) {
      if (this.players[i].cards.length > 0) return i;
    }

    // only when the next player is the last player left
    return null;
  }

  resetGame() {
    this.players.forEach((player) => {
      player.cards = [];
      player.potIndex = 0;
      player.endTurn();
    });

    this.started = false;
    this.communityCards = [];
    this.stage = 'preflop';
    this.winners = [];
    this.pot = [0];
  }

  afterPlayerAction(targetPlayerIndex) {
    const nextPlayerIndex = this.findNextPlayerIndex(targetPlayerIndex);
    const nextPlayer = this.players[nextPlayerIndex];

    if (this.findNextPlayerIndex(nextPlayerIndex) === null) {
      this.collectChipsToPot();
      nextPlayer.get(
        this.pot.reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        }, 0)
      );
      this.resetGame();
      broadcastGameState();
      return;
    }

    if (nextPlayer.acted) {
      this.nextStage();
    } else {
      this.playerTakeTurn(nextPlayerIndex);
    }

    broadcastGameState();
  }

  resetPlayersActed() {
    this.players.forEach((player) => {
      player.resetActed();
    });
  }

  playerTakeTurn(playerIndex) {
    const player = this.players[playerIndex];
    if (player.cards.length === 0) {
      this.playerTakeTurn(this.findNextPlayerIndex(playerIndex));
    } else {
      player.takeTurn();
    }
  }

  resetPlayersActionsThisTurn() {
    this.players.forEach((player) => {
      player.resetActionThisTurn();
    });
  }

  checkRank() {
    this.players.forEach((player) => {
      const bestHand = getBestHand(player.cards, this.communityCards);
      player.setCardRank(evaluateHand(bestHand).rank);
      player.bestHand = bestHand;
    });
  }
}
