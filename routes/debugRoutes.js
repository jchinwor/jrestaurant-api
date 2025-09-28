const fs = require('fs');
const path = require('path');

router.get('/uploads', (req, res) => {
  const folderPath = path.join(process.cwd(), 'uploads', 'foods');
  try {
    const files = fs.readdirSync(folderPath);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
