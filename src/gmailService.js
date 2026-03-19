const { google } = require('googleapis');
const { getResume } = require('./resumeStore');

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function buildRawEmail({ to, subject, htmlBody }) {
  const boundary = `boundary_${Date.now()}`;
  const resume = await getResume();

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

  if (resume && resume.data) {
    raw.push(`--${boundary}`);
    raw.push(`Content-Type: application/pdf; name="${resume.fileName}"`);
    raw.push(`Content-Disposition: attachment; filename="${resume.fileName}"`);
    raw.push(`Content-Transfer-Encoding: base64`);
    raw.push('');
    raw.push(resume.data);
    raw.push('');
  }

  raw.push(`--${boundary}--`);
  const message = raw.join('\r\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail({ to, subject, htmlBody }) {
  const gmail = getGmailClient();
  const raw = await buildRawEmail({ to, subject, htmlBody });
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
  return res.data;
}

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