const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Encodes email as base64 RFC 2822 message
 */
function buildRawEmail({ to, subject, htmlBody, resumePath }) {
  const boundary = `boundary_${Date.now()}`;

  let raw = [
    `To: ${to}`,
    `From: ${process.env.YOUR_NAME || 'Aman Singh'} <${process.env.YOUR_EMAIL}>`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    '',
    htmlBody,
    ''
  ];

  // Attach resume if exists
  if (resumePath && fs.existsSync(resumePath)) {
    const resumeData = fs.readFileSync(resumePath).toString('base64');
    const fileName = path.basename(resumePath);
    raw.push(`--${boundary}`);
    raw.push(`Content-Type: application/pdf; name="${fileName}"`);
    raw.push(`Content-Disposition: attachment; filename="${fileName}"`);
    raw.push(`Content-Transfer-Encoding: base64`);
    raw.push('');
    raw.push(resumeData);
    raw.push('');
  }

  raw.push(`--${boundary}--`);

  const message = raw.join('\r\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail({ to, subject, htmlBody, resumePath }) {
  const gmail = getGmailClient();
  const raw = buildRawEmail({ to, subject, htmlBody, resumePath });
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
  return res.data;
}

/**
 * Check if a recruiter has replied to us after a given date
 */
async function hasReplied(fromEmail, afterDate) {
  try {
    const gmail = getGmailClient();
    const afterTimestamp = Math.floor(new Date(afterDate).getTime() / 1000);
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:${fromEmail} after:${afterTimestamp}`
    });
    return !!(res.data.messages && res.data.messages.length > 0);
  } catch (err) {
    console.error(`Error checking reply for ${fromEmail}:`, err.message);
    return false;
  }
}

module.exports = { sendEmail, hasReplied };
