const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parses Apollo CSV export and extracts only:
 * firstName, email, company
 */
function parseApolloCsv(filePath) {
  return new Promise((resolve, reject) => {
    const contacts = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const firstName = (row['First Name'] || '').trim();
        const email = (row['Email'] || '').trim();
        const company = (row['Company Name'] || '').trim();

        // Skip rows with missing critical fields
        if (!email || !firstName) return;

        // Skip invalid emails
        if (!email.includes('@')) return;

        contacts.push({ firstName, email, company });
      })
      .on('end', () => resolve(contacts))
      .on('error', reject);
  });
}

module.exports = { parseApolloCsv };
