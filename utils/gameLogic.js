import { evaluateHand, handRanks } from './handEvaluator.js';

const getAllCombinations = (allCards) => {
  if (allCards.length <= 5) {
    return [[...allCards]];
  }

  const result = [];

  function combine(tmpAry, startIndex, remaining) {
    if (remaining === 0) {
      result.push([...tmpAry]);
      return;
    }

    for (let i = startIndex; i <= allCards.length - remaining; i++) {
      tmpAry.push(allCards[i]);
      combine(tmpAry, i + 1, remaining - 1);
      tmpAry.pop();
    }
  }

  combine([], 0, 5);
  return result;
};

// Comparing to hand2, hand1 is 'win' or ''lose' or 'tie'
const compareHands = (hand1, hand2) => {
  if (!hand1) {
    return 'lose';
  }

  if (!hand2) {
    return 'win';
  }

  const eHand1 = evaluateHand(hand1);
  const eHand2 = evaluateHand(hand2);
  if (handRanks[eHand1.rank] > handRanks[eHand2.rank]) {
    return 'win';
  }

  if (handRanks[eHand1.rank] < handRanks[eHand2.rank]) {
    return 'lose';
  }

  if (eHand1.value === eHand2.value) {
    return 'tie';
  }

  return eHand1.value > eHand2.value ? 'win' : 'lose';
};

export const getBestHand = (playerCards, communityCards) => {
  const allCards = [...playerCards, ...communityCards].sort(
    (a, b) => b.rank - a.rank
  );

  let bestHand = null;

  const allHands = getAllCombinations(allCards);

  allHands.forEach((hand) => {
    if (compareHands(hand, bestHand) === 'win') {
      bestHand = hand;
    }
  });

  return bestHand;
};

export const determineWinner = (players, communityCards) => {
  let winners = [];

  players.forEach((player) => {
    if (player.cards.length === 0) return;

    // further optimization point
    const bestPlayerHand = getBestHand(player.cards, communityCards);
    for (let i = 0; i < winners.length; i++) {
      const compare = compareHands(
        bestPlayerHand,
        getBestHand(winners[i][0].cards, communityCards)
      );

      if (compare === 'win') {
        winners.splice(i, 0, [player]);
        return;
      }

      if (compare === 'tie') {
        winners[i].push(player);
        return;
      }
    }

    winners.push([player]);
  });

  return winners;
};
