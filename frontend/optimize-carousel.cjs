const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public/images/carousel');

async function convertAll() {
  const files = fs.readdirSync(dir);
  let totalSaved = 0;
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const filePath = path.join(dir, file);
      const fileBase = path.basename(file, path.extname(file));
      const webpPath = path.join(dir, `${fileBase}.webp`);
      
      const statBefore = fs.statSync(filePath);
      
      await sharp(filePath)
        .webp({ quality: 80, effort: 4 })
        .toFile(webpPath);
        
      const statAfter = fs.statSync(webpPath);
      totalSaved += (statBefore.size - statAfter.size);
      
      console.log(`Converted ${file} -> ${fileBase}.webp (-${((statBefore.size - statAfter.size) / 1024 / 1024).toFixed(2)} MB)`);
      
      // Delete the original file
      fs.unlinkSync(filePath);
    }
  }
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

convertAll().catch(console.error);
