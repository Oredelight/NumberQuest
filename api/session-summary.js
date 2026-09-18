'use strict';

const SYSTEM_PROMPT = 'You are Professor Chalk, a warm and precise K-5 math tutoring assistant. You write session intelligence reports for parents and teachers. You are direct, specific, and encouraging. You never use em-dashes or en-dashes.';
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
          generationConfig: { maxOutputTokens: 320 }
        })
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error('Gemini request failed:', geminiRes.status, data.error?.status || 'unknown error');
      res.status(502).json({ error: 'Gemini request failed', providerStatus: geminiRes.status });
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

    res.status(200).json({ text });
  } catch (err) {
    console.error('Session summary error:', err.message);
    res.status(502).json({ error: 'Unable to generate summary' });
  }
};
