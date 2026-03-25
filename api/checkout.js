// api/checkout.js
// Creates a Stripe Checkout session and returns the URL

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CREDIT_MAP = {
  [process.env.STRIPE_PRICE_1BOOK]:   1,
  [process.env.STRIPE_PRICE_3BOOKS]:  3,
  [process.env.STRIPE_PRICE_8BOOKS]:  8,
  [process.env.STRIPE_PRICE_20BOOKS]: 20,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, email } = req.body;
  if (!priceId || !CREDIT_MAP[priceId]) {
    return res.status(400).json({ error: 'Ungültige Preis-ID' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_URL}/app.html?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/index.html?cancelled=1`,
      metadata: { credits: String(CREDIT_MAP[priceId]) },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
};
