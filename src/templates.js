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

I'm Aman Singh, a backend engineer with about 9 months of experience at CCIL (a fintech firm), where I've been working on Kafka pipelines and microservices in Java/Spring Boot.

I came across {{company}} and was genuinely excited about the kind of engineering challenges you're working on. I'd love to explore if there's a relevant SDE-1 opening on your team.

Quick snapshot:
- 600+ LeetCode problems, strong in DSA
- Hands-on with Java, Spring Boot, Kafka, Microservices
- Built real-time data pipelines in production
- B.Tech IT from FCRIT (2025) with 9.64 CGPA

I've attached my resume for your reference. Happy to connect for a quick chat if there's a fit.

Thanks for your time,
Aman Singh
LinkedIn: https://www.linkedin.com/in/aman-singh-dev
GitHub: https://github.com/amansingh`;

/**
 * Follow-up 1 — sent 2 days after initial if no reply
 */
const DEFAULT_FOLLOW1_SUBJECT = `Following up – Aman Singh | SDE-1 Application`;

const DEFAULT_FOLLOW1_BODY = `Hi {{firstName}},

Just wanted to follow up on my previous email in case it got buried.

I'm still very keen on exploring opportunities at {{company}}. If there's a suitable SDE-1 opening or if you could point me in the right direction, I'd really appreciate it.

Happy to share more details or hop on a quick call at your convenience.

Thanks,
Aman Singh`;

/**
 * Follow-up 2 — sent 2 days after follow-up 1 if no reply
 */
const DEFAULT_FOLLOW2_SUBJECT = `Last follow-up – Aman Singh`;

const DEFAULT_FOLLOW2_BODY = `Hi {{firstName}},

I know inboxes get busy, so this will be my last follow-up.

If there's ever an opening at {{company}} that matches my profile (Java, Kafka, Microservices, Spring Boot), I'd love to be considered. I'll keep an eye on your careers page too.

Wishing you a great week ahead!

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
  DEFAULT_FOLLOW2_BODY,
  renderTemplate,
  textToHtml,
  getResumePath,
  saveResumePath
};
