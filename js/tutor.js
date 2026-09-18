'use strict';
window.NQ = window.NQ || {};

/* ─── Rule-based per-answer diagnosis (always instant, no network) ────── */
NQ.FALLBACK_BY_HINT = {
  'subtracts the smaller digit from the larger one column by column, skipping regrouping/borrowing':
    'When the top ones digit is smaller, borrow a ten before subtracting.',
  'forgot to carry the extra ten when the ones digits add to 10 or more':
    'When the ones add up to 10 or more, carry that extra ten over to the tens place.',
  'reads the digits backward (ones digit before tens digit)':
    'Tens come first, ones come second. Count the tall towers first.',
  'confuses which block size represents tens vs. ones':
    'The tall skinny towers are tens, and the little squares are ones.',
  'compares by ones digit instead of tens (place value) digit':
    'Look at the tens digit first. That is what decides which number is bigger.',
  'whole-number bias on denominators':
    'More slices from the same whole means each slice is smaller, not bigger.',
  'adds denominators too (double-add bug)':
    'When the bottom numbers match, only add the top numbers. The bottom stays the same.',
  'improper fraction blindness':
    'It is okay if your answer is bigger than the bottom number. Fractions can go past one whole.',
  'skip-counting or grouping slip':
    'Count in groups of that number all the way through.',
  'two-digit multiplication error':
    'Break the bigger number into tens and ones, multiply each part, then add.',
  'basic counting or fact recall slip':
    'Try counting it out slowly, one step at a time.'
};

NQ.smartFallback = function(problem, given) {
  if (typeof problem.fallback === 'function') {
    const msg = problem.fallback(given);
    if (msg) return msg;
  }
  if (
    typeof problem.correctAnswer === 'number' &&
    typeof given === 'number' &&
    Math.abs(given - problem.correctAnswer) === 1
  ) {
    return 'You are only one off. Try recounting one step at a time.';
  }
  return NQ.FALLBACK_BY_HINT[problem.misconceptionHint] ||
    'Take another look at each part of the problem, one piece at a time.';
};


/* ─── AI session summary (called once per session by the parent/teacher) ─ */
NQ.generateSessionSummary = async function() {
  const log = NQ.sessionLog;
  if (log.length === 0) return null;

  const total   = log.length;
  const correct = log.filter(e => e.correct).length;
  const pct     = Math.round(correct / total * 100);
  const strands = [...new Set(log.map(e => NQ.STRANDS[e.strand]?.label || e.strand))];

  /* Include up to 8 wrong answers so the prompt stays short */
  const errorLines = log
    .filter(e => !e.correct)
    .slice(0, 8)
    .map(e =>
      `Problem: "${e.prompt}" | Student answered: ${e.studentAnswer} | Correct: ${e.correctAnswer} | Diagnosis: ${e.diagnosis}`
    )
    .join('\n');

  const userMsg = `Session data:
- Total problems: ${total}
- Correct: ${correct} (${pct}%)
- Wrong: ${total - correct}
- Skills practiced: ${strands.join(', ')}
${errorLines ? `\nSpecific errors this session:\n${errorLines}` : '\nNo errors. The student answered everything correctly.'}

Write exactly 3 sentences for a parent or teacher. The first sentence MUST mention ${total} total problems, ${correct} correct, ${total - correct} wrong, ${pct}% accuracy, and every skill in this session. The second sentence MUST explain the most significant error pattern using the specific wrong-answer details above. The third sentence MUST give one concrete recommendation for the next practice session.

Rules: Do not greet the reader or say hello. Use only the supplied data. Be specific and warm. Never use em-dashes or en-dashes. No bullet points or headings.`;

  try {
    const res = await fetch('/api/session-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userMsg })
    });

    const data = await res.json();
    if (!res.ok) return { status: res.status, error: data.error || 'Request failed' };
    return { text: data.text || '' };

  } catch (err) {
    console.warn('Session summary error:', err.message);
    return { status: 0, error: err.message };
  }
};
