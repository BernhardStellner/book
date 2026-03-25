// api/credits.js
// GET  ?email=x  → returns { credits: N }
// POST { email, action:'deduct' } → deducts 1 credit, returns { credits: N }

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: check credits
  if (req.method === 'GET') {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email fehlt' });

    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('email', email)
      .single();

    if (error || !data) return res.json({ credits: 0 });
    return res.json({ credits: data.credits });
  }

  // POST: deduct 1 credit
  if (req.method === 'POST') {
    const { email, action } = req.body;
    if (!email) return res.status(400).json({ error: 'Email fehlt' });

    const { data, error } = await supabase
      .from('users')
      .select('id, credits')
      .eq('email', email)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User nicht gefunden' });
    if (data.credits <= 0) return res.status(403).json({ error: 'Keine Credits mehr' });

    if (action === 'deduct') {
      await supabase
        .from('users')
        .update({ credits: data.credits - 1 })
        .eq('email', email);
      return res.json({ credits: data.credits - 1 });
    }

    return res.json({ credits: data.credits });
  }

  res.status(405).end();
};
