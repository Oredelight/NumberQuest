'use strict';
window.NQ = window.NQ || {};

NQ.blockGroupHTML = function(tens, ones, label) {
  let rods = '';
  for (let i = 0; i < tens; i++) rods += '<div class="rod"></div>';
  let squares = '';
  for (let i = 0; i < ones; i++) squares += '<div class="one"></div>';
  const labelHTML = label !== undefined
    ? `<div class="block-label">${label}</div>`
    : '';
  return `<div class="block-group">
    <div class="rods-row">${rods}</div>
    <div class="ones-row">${squares}</div>
    ${labelHTML}
  </div>`;
};

NQ.fracBarHTML = function(denom, shadedSet, clickable) {
  let segs = '';
  for (let i = 0; i < denom; i++) {
    const shaded    = shadedSet.has(i) ? 'shaded' : '';
    const clickCls  = clickable ? 'clickable' : '';
    segs += `<div class="frac-seg ${shaded} ${clickCls}" data-idx="${i}"></div>`;
  }
  return `<div class="frac-bar">${segs}</div>`;
};

NQ.renderNumPad = function(container, onChange) {
  let val = '';

  container.innerHTML = `
    <div class="answer-row">
      <div class="answer-box" id="ansDisplay">&nbsp;</div>
    </div>
    <div class="pad">
      ${[1,2,3,4,5,6,7,8,9].map(n =>
        `<button data-n="${n}" aria-label="${n}">${n}</button>`
      ).join('')}
      <button data-n="clear" class="wide" aria-label="Clear all">Clear</button>
      <button data-n="0"    aria-label="0">0</button>
      <button data-n="back" class="wide" aria-label="Backspace">⌫</button>
    </div>`;

  const display = container.querySelector('#ansDisplay');

  function commit() {
    const hasVal = val.length > 0;
    display.textContent = hasVal ? val : '\u00A0';
    display.classList.toggle('has-value', hasVal);
    onChange(hasVal ? parseInt(val, 10) : null);
  }

  
  NQ._numpadInput = function(n) {
    if (n === 'clear') {
      val = '';
    } else if (n === 'back') {
      val = val.slice(0, -1);
    } else if (val.length < 3) {
      val += String(n);
    }
    commit();
  };

  container.querySelectorAll('.pad button').forEach(btn => {
    btn.addEventListener('click', () => NQ._numpadInput(btn.dataset.n));
  });
};
