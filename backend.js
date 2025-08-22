const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

// Postgres connection (replace with your Render credentials)
const pool = new Pool({
  host: 'dpg-d2k33mumcj7s739r5rj0-a',
  port: 5432,
  database: 'contacts_db_s6oo',
  user: 'oligocodes',
  password: 'd5hCikfh6PaYHRvgy4wevRyYD2uSHBjp'
});

// Choose safe VCF path
// Locally: in project folder
// Render: in /tmp folder (writable)
const vcfPath = process.env.RENDER ? '/tmp/one-vcf.vcf' : path.join(__dirname, 'one-vcf.vcf');
console.log('VCF will be saved at:', vcfPath);

// Function to append a contact to VCF
const appendToVcf = (contact) => {
  if (!contact) return;

  const vcfEntry = 
    `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL:${contact.number}\nEND:VCARD\n`;

  try {
    fs.appendFileSync(vcfPath, vcfEntry, 'utf8');
    console.log('✅ VCF updated:', contact.name, contact.number);
  } catch (err) {
    console.error('❌ Failed writing VCF:', err);
  }
};

// Initialize Postgres DB
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        number TEXT NOT NULL
      );
    `);
    console.log('✅ Postgres DB ready!');
  } catch (err) {
    console.error('❌ DB initialization failed:', err);
  }
};

// POST route to save contact
app.post('/save', async (req, res) => {
  const { name, number } = req.body;
  if (!name || !number) return res.status(400).json({ message: '👤 Name and 🔢 number required' });

  try {
    await pool.query(
      'INSERT INTO contacts (name, number) VALUES ($1, $2)',
      [name, number]
    );

    appendToVcf({ name, number });

    res.json({ message: '✅️ Contact saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving contact:', err);
    res.status(500).json({ message: '❌ Error saving contact.' });
  }
});

// Start server
initDb().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🙌 Server Running at http://localhost:${PORT}`));
});
