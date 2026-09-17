'use strict';

window.NQ = window.NQ || {};

NQ.STRANDS = {
  addsub:         { label: 'Addition & Subtraction', tier: 1, streak: 0, mastered: false, _nextSimplify: false },
  placevalue:     { label: 'Place Value',             tier: 1, streak: 0, mastered: false, _nextSimplify: false },
  multiplication: { label: 'Multiplication',          tier: 1, streak: 0, mastered: false, _nextSimplify: false },
  fractions:      { label: 'Fractions',               tier: 1, streak: 0, mastered: false, _nextSimplify: false }
};

NQ.current = 'addsub';

NQ.rand = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

NQ.saveState = function() {
  try {
    const data = {};
    Object.entries(NQ.STRANDS).forEach(([k, s]) => {
      data[k] = { tier: s.tier, streak: s.streak, mastered: s.mastered };
    });
    localStorage.setItem('nq_state_v2', JSON.stringify(data));
  } catch (e) {  }
};

NQ.loadState = function() {
  try {
    const raw = localStorage.getItem('nq_state_v2');
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([k, v]) => {
      if (!NQ.STRANDS[k]) return;
      NQ.STRANDS[k].tier    = Number(v.tier)    || 1;
      NQ.STRANDS[k].streak  = Number(v.streak)  || 0;
      NQ.STRANDS[k].mastered = !!v.mastered;
    });
  } catch (e) {  }
};

NQ.resetState = function() {
  Object.keys(NQ.STRANDS).forEach(k => {
    NQ.STRANDS[k].tier          = 1;
    NQ.STRANDS[k].streak        = 0;
    NQ.STRANDS[k].mastered      = false;
    NQ.STRANDS[k]._nextSimplify = false;
  });
  NQ.sessionLog = [];
  try { localStorage.removeItem('nq_state_v2'); } catch (e) {}
};

NQ.getSoundPref = function() {
  try { return localStorage.getItem('nq_sound') !== '0'; } catch (e) { return true; }
};

NQ.setSoundPref = function(on) {
  try { localStorage.setItem('nq_sound', on ? '1' : '0'); } catch (e) {}
};


