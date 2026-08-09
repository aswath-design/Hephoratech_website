# HephoraTech — setup guide

> ## ⚠️ ARCHIVED — do not follow these steps
>
> Written for an early version of the site. Kept only for history. As of 09 Aug 2026:
>
> - **Never run `git branch -M main`.** The deploy branch is **`master`** and pushing to it
>   deploys the live site. Renaming it breaks deploys. (The commands below have been removed.)
> - Both setup tasks are **already done** — the Web3Forms key is live in `contact.html`, and
>   the repo has been pushed for months.
> - The file tree below is wrong: there are 16 pages, not 9, and `index-classic.html`,
>   `assets/style.css` and `assets/app.js` were deleted long ago.
> - §4 is wrong: `WA_NUMBER` no longer exists in `xtract.js`. The number is hardcoded across
>   the HTML files — changing it is a find-and-replace.
> - The contact address is now `info@hephoratech.com`, not `Aswath@`.
>
> **See [HANDOFF.md](HANDOFF.md) instead.**

Two things need you to finish them: **pushing to GitHub** and **making the contact
form email you**. Both are quick.

---

## 1. Push the site to GitHub

The repo is already initialised and everything is committed — the commit is called
*"HephoraTech website: dark blue theme, new products, chat widget"* (29 files).
The remote is already pointed at your repo.

You're on **PowerShell** (per your screenshot) — `del /f /q ... 2>nul` is CMD syntax and doesn't
work there, which is why you saw the `FileStream` error. Use this instead:

```powershell
cd D:\Hephoratech

# one-off cleanup: leftover lock files from the sandbox
Remove-Item -Force .git\index.lock -ErrorAction SilentlyContinue
Remove-Item -Force .git\HEAD.lock -ErrorAction SilentlyContinue
Remove-Item -Force .git\refs\heads\master.lock -ErrorAction SilentlyContinue

# the branch rename that was here has been REMOVED — see the banner at the top.
# The deploy branch is master. Just: git push
```

If you're in Command Prompt (cmd.exe) instead, this version works there:

```bat
cd D:\Hephoratech
del /f /q .git\index.lock
del /f /q .git\HEAD.lock
del /f /q .git\refs\heads\master.lock
rem branch rename REMOVED — the deploy branch is master. Just: git push
```

GitHub will ask you to sign in. Use a **personal access token** as the password
(GitHub no longer accepts your account password):

1. Go to <https://github.com/settings/tokens> → *Generate new token (classic)*
2. Tick the **repo** scope, generate, and copy the token
3. Paste it when git asks for a password

After the first push, later updates are just:

```bash
git add .
git commit -m "describe what changed"
git push
```

> **Note:** never commit a token or password into the repo.

---

## 2. Make the contact form email you

**Short answer:** a plain HTML website *cannot* send email on its own. Email has to
be sent by a server. You have two options — one is free and takes 2 minutes.

### Right now (already working, no setup)

If you do nothing, clicking **Send Message** opens the visitor's own email app with
all their answers pre-filled and addressed to `Aswath@hephoratech.com`. It works,
but the visitor has to press send themselves, so some people drop off.

### Recommended — Web3Forms (free, 2 minutes, no server)

This sends the enquiry straight to your inbox automatically.

1. Go to <https://web3forms.com>
2. Enter **Aswath@hephoratech.com** and click *Create Access Key*
3. Check that inbox — you'll receive an access key that looks like
   `a1b2c3d4-1234-5678-9abc-def012345678`
4. Open `hephoratech-website/contact.html` and replace **both** copies of
   `YOUR-ACCESS-KEY-HERE`:

```html
<form class="rv" style="transition-delay:.12s" data-mail="PASTE-YOUR-KEY-HERE">
  <input type="hidden" name="access_key" value="PASTE-YOUR-KEY-HERE">
```

That's it. Every submission now lands in your inbox within seconds, and the visitor
sees a "Your message is on its way" confirmation on the page.

Free plan covers **250 submissions/month**, which is plenty for a business site.

### Alternatives, if you'd rather

| Option | Cost | Notes |
|---|---|---|
| **Formspree** | Free tier (50/mo) | Same idea, swap the endpoint URL |
| **Netlify Forms** | Free (100/mo) | Only if you host the site on Netlify |
| **EmailJS** | Free (200/mo) | Sends via your own Gmail account |
| **Own backend** | Server cost | Full control; needs PHP/Node + SMTP |

Web3Forms is the best fit here — no account for visitors, no server, works on any host.

---

## 3. Where things live

```
hephoratech-website/
├── index.html                    homepage
├── services.html                 + 6 service detail pages
├── products.html                 + 2 product detail pages
├── about.html · contact.html
├── HOW-TO-ADD-VIDEO.md           how to put a video/GIF in the services section
└── assets/
    ├── xtract.css                all styling for the dark site
    ├── xtract.js                 all animation + interactions
    ├── logo-transparent.png      white logo (used on the dark theme)
    └── media/                    put your service videos & screenshots here
```

`index-classic.html`, `assets/style.css` and `assets/app.js` are the **old light
theme**, kept as a backup. Safe to delete once you're happy with the new site.

---

## 4. Changing the WhatsApp number

It's set to **+91 99942 29860**. To change it, open `assets/xtract.js` and edit
this line near the bottom:

```js
const WA_NUMBER = '919994229860';   // country code + number, no + or spaces
```
