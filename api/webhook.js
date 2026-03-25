// api/webhook.js
// Stripe sends payment confirmations here → credits are added to Supabase

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Vercel: disable body parsing so we can verify Stripe signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email   = session.customer_email || session.customer_details?.email;
    const credits  = parseInt(session.metadata?.credits || '0');

    if (!email || credits <= 0) {
      console.error('Missing email or credits in session', session.id);
      return res.json({ received: true });
    }

    // Upsert user: create if not exists, add credits if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, credits')
      .eq('email', email)
      .single();

    if (existing) {
      await supabase
        .from('users')
        .update({ credits: existing.credits + credits })
        .eq('email', email);
    } else {
      await supabase
        .from('users')
        .insert({ email, credits });
    }

    console.log(`✓ ${credits} Credits für ${email} gutgeschrieben`);
  }

  res.json({ received: true });
};
