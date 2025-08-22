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

// Postgres connection
const pool = new Pool({
  host: 'dpg-d2k33mumcj7s739r5rj0-a',
  port: 5432,
  database: 'contacts_db_s6oo',
  user: 'oligocodes',
  password: 'd5hCikfh6PaYHRvgy4wevRyYD2uSHBjp'
});

// Path for VCF file in project folder
const vcfPath = path.join(__dirname, 'one-vcf.vcf');

// Append new contact to VCF safely
const appendToVcf = (contact) => {
  if (!contact || !contact.name || !contact.number) {
    console.log('❌ Invalid contact data:', contact);
    return;
  }

  const vcfEntry = 
    `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL:${contact.number}\nEND:VCARD\n`;

  try {
    fs.appendFileSync(vcfPath, vcfEntry, 'utf8');
    console.log('✅ VCF updated:', contact.name, contact.number);
  } catch (err) {
    console.error('❌ Error writing to VCF:', err);
  }
};

// Initialize DB
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
    console.error('❌ DB initialization error:', err);
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
    console.log('📥 Contact saved to DB:', name, number);

    appendToVcf({ name, number });

    res.json({ message: '✅ Contact saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving contact:', err);
    res.status(500).json({ message: '❌ Error saving contact.' });
  }
});

// Start server
initDb().then(() => {
  app.listen(3000, () => console.log('🙌 Server Running at http://localhost:3000'));
});
