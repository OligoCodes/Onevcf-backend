const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

app.post('/save' , (req, res) => {
  const {name, number} = req.body;

  if (!name || !number) {
 return res.status(400).send('Name and number required');
  }

  const vcfEntry = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${number}\nEND:VCARD\n`;

  fs.appendFile('one-vcf.vcf', vcfEntry, (err) => {

   if (err) {
     console.error(err);
     return res.status(500).send('⚠️ Error saving contact');
   }
   res.send('✅️ Contact saved successfully.');

  });
});

app.listen(3000, () => {
  console.log(`🙌 Server Running at http://localhost:3000`);
});
