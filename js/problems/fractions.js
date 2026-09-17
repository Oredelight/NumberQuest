'use strict';
window.NQ = window.NQ || {};

NQ.genFractions = function(tier, simplify) {
  const rand = NQ.rand;

  
  if (tier === 1) {
    const pool   = simplify ? [2, 3] : [2, 3, 4, 6, 8];
    let denomA   = pool[rand(0, pool.length - 1)];
    let denomB   = pool[rand(0, pool.length - 1)];
    while (denomB === denomA) denomB = pool[rand(0, pool.length - 1)];
    const smaller = Math.min(denomA, denomB);

    return {
      strand: 'fractions', tier,
      prompt: `Which is bigger: 1/${denomA} or 1/${denomB}?`,
      correctAnswer: `1/${smaller}`,
      descForAI: `Comparing 1/${denomA} vs 1/${denomB}. Correct answer is 1/${smaller}: fewer, bigger equal slices make a bigger piece. The classic wrong answer is picking the LARGER denominator, treating it like a bigger whole number.`,
      misconceptionHint: 'whole-number bias on denominators',
      hintText: `Imagine cutting a pizza into ${denomA} vs ${denomB} equal slices. Which slice would you rather have?`,

      renderVisual(container) {
        container.innerHTML = `<div class="compare-row">
          <div class="compare-card" data-val="1/${denomA}">
            ${NQ.fracBarHTML(denomA, new Set([0]), false)}
            <div class="block-label">1/${denomA}</div>
          </div>
          <div class="compare-card" data-val="1/${denomB}">
            ${NQ.fracBarHTML(denomB, new Set([0]), false)}
            <div class="block-label">1/${denomB}</div>
          </div>
        </div>`;
      },

      showHint(visualContainer) {
        visualContainer.querySelectorAll('.frac-seg.shaded').forEach(el => {
          el.classList.remove('highlight'); void el.offsetWidth;
          el.classList.add('highlight');
        });
      },

      renderInteraction(container, onChange) {
        container.innerHTML = '';
        
        setTimeout(() => {
          document.querySelectorAll('.compare-card').forEach(card => {
            card.addEventListener('click', () => {
              document.querySelectorAll('.compare-card').forEach(c => c.classList.remove('picked'));
              card.classList.add('picked');
              onChange(card.dataset.val);
            });
          });
        }, 0);
      },

      
      fallback(given) {
        const larger  = Math.max(denomA, denomB);
        const givenStr = String(given);

        
        if (givenStr === `1/${larger}`) {
          return `You picked 1/${larger}. Imagine cutting a pizza into ${larger} equal slices versus only ${smaller} slices. The ${smaller}-slice pizza gives you a much bigger piece each time. A bigger bottom number means smaller slices, not bigger ones.`;
        }

        
        return `Look at how wide the shaded part is in each bar. 1/${smaller} takes up more space than 1/${larger} because cutting into only ${smaller} pieces makes each piece larger.`;
      }
    };
  }

  
  if (tier === 2) {
    const denom = simplify ? 4 : [4, 5, 6, 8][rand(0, 3)];
    const numA  = rand(1, denom - 2);
    const numB  = rand(1, Math.max(1, denom - 1 - numA));

    return {
      strand: 'fractions', tier,
      prompt: `${numA}/${denom} + ${numB}/${denom} = ?/${denom} — type how many ${denom}ths in total.`,
      correctAnswer: numA + numB,
      descForAI: `Adding ${numA}/${denom} + ${numB}/${denom}. Correct numerator total is ${numA + numB} and the denominator STAYS ${denom}. The classic bug is adding the denominators too (as if the answer were ${numA + numB}/${denom * 2}).`,
      misconceptionHint: 'adds denominators too (double-add bug)',
      hintText: `The bottom number (${denom}) never changes when the denominators match. Just count all the yellow pieces across both bars!`,

      renderVisual(container) {
        container.innerHTML = `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center;">
          ${NQ.fracBarHTML(denom, new Set(Array.from({ length: numA }, (_, i) => i)), false)}
          <div style="font-family:'Kalam',cursive;font-size:1.4rem;">+</div>
          ${NQ.fracBarHTML(denom, new Set(Array.from({ length: numB }, (_, i) => i)), false)}
        </div>`;
      },

      showHint(visualContainer) {
        visualContainer.querySelectorAll('.frac-seg.shaded').forEach((el, i) => {
          setTimeout(() => {
            el.classList.remove('highlight'); void el.offsetWidth;
            el.classList.add('highlight');
          }, i * 80);
        });
      },

      
      fallback(given) {
        const correct = numA + numB;

        
        if (typeof given === 'number' && given === correct + denom) {
          return `You got ${given} by adding the bottom numbers too. The denominator stays ${denom} because the piece sizes do not change. Only count the yellow pieces: ${numA} in the first bar plus ${numB} in the second equals ${correct}.`;
        }

        
        if (given === denom) {
          return `You got ${denom}, which would mean a completely full bar. But you only have ${numA} yellow pieces in the first bar and ${numB} in the second. ${numA} + ${numB} = ${correct}.`;
        }

        
        if (given === numA) {
          return `You got ${numA}, which is the first bar only. Add the ${numB} yellow pieces from the second bar too. ${numA} + ${numB} = ${correct}.`;
        }

        
        if (given === numB) {
          return `You got ${numB}, which is the second bar only. Add the ${numA} yellow pieces from the first bar too. ${numA} + ${numB} = ${correct}.`;
        }

        
        if (Math.abs(given - correct) === 1) {
          return `You got ${given}, just one piece off. Count again: ${numA} yellow pieces in the first bar, ${numB} in the second. That is ${numA} + ${numB} = ${correct}.`;
        }

        
        return `You got ${given}. Count only the yellow (shaded) pieces: ${numA} in the first bar and ${numB} in the second. Add them together. The bottom number (${denom}) does not change.`;
      },

      renderInteraction(container, onChange) {
        NQ.renderNumPad(container, onChange);
      }
    };
  }

  
  const denom = simplify ? 4 : [4, 5, 6][rand(0, 2)];
  const numA  = rand(Math.ceil(denom / 2), denom - 1);
  const numB  = rand(2, denom - 1);
  const total = numA + numB;

  return {
    strand: 'fractions', tier,
    prompt: `${numA}/${denom} + ${numB}/${denom} = ?/${denom} — type how many ${denom}ths in total.`,
    correctAnswer: total,
    descForAI: `Adding ${numA}/${denom} + ${numB}/${denom}, where the true total (${total}/${denom}) is an IMPROPER fraction, more than one whole. Common bug: capping the answer at ${denom}, or answering ${denom} because "a fraction can't be more than a whole" (improper fraction blindness).`,
    misconceptionHint: 'improper fraction blindness',
    hintText: `It's okay if your answer is bigger than ${denom}! Fractions can go past one whole. Count every shaded piece across both bars.`,

    renderVisual(container) {
      container.innerHTML = `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center;">
        ${NQ.fracBarHTML(denom, new Set(Array.from({ length: numA }, (_, i) => i)), false)}
        <div style="font-family:'Kalam',cursive;font-size:1.4rem;">+</div>
        ${NQ.fracBarHTML(denom, new Set(Array.from({ length: numB }, (_, i) => i)), false)}
      </div>`;
    },

    showHint(visualContainer) {
      visualContainer.querySelectorAll('.frac-seg.shaded').forEach((el, i) => {
        setTimeout(() => {
          el.classList.remove('highlight'); void el.offsetWidth;
          el.classList.add('highlight');
        }, i * 80);
      });
    },

    
    fallback(given) {
      
      if (given === denom) {
        return `You stopped at ${denom}, but that is not the limit. Count every yellow piece: ${numA} in the first bar, then ${numB} in the second. ${numA} + ${numB} = ${total}. Fractions can go past one whole and that is fine.`;
      }

      
      if (given === total + denom) {
        return `You got ${given} by adding the bottom numbers too. The ${denom} stays the same. Only count the shaded pieces: ${numA} + ${numB} = ${total}.`;
      }

      
      if (Math.abs(given - total) === 1) {
        return `You got ${given}, just one piece off. First bar: ${numA} yellow pieces. Second bar: ${numB} yellow pieces. ${numA} + ${numB} = ${total}.`;
      }

      
      if (given === numA) {
        return `You counted the first bar (${numA}) and stopped. The second bar has ${numB} more yellow pieces. ${numA} + ${numB} = ${total}.`;
      }
      if (given === numB) {
        return `You counted the second bar (${numB}) and stopped. The first bar has ${numA} more yellow pieces. ${numA} + ${numB} = ${total}.`;
      }

      
      return `You got ${given}. Count every yellow piece across both bars: ${numA} in the first, ${numB} in the second. ${numA} + ${numB} = ${total}. Do not stop at ${denom} just because that is the bottom number.`;
    },

    renderInteraction(container, onChange) {
      NQ.renderNumPad(container, onChange);
    }
  };
};
