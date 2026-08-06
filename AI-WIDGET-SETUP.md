# Turning on the AI assistant

The widget is built and already on every page. It needs one thing to start
answering: your OpenAI key, stored safely on Cloudflare.

---

## Why the key can't go in the website

A website's JavaScript is fully visible to anyone — right-click, View Source,
and it's there. If the key were in that file, someone could copy it and spend
your OpenAI credit.

So the key lives on **Cloudflare's server** instead. The browser talks to your
own `/api/chat` address, Cloudflare adds the key behind the scenes, and the
visitor never sees it.

**Never paste your key into a chat, a file in this project, or a website form.**

---

## Setup — about 2 minutes

Open PowerShell:

```powershell
cd D:\Hephoratech
npx wrangler secret put OPENAI_API_KEY
```

It will ask you to paste the key. Paste it and press Enter — it won't show on
screen as you type, which is normal. The key is stored encrypted on Cloudflare
and cannot be read back out afterwards.

Then deploy:

```powershell
git add -A
git commit -m "Add AI assistant"
git push
```

That's it. The bubble will start answering within a minute or two.

> If `npx wrangler` asks you to log in, it will open your browser — sign in with
> the same account your site is deployed under.

---

## Changing the model

It uses `gpt-4o-mini` by default, which is inexpensive and fast enough for a
website assistant. To use a different one:

```powershell
npx wrangler secret put OPENAI_MODEL
```

and enter e.g. `gpt-4o`.

---

## What the assistant knows

Its knowledge lives in `worker/index.js`, in the `SYSTEM_PROMPT` section. It
currently covers:

- All six services, with typical timelines
- Both products, including that School Manager is still in development
- The team — Aswathaman, Saran, Giritharan, Kamalesh
- Contact details

It is explicitly instructed **not** to invent prices, client names, case
studies or timelines, and to say it doesn't know rather than guess. When you
add a service, a product, or a team member, edit that section and push — the
assistant updates with it.

---

## Cost and safety

Each conversation costs a fraction of a rupee on `gpt-4o-mini`. The Worker
already limits message length to 600 characters and history to 12 turns, so a
single visitor can't run up a large bill quickly.

Two things worth doing once it's live:

1. **Set a spend limit** in your OpenAI account (Billing → Limits). This is the
   real protection — it caps what can ever be charged.
2. **Add a rate limit** in Cloudflare if the site gets busy: Security → WAF →
   Rate limiting rules, applied to the path `/api/chat`.

---

## Turning it off

If you ever want to remove it, delete the `assistant()` block near the bottom
of `hephoratech-website/assets/xtract.js`. The rest of the site is unaffected.
