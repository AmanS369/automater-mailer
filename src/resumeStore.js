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

async function saveResume(fileName, base64Data) {
  await connect();
  await db.collection('resume').deleteMany({});
  await db.collection('resume').insertOne({
    fileName,
    data: base64Data,
    updatedAt: new Date().toISOString()
  });
}

async function getResume() {
  await connect();
  return db.collection('resume').findOne({});
}

module.exports = { saveResume, getResume };