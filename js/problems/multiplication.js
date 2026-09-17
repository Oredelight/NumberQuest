'use strict';
window.NQ = window.NQ || {};

NQ.genMultiplication = function(tier, simplify) {
  const rand = NQ.rand;
  let a, b;

  if (tier === 1 || simplify) {
    const easy = [2, 3, 5, 10];
    a = easy[rand(0, easy.length - 1)];
    b = rand(2, 9);
  } else if (tier === 2) {
    const hard = [4, 6, 7, 8, 9];
    a = hard[rand(0, hard.length - 1)];
    b = rand(3, 9);
  } else {
    
    a = rand(12, 15);
    b = rand(3, 8);
  }

  const answer  = a * b;
  const skipSeq = Array.from({ length: b }, (_, i) => (i + 1) * a).join(', ');

  const descForAI = `${a} times ${b} = ${answer}. Skip-count by ${a}: ${skipSeq}. Common errors: adding instead (${a + b}), one group short (${a * (b - 1)}), one group over (${a * (b + 1)}).`;
  const misconceptionHint = tier === 3 ? 'two-digit multiplication error' : 'skip-counting or grouping slip';
  const hintText = tier === 3
    ? `Break ${a} into ${Math.floor(a / 10) * 10} and ${a % 10}. Multiply each part by ${b} separately, then add the two results.`
    : `There are ${b} groups of ${a}. Count by ${a}s: ${skipSeq}.`;

  
  function renderDotArray(container) {
    const product = a * b;
    const dotSize = product <= 40 ? '22px' : product <= 70 ? '16px' : '12px';
    const dotGap  = product <= 40 ? '8px'  : '5px';
    let dots = '';
    for (let i = 0; i < product; i++) dots += '<div class="dot"></div>';
    container.innerHTML = `
      <div class="dot-array" style="--cols:${b};--dot-size:${dotSize};--dot-gap:${dotGap};">
        ${dots}
      </div>
      <div class="array-label">${a} row${a === 1 ? '' : 's'} of ${b}</div>`;
  }

  
  function renderDecomposition(container) {
    const tens  = Math.floor(a / 10) * 10;
    const ones  = a % 10;
    const pTens = tens * b;
    const pOnes = ones * b;
    container.innerHTML = `
      <div class="decomp-visual">
        <div class="decomp-row">
          <span class="decomp-chip tens-chip">${tens} x ${b} = ${pTens}</span>
          <span class="decomp-plus">+</span>
          <span class="decomp-chip ones-chip">${ones} x ${b} = ${pOnes}</span>
        </div>
        <div class="decomp-eq">${pTens} + ${pOnes} = ?</div>
      </div>`;
  }

  return {
    strand: 'multiplication', tier,
    prompt: `${a} x ${b} = ?`,
    correctAnswer: answer,
    descForAI,
    misconceptionHint,
    hintText,

    renderVisual(container) {
      if (tier === 3) renderDecomposition(container);
      else renderDotArray(container);
    },

    showHint(visualContainer) {
      if (tier === 3) {
        visualContainer.querySelectorAll('.decomp-chip').forEach((el, i) => {
          setTimeout(() => {
            el.classList.remove('highlight');
            void el.offsetWidth;
            el.classList.add('highlight');
          }, i * 320);
        });
        return;
      }
      
      const dots = [...visualContainer.querySelectorAll('.dot')];
      dots.forEach((dot, i) => {
        const rowIdx = Math.floor(i / b);
        setTimeout(() => {
          dot.classList.remove('highlight');
          void dot.offsetWidth;
          dot.classList.add('highlight');
        }, rowIdx * 130 + (i % b) * 35);
      });
    },

    renderInteraction(container, onChange) {
      NQ.renderNumPad(container, onChange);
    },

    
    fallback(given) {
      
      if (tier === 3) {
        const tens  = Math.floor(a / 10) * 10;
        const ones  = a % 10;
        const pTens = tens * b;
        const pOnes = ones * b;

        if (given === a + b) {
          return `You added ${a} and ${b} to get ${given}. This is multiplication. Break ${a} into ${tens} and ${ones}: ${tens} times ${b} is ${pTens}, and ${ones} times ${b} is ${pOnes}. Add those: ${answer}.`;
        }
        if (given === pTens) {
          return `You got ${pTens}, which is just the tens part (${tens} times ${b}). You still need to add the ones part: ${ones} times ${b} = ${pOnes}. So ${pTens} + ${pOnes} = ${answer}.`;
        }
        if (given === pOnes) {
          return `You got ${pOnes}, which is just the ones part (${ones} times ${b}). You also need the tens part: ${tens} times ${b} = ${pTens}. So ${pTens} + ${pOnes} = ${answer}.`;
        }
        if (given === tens * b + ones) {
          return `You multiplied the tens (${tens} x ${b} = ${pTens}) but then just wrote the ones digit ${ones} instead of multiplying it too. Multiply ${ones} by ${b} to get ${pOnes}, then add: ${pTens} + ${pOnes} = ${answer}.`;
        }
        return `You got ${given}. Break ${a} into ${tens} and ${ones}: ${tens} x ${b} = ${pTens}, and ${ones} x ${b} = ${pOnes}. Add them together: ${answer}.`;
      }

      

      if (given === a + b) {
        return `You got ${given} by adding ${a} and ${b}. Multiplication is about groups: ${b} groups of ${a} each. Count by ${a}s: ${skipSeq}.`;
      }
      if (given === a - b || given === b - a) {
        return `You got ${given} by subtracting. This is a times problem. Count ${b} groups of ${a}: ${skipSeq}.`;
      }
      if (given === a * (b - 1) && b > 1) {
        const missed = a * (b - 1);
        return `You got ${missed}, which is ${a} times ${b - 1}. You counted one group too few. The last step goes: ..., ${missed}, ${answer}. Add one more group of ${a}.`;
      }
      if (given === a * (b + 1)) {
        const extra = a * (b + 1);
        return `You got ${extra}, which is ${a} times ${b + 1}. That is one group too many. Stop one step earlier: ${skipSeq}.`;
      }
      if (given === a) {
        return `You wrote ${a}, which is just one group. You need all ${b} groups of ${a}. Count: ${skipSeq}.`;
      }
      if (given === b) {
        return `You wrote ${b}. That is the number of groups, not the total. Count ${b} groups of ${a}: ${skipSeq}.`;
      }
      if (Math.abs(given - answer) === a) {
        const dir = given < answer ? 'one group short' : 'one group too many';
        return `You are ${dir}. The count goes: ${skipSeq}. Land on the ${b}th number.`;
      }
      return `You got ${given}. Skip count by ${a} a total of ${b} times: ${skipSeq}. The last number is the answer.`;
    }
  };
};
