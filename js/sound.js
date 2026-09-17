'use strict';
window.NQ = window.NQ || {};

let _ctx = null;

function ctx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function tone(freq, duration, gain = 0.22, startOffset = 0, type = 'sine') {
  const c = ctx();
  if (!c || !NQ.soundEnabled) return;
  try {
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + startOffset);
    g.gain.setValueAtTime(gain, c.currentTime + startOffset);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startOffset + duration);
    osc.start(c.currentTime + startOffset);
    osc.stop(c.currentTime + startOffset + duration + 0.05);
  } catch (e) {}
}

NQ.soundEnabled = true;

NQ.playCorrect = function() {
  tone(523, 0.12);          
  tone(659, 0.20, 0.22, 0.10);  
};

NQ.playWrong = function() {
  tone(220, 0.32, 0.18, 0, 'triangle');
};

NQ.playLevelUp = function() {
  tone(523, 0.10);           
  tone(659, 0.10, 0.22, 0.12); 
  tone(784, 0.26, 0.28, 0.24); 
};

NQ.playMastered = function() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.20, 0.28, i * 0.13));
};

NQ.toggleSound = function() {
  NQ.soundEnabled = !NQ.soundEnabled;
  NQ.setSoundPref(NQ.soundEnabled);
  const btn = document.getElementById('soundBtn');
  if (btn) btn.textContent = NQ.soundEnabled ? 'Sound on' : 'Sound off';
};

NQ.initSound = function() {
  NQ.soundEnabled = NQ.getSoundPref();
  const btn = document.getElementById('soundBtn');
  if (btn) btn.textContent = NQ.soundEnabled ? 'Sound on' : 'Sound off';
};
