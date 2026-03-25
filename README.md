# AI Buchgenerator — Setup Anleitung

## Dateistruktur
```
aibuchgenerator/
├── api/
│   ├── checkout.js      ← Stripe Checkout erstellen
│   ├── webhook.js       ← Credits nach Zahlung gutschreiben
│   ├── credits.js       ← Credits prüfen / abziehen
│   └── generate.js      ← OpenAI Proxy (Key bleibt geheim)
├── public/
│   ├── index.html       ← Landingpage mit Preisen
│   └── app.html         ← Der Generator (nach Login)
├── package.json
├── vercel.json
└── .env.example         ← Vorlage für deine Keys
```

---

## Schritt 1 — Supabase Tabelle anlegen

1. Supabase Dashboard → **Table Editor** → **New Table**
2. Name: `users`
3. Spalten hinzufügen:
   - `email` → type: `text` → unique: ✓
   - `credits` → type: `int8` → default: `0`
4. **Save**

Dann: **Authentication → Settings → Site URL** auf deine Vercel-URL setzen:
`https://aibuchgenerator.vercel.app`

Und unter **Email Templates → Magic Link**: Redirect URL auf:
`https://aibuchgenerator.vercel.app/app.html`

---

## Schritt 2 — GitHub Repository erstellen

1. github.com → **New repository** → Name: `aibuchgenerator` → Public
2. Diesen Ordner hochladen (drag & drop im Browser, oder):
```bash
cd aibuchgenerator
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DEIN_USERNAME/aibuchgenerator.git
git push -u origin main
```

---

## Schritt 3 — Vercel deployen

1. vercel.com → **New Project** → GitHub Repo importieren
2. **Environment Variables** eintragen (Settings → Environment Variables):

```
STRIPE_SECRET_KEY         = sk_live_...
STRIPE_PUBLISHABLE_KEY    = pk_live_...
STRIPE_WEBHOOK_SECRET     = whsec_... (kommt im nächsten Schritt)
STRIPE_PRICE_1BOOK        = price_1TEyh4QyGxc2syscjWCIwLQ8
STRIPE_PRICE_3BOOKS       = price_1TEyhWQyGxc2syscPoq2IKq6
STRIPE_PRICE_8BOOKS       = price_1TEyi6QyGxc2sysc71zOz3k9
STRIPE_PRICE_20BOOKS      = price_1TEykXQyGxc2syscycQmGrXk
SUPABASE_URL              = https://dlkptnnjmlswmyooaawj.supabase.co
SUPABASE_ANON_KEY         = sb_publishable_...
SUPABASE_SERVICE_KEY      = dein_service_key
OPENAI_API_KEY            = sk-...
NEXT_PUBLIC_URL           = https://aibuchgenerator.vercel.app
```

3. **Deploy** klicken

---

## Schritt 4 — Stripe Webhook einrichten

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://aibuchgenerator.vercel.app/api/webhook`
3. Events: `checkout.session.completed` auswählen
4. **Add endpoint**
5. Den **Signing secret** (whsec_...) kopieren
6. In Vercel Environment Variables als `STRIPE_WEBHOOK_SECRET` eintragen
7. Vercel **Redeploy** (damit der neue Key aktiv wird)

---

## Schritt 5 — app.html anpassen

In `public/app.html` Zeile mit `SUPABASE_ANON_KEY` finden:
```javascript
const SUPABASE_ANON = 'DEIN_SUPABASE_ANON_KEY';
```
→ Ersetzen durch deinen echten Supabase Anon Key (dieser ist public-safe).

---

## Fertig! Testen:

1. `https://aibuchgenerator.vercel.app` aufrufen
2. Paket kaufen (Stripe Testmodus zuerst empfohlen)
3. Magic Link kommt per Email
4. Einloggen → Buch generieren → DOCX downloaden ✓

---

## Stripe Testmodus

Bevor du live gehst: In Stripe auf **Testmodus** schalten.
Testkarte: `4242 4242 4242 4242` · Datum: beliebig in Zukunft · CVC: beliebig

Wenn alles funktioniert → Stripe auf **Live** schalten.
