'use strict';
window.NQ = window.NQ || {};

NQ.generateProblem = function(strand, tier, simplify) {
  if (strand === 'addsub')         return NQ.genAddSub(tier, simplify);
  if (strand === 'placevalue')     return NQ.genPlaceValue(tier, simplify);
  if (strand === 'multiplication') return NQ.genMultiplication(tier, simplify);
  return NQ.genFractions(tier, simplify);
};

const $ = id => document.getElementById(id);

function setBubble(text, cls = 'bubble') {
  const el = $('bubble');
  el.className = cls;
  el.textContent = text;
}

function setBubbleThinking() {
  const el = $('bubble');
  el.className = 'bubble';
  el.innerHTML = '<div class="thinking"><span></span><span></span><span></span></div>';
}

function bounceOwl() {
  const owl = document.querySelector('.owl');
  owl.classList.remove('bounce');
  void owl.offsetWidth;
  owl.classList.add('bounce');
  owl.addEventListener('animationend', () => owl.classList.remove('bounce'), { once: true });
}

NQ.renderStrandTabs = function() {
  const el = $('strandTabs');
  el.innerHTML = '';

  Object.entries(NQ.STRANDS).forEach(([key, s]) => {
    const btn = document.createElement('button');
    btn.className = 'strand-tab' + (key === NQ.current ? ' active' : '');
    btn.setAttribute('aria-label', `${s.label}, Tier ${s.mastered ? 3 : s.tier} of 3`);
    btn.setAttribute('aria-pressed', key === NQ.current ? 'true' : 'false');

    const tierDots = [1, 2, 3].map(t =>
      `<span class="dot ${t <= (s.mastered ? 3 : s.tier - 1) ? 'filled' : ''}"></span>`
    ).join('');

    const streakBadge = (!s.mastered && s.streak > 0)
      ? `<span class="streak-badge">${s.streak}/3</span>`
      : '';

    const masteredBadge = s.mastered
      ? '<span class="ribbon">MASTERED</span>'
      : '';

    btn.innerHTML = `
      <span class="tname">${s.label}</span>
      <span class="tmeta">
        Tier ${s.mastered ? 3 : s.tier}/3
        <span class="dots">${tierDots}</span>
        ${streakBadge}
        ${masteredBadge}
      </span>`;

    btn.addEventListener('click', () => {
      NQ.current = key;
      NQ.loadProblem();
      NQ.renderStrandTabs();
    });

    el.appendChild(btn);
  });
};

let problem    = null;
let userAnswer = null;
let answered   = false;
let hintUsed   = false;

NQ.loadProblem = function(simplify = false) {
  answered   = false;
  userAnswer = null;
  hintUsed   = false;
  NQ._numpadInput = null;  

  const s = NQ.STRANDS[NQ.current];
  problem = NQ.generateProblem(NQ.current, s.tier, simplify);

  $('promptText').textContent = problem.prompt;
  problem.renderVisual($('visualArea'));
  problem.renderInteraction($('interactionArea'), v => { userAnswer = v; });

  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';

  $('checkBtn').style.display    = 'inline-block';
  $('checkBtn').disabled         = false;
  $('tryAgainBtn').style.display = 'none';
  $('nextBtn').style.display     = 'none';

  const hintBtn = $('hintBtn');
  hintBtn.disabled = false;
  hintBtn.classList.remove('used');
  hintBtn.title = 'Get a visual hint (uses 1 hint per problem)';

  setBubble("Give it a try. I'm watching how you think, not just the answer.");
};

$('hintBtn').addEventListener('click', function() {
  if (hintUsed || answered || !problem) return;
  hintUsed = true;
  this.disabled = true;
  this.classList.add('used');

  setBubble(problem.hintText, 'bubble hint-mode active anim-fadeInUp');

  if (problem.showHint) {
    problem.showHint($('visualArea'));
  }
});

