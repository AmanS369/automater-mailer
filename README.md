# Cold Email Bot

Automated cold email outreach tool. Upload Apollo CSV → edit template → send now or schedule at 9 AM IST. Auto follow-ups at 10 AM IST if no reply detected.

## Tech Stack
- Node.js + Express
- Gmail API (OAuth2) for sending & reply detection
- node-cron for scheduling
- JSON file as lightweight data store
- Deployed on Render

---

## Setup Guide

### 1. Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **Gmail API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID** (Desktop app)
4. Download credentials JSON
5. Get your refresh token:

```bash
# Install google-auth-library globally
npm install -g google-auth-library

# Run this one-time script to get refresh token
node scripts/getRefreshToken.js
```

**One-time token script** — create `scripts/getRefreshToken.js`:
```js
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']
});

console.log('Visit this URL:', url);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter the code: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('REFRESH TOKEN:', tokens.refresh_token);
  rl.close();
});
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:
```
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback
GMAIL_REFRESH_TOKEN=...
YOUR_EMAIL=your@gmail.com
```

### 3. Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Add all env variables in Render dashboard
5. Deploy

---

## How It Works

| Time | What happens |
|------|-------------|
| You upload CSV | Contacts parsed, duplicates skipped, saved to contacts.json |
| You click "Schedule" | Template saved, cron picks it up next morning |
| 9:00 AM IST | Initial emails sent to all pending contacts |
| 10:00 AM IST | Follow-up 1 sent to contacts with no reply after 2 days |
| 10:00 AM IST | Follow-up 2 sent to contacts with no reply after 2 more days |

Reply detection uses Gmail API to check if the recruiter emailed you back — if yes, they're automatically marked as replied and skipped from follow-ups.

---

## Folder Structure

```
cold-email-bot/
├── src/
│   ├── index.js          # Server + cron jobs
│   ├── routes.js         # API endpoints
│   ├── csvParser.js      # Apollo CSV → clean contacts
│   ├── dataStore.js      # Read/write contacts.json
│   ├── gmailService.js   # Send email + check replies
│   ├── emailLogic.js     # Follow-up decision engine
│   └── templates.js      # Email templates + resume path
├── public/
│   └── index.html        # Frontend dashboard
├── data/                 # Auto-created: contacts.json
├── uploads/              # Auto-created: csv + resume
├── render.yaml
├── .env.example
└── package.json
```
