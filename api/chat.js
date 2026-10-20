// Vercel serverless function: proxies OpenRouter chat requests.
// The API key lives in Vercel environment variables (OPENROUTER_API_KEY), never in the repo.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured in Vercel env vars' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : null;
  if (!messages || !messages.length) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.YUTEA_MODEL || 'minimax/minimax-m3.1-flash:free',
        messages,
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err) {
    console.error('[chat proxy]', err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
