require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const routes = require('./routes');
const { runInitialEmailBatch, runFollowUp1Batch } = require('./emailLogic');
const { DEFAULT_INITIAL_SUBJECT, DEFAULT_INITIAL_BODY } = require('./templates');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Serve frontend ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── CRON: Send initial emails at 9:00 AM IST (3:30 AM UTC) ─────────────────
cron.schedule('30 3 * * *', async () => {
  console.log('[CRON] 9:00 AM IST — Running initial email batch...');

  // Check if a custom template was scheduled
  const templateFile = path.join(__dirname, '../data/scheduled_template.json');
  let subject = DEFAULT_INITIAL_SUBJECT;
  let body = DEFAULT_INITIAL_BODY;

  if (fs.existsSync(templateFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
      subject = saved.subject || subject;
      body = saved.body || body;
      // Clear after use — don't re-send tomorrow with same template unless re-scheduled
      fs.unlinkSync(templateFile);
    } catch (e) {
      console.error('[CRON] Error reading scheduled template:', e.message);
    }
  }

  await runInitialEmailBatch(subject, body);
}, {
  timezone: 'Asia/Kolkata'
});

// ─── CRON: Follow-up emails at 10:00 AM IST (4:30 AM UTC) ───────────────────
cron.schedule('30 4 * * *', async () => {
  console.log('[CRON] 10:00 AM IST — Running follow-up email batch...');
  await runFollowUp1Batch();
}, {
  timezone: 'Asia/Kolkata'
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Cold Email Bot running on http://localhost:${PORT}`);
  console.log(`📅 Initial emails cron: 9:00 AM IST daily`);
  console.log(`📅 Follow-up emails cron: 10:00 AM IST daily`);
  console.log(`📂 Upload Apollo CSV at /api/upload-csv`);
});
