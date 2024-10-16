import { BB } from './GameState.js';

export class Player {
  constructor(id, initChips) {
    this.id = id;
    this.name = id;
    this.cards = [];
    this.chips = initChips;
    this.ready = false;
    this.position = null;
    this.chipsOnTable = 0;
    this.actionThisTurn = 'none';
    this.onTurn = false;
    this.acted = false;
    this.cardRank = 'highCard';
    this.bestHand = [];
    this.potIndex = 0;
  }

  bet(amount) {
    if (amount > this.chips) {
      amount = this.chips;
    }

    this.chips -= amount;
    this.chipsOnTable += amount;
  }

  get(amount) {
    this.chips += amount;
  }

  fold() {
    this.cards = [];
    this.actionThisTurn = 'fold';
    this.act();
    this.endTurn();
  }

  check() {
    this.actionThisTurn = 'check';
    this.act();
    this.endTurn();
  }

  call(maxChipsOnTable) {
    this.bet(maxChipsOnTable - this.chipsOnTable);
    this.actionThisTurn = 'call';
    this.act();
    this.endTurn();
  }

  raise(amount) {
    this.bet(amount);
    this.actionThisTurn = 'raise';
    this.act();
    this.endTurn();
  }

  setBB() {
    this.bet(BB);
    this.position = 'bb';
  }

  setSB() {
    this.bet(BB / 2);
    this.position = 'sb';
  }

  setDealer() {
    this.position = 'dealer';
  }

  takeTurn() {
    this.onTurn = true;
  }

  endTurn() {
    this.onTurn = false;
  }

  act() {
    this.acted = true;
  }

  resetActed() {
    // if the player has no chips left(all in), they are considered acted
    if (this.chips === 0 || this.cards.length === 0) {
      this.acted = true;
      return;
    }

    this.acted = false;
  }

  resetActionThisTurn() {
    this.actionThisTurn = 'none';
  }

  setCardRank(rank) {
    this.cardRank = rank;
  }
}
