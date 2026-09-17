'use strict';
window.NQ = window.NQ || {};

NQ.genAddSub = function(tier, simplify) {
  const rand = NQ.rand;
  const op   = Math.random() < 0.5 ? '+' : '-';
  let a, b;

  if (tier === 1 || simplify) {
    a = rand(2, 9);
    b = op === '+' ? rand(1, Math.max(1, 9 - a)) : rand(1, a);
  } else if (tier === 2) {
    a = rand(6, 14);
    b = op === '+' ? rand(2, 9) : rand(1, a);
  } else {
    a = rand(20, 60);
    b = op === '+' ? rand(10, 35) : rand(5, a - 1);
  }

  const answer       = op === '+' ? a + b : a - b;
  const needsRegroup = op === '-'
    ? (a % 10) < (b % 10)
    : (a % 10 + b % 10) >= 10;

  let misconceptionHint, descForAI, hintText;

  if (op === '-') {
    if (needsRegroup) {
      misconceptionHint = 'subtracts the smaller digit from the larger one column by column, skipping regrouping/borrowing';
      descForAI = `${a} - ${b}. This needs regrouping (borrowing from the tens) because the ones digit of ${a} is smaller than the ones digit of ${b}. If the wrong answer looks like it came from subtracting digits in whichever order is bigger minus smaller per column instead of borrowing, say so specifically and tell the student to borrow a ten. If the wrong answer is exactly 1 more or 1 less than the correct answer of ${answer}, it is a simple counting slip: tell the student to recount by counting back from ${a} one number at a time, ${b} counts total, instead of just saying "try again".`;
      hintText = `The ones digit of ${a} is smaller than the ones digit of ${b}. Borrow a ten from the tens column first, then subtract!`;
    } else {
      misconceptionHint = 'basic counting or fact recall slip';
      descForAI = `${a} - ${b}, straightforward subtraction with no regrouping needed. If wrong, suggest counting back from ${a} one number at a time, ${b} counts total.`;
      hintText = `Count back from ${a} slowly, one step at a time. Point to each number as you count back ${b} times.`;
    }
  } else {
    if (needsRegroup) {
      misconceptionHint = 'forgot to carry the extra ten when the ones digits add to 10 or more';
      descForAI = `${a} + ${b}. This needs carrying a ten because the ones digits add to 10 or more. If the wrong answer looks like the ones digits were added but the carry was dropped, say so specifically and tell the student to carry the extra ten. If the wrong answer is exactly 1 more or 1 less than the correct answer of ${answer}, it is a simple counting slip: tell the student to recount by counting on from ${a} one number at a time, ${b} counts total, instead of just saying "try again".`;
      hintText = `The ones digits (${a % 10} + ${b % 10}) add up to more than 9. Remember to carry that extra ten over to the tens column!`;
    } else {
      misconceptionHint = 'basic counting or fact recall slip';
      descForAI = `${a} + ${b}, straightforward addition with no carrying needed. If wrong, suggest counting on from ${a} one number at a time, ${b} counts total.`;
      hintText = `Start at ${a} and count forward ${b} times. Use your fingers or the blocks below!`;
    }
  }

  return {
    strand: 'addsub',
    tier,
    prompt: `${a} ${op} ${b} = ?`,
    correctAnswer: answer,
    descForAI,
    misconceptionHint,
    hintText,

    renderVisual(container) {
      container.innerHTML =
        NQ.blockGroupHTML(Math.floor(a / 10), a % 10, String(a)) +
        `<div style="font-family:'Kalam',cursive;font-size:1.6rem;align-self:center;">${op}</div>` +
        NQ.blockGroupHTML(Math.floor(b / 10), b % 10, String(b));
    },

    showHint(visualContainer) {
      
      const targets = needsRegroup
        ? visualContainer.querySelectorAll('.one')
        : visualContainer.querySelectorAll('.rod, .one');
      targets.forEach((el, i) => {
        setTimeout(() => {
          el.classList.remove('highlight');
          void el.offsetWidth; 
          el.classList.add('highlight');
        }, i * 60);
      });
    },

    
    fallback(given) {
      
      function countingSeq(start, steps, direction) {
        if (steps > 13) return null; 
        const arr = [start];
        for (let i = 1; i <= steps; i++) {
          arr.push(direction === 'back' ? start - i : start + i);
        }
        return arr.join(', ');
      }

      const dir = op === '+' ? 'forward' : 'back';
      const seq = countingSeq(a, b, dir);
      const ns  = b === 1 ? 'step' : 'steps';

      
      if (given === answer + 1) {
        
        if (op === '-') {
          return seq
            ? `You got ${given}, which is where you land after ${b - 1} steps back from ${a}, not ${b}. You stopped one step too soon. The full count is: ${seq}. The last number is the answer.`
            : `You got ${given} and stopped one step too early. Count back from ${a} exactly ${b} ${ns} and stop only when you reach ${b}.`;
        } else {
          return seq
            ? `You got ${given}, which is one step past the answer. Count forward from ${a} exactly ${b} ${ns} and stop: ${seq}. The last number is the answer.`
            : `You went one step too far. Count forward from ${a} exactly ${b} ${ns}, then stop.`;
        }
      }

      if (given === answer - 1) {
        
        if (op === '+') {
          return seq
            ? `You got ${given}, one short of the answer. Count forward from ${a} exactly ${b} ${ns}: ${seq}. Stop at the last number.`
            : `You got ${given}, just one step short. Count forward from ${a} exactly ${b} ${ns}, then stop.`;
        } else {
          return seq
            ? `You went one step too far back. Count back from ${a} exactly ${b} ${ns}: ${seq}. The last number is the answer.`
            : `You went one step too far. Count back from ${a} exactly ${b} ${ns} and stop there.`;
        }
      }

      
      if (op === '+' && given === a - b) {
        return seq
          ? `You got ${given} by counting back, but the sign is plus, not minus. Count forward from ${a} instead: ${seq}.`
          : `You got ${given} by subtracting, but the sign is plus. Start at ${a} and count forward ${b} ${ns}.`;
      }
      if (op === '-' && given === a + b) {
        return seq
          ? `You got ${given} by counting forward, but the sign is minus, not plus. Count back from ${a} instead: ${seq}.`
          : `You got ${given} by adding, but the sign is minus. Start at ${a} and count back ${b} ${ns}.`;
      }

      
      if (op === '-' && a > 9) {
        const tensOfA = Math.floor(a / 10) * 10;
        if (tensOfA !== a && tensOfA - b === given) {
          const corrSeq = countingSeq(a, b, 'back');
          return corrSeq
            ? `You got ${given}, which is ${tensOfA} minus ${b}. But the problem starts at ${a}, not ${tensOfA}. Count back from ${a}: ${corrSeq}.`
            : `You got ${given}, which is ${tensOfA} minus ${b}. The full number is ${a}, so start your count from ${a}, not ${tensOfA}.`;
        }
      }

      
      if (op === '-' && needsRegroup) {
        const oA = a % 10, oB = b % 10;
        const wrongGuess = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs(oA - oB);
        if (given === wrongGuess) {
          return `You got ${given} by subtracting the smaller digit from the larger in the ones column. But ${oA} is less than ${oB}, so you cannot do that directly. Borrow a ten from the tens column first: that turns ${oA} into ${oA + 10}, and ${oA + 10} minus ${oB} is ${oA + 10 - oB}.`;
        }
      }

      
      if (op === '+' && needsRegroup) {
        const onesSum    = a % 10 + b % 10;
        const wrongCarry = (Math.floor(a / 10) + Math.floor(b / 10)) * 10 + onesSum % 10;
        if (given === wrongCarry) {
          return `You got ${given}. The ones digits ${a % 10} and ${b % 10} add up to ${onesSum}, which is more than 9. You need to carry that extra 1 into the tens column. Write ${onesSum % 10} in the ones place and add 1 to the tens.`;
        }
      }

      
      if (given === a) {
        return seq
          ? `You wrote ${a}, which is where the problem starts. Now count ${dir} ${b} ${ns} from there: ${seq}.`
          : `You wrote ${a}, which is the starting number. You still need to count ${dir} ${b} ${ns} from there.`;
      }

      
      if (given === b) {
        return seq
          ? `You wrote ${b}, but that is the number you are ${op === '+' ? 'adding' : 'subtracting'}. Start at ${a} and count ${dir} ${b} ${ns}: ${seq}.`
          : `You wrote ${b}, which is the number being ${op === '+' ? 'added' : 'subtracted'}. Start at ${a} and count ${dir} ${b} ${ns}.`;
      }

      
      return seq
        ? `You got ${given}. To solve ${a} ${op} ${b}, start at ${a} and count ${dir} one number at a time, ${b} ${ns}: ${seq}. The last number you land on is the answer.`
        : `You got ${given}. Start at ${a} and count ${dir} ${b} ${ns}, one step at a time. Write down each number as you go so you do not lose count.`;
    },

    renderInteraction(container, onChange) {
      NQ.renderNumPad(container, onChange);
    }
  };
};
