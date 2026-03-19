const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ]
});

console.log('\n1. Open this URL in your browser:\n');
console.log(url);
console.log('\n2. Approve access with your Gmail account');
console.log('3. Google will show you a code — paste it below\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
    console.log('\n✅ Your GMAIL_REFRESH_TOKEN is:\n');
    console.log(tokens.refresh_token);
    console.log('\nCopy this into your .env file as GMAIL_REFRESH_TOKEN=...\n');
  } catch (err) {
    console.error('Error getting token:', err.message);
  }
  rl.close();
});