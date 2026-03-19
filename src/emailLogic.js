const { sendEmail, hasReplied } = require('./gmailService');
const { updateContact, getPendingContacts, getFollow1DueContacts } = require('./dataStore');
const {
  DEFAULT_FOLLOW1_SUBJECT, DEFAULT_FOLLOW1_BODY,
  renderTemplate, textToHtml, getResumePath
} = require('./templates');

async function sendInitialEmail(contact, subject, bodyText) {
  const renderedSubject = renderTemplate(subject, contact);
  const renderedBody = renderTemplate(bodyText, contact);
  const htmlBody = textToHtml(renderedBody);
  const resumePath = getResumePath();

  await sendEmail({ to: contact.email, subject: renderedSubject, htmlBody, resumePath });
  await updateContact(contact.email, { status: 'sent', initialSentAt: new Date().toISOString() });
  console.log(`[SENT] Initial email → ${contact.email}`);
}

async function runInitialEmailBatch(subject, bodyText) {
  const pending = await getPendingContacts();
  console.log(`[CRON 9AM] Sending initial emails to ${pending.length} contacts`);
  for (const contact of pending) {
    try {
      await sendInitialEmail(contact, subject, bodyText);
      await sleep(2000);
    } catch (err) {
      console.error(`[ERROR] Failed to send to ${contact.email}:`, err.message);
    }
  }
}

async function runFollowUp1Batch() {
  const due = await getFollow1DueContacts();
  console.log(`[CRON 10AM] Follow-up check: ${due.length} candidates`);
  for (const contact of due) {
    try {
      const replied = await hasReplied(contact.email, contact.initialSentAt);
      if (replied) {
        await updateContact(contact.email, { status: 'replied', repliedAt: new Date().toISOString() });
        console.log(`[REPLIED] ${contact.email} — skipping follow-up`);
        continue;
      }
      const subject = renderTemplate(DEFAULT_FOLLOW1_SUBJECT, contact);
      const htmlBody = textToHtml(renderTemplate(DEFAULT_FOLLOW1_BODY, contact));
      await sendEmail({ to: contact.email, subject, htmlBody, resumePath: null });
      await updateContact(contact.email, { status: 'follow1_sent', follow1SentAt: new Date().toISOString() });
      console.log(`[FOLLOW-UP] Sent → ${contact.email}`);
      await sleep(2000);
    } catch (err) {
      console.error(`[ERROR] Follow-up failed for ${contact.email}:`, err.message);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sendInitialEmail, runInitialEmailBatch, runFollowUp1Batch };
