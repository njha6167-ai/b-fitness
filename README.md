# B-FITNESS — Gym Membership Manager

A simple, focused tool for one job: **add members → track membership expiry → automatically remind them on WhatsApp before it runs out → renew in one click.**

No trainers, no workout plans, no BMI calculators, no revenue charts — just membership tracking and expiry reminders, as requested.

---

## 1. What's inside

```
b-fitness/
├── backend/     Node.js + Express + MongoDB API, WhatsApp integration, daily cron scheduler
└── frontend/    React + Tailwind CSS dashboard (Vite)
```

- **Backend**: `backend/README` info is in this file (section 3). Entry point: `backend/server.js`.
- **Frontend**: React SPA. Entry point: `frontend/src/main.jsx`.

Both were built and smoke-tested in the process of creating this project (npm install, syntax checks, a live server run, and a production `vite build`) — see section 6 for exactly what was and wasn't testable without a live MongoDB instance in the build environment.

---

## 2. Prerequisites

- **Node.js 18+** and npm
- **MongoDB** — either:
  - a local MongoDB server (`mongod` running on `localhost:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended if you don't want to install MongoDB yourself)

---

## 3. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Open `backend/.env` and set at minimum:

```
MONGO_URI=mongodb://127.0.0.1:27017/bfitness
```

(or your Atlas connection string).

Then run it:

```bash
npm run dev      # auto-restarts on file changes (uses nodemon)
# or
npm start        # plain node
```

You should see:

```
[MongoDB] connected -> bfitness
[Scheduler] Daily reminder check scheduled ("0 9 * * *")
[B-FITNESS API] running on http://localhost:5000
```

The API is now live at `http://localhost:5000/api`. Try `http://localhost:5000/api/health`.

**If MongoDB isn't reachable**, the server still starts (it doesn't crash), `/api/health` and `/api/whatsapp/status` keep working, and every other route returns a clear `503 Database not connected` message instead of hanging — so you always get useful feedback while you sort out `MONGO_URI`.

---

## 4. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (`http://localhost:5173`). It's already configured (`vite.config.js`) to proxy `/api` and `/uploads` to the backend on port 5000, so no extra config is needed for local development.

For a production build: `npm run build` → static files land in `frontend/dist`, serve them with any static host (or point Express at them — not wired up by default, kept separate on purpose for simplicity).

---

## 5. Connecting WhatsApp — exactly where to add your credentials

**Everything lives in `backend/.env`.** Nothing WhatsApp-related ever touches the frontend code — the access token never leaves the server.

```
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

### How to get these values

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and create (or open) an app.
2. Add the **WhatsApp** product to it.
3. Under **WhatsApp → API Setup** you'll see a temporary access token, a **Phone Number ID**, and your **WhatsApp Business Account ID**. Paste them into `.env`.
4. Restart the backend (`npm run dev`). `GET /api/whatsapp/status` (and the Settings page in the UI) will now report `configured: true`.

### One important real-world detail

WhatsApp only allows free-form text messages within a 24-hour window after a customer has messaged you. A membership reminder is sent by the *business*, proactively, so Meta requires it to use a **pre-approved message template** rather than a plain text message.

1. In WhatsApp Manager → **Account Tools → Message Templates**, create a template (e.g. named `membership_expiry_reminder`) with a body like:
   `Hello {{1}} 👋 Your {{3}} membership expires on {{2}}. Please renew to continue your workouts. Thank you, {{3}}`
2. Get it approved by Meta (usually fast for simple utility templates).
3. `backend/services/whatsappService.js` already sends `template`-type messages using this exact structure — the template name defaults to `"membership_expiry_reminder"`. If you name yours differently, update the `templateName` default in that file (it's the single place that constant lives).

### If you don't set up the Cloud API at all

The app still works fully. `POST /api/whatsapp/send-reminder` detects that no credentials are configured and returns a `wa.me` link instead. The frontend's **"Send WhatsApp"** button opens that link in a new tab with the message pre-filled — you just tap Send in WhatsApp yourself. This is never disguised as an automatic send; the reminder history log records it as a `manual` channel entry, separately from `api` (automatic) entries.

---

## 6. What was actually verified while building this (and what wasn't)

Being upfront about this, since the brief asked for a *real* working app rather than a mockup:

**Verified in this environment:**
- Every backend file passes `node --check` (syntax).
- `npm install` succeeds cleanly for both backend and frontend.
- The backend was actually started (`node server.js`) and its HTTP endpoints were hit with `curl`: `/api/health` returns 200, `/api/whatsapp/status` correctly reports `configured: false` with no credentials, and DB-dependent routes return a clean `503` (not a crash or a hang) when MongoDB isn't reachable.
- `npm run build` for the frontend completed with no errors across all 20+ components, and the production build was served and loaded successfully with `vite preview`.
- Every `lucide-react` icon imported anywhere in the app was checked against the installed package's actual exports — no typos.

**Not verified (no MongoDB binary is available in the sandbox this was built in, and it can't be downloaded there either):**
- Full create/read/update/delete flows against a real database.
- An actual WhatsApp message being delivered (that also requires your own Meta app + phone number, which only you can set up).

In short: the code is real and runs, but you should still do a quick pass yourself once MongoDB is connected — create a test member, renew it, and try both the manual WhatsApp link and (if configured) the Cloud API send.

---

## 7. How the automatic reminder system works

- A daily cron job (`backend/services/reminderScheduler.js`, schedule set by `REMINDER_CRON` in `.env`, default `0 9 * * *` = 9am) checks every member's days-remaining against the **Settings → Reminder Schedule** list (default: 7, 3, 1, 0 days before expiry).
- For each member due today, it either sends automatically (if WhatsApp credentials exist) or queues a "pending — send manually" entry (if not).
- **Duplicate prevention**: before sending, it checks the `Reminder` collection for an existing successful send of that exact reminder type, for that exact expiry date, on the `api` channel. Renewing a membership changes the expiry date, which naturally resets the reminder schedule for the new cycle — nothing needs to be manually cleared.
- Every attempt (sent, failed, or queued) is logged with a timestamp, type, channel, and status, viewable per-member on their Profile page.
- Settings → **"Run reminder check now"** triggers the exact same check on demand, useful for testing without waiting for the schedule.

---

## 8. API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/members?search=` | List members, optional name/phone search |
| GET | `/api/members/:id` | Member details + reminder history |
| POST | `/api/members` | Create member (multipart, `photo` field optional) |
| PUT | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Delete member |
| POST | `/api/members/:id/renew` | Renew membership |
| GET | `/api/members/stats/dashboard` | Dashboard counts + expiring-soon list |
| GET | `/api/whatsapp/status` | Whether the Cloud API is configured |
| POST | `/api/whatsapp/send-reminder` | Send (or build a manual link for) one reminder |
| POST | `/api/whatsapp/run-reminder-check` | Manually trigger the daily scheduler logic |
| GET/PUT | `/api/settings` | Reminder days, message template, gym name |

---

## 9. Design

Colours and the "B-FITNESS" wordmark are pulled directly from your uploaded gym logo: near-black background (`#121212`), the logo's gold (`#F2B705`) as the single accent colour, and its chrome-silver for secondary text — see `frontend/tailwind.config.js` (`theme.extend.colors.gym`) if you want to adjust them. The logo image itself lives at `frontend/src/assets/logo.jpg` and `frontend/public/logo.jpg` (used as the favicon too).