$('checkBtn').addEventListener('click', function() {
  if (userAnswer === null || userAnswer === undefined || answered) return;
  answered = true;
  this.disabled = true;
  this.style.display = 'none';

  const correct     = String(userAnswer) === String(problem.correctAnswer);
  const fb          = $('feedback');
  const boardPanel  = document.querySelector('.board-panel');
  const s           = NQ.STRANDS[NQ.current];

  
  if (correct) {
    fb.textContent = 'Correct!';
    fb.className   = 'feedback correct';

    boardPanel.classList.add('anim-correct');
    boardPanel.addEventListener('animationend',
      () => boardPanel.classList.remove('anim-correct'), { once: true });

    NQ.playCorrect();
    bounceOwl();

    s.streak++;
    let leveled      = false;
    let justMastered = false;

    if (s.streak >= 3) {
      if (s.tier < 3) {
        s.tier++;
        s.streak = 0;
        leveled  = true;
        
        setTimeout(() => NQ.fireConfetti(), 300);
        NQ.playLevelUp();
      } else if (!s.mastered) {
        s.mastered     = true;
        justMastered   = true;
        setTimeout(() => NQ.fireConfetti('#e8b923'), 300);
        NQ.playMastered();
        
        const activeTab = document.querySelector('.strand-tab.active');
        if (activeTab) {
          activeTab.classList.add('level-up');
          activeTab.addEventListener('animationend',
            () => activeTab.classList.remove('level-up'), { once: true });
        }
      }
    }

    NQ.saveState();
    NQ.renderStrandTabs();

    const bubbleMsg = justMastered
      ? 'Skill mastered! You have really got this one!'
      : leveled
        ? `You leveled up to Tier ${s.tier}. Time to step it up.`
        : `${s.streak} out of 3 in a row. Keep going.`;

    setBubble(bubbleMsg, 'bubble active anim-fadeInUp');
    NQ.checkAllMastered();

    /* Log correct answer to session */
    NQ.logSession({
      strand: problem.strand,
      tier:   problem.tier,
      prompt: problem.prompt,
      correctAnswer: problem.correctAnswer,
      studentAnswer: userAnswer,
      correct: true,
      diagnosis: null
    });

  } else {
    s.streak = 0;
    NQ.saveState();
    NQ.renderStrandTabs();

    fb.textContent = 'Not quite. Let us figure out what happened.';
    fb.className   = 'feedback wrong';

    boardPanel.classList.add('anim-wrong');
    boardPanel.addEventListener('animationend',
      () => boardPanel.classList.remove('anim-wrong'), { once: true });

    NQ.playWrong();
    setBubbleThinking();

    /* Compute diagnosis once, use for both display and session log */
    const diagnosis = NQ.smartFallback(problem, userAnswer);

    NQ.logSession({
      strand: problem.strand,
      tier:   problem.tier,
      prompt: problem.prompt,
      correctAnswer: problem.correctAnswer,
      studentAnswer: userAnswer,
      correct: false,
      diagnosis
    });

    s._nextSimplify = true;

    setTimeout(() => {
      setBubble(diagnosis, 'bubble active anim-fadeInUp');
    }, 400);
  }

  if (correct) {
    $('tryAgainBtn').style.display = 'none';
    $('nextBtn').style.display     = 'inline-block';
  } else {
    $('tryAgainBtn').style.display = 'inline-block';
    $('nextBtn').style.display     = 'inline-block';
  }
});

$('tryAgainBtn').addEventListener('click', function() {
  answered   = false;
  userAnswer = null;
  NQ._numpadInput = null;

  document.querySelectorAll('.compare-card').forEach(c => c.classList.remove('picked'));
  $('interactionArea').innerHTML = '';
  problem.renderInteraction($('interactionArea'), v => { userAnswer = v; });

  $('feedback').textContent  = '';
  $('feedback').className    = 'feedback';
  $('checkBtn').style.display = 'inline-block';
  $('checkBtn').disabled      = false;
  this.style.display          = 'none';
  $('nextBtn').style.display  = 'none';
});

$('nextBtn').addEventListener('click', function() {
  const s        = NQ.STRANDS[NQ.current];
  const simplify = !!s._nextSimplify;
  s._nextSimplify = false;
  NQ.loadProblem(simplify);
});

NQ.checkAllMastered = function() {
  if (Object.values(NQ.STRANDS).every(s => s.mastered)) {
    setTimeout(() => $('celebOverlay').classList.add('show'), 900);
  }
};

$('resetProgress').addEventListener('click', () => {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  NQ.resetState(); /* also clears NQ.sessionLog */
  NQ.renderStrandTabs();
  NQ.loadProblem();
  $('dashOverlay').classList.remove('show');
});

/* ─── Overlays ───────────────────────────────────────────────────── */
$('closeOverlay').addEventListener('click', () => $('celebOverlay').classList.remove('show'));

$('dashBtn').addEventListener('click', () => {
  NQ.renderDashboard();
  $('dashOverlay').classList.add('show');
});
$('closeDash').addEventListener('click', () => $('dashOverlay').classList.remove('show'));


$('soundBtn').addEventListener('click', NQ.toggleSound);

NQ.loadState();
NQ.initSound();
NQ.renderStrandTabs();
NQ.loadProblem();
