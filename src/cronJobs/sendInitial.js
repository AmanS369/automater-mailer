require('dotenv').config();
const { runInitialEmailBatch } = require('../emailLogic');
const { DEFAULT_INITIAL_SUBJECT, DEFAULT_INITIAL_BODY } = require('../templates');
const { closeConnection } = require('../dataStore');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('[CRON] Running initial email batch...');

  let subject = DEFAULT_INITIAL_SUBJECT;
  let body = DEFAULT_INITIAL_BODY;

  // Use scheduled template if exists
  const templateFile = path.join(__dirname, '../../data/scheduled_template.json');
  if (fs.existsSync(templateFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
      subject = saved.subject || subject;
      body = saved.body || body;
      fs.unlinkSync(templateFile);
    } catch (e) {
      console.error('Error reading scheduled template:', e.message);
    }
  }

  await runInitialEmailBatch(subject, body);
  await closeConnection();
  console.log('[CRON] Initial email batch complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('[CRON ERROR]', err.message);
  process.exit(1);
});
