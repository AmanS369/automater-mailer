const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db = null;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db('cold-email-bot');
  }
  return db;
}

function col() {
  return db.collection('contacts');
}

async function readContacts() {
  await connect();
  return col().find({}).toArray();
}

async function writeContacts(contacts) {
  await connect();
  await col().deleteMany({});
  if (contacts.length > 0) await col().insertMany(contacts);
}

async function upsertContacts(newContacts) {
  await connect();
  const existing = await col().find({}, { projection: { email: 1 } }).toArray();
  const existingEmails = new Set(existing.map(c => c.email.toLowerCase()));

  const toInsert = [];
  for (const c of newContacts) {
    if (existingEmails.has(c.email.toLowerCase())) continue;
    toInsert.push({
      id: Date.now() + Math.random().toString(36).slice(2),
      firstName: c.firstName,
      email: c.email,
      company: c.company,
      status: 'pending',
      initialSentAt: null,
      follow1SentAt: null,
      repliedAt: null,
      createdAt: new Date().toISOString()
    });
    existingEmails.add(c.email.toLowerCase());
  }

  if (toInsert.length > 0) await col().insertMany(toInsert);
  const total = await col().countDocuments();
  return { total, added: toInsert.length };
}

async function updateContact(email, updates) {
  await connect();
  const result = await col().updateOne(
    { email: { $regex: new RegExp(`^${email}$`, 'i') } },
    { $set: updates }
  );
  return result.matchedCount > 0;
}

async function getPendingContacts() {
  await connect();
  return col().find({ status: 'pending' }).toArray();
}

async function getFollow1DueContacts() {
  await connect();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  return col().find({
    status: 'sent',
    initialSentAt: { $ne: null, $lte: twoDaysAgo }
  }).toArray();
}

async function deleteContact(email) {
  await connect();
  const result = await col().deleteOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  return result.deletedCount > 0;
}

async function closeConnection() {
  await client.close();
  db = null;
}

module.exports = {
  readContacts,
  writeContacts,
  upsertContacts,
  updateContact,
  getPendingContacts,
  getFollow1DueContacts,
  deleteContact,
  closeConnection
};
