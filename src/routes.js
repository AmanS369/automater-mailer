const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { parseApolloCsv } = require('./csvParser');
const { upsertContacts, readContacts, writeContacts, updateContact, deleteContact } = require('./dataStore');
const { sendInitialEmail, runInitialEmailBatch } = require('./emailLogic');
const { DEFAULT_INITIAL_SUBJECT, DEFAULT_INITIAL_BODY, getResumePath, saveResumePath } = require('./templates');

const csvUpload = multer({ dest: 'uploads/csv/' });
const resumeUpload = multer({
  dest: 'uploads/resume/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// ─── Upload Apollo CSV ────────────────────────────────────────────────────────
router.post('/upload-csv', csvUpload.single('csv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
    const contacts = await parseApolloCsv(req.file.path);
    const result = await upsertContacts(contacts);
    fs.unlinkSync(req.file.path);
    res.json({ message: 'CSV processed', parsed: contacts.length, added: result.added, total: result.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload Resume ────────────────────────────────────────────────────────────
router.post('/upload-resume', resumeUpload.single('resume'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });
    const dest = path.join(__dirname, '../uploads/resume/resume.pdf');
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(req.file.path, dest);
    saveResumePath(dest);
    res.json({ message: 'Resume uploaded', path: dest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get template + resume status ────────────────────────────────────────────
router.get('/template', (req, res) => {
  const resumePath = getResumePath();
  res.json({
    subject: DEFAULT_INITIAL_SUBJECT,
    body: DEFAULT_INITIAL_BODY,
    resumeAttached: !!(resumePath && fs.existsSync(resumePath)),
    resumeFileName: resumePath ? path.basename(resumePath) : null
  });
});

// ─── Get all contacts ─────────────────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await readContacts();
    res.json({ contacts, total: contacts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Send Now ─────────────────────────────────────────────────────────────────
router.post('/send-now', async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body required' });
    runInitialEmailBatch(subject, body).catch(console.error);
    res.json({ message: 'Emails are being sent in the background' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Schedule Send ────────────────────────────────────────────────────────────
router.post('/schedule-send', (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body required' });
    const templateFile = path.join(__dirname, '../data/scheduled_template.json');
    fs.mkdirSync(path.dirname(templateFile), { recursive: true });
    fs.writeFileSync(templateFile, JSON.stringify({ subject, body }, null, 2));
    res.json({ message: 'Email scheduled for 9:00 AM IST' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Mark replied ─────────────────────────────────────────────────────────────
router.post('/mark-replied', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const updated = await updateContact(email, { status: 'replied', repliedAt: new Date().toISOString() });
  if (!updated) return res.status(404).json({ error: 'Contact not found' });
  res.json({ message: `${email} marked as replied` });
});

// ─── Delete contact ───────────────────────────────────────────────────────────
router.delete('/contact/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const deleted = await deleteContact(email);
  if (!deleted) return res.status(404).json({ error: 'Contact not found' });
  res.json({ message: `${email} removed` });
});

module.exports = router;
