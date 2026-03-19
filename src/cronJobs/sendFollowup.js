require('dotenv').config();
const { runFollowUp1Batch } = require('../emailLogic');
const { closeConnection } = require('../dataStore');

async function main() {
  console.log('[CRON] Running follow-up email batch...');
  await runFollowUp1Batch();
  await closeConnection();
  console.log('[CRON] Follow-up batch complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('[CRON ERROR]', err.message);
  process.exit(1);
});
