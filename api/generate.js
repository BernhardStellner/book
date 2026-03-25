// api/generate.js
// Proxies OpenAI calls so the API key stays secret on the server
// Checks credits before generating, deducts after success

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, model, messages, max_tokens } = req.body;
  if (!email) return res.status(400).json({ error: 'Email fehlt' });

  // Check credits (only check, don't deduct yet — deduct happens at end of full book)
  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('email', email)
    .single();

  if (!user || user.credits <= 0) {
    return res.status(403).json({ error: 'Keine Credits. Bitte Paket kaufen.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4.1',
        temperature: 0.72,
        max_tokens: max_tokens || 3500,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI Error ${response.status}`);
    res.json(data);

  } catch (err) {
    console.error('OpenAI proxy error:', err);
    res.status(500).json({ error: err.message });
  }
};
