const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg'); // Postgres client
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

// Postgres connection (replace with your Render credentials)
const pool = new Pool({
  host: 'YOUR_HOST',
  port: 5432,
  database: 'YOUR_DB',
  user: 'YOUR_USER',
  password: 'YOUR_PASSWORD'
});

// Path for VCF in the same folder
const vcfPath = path.join(__dirname, 'one-vcf.vcf');

// Append new contact to VCF
const appendToVcf = (contact) => {
  if (!contact) return;

  const vcfEntry = 
    `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL:${contact.number}\nEND:VCARD\n`;

  fs.appendFileSync(vcfPath, vcfEntry);
};

// Create contacts table if not exists
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT NOT NULL
    );
  `);
  console.log('✅️ Postgres DB ready!');
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
    console.error(err);
    res.status(500).json({ message: '❌ Error saving contact.' });
  }
});

// Start server
initDb().then(() => {
  app.listen(3000, () => console.log('🙌 Server Running at http://localhost:3000'));
});
