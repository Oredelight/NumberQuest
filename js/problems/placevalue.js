'use strict';
window.NQ = window.NQ || {};

NQ.genPlaceValue = function(tier, simplify) {
  const rand = NQ.rand;

  
  if (tier === 1 || simplify) {
    const tens = rand(1, 7);
    const ones = rand(0, 9);
    const num  = tens * 10 + ones;

    return {
      strand: 'placevalue', tier,
      prompt: 'What number do these blocks show?',
      correctAnswer: num,
      descForAI: `Blocks show ${tens} tens and ${ones} ones (the number ${num}). A classic wrong answer reverses the digits, saying "${ones}${tens}" instead of "${tens}${ones}": writing the ones digit before the tens digit.`,
      misconceptionHint: 'reads the digits backward (ones digit before tens digit)',
      hintText: `Count the tall towers first — each one is worth 10. Then count the small squares.`,

      renderVisual(container) {
        container.innerHTML = NQ.blockGroupHTML(tens, ones);
      },

      showHint(visualContainer) {
        
        const rods  = [...visualContainer.querySelectorAll('.rod')];
        const sqrs  = [...visualContainer.querySelectorAll('.one')];
        rods.forEach((el, i) => setTimeout(() => {
          el.classList.remove('highlight'); void el.offsetWidth;
          el.classList.add('highlight');
        }, i * 90));
        sqrs.forEach((el, i) => setTimeout(() => {
          el.classList.remove('highlight'); void el.offsetWidth;
          el.classList.add('highlight');
        }, rods.length * 90 + 200 + i * 60));
      },

      
      fallback(given) {
        
        const reversed = ones * 10 + tens;
        if (given === reversed) {
          return `You wrote ${given} — looks like the digits got swapped! Count the ${tens} tall towers first (each tower = 10), then count the ${ones} small squares.`;
        }
        
        if (given === tens + ones) {
          return `You added ${tens} and ${ones} together, but the towers aren't 1s. Each tall tower is worth 10! So those ${tens} towers are actually worth ${tens * 10}.`;
        }
        
        if (given === tens * 10) {
          return `You counted the ${tens} towers and stopped. Don't forget the ${ones} small squares — add those on too!`;
        }
        
        if (given === ones) {
          return `You only counted the small squares. The ${tens} tall towers each count as 10 — add those first!`;
        }
        return `Count the tall towers first (worth 10 each), then add the small squares. Towers: ${tens}, squares: ${ones}.`;
      },

      renderInteraction(container, onChange) {
        NQ.renderNumPad(container, onChange);
      }
    };
  }

  
  if (tier === 2) {
    const target = rand(11, 89);
    const built  = { tens: 0, ones: 0 };

    const p = {
      strand: 'placevalue', tier,
      prompt: `Build the number ${target} using tens and ones blocks.`,
      correctAnswer: target,
      descForAI: `Build the number ${target} with blocks (${Math.floor(target / 10)} tens, ${target % 10} ones). A classic wrong answer swaps which block size represents tens vs. ones.`,
      misconceptionHint: 'confuses which block size represents tens vs. ones',
      hintText: `${target} has ${Math.floor(target / 10)} tens and ${target % 10} ones. Add the tall towers for tens first!`,

      renderVisual(container) {
        container.innerHTML = NQ.blockGroupHTML(built.tens, built.ones, `${built.tens * 10 + built.ones}`);
      },

      showHint(visualContainer) {
        visualContainer.querySelectorAll('.rod, .one').forEach(el => {
          el.classList.remove('highlight'); void el.offsetWidth;
          el.classList.add('highlight');
        });
      },

      renderInteraction(container, onChange) {
        container.innerHTML = `<div class="block-controls">
          <button class="block-btn" data-a="tens+1" aria-label="Add 1 ten">+1 ten</button>
          <button class="block-btn" data-a="tens-1" aria-label="Remove 1 ten">−1 ten</button>
          <button class="block-btn" data-a="ones+1" aria-label="Add 1 one">+1 one</button>
          <button class="block-btn" data-a="ones-1" aria-label="Remove 1 one">−1 one</button>
        </div>`;

        container.querySelectorAll('.block-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const raw   = btn.dataset.a;
            const key   = raw.startsWith('tens') ? 'tens' : 'ones';
            const delta = raw.endsWith('+1') ? 1 : -1;
            built[key]  = Math.max(0, built[key] + delta);
            p.renderVisual(document.getElementById('visualArea'));
            onChange(built.tens * 10 + built.ones);
          });
        });
      },

      
      fallback(given) {
        const targetTens = Math.floor(target / 10);
        const targetOnes = target % 10;
        
        const swapped = targetOnes * 10 + targetTens;
        if (given === swapped) {
          return `You used ${targetOnes} towers and ${targetTens} squares — those are flipped! You need ${targetTens} tall towers and ${targetOnes} small squares to make ${target}.`;
        }
        if (given < target) {
          const diff = target - given;
          return `You're ${diff} short of ${target}. Add ${diff > 9 ? Math.ceil(diff / 10) + ' more tower(s)' : diff + ' more square(s)'} to reach the target.`;
        }
        if (given > target) {
          const diff = given - target;
          return `You built ${given} — that's ${diff} too many. Remove ${diff > 9 ? Math.ceil(diff / 10) + ' tower(s)' : diff + ' square(s)'} to hit ${target}.`;
        }
        return `${target} needs exactly ${targetTens} tall towers and ${targetOnes} small squares.`;
      }
    };
    return p;
  }

  
  const a = rand(10, 89);
  let b   = rand(10, 89);
  while (b === a) b = rand(10, 89);
  const bigger = Math.max(a, b);

  return {
    strand: 'placevalue', tier,
    prompt: 'Which number is greater?',
    correctAnswer: bigger,
    descForAI: `Compare ${a} and ${b} (blocks shown for each); correct choice was the greater number, ${bigger}. A classic wrong answer picks based on the ones digit or on which number "looks bigger written down" instead of comparing the tens digit first.`,
    misconceptionHint: 'compares by ones digit instead of tens (place value) digit',
    hintText: `Look at the tall towers first. More towers = bigger number, no matter what the small squares say.`,

    renderVisual(container) {
      container.innerHTML = `<div class="compare-row">
        <div class="compare-card" data-val="${a}">
          ${NQ.blockGroupHTML(Math.floor(a / 10), a % 10, String(a))}
        </div>
        <div class="compare-card" data-val="${b}">
          ${NQ.blockGroupHTML(Math.floor(b / 10), b % 10, String(b))}
        </div>
      </div>`;
    },

    showHint(visualContainer) {
      visualContainer.querySelectorAll('.rod').forEach(el => {
        el.classList.remove('highlight'); void el.offsetWidth;
        el.classList.add('highlight');
      });
    },

    renderInteraction(container, onChange) {
      container.innerHTML = '';
      document.querySelectorAll('.compare-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.compare-card').forEach(c => c.classList.remove('picked'));
          card.classList.add('picked');
          onChange(parseInt(card.dataset.val, 10));
        });
      });
    },

    
    fallback(given) {
      const smaller  = Math.min(a, b);
      const bigTens  = Math.floor(bigger / 10);
      const smTens   = Math.floor(smaller / 10);
      const bigOnes  = bigger % 10;
      const smOnes   = smaller % 10;

      if (given === smaller) {
        
        if (smOnes > bigOnes && smTens < bigTens) {
          return `${smaller} has a bigger ones digit (${smOnes} vs ${bigOnes}), but look at the towers! ${bigger} has ${bigTens} towers vs ${smTens} — towers always win.`;
        }
        return `${bigger} has ${bigTens} towers and ${smaller} has ${smTens}. More towers means a bigger number — look at the towers first!`;
      }
      return `Compare the tall towers first. ${bigger} has ${bigTens} towers, ${smaller} has ${smTens} towers — so ${bigger} is greater.`;
    }
  };
};
