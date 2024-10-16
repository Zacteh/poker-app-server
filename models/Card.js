export class Card {
  constructor(rank = null, suit = null) {
    this._rank = rank === 1 ? 14 : rank;
    this._suit = suit;
  }

  get rank() {
    return this._rank;
  }

  get suit() {
    return this._suit;
  }

  get value() {
    return `${this._rank}${this._suit}`;
  }
}
