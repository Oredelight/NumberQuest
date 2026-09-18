'use strict';

const SYSTEM_PROMPT = 'You are Professor Chalk, writing a session report from the supplied SESSION DATA. This is not a chat. Never greet the user, say hello, introduce yourself, or give generic encouragement. Return exactly 3 sentences for a parent or teacher: sentence 1 must name every skill practiced and the exact total, correct, wrong, and accuracy numbers; sentence 2 must explain the most important error pattern using the supplied problem details; sentence 3 must give one concrete next-session recommendation. Use only facts from SESSION DATA. If there are multiple skills, name all of them. Be warm and specific. Never use em-dashes or en-dashes. Return only the three sentences, with no bullets or headings.';
const GEMINI_MODEL = 'gemini-2.5-flash';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Gemini is not configured' });
    return;
  }

  const userMsg = typeof req.body?.userMsg === 'string' ? req.body.userMsg.trim() : '';
  if (!userMsg || userMsg.length > 12000) {
    res.status(400).json({ error: 'Invalid session data' });
    return;
  }

  try {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' +
      encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: {
            maxOutputTokens: 320,
            temperature: 0.4
          }
        })
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error('Gemini request failed:', geminiRes.status, data.error?.status || 'unknown error');
      res.status(502).json({
        error: 'Gemini request failed',
        providerStatus: geminiRes.status,
        providerMessage: data.error?.message || 'Unknown Gemini error'
      });
      return;
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || '')
      .join('')
      .replace(/[\u2013\u2014]/g, ',')
      .replace(/,\s*,/g, ',')
      .trim();

    if (!text) {
      res.status(502).json({ error: 'Gemini returned no summary' });
      return;
    }

    const total = userMsg.match(/Total problems: (\d+)/)?.[1];
    const correct = userMsg.match(/Correct: (\d+)/)?.[1];
    const wrong = userMsg.match(/Wrong: (\d+)/)?.[1];
    const accuracy = userMsg.match(/Correct: \d+ \((\d+)%\)/)?.[1];
    const skills = userMsg.match(/Skills practiced: (.+)/)?.[1];
    const requiredFacts = [total, correct, wrong, accuracy, skills].filter(Boolean);
    const hasAllFacts = requiredFacts.every(fact => text.includes(fact));

    if (!hasAllFacts) {
      text = `This session included ${total} problems, with ${correct} correct and ${wrong} wrong for ${accuracy}% accuracy across ${skills}. ${text}`;
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error('Session summary error:', err.message);
    res.status(502).json({ error: 'Unable to generate summary' });
  }
};
