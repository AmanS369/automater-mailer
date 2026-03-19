const RESUME_PATH_FILE = require('path').join(__dirname, '../data/resume_path.txt');
const fs = require('fs');

function getResumePath() {
  if (fs.existsSync(RESUME_PATH_FILE)) {
    return fs.readFileSync(RESUME_PATH_FILE, 'utf-8').trim();
  }
  return null;
}

function saveResumePath(filePath) {
  fs.writeFileSync(RESUME_PATH_FILE, filePath);
}

/**
 * Default initial cold email template
 * Supports {{firstName}} and {{company}} placeholders
 */
const DEFAULT_INITIAL_SUBJECT = `SDE-1 Application | Aman Singh | Backend Engineer (Java, Kafka, Microservices)`;

const DEFAULT_INITIAL_BODY = `Hi {{firstName}},

I'm Aman Singh, a SDE-1 at CCIL (fintech), where I've been working on Kafka pipelines and microservices in Java/Spring Boot.

I came across {{company}} and was genuinely excited about the kind of engineering challenges you're working on. I'd love to explore if there's a relevant SDE-1 opening on your team.

Quick snapshot:
- Hands-on with Java, Spring Boot, Kafka, Microservices, Docker
- Worked on Node.js,React,Django,Python in past projects
- Experience building and maintaining backend services in production
- B.Tech IT from FCRIT (2025) with 9.64 CGPA

I've attached my resume for your reference. Happy to connect for a quick chat if there's a fit.

Thanks for your time,
Aman Singh
LinkedIn: https://www.linkedin.com/in/amans369/
GitHub: https://github.com/amanS369`;

/**
 * Follow-up 1 — sent 2 days after initial if no reply
 */
const DEFAULT_FOLLOW1_SUBJECT = `Following up – Aman Singh | SDE-1 Application`;

const DEFAULT_FOLLOW1_BODY = `Hi {{firstName}},

I wanted to follow up on my previous email.

I'm very interested in opportunities at {{company}}. Please let me know if there are any SDE-1 openings or if you can guide me further.

Happy to share more details if needed.

Thanks,
Aman Singh`;

/**
 * Replace placeholders in subject and body
 */
function renderTemplate(template, { firstName, company }) {
  return template
    .replace(/{{firstName}}/g, firstName || '')
    .replace(/{{company}}/g, company || '');
}

/**
 * Convert plain text to simple HTML
 */
function textToHtml(text) {
  return `<html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
${text.split('\n').map(line => line.trim() === '' ? '<br>' : `<p style="margin:0 0 4px 0">${line}</p>`).join('\n')}
</body></html>`;
}

module.exports = {
  DEFAULT_INITIAL_SUBJECT,
  DEFAULT_INITIAL_BODY,
  DEFAULT_FOLLOW1_SUBJECT,
  DEFAULT_FOLLOW1_BODY,
  DEFAULT_FOLLOW2_SUBJECT,
  renderTemplate,
  textToHtml,
  getResumePath,
  saveResumePath
};