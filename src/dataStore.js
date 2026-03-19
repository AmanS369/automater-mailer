const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/contacts.json');

// Ensure data dir + file exists
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readContacts() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeContacts(contacts) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
}

/**
 * Upsert contacts from CSV — skip duplicates by email
 */
function upsertContacts(newContacts) {
  const existing = readContacts();
  const existingEmails = new Set(existing.map(c => c.email.toLowerCase()));

  const added = [];
  for (const c of newContacts) {
    if (existingEmails.has(c.email.toLowerCase())) continue;

    const contact = {
      id: Date.now() + Math.random().toString(36).slice(2),
      firstName: c.firstName,
      email: c.email,
      company: c.company,
      status: 'pending',        // pending | sent | follow1_sent | follow2_sent | replied | done
      initialSentAt: null,
      follow1SentAt: null,
      follow2SentAt: null,
      repliedAt: null,
      createdAt: new Date().toISOString()
    };

    existing.push(contact);
    added.push(contact);
    existingEmails.add(c.email.toLowerCase());
  }

  writeContacts(existing);
  return { total: existing.length, added: added.length };
}

function updateContact(email, updates) {
  const contacts = readContacts();
  const idx = contacts.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  contacts[idx] = { ...contacts[idx], ...updates };
  writeContacts(contacts);
  return true;
}

function getContactByEmail(email) {
  const contacts = readContacts();
  return contacts.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
}

function getPendingContacts() {
  return readContacts().filter(c => c.status === 'pending');
}

function getSentContacts() {
  return readContacts().filter(c => c.status === 'sent');
}

function getFollow1DueContacts() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return readContacts().filter(c =>
    c.status === 'sent' &&
    c.initialSentAt &&
    new Date(c.initialSentAt) <= twoDaysAgo
  );
}

function getFollow2DueContacts() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return readContacts().filter(c =>
    c.status === 'follow1_sent' &&
    c.follow1SentAt &&
    new Date(c.follow1SentAt) <= twoDaysAgo
  );
}

module.exports = {
  readContacts,
  writeContacts,
  upsertContacts,
  updateContact,
  getContactByEmail,
  getPendingContacts,
  getSentContacts,
  getFollow1DueContacts,
  getFollow2DueContacts
};