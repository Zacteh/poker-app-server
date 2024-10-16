export const handRanks = {
  highCard: 1,
  onePair: 2,
  twoPair: 3,
  threeOfAKind: 4,
  straight: 5,
  flush: 6,
  fullHouse: 7,
  fourOfAKind: 8,
  straightFlush: 9,
  royalFlush: 10,
};

export const evaluateHand = (hand) => {
  const isFlush = checkFlush(hand);
  const isStraight = checkStraight(hand);
  if (isFlush) {
    if (isStraight) {
      if (hand[0].rank === 14) {
        return { rank: 'royalFlush', value: hand[0].rank };
      }
      return { rank: 'straightFlush', value: hand[0].rank };
    }
    return { rank: 'flush', value: hand[0].rank };
  }

  if (isStraight) {
    return { rank: 'straight', value: hand[0].rank };
  }

  const fourOfAKind = getFourOfAKind(hand);
  if (fourOfAKind) {
    return { rank: 'fourOfAKind', value: fourOfAKind };
  }

  const fullHouse = getFullHouse(hand);
  if (fullHouse) {
    return { rank: 'fullHouse', value: fullHouse };
  }

  const threeOfAKind = getThreeOfAKind(hand);
  if (threeOfAKind) {
    return { rank: 'threeOfAKind', value: threeOfAKind };
  }

  const twoPair = getTwoPair(hand);
  if (twoPair) {
    return { rank: 'twoPair', value: twoPair };
  }

  const onePair = getOnePair(hand);
  if (onePair) {
    return { rank: 'onePair', value: onePair };
  }

  return { rank: 'highCard', value: hand[0].rank };
};

const checkStraight = (hand) => {
  if (hand.length < 5) return false;

  for (let i = 0; i < hand.length - 1; i++) {
    if (i === 0 && hand[i].rank === 14 && hand[i + 1].rank === 2) continue;

    if (hand[i].rank + 1 !== hand[i + 1].rank) {
      return false;
    }
  }

  return true;
};

const checkFlush = (hand) => {
  if (hand.length < 5) return false;

  for (let i = 0; i < hand.length - 1; i++) {
    if (hand[i].suit !== hand[i + 1].suit) {
      return false;
    }
  }

  return true;
};

const getFourOfAKind = (hand) => {
  for (let i = 0; i < hand.length - 1; i++) {
    if (i + 3 >= hand.length) {
      return null;
    }

    if (hand[i].rank === hand[i + 3].rank) {
      return Number(`${hand[i].rank}${i ? hand[0].rank : hand[4].rank}`);
    }
  }

  return null;
};

const getFullHouse = (hand) => {
  if (hand.length < 5) return false;

  if (hand[0].rank === hand[2].rank && hand[3].rank === hand[4].rank) {
    return Number(`${hand[0].rank}${hand[3].rank}`);
  }

  if (hand[0].rank === hand[1].rank && hand[2].rank === hand[4].rank) {
    return Number(`${hand[2].rank}${hand[0].rank}`);
  }

  return null;
};

const getThreeOfAKind = (hand) => {
  for (let i = 0; i < hand.length - 1; i++) {
    if (i + 2 >= hand.length) {
      return null;
    }

    if (hand[i].rank === hand[i + 2].rank) {
      return Number(
        `${hand[i].rank}${hand
          .slice(0, i)
          .map((item) => String(item.rank))
          .join('')}${hand
          .slice(i + 3)
          .map((item) => String(item.rank))
          .join('')}`
      );
    }
  }

  return null;
};

const getTwoPair = (hand) => {
  let firstPair = null;
  const handCopy = [...hand];

  for (let i = 0; i < hand.length - 1; i++) {
    if (hand[i].rank === hand[i + 1].rank) {
      if (firstPair) {
        handCopy.splice(
          handCopy.findIndex((card) => card === hand[i]),
          2
        );

        let rankStr = '';
        handCopy.forEach((card) => {
          rankStr += card.rank;
        });

        return Number(hand[i].rank + firstPair + rankStr);
      }

      handCopy.splice(i, 2);
      firstPair = hand[i].rank;
    }
  }

  return null;
};

const getOnePair = (hand) => {
  const handCopy = [...hand];

  for (let i = 0; i < hand.length - 1; i++) {
    if (hand[i].rank === hand[i + 1].rank) {
      handCopy.splice(i, 2);

      let rankStr = '';
      handCopy.forEach((card) => {
        rankStr += card.rank;
      });

      return Number(hand[i].rank + rankStr);
    }
  }

  return null;
};
