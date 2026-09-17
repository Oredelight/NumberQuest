'use strict';
window.NQ = window.NQ || {};

/* ─── Session log (per-play session, resets on page load / reset) ─────── */
NQ.sessionLog = [];

NQ.logSession = function(entry) {
  NQ.sessionLog.push(entry);
};

/* ─── Mastery score (for the at-a-glance stat) ───────────────────────── */
NQ.masteryScore = function() {
  const pts = Object.values(NQ.STRANDS).reduce((sum, s) => {
    const tierCredit   = s.mastered ? 3 : (s.tier - 1);
    const streakCredit = s.mastered ? 0 : (s.streak / 3);
    return sum + tierCredit + streakCredit;
  }, 0);
  return Math.min(100, Math.round((pts / 12) * 100)); /* 12 = 4 strands x 3 tiers */
};

/* ─── Dashboard renderer ─────────────────────────────────────────────── */
NQ.renderDashboard = function() {
  const body = document.getElementById('dashboardBody');
  if (!body) return;

  const log     = NQ.sessionLog;
  const total   = log.length;
  const correct = log.filter(e => e.correct).length;
  const wrong   = total - correct;
  const pct     = total > 0 ? Math.round(correct / total * 100) : 0;

  /* Per-strand accuracy bars */
  const strandMap = {};
  log.forEach(e => {
    if (!strandMap[e.strand]) {
      strandMap[e.strand] = { label: NQ.STRANDS[e.strand]?.label || e.strand, correct: 0, total: 0 };
    }
    strandMap[e.strand].total++;
    if (e.correct) strandMap[e.strand].correct++;
  });

  const strandRows = Object.values(strandMap).map(s => {
    const sPct = Math.round(s.correct / s.total * 100);
    return `<div class="dash-strand-row">
      <span class="dash-strand-name">${s.label}</span>
      <div class="dash-bar-wrap"><div class="dash-bar" style="width:${sPct}%"></div></div>
      <span class="dash-strand-pct">${sPct}%</span>
    </div>`;
  }).join('');

  /* Overall progress (tier dots) */
  const progressRows = Object.values(NQ.STRANDS).map(s => {
    const dots = [1,2,3].map(t =>
      `<span class="dot ${t <= (s.mastered ? 3 : s.tier - 1) ? 'filled' : ''}"></span>`
    ).join('');
    const badge = s.mastered ? '<span class="ribbon" style="font-size:0.6rem;padding:1px 6px;">MASTERED</span>' : '';
    return `<div class="dash-prog-row">
      <span class="dash-strand-name">${s.label}</span>
      <span class="dots">${dots}</span>
      ${badge}
    </div>`;
  }).join('');

  body.innerHTML = `
    ${total === 0 ? `<p class="dash-empty">No problems attempted yet. Start playing to generate a session summary.</p>` : `
    <div class="dash-stats">
      <div class="dash-stat"><div class="dash-stat-num">${total}</div><div class="dash-stat-label">problems</div></div>
      <div class="dash-stat"><div class="dash-stat-num correct-num">${correct}</div><div class="dash-stat-label">correct</div></div>
      <div class="dash-stat"><div class="dash-stat-num wrong-num">${wrong}</div><div class="dash-stat-label">wrong</div></div>
      <div class="dash-stat"><div class="dash-stat-num">${pct}%</div><div class="dash-stat-label">accuracy</div></div>
    </div>

    ${strandRows.length ? `<div class="dash-strands">${strandRows}</div>` : ''}
    `}

    <div class="dash-prog-section">
      <div class="dash-section-label">Progress</div>
      <div class="dash-prog-rows">${progressRows}</div>
    </div>

    <div class="dash-summary-section">
      <div class="dash-section-label">AI session summary</div>
      <p class="dash-summary-sub">
        Professor Chalk reads the whole session and writes a plain-language note for a parent or teacher.
      </p>

      <button class="btn btn-primary dash-gen-btn" id="generateSummary" ${total === 0 ? 'disabled' : ''}>
        Generate summary
      </button>

      <div class="dash-summary-output" id="summaryOutput" hidden></div>
    </div>
  `;

  /* Generate button */
  document.getElementById('generateSummary')?.addEventListener('click', async function() {
    const out    = document.getElementById('summaryOutput');
    out.hidden   = false;

    this.disabled    = true;
    this.textContent = 'Generating...';
    out.innerHTML    = `<p class="summary-text" style="color:var(--chalk-dim);">Reading the session...</p>`;

    const result = await NQ.generateSessionSummary();

    if (result?.text) {
      const summary = result.text;
      out.innerHTML = `
        <p class="summary-text">${summary}</p>
        <button class="btn btn-ghost summary-copy-btn" id="copySummary">Copy</button>
      `;
      document.getElementById('copySummary')?.addEventListener('click', function() {
        navigator.clipboard.writeText(summary).then(() => {
          this.textContent = 'Copied!';
          setTimeout(() => { this.textContent = 'Copy'; }, 2000);
        });
      });
    } else {
      const detail = result?.status === 500
        ? 'Gemini is not configured on the deployed app.'
        : result?.status === 502
          ? 'Gemini rejected the request. Check the deployment key and model access.'
          : 'Please use the deployed app URL, then try again.';
      out.innerHTML = `<p class="summary-text" style="color:var(--rod-red);">Could not generate the summary. ${detail}</p>`;
    }

    this.disabled    = false;
    this.textContent = 'Regenerate';
  });
};
